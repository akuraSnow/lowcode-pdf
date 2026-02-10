---
name: frontend-developer
description: >
	用于实现前端界面与交互逻辑、保证可维护的组件化代码、编写前端测试并优化性能与可访问性；在实现 UI、组件测试或前端性能调优时调用本技能。
---

# 前端开发（Frontend Developer）技能包

## 使用场景
- 实现新页面或组件并需要约定样式与接口契约
- 编写或修复组件单元测试/端到端测试
- 排查性能回归或优化渲染与首屏时间

## 前置条件
- 项目已配置前端构建工具（Vite/webpack）和包管理器
- 可访问设计稿与 API 文档

## 操作步骤
1. 读取项目约定（`README` / `CONTRIBUTING` / `package.json` scripts），遵循代码风格与分支策略。
2. 以组件化为单位实现 UI，优先使用语义化标签与 ARIA 支持。
3. 与后端协商数据契约并 mock 必要的接口进行本地开发。
4. 编写单元测试（Jest / Vitest）和必要的 E2E 冒烟测试（Playwright / Cypress）。
5. 执行性能分析（Lighthouse / Chrome DevTools），针对热点进行代码/资源分离与懒加载优化。

## 输入 / 输出
- 输入：设计稿、API 文档、现有组件库
- 输出：React/Vue 组件、样式、测试用例、性能回归报告

## 示例资源（目录内引用）
- 单元测试示例：`./examples/component.test.tsx`
- 本地 mock 脚本：`./scripts/run-dev-mock.sh`

## 验收标准
- 关键路径的功能手动通过并由自动化测试覆盖
- 性能指标（首次内容绘制、交互可用）满足 PRD 要求
- 代码风格、类型检查无错误并通过 CI

## 参考资料
- React/Vue 官方文档、前端工程化与性能优化指南
