#!/usr/bin/env python3
"""Publish this project to a new public repository in your GitHub CLI account."""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

from build import ROOT, build


def run(*args, capture=False):
    result = subprocess.run(list(args), cwd=ROOT, check=True, text=True,
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else ""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-name", default="CollectionCitationTracker")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", args.repo_name) or args.repo_name in {".", ".."}:
        raise RuntimeError("Invalid repository name")
    for command in ("git", "gh"):
        if not shutil.which(command):
            raise RuntimeError("Install " + command + " from its official source before publishing")
    if (ROOT / ".git").exists():
        raise RuntimeError("This directory already has a Git repository. Inspect it and complete publication manually")
    run("gh", "auth", "status", "--hostname", "github.com")
    account = json.loads(run("gh", "api", "--hostname", "github.com", "user", capture=True))
    owner = account["login"]
    repository = owner + "/" + args.repo_name
    existing = subprocess.run(["gh", "api", "--hostname", "github.com", "repos/" + repository],
                              cwd=ROOT, text=True, capture_output=True)
    if existing.returncode == 0:
        raise RuntimeError("Repository " + repository + " already exists; no remote changes were made. Use --repo-name for a new name")
    if "HTTP 404" not in existing.stderr:
        raise RuntimeError("Could not verify that the repository name is available; no remote changes were made")
    version = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))["version"]
    notes = ROOT / "docs" / ("RELEASE-v" + version + ".md")
    if not notes.is_file():
        raise RuntimeError("Release notes are missing: " + str(notes))
    version, assets = build(repository, owner)
    run("git", "init", "-b", "main")
    run("git", "add", "manifest.json", "bootstrap.js", "tracker.js", "README.md", "CHANGELOG.md", ".gitignore", "updates.json", "docs", "scripts")
    run("git", "-c", "user.name=" + owner,
        "-c", "user.email=" + str(account["id"]) + "+" + owner + "@users.noreply.github.com",
        "commit", "-m", "Initial release: Collection Citation Tracker " + version)
    description = "按 Zotero 分类独立标记文献引用状态，支持状态列、右键操作与批量标记。"
    run("gh", "repo", "create", repository, "--public", "--description", description,
        "--source", str(ROOT), "--remote", "origin", "--push")
    run("gh", "release", "create", "v" + version, *[str(asset) for asset in assets],
        "--repo", repository, "--target", "main", "--title", "v" + version + " · 分类引用标记",
        "--notes-file", str(notes))
    run("gh", "repo", "edit", repository, "--add-topic", "zotero", "--add-topic", "zotero-plugin",
        "--add-topic", "citation", "--add-topic", "reference-management", "--add-topic", "research-tools")
    result = json.loads(run("gh", "release", "view", "v" + version, "--repo", repository,
                            "--json", "url,assets,isDraft", capture=True))
    names = {asset["name"] for asset in result["assets"]}
    if result["isDraft"] or not {asset.name for asset in assets}.issubset(names):
        raise RuntimeError("Release was created but its published attachments could not be verified")
    print("Published and verified: " + result["url"])


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, subprocess.CalledProcessError) as error:
        print("Publication stopped: " + str(error), file=sys.stderr)
        sys.exit(1)
