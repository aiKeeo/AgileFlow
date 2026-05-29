---
name: dev-flow
description: >-
  智能开发流程总控：自动判断快速/严谨模式，按需求→建模→设计→任务跟踪→开发→测试顺序执行，
  全程维护 specs/todo.md。任何新功能开发、项目搭建、全流程交付请求时优先启用本技能。
version: 1.1.0
category: workflow
priority: 100
---

# DevFlow 智能开发总控

## 核心规则（最高优先级，不可违反）

1. 任何开发请求，必须先启动本技能
2. 自动判断项目类型，切换「快速模式」或「严谨模式」
3. 严格按顺序执行：需求 → 建模 → 设计 → 任务跟踪 → 开发 → 测试
4. **上一环节未确认通过，禁止进入下一环节**
5. **每个环节完成后，必须自动更新代办事项列表**（调用 task-tracking 技能或直接更新 `specs/todo.md`）
6. 所有输出必须保存到对应目录

## 自动模式判断规则

**快速模式**（满足任意一条）：

- 原型、Demo、个人小工具
- 简单 CRUD、单页面、纯前端展示
- 开发时间 < 1 天
- 无高可用、高并发要求

**严谨模式**（满足任意一条）：

- 核心业务、服务端接口、数据库操作
- 涉及支付、权限、用户数据
- 开发时间 > 1 天
- 团队协作、需要长期维护

## 执行流程（含任务跟踪）

1. 向用户确认项目类型和基本信息
2. 调用 `product-requirement` 技能 → 生成 `specs/001-requirement.md`
3. 需求确认后，调用 `data-modeling` 技能 → 生成 `specs/002-data-model.md` 与 `sql/init.sql`
4. 模型确认后，调用 `solution-design` 技能 → 生成 `specs/003-solution.md`
5. 方案确认后，调用 `task-tracking` 技能 → 生成/初始化 `specs/todo.md`
6. 调用 `development` 技能（传入模式参数）→ 每完成一个任务自动更新 `specs/todo.md`
7. 开发完成后，调用 `testing` 技能 → 生成 `specs/004-test-report.md` 并更新代办
8. 输出最终交付物和验收报告（`specs/delivery-report.md`）

## 子技能调用顺序

| 步骤 | 技能名 | 产出 |
|------|--------|------|
| 1 | product-requirement | specs/001-requirement.md |
| 2 | data-modeling | specs/002-data-model.md, sql/init.sql |
| 3 | solution-design | specs/003-solution.md |
| 4 | task-tracking | specs/todo.md |
| 5 | development | src/, tests/ |
| 6 | testing | specs/004-test-report.md, specs/delivery-report.md |

## 强制文档产出（总控）

| 文件 | 说明 |
|------|------|
| `specs/README.md` | 项目总览文档（流程启动时创建或更新） |
| `specs/todo.md` | 全程自动更新的代办事项列表 |

## 项目初始化

若 `specs/` 目录不存在，先创建：

```
specs/
├── README.md
└── todo.md
```

在 `specs/README.md` 中记录：项目名称、模式、当前阶段、各文档链接。

## 环节闸门

- 用户未明确确认「需求 OK」→ 禁止进入数据建模
- 用户未明确确认「模型 OK」→ 禁止进入技术方案
- 用户未明确确认「方案 OK」→ 禁止进入开发与任务拆解执行
- 测试未通过 → 禁止生成交付报告
