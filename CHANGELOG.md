# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 2.0.0 (2026-07-10)

### Features

- 集成 nsuite 错误日志并清理未使用参数 ([6460f9f](https://github.com/Yakima-Teng/jmock/commit/6460f9f19b42b6b40c0727baad536956f122b223))
- 重构部署流程，添加 release 脚本和 npm token 自动读取 ([1ce3d4c](https://github.com/Yakima-Teng/jmock/commit/1ce3d4c7046ecc7e693841f96f10e3e8deac2e73))

### Bug Fixes

- 修复错误处理中的控制流问题并清理冗余代码 ([4bae39c](https://github.com/Yakima-Teng/jmock/commit/4bae39c7e190b6e864d94ea79c8374b811e73d60))

## 1.0.2

- support mocking data and proxying requests with configuration.

## 1.0.3

- support `jmock --config` command (generate configuration file automatically)
- add Chinese version of README.md

## 1.0.4

- let configuration file takes effect directly after `jmock --config`
