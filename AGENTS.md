# AGENTS.md

## 项目简介

- **jmock** — 一个简单易用的命令行 HTTP 服务器，支持数据模拟（Mock）、请求代理（Proxy）和静态文件服务
- 这是一个 npm 项目，根目录有 `package.json`，使用 TypeScript + ES Module

## 范围

- 本仓库默认语言：TypeScript
- 允许修改目录：`lib/`（核心代码）、`test/`（测试代码）、`bin/`（CLI 入口）、根目录配置文件
- 禁止修改目录：`node_modules/`、`screenshots/`

## 改动检查

**已配置的检查命令（在 `package.json` 中定义）：**

- `npm run format` — Prettier 格式化
- `npm run lint:code` — ESLint 代码检查
- `npm run lint:markdown` — Markdown 格式检查
- `npm run typecheck` — TypeScript 类型检查（`tsc --noEmit`）
- `npm test` — Node.js 原生测试运行器执行测试
- `npm run lint` — 全部检查（format + lint:code + lint:markdown + typecheck + test）

**改动后建议执行：**

1. 运行 `npm run lint` 执行全部检查
2. 确保所有测试通过

## 交付格式

- 先给风险摘要，再给出具体修改点（含文件路径和行号），最后给出测试结果
- 所有文件引用都要带路径和行号
- 对于配置变更，说明变更后对用户的影响

## 项目结构

```text
jmock/
├── bin/
│   └── jmock                    # CLI 入口脚本
├── lib/                          # 核心库代码
│   ├── core/                     # 核心模块
│   │   ├── index.ts              # 主入口，服务器启动逻辑
│   │   ├── opts.ts               # 命令行选项解析
│   │   ├── etag.ts               # ETag 处理
│   │   ├── status-handlers.ts    # HTTP 状态码处理器
│   │   ├── aliases.json          # 别名映射
│   │   ├── defaults.json         # 默认配置
│   │   └── show-dir/             # 目录浏览功能
│   ├── jmock.ts                  # 模块主入口
│   ├── shims/
│   │   └── jmock-shim.ts         # 兼容性封装
│   └── types.d.ts                # 类型定义
├── test/
│   └── smoke.test.ts             # 冒烟测试
├── screenshots/                  # 截图资源
├── jmock.config.mjs              # 用户配置文件（示例）
├── package.json                  # 项目配置与依赖
├── tsconfig.json                 # TypeScript 配置
├── .eslintrc.json                # ESLint 配置
├── .prettierrc.json              # Prettier 配置
└── .markdownlint-cli2.jsonc      # Markdown lint 配置
```

## 路径格式规范

- 在文档中提及文件路径时，优先使用相对路径，以保持跨设备下的通用性
- 在终端中提及文件路径时，优先使用绝对路径，以方便终端/IDE 将其识别为可点击的链接
- 使用正斜杠作为路径分隔符，路径包含空格时使用引号包裹，以确保跨平台兼容性和正确解析

## 终端命令能力识别

执行终端命令前，先读取项目根目录下的 `.terminal.local.md`，并优先使用其中记录的已验证 shell 启动入口、命令可用性和命令写法。

- 在读取 `.terminal.local.md` 前，优先使用 Agent 原生文件读取能力；若不可用，则直接使用 `node` 进程读取文件内容，不通过 shell 包装。
- 只有原生读取与 `node` 读取均不可用时，才按固定优先级执行最小 shell 读取探测；该阶段只用于判断文件是否存在并读取内容，不代表终端能力结论。
- 如果 `.terminal.local.md` 不存在、内容为空或记录与实际执行结果不一致，优先使用 `yy-detect-terminal` 技能创建或更新该文件。
- 如果 `yy-detect-terminal` 技能不可用，使用最小化本地回退规则：先确认可用 shell，再确认命令存在性判断方式，最后记录首选 shell、备用 shell、不可用 shell 和搜索命令选择。
- `.terminal.local.md` 只描述本机环境，不代表其他开发者环境；发现记录失效时应立即更新。

## 需要遵守的规则

- 执行指令前，先检查项目根目录下是否存在 `AGENTS.LOCAL.md` 文件；如果存在，读取其中的内容并**严格遵守**；该文件用于存放开发者个人偏好配置，已添加到 `.gitignore` 避免误提交
- 遵循 `.editorconfig` 中定义的编辑器风格配置
- 遵循 `SECURITY.md` 中的安全策略
- 遵循 `README.md` 中的项目说明

## 关键参考

- `package.json` — 项目配置，包含依赖、脚本、入口和发布配置
- `tsconfig.json` — TypeScript 编译配置
- `.eslintrc.json` — ESLint 代码检查规则
- `.prettierrc.json` — Prettier 格式化规则
- `.editorconfig` — 编辑器配置，编写内容时需遵循
- `README.md` — 项目说明文档
- `.terminal.local.md` — 本机终端能力记录
