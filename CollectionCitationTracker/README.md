# Collection Citation Tracker · 分类引用标记

按 Zotero 分类独立管理文献的引用状态，让每篇论文都有自己的引用清单。

同一篇文献可以同时属于多个分类：在“论文 A”中标为已引用，在“论文 B”中保持未标记，两个分类互不影响。适合以 Zotero 分类管理论文、项目和综述的写作流程。

**当前版本：1.0.1 · 目标版本：Zotero 9.0.x · 中文界面**

## 功能

- **每个分类独立记录**：同一文献在不同分类中可以拥有不同状态。
- **引用状态列**：在文献列表中显示状态，并可点击列标题排序。
- **右键操作**：标记已引用、标记未引用或清除当前分类的标记。
- **批量标记**：支持选中多条文献后统一操作。
- **本地持久保存**：关闭 Zotero 后记录仍保留，卸载插件时也保留已有记录。
- **保留原有文献数据**：不修改文献字段、标签和笔记。

| 状态 | 含义 |
| --- | --- |
| ✓ 已引用 | 已确认在当前分类对应的论文或项目中引用 |
| ○ 未引用 | 已核对，明确尚未引用 |
| — 未标记 | 尚未核对，不能等同于未引用 |

## 安装

1. 打开本仓库的 **Releases**，下载 `CollectionCitationTracker-1.0.1.xpi`。安装插件使用 XPI；GitHub 的 `Source code (zip)` 是源码。
2. 在 Zotero 中打开 **工具 → 插件**（部分界面可能显示为“附加组件”）。
3. 点击齿轮按钮，选择 **从文件安装插件… / Install Plugin From File…**。
4. 选择下载的 XPI，按 Zotero 提示完成安装；如提示重启，请重启。

## 使用

1. 左侧选中一个具体分类，例如“论文 A”。
2. 选中文献主条目；支持多选，macOS 可使用 Command，Windows 可使用 Ctrl。
3. 右键 → **当前分类：引用状态**，选择已引用、未引用或清除标记。
4. 查看文献列表的 **引用状态** 列。如果没有显示，右键点击列表表头并勾选“引用状态”。
5. 切换到另一个分类后，可以为同一文献设置独立状态。

“我的文库”根节点、保存的搜索和单独的附件/笔记不是本插件的标记入口。父分类与子分类各自记录，不会自动继承状态。

## 数据与边界

引用状态由用户**手动标记**。插件不读取 Word 或其他论文文件，也不会自动检测正文中是否实际引用了某篇文献。

记录保存在当前 Zotero profile 的本地 preferences 中，按文库 ID、分类 key 和文献 key 区分。它们**不会随 Zotero 账号跨设备同步**。删除分类后重新创建同名分类，会生成新的 key，因此旧分类的记录不会自动迁移。备份时需要包含 Zotero 用户配置文件。

目标兼容范围在清单中设为 `9.0` 至 `9.0.*`，原始版本以 Zotero 9.0.6 为目标编写。源码与发布包可以进行静态检查；本项目尚未在此工作环境的真实 Zotero 9.0.6 客户端中完成安装和界面验证。

## 常见问题

**找不到右键菜单？** 先选中具体分类，再选中文献主条目。根节点、保存的搜索、附件和笔记不显示该操作。

**状态列没有立即更新？** 尝试切换到其他分类，再切回原分类。如果仍异常，请记录 Zotero 版本及错误控制台消息。

**能否自动更新？** 发布工具会将正式 XPI 中的更新地址配置为本仓库的 `updates.json`。后续维护者需要同时发布新版本 XPI，并更新 `updates.json`，更新机制才会有新版本可用。早期使用 `example.com` 更新地址的本地安装包，需要手动安装正式发布包。

**怎样反馈问题？** 在本仓库的 Issues 中提供 Zotero 版本、操作系统、复现步骤和错误消息。请先移除日志中的私人文献内容。

## 开发与发布

核心运行文件为 `manifest.json`、`bootstrap.js` 和 `tracker.js`，无需安装第三方运行库。

上传前配置真实仓库地址并构建：

```bash
python3 scripts/build.py --repository 你的用户名/CollectionCitationTracker --author 你的用户名
```

构建会更新清单中的主页和更新地址，并生成 XPI、源码包、SHA-256 校验文件和 `updates.json`。清单保留原有插件 ID，以继续读取已有标记。

如果在自己的电脑上使用已登录的 GitHub CLI，可运行：

```bash
python3 scripts/publish.py
```

该命令会在 GitHub CLI 当前登录账号下创建公开仓库 `CollectionCitationTracker`、上传源码，并发布 `v1.0.1` 和下载附件。它会先检查同名仓库；如已存在则停止，不覆盖已有项目。可用 `--repo-name` 指定新的仓库名。具体步骤见 [发布指南](docs/PUBLISHING.md)，版本文案见 [v1.0.1 发布说明](docs/RELEASE-v1.0.1.md)。

## English

Collection Citation Tracker is a Chinese-interface Zotero plugin for tracking citation status independently in each collection. Mark regular items as cited, uncited, or unmarked through an item context menu, and view the result in a custom column. Multi-selection is supported.

Statuses are manually assigned, stored locally, and do not sync across devices. The plugin does not inspect manuscripts or modify bibliographic metadata, tags, or notes. The manifest targets Zotero 9.0.x; real-client verification remains pending in this work environment.

## 技术参考

- [Zotero 官方插件开发文档](https://www.zotero.org/support/dev/client_coding/plugin_development)
- [Zotero 官方插件清单与更新清单说明](https://www.zotero.org/support/dev/zotero_7_for_developers)

