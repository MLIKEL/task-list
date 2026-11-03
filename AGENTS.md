# 任务清单接手入口

推荐顺序：先读 [README.md](README.md)，再读 [docs/当前状态.md](docs/当前状态.md)，最后按本次任务阅读对应代码和 [docs/开发与发布.md](docs/开发与发布.md)。不要默认全量读取仓库或 `src-tauri/target/`。

- 技术栈：Tauri 2、Rust、原生 HTML/CSS/JavaScript；前端源码在 `dist/`，桌面能力在 `src-tauri/`。
- 命令：`npm test` 验证数据规则；`npm run tauri:build` 生成 Windows 安装包。
- 数据：当前状态键为 `task-list-state-v2`；旧键仅用于迁移，不能删除。真实备份、安装包、`node_modules/`、`src-tauri/target/` 都不提交。
- 开发完成后：更新 README、`docs/当前状态.md` 和与改动对应的文档；运行相关测试和构建。
- 发布：每次都必须取得当次用户授权并重新核对版本、标签、安装包与远端状态；本次授权不延续到后续工作。
