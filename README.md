# 任务清单

一个本地优先的 Windows 任务清单应用。任务可拆成子事项，并支持拖拽排序、备忘录与手动导入/导出备份。

## 功能

- 新建、修改、完成或删除任务与子事项
- 任务和子事项拖拽排序
- 侧边栏筛选：全部、进行中、已完成
- 备忘录自动保存
- JSON 格式的数据导入和导出
- Windows 桌面版（Tauri）

## 数据与隐私

任务和备忘录只保存在本机应用的本地存储中，不会上传到服务器。请定期通过“备份”导出 JSON 文件；备份文件包含个人任务数据，默认不会被纳入 Git 仓库。

## 本地运行与打包

前提：Windows 10/11、Node.js、Rust（MSVC 工具链）以及 WebView2 Runtime。

```powershell
npm install
npm run tauri:build
```

安装包会生成在：

```text
src-tauri\target\release\bundle\nsis
```

## 项目结构

```text
dist/          网页界面与图标
src-tauri/     Windows 桌面壳与打包配置
package.json   Tauri 命令与 Node 开发依赖
```

