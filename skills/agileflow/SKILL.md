---
name: agileflow
description: >-
  五阶段软件交付流程（需求→建模→方案→开发→测试），AskQuestion 闸门，维护 specs/ 文档体系。
  仅在用户明确走流程时启用：@agileflow、从零做系统、走完整流程、已有 specs/ 时说「继续 agileflow」
  或指定阶段（写 REQ、数据建模、出技术方案、按流程开发、验收测试）。
  不用于纯解释代码、code review、答疑、未提及流程的普通小改。
version: 4.2.0
---

# Agileflow 智能开发全流程

> **入口**：先读 [phases/00-intent-routing.md](phases/00-intent-routing.md) → 再读**一个** phase；模板按需加载。

## 阶段路由

| 阶段 | 文件 | 产出 |
|------|------|------|
| 1 需求澄清 | [phases/01-requirement.md](phases/01-requirement.md) | `specs/requirements/REQ-*.md` |
| 2 数据建模 | [phases/02-modeling.md](phases/02-modeling.md) | `specs/002-data-model.md`, `sql/init.sql` |
| 3 技术方案 | [phases/03-solution-design.md](phases/03-solution-design.md) | `specs/003-solution.md` |
| 4 开发实现 | [phases/04-development.md](phases/04-development.md) | 业务代码、测试代码 |
| 5 测试验收 | [phases/05-testing.md](phases/05-testing.md) | `specs/tests/REQ-*-验收报告.md` |
| 任务跟踪 | [phases/task-tracking.md](phases/task-tracking.md) | `specs/todo.md`, `specs/humanTodo.md` |

**模板**：[templates/](templates/) · **示例**：[examples/flow-interaction.md](examples/flow-interaction.md)

## 铁律（细则见引用文件，此处不重复）

1. **顺序**：需求 → 建模 → 方案 → 开发 → 测试；豁免见 [00-intent-routing.md §①](phases/00-intent-routing.md)
2. **职责**：阶段 4 只写代码；阶段 5 才跑验收与出报告
3. **闸门**：阶段 1–4 结束必须 `AskQuestion` → **立即停止** → [askquestion-gate.md](templates/askquestion-gate.md)
4. **跟踪**：每阶段更新 `specs/todo.md`；人类依赖写 `specs/humanTodo.md` → [task-tracking.md](phases/task-tracking.md)
5. **阻塞**：humanTodo 未清 → 结论 `BLOCKED-HUMAN`，禁止标 PASS → [human-todo.md](templates/human-todo.md)

## 首行声明

进入阶段后回复首行：

`📍 Agileflow | 模式：{快速/严谨} | 阶段：{N}-{名称}`

模式判定见 [00-intent-routing.md §模式](phases/00-intent-routing.md)。

## 阶段闸门速查

| 完成阶段 | 下一步 |
|----------|--------|
| 1–4 | AskQuestion 是否进入下一阶段 → 停止 |
| 5 | 更新 README + todo ✅，流程结束 |

阶段 5 结论（PASS / BLOCKED-HUMAN / FAIL）见 [05-testing.md](phases/05-testing.md)。
