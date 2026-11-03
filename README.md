# 任务清单

面向个人使用的离线 Windows 任务清单。可把任务拆成子事项，记录备忘录，并通过 JSON 备份迁移数据；不需要账号或服务器。

## 下载与使用

- 平台：Windows 10/11。
- 最新桌面版：[v1.0.3 Release](https://github.com/MLIKEL/task-list/releases/tag/v1.0.3)。下载其中的 `任务清单_1.0.3_x64-setup.exe`。
- 安装：先关闭正在运行的旧版，再双击安装包；安装完成后从开始菜单或安装目录启动。

## 已实现功能

- 新建、编辑、完成、删除任务和子事项；支持拖拽排序及筛选。
- 备忘录自动保存。
- 导入、导出 JSON 备份；导入先校验，保存失败不会覆盖原数据。
- 旧数据迁移、损坏数据恢复提示、单实例启动保护。

## 数据与备份

任务和备忘录保存于应用 WebView 的本地存储中，不会上传。应用内点击“备份”导出 JSON；备份包含个人内容，不要提交到 Git 仓库或公开分享。物理存储目录依赖 Windows WebView 运行环境，未作为稳定接口；跨电脑或清理应用前请使用 JSON 备份。

## 开发文档

- [当前状态](docs/当前状态.md)：版本、验证、已知问题和后续入口。
- [架构与目录](docs/架构与目录.md)：代码、数据和桌面能力如何协作。
- [开发与发布](docs/开发与发布.md)：运行、测试、构建和 Release 流程。
- [开发记录](docs/开发记录.md)：近期整改记录。

## 本地开发

前提：Windows 10/11、Node.js 22、Rust（MSVC 工具链）和 WebView2 Runtime。

```powershell
npm install
npm test
npm run tauri:build
```

安装包生成于 `src-tauri\target\release\bundle\nsis\`。`dist/` 是前端源码，不是构建产物。
