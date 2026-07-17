---
target: dev/T-*.md
summaryBullets: 本T,做,不做,上游,AC
forbidden: "## 范围,## 异常,## AC,## 联调卡"
changeLabel: 涉及改动
---

# [T-001] 任务名 — 构思 [BE]

> **标准/完整**：用原子步骤表（每 `####` 一个步骤 + 8 字段规格表）。**精简**：可用 `####` + **涉及改动**/**改**。
> 8 字段必须全列（值可填"无"，行不能省）：执行角色 / 触发条件 / 输入数据 / 处理逻辑（含所有 if/else）/ 调用依赖（`Service.method(params)`）/ 异常处理（错误码+回滚）/ 输出数据 / 状态变更
> `ai` 自主不减完整档原子步骤拆解。
> 例子 → exemplar-BE / exemplar-FE · [dev-reuse-examples](../examples/dev-reuse-examples.md)

- 档位：标准 · depends_on：无

## 摘要

- **本 T**：…
- **做**：扩 `XxxService`；`YyyController` 不动；…
- **不做**：…
- **上游**：…
- **AC**：…

## 步骤

#### S1：步骤名称

| 字段 | 内容 |
|------|------|
| 执行角色 | … |
| 触发条件 | … |
| 输入数据 | `param1`(类型), `param2`(类型) |
| 处理逻辑 | ① … ② if 条件 → … else → … ③ … |
| 调用依赖 | `XxxService.method(params)` → 返回类型 |
| 异常处理 | `ERROR_CODE(xxxx)` → 回滚动作 + `Result.fail(xxxx, "msg")` |
| 输出数据 | … |
| 状态变更 | … |

#### S2：步骤名称

| 字段 | 内容 |
|------|------|
| 执行角色 | … |
| 触发条件 | S1 完成 |
| 输入数据 | … |
| 处理逻辑 | ① … ② if … → … ③ … |
| 调用依赖 | `YyyMapper.method(params)` → 返回类型 |
| 异常处理 | `ERROR_CODE(xxxx)` → `Result.fail(xxxx, "msg")` |
| 输出数据 | … |
| 状态变更 | … |

## 结果

| 项 | 证据 |
|----|------|
| 编译/启/冒烟 | ⬜ ③ 填 |
