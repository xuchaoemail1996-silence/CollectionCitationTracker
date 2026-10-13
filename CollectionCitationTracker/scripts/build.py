#!/usr/bin/env python3
"""Build release assets using an explicitly supplied GitHub repository."""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def archive(path, files):
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as package:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 13, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            package.writestr(info, data)
    with zipfile.ZipFile(path) as package:
        if package.testzip() is not None:
            raise RuntimeError("Archive CRC check failed")


def build(repository, author):
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})/[A-Za-z0-9_.-]+", repository):
        raise ValueError("Repository must be OWNER/REPO on github.com")
    if any(part in {".", ".."} for part in repository.split("/")):
        raise ValueError("Invalid repository")
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Expected a numeric major.minor.patch version")
    base = "https://github.com/" + repository
    manifest["author"] = author or repository.split("/")[0]
    manifest["homepage_url"] = base
    zotero = manifest["applications"]["zotero"]
    zotero["update_url"] = "https://raw.githubusercontent.com/" + repository + "/main/updates.json"
    write_json(ROOT / "manifest.json", manifest)
    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    xpi = dist / ("CollectionCitationTracker-" + version + ".xpi")
    files = {name: (ROOT / name).read_bytes() for name in ("manifest.json", "bootstrap.js", "tracker.js", "README.md")}
    archive(xpi, files)
    digest = hashlib.sha256(xpi.read_bytes()).hexdigest()
    updates = {"addons": {zotero["id"]: {"updates": [{
        "version": version,
        "update_link": base + "/releases/download/v" + version + "/" + xpi.name,
        "update_hash": "sha256:" + digest,
        "applications": {"zotero": {key: zotero[key] for key in ("strict_min_version", "strict_max_version")}}
    }]}}}
    write_json(ROOT / "updates.json", updates)
    source = dist / ("CollectionCitationTracker-" + version + "-source.zip")
    source_files = {}
    for p in sorted(ROOT.rglob("*")):
        rel = p.relative_to(ROOT)
        if not p.is_file() or any(part in {"dist", ".git", "__pycache__"} for part in rel.parts):
            continue
        source_files[str(Path("CollectionCitationTracker") / rel)] = p.read_bytes()
    archive(source, source_files)
    sums = dist / "SHA256SUMS.txt"
    sums.write_text("".join(hashlib.sha256(p.read_bytes()).hexdigest() + "  " + p.name + "\n" for p in (xpi, source)), encoding="utf-8")
    return version, [xpi, source, sums]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repository", required=True, help="Your actual GitHub OWNER/REPO")
    parser.add_argument("--author", help="Plugin author name; defaults to the repository owner")
    args = parser.parse_args()
    version, assets = build(args.repository, args.author)
    print("Built version " + version)
    for asset in assets:
        print(asset)


if __name__ == "__main__":
    main()

