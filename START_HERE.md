# GitHub 发布准备包

本包包含插件源码、中文 README、v1.0.1 Release 文案、构建工具和发布工具。

当前状态：文件已准备并通过构建检查；GitHub 仓库和 Release 尚未创建。

- 项目源码：CollectionCitationTracker/
- 项目介绍：CollectionCitationTracker/README.md
- Release 文案：CollectionCitationTracker/docs/RELEASE-v1.0.1.md
- 发布步骤：CollectionCitationTracker/docs/PUBLISHING.md
- 你的原始安装包：original-package/CollectionCitationTracker-1.0.1.xpi

原始安装包保持上传时的字节内容；它仍包含 example.com 占位更新地址。正式发布前，在项目目录执行构建命令并填入你的真实 GitHub 用户名：

```bash
python3 scripts/build.py --repository 你的用户名/CollectionCitationTracker --author 你的用户名
```

如果你电脑上的 GitHub CLI 已经登录，可运行下面的命令，由工具读取当前账号并完成新仓库的创建和发布：

```bash
python3 scripts/publish.py
```

静态检查确认：JavaScript/Python 语法通过，核心运行文件与原始包一致，插件 ID 保留，构建后的 XPI/源码包结构正常，更新清单与 SHA-256 校验值一致，同一输入可生成相同文件。

没有在真实 Zotero 客户端里完成安装和界面验证。
