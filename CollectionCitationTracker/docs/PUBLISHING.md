# 发布指南

## 已准备的发布内容

| 项目 | 内容 |
| --- | --- |
| 仓库名 | `CollectionCitationTracker` |
| 可见性 | 公开 |
| 简介 | 按 Zotero 分类独立标记文献引用状态，支持状态列、右键操作与批量标记。 |
| 标签 | `zotero`、`zotero-plugin`、`citation`、`reference-management`、`research-tools` |
| 版本标签 | `v1.0.1` |
| Release 标题 | `v1.0.1 · 分类引用标记` |
| Release 正文 | `docs/RELEASE-v1.0.1.md` |

项目文件已经准备好，但准备文件并不代表 GitHub 仓库或 Release 已经创建。完成发布需要实际访问你的 GitHub 账号。

## 通过 GitHub CLI 发布

适用于已经安装 Git、Python 3 和 [GitHub CLI](https://cli.github.com/) 的电脑。

1. 在终端进入解压后的 `CollectionCitationTracker` 文件夹。
2. 用 `gh auth status` 检查当前账号。尚未登录时运行 `gh auth login`，按官方流程登录。
3. 运行 `python3 scripts/publish.py`。

发布工具会读取 GitHub CLI 的当前登录用户名，配置正式主页与更新地址，然后创建公开仓库、推送源码、创建 `v1.0.1` Release 并上传 XPI、源码 ZIP 和校验文件。

工具会拒绝覆盖现有的同名仓库；换名时运行 `python3 scripts/publish.py --repo-name 新仓库名`。如果当前目录已经有 Git 仓库，也会停止，避免推送已有内容。工具不会设置全局 Git 选项。

网络或权限问题可能造成仓库已创建但发布尚未完成。这时保留当前目录，先检查远程仓库；不要删除仓库或重复运行创建命令。可以按下面的网页步骤完成上传和 Release。

## 通过 GitHub 网页发布

1. 在自己的 GitHub 账号下创建公开仓库 `CollectionCitationTracker`，填写上表中的简介。
2. 将自己的用户名代入，运行：

   ```bash
   python3 scripts/build.py --repository 你的用户名/CollectionCitationTracker --author 你的用户名
   ```

3. 上传项目源码、README、CHANGELOG、docs、scripts 和 `updates.json`；无需把 `dist`、临时文件或此发布准备包上传到源码目录。
4. 在仓库的 Releases 中创建新版本，标签为 `v1.0.1`，标题为上表内容，正文复制 `docs/RELEASE-v1.0.1.md`。
5. 附加 `dist` 中的 XPI、`-source.zip` 和 `SHA256SUMS.txt`，然后发布。
6. 打开 Release 页面，确认三个附件可见，XPI 文件名正确。

项目会出现在你的仓库列表中。如希望个人主页突出显示，可在主页的 **Customize your pins** 中固定该仓库。

## 后续更新

修改 `manifest.json` 中的版本号，添加对应的发布说明，重新运行构建。将新的 XPI 作为对应版本 Release 附件发布，并将构建生成的 `updates.json` 推送到 `main` 分支。插件的更新机制只会检查清单里高于当前安装版本的版本。

早期 XPI 使用了 `example.com` 占位更新地址，需要手动安装正式 XPI 才能切换到真实更新源。同为 `1.0.1` 的本地安装也应手动重新安装正式包。

