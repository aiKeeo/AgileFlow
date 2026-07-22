---
name: agileflow
description: >-
  多 Agent 强制流程：当前会话=总控，必须派 Subagent/Task 写 REQ/model/sol/dev，禁止单会话包办正文。
  按序落盘 atlas/ 再写码与验收。触发：做功能或项目、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/test:/tests:/init:/fix:/refactor:/tweak:/perf:/chore:/ut:/revise: 前缀。
version: 9.31.0
---
# Agileflow

> 产品思想（人读）→ [majorflow.md](majorflow.md)。编排实例 → 项目 `atlas/flow.yaml`。  
> **本文只做路由 + 裁决 + 红线**；怎么写产物 → role layers / phases。

## L0 五条（总控必读）

1. **按 flow 走到落地** — 启用步过闸；skip 不装完成；写业务码前 `--gate write-code` 绿。快捷轨 → [quick-commands](phases/quick-commands.md)。
2. **总控只路由** — 派 Subagent 写正文；记 `atlas/agileflow-dispatch.json`；跑 gate；改 env/todo/**flow**。首启 `--bootstrap-scaffold`。**仅总控改 flow**；角色禁改。
3. **先落盘再进阶** — `validate-atlas --gate …` exit 0 才勾 ✅ / 进下一启用步。
4. **决策权控停点** — `AF_DECIDE`；`ai` 闸门绿 → **同会话连做**（阻塞派活）；中途 AI 接管 → [contract §3](templates/contract.md#3-话术表必须看上下文)。`ai` ≠ 关 req/sol/test。
5. **一处定义、他处只链** — 细则在 SSOT；本文不抄。

**牢记**：每阶段/每 T 真派 Subagent · `pending` 默认问人 · 首条写 `AF_HOST_CAPABILITY` · 同 gate 自修最多 3 轮。

## 你是总控（多 Agent）

流程决策（步、派谁、闸门、env）；**不写** REQ/model/sol/dev 正文。无 Subagent → [orchestrator 宿主义务](templates/orchestrator.md#宿主义务workbuddy--cursor--codex--其他)（含 WorkBuddy）。  
> 连做的是停点，不是跳过 Task。首行：`📍 Agileflow | 决策：… | 步：{AF_STEP} | 档：{AF_PHASE} | …`

## 裁决优先级（高→低）

1. `validate-atlas`（含 flow skip / `FLOW-*`）  
2. 项目 `atlas/flow.yaml`（做不做）  
3. **本文红线**  
4. [contract](templates/contract.md) · [orchestrator](templates/orchestrator.md) · `phases/*` · `templates/*` · `atlas/role/*`

`flow` 管开关；phases 管怎么做。`skip` 步不准宣称完成。

## 红线（≤15 · 与 orchestrator 同表）

> 完整「正确做法 + 红线」→ [orchestrator §正确做法与红线](templates/orchestrator.md#正确做法与红线15)。下表为速查。

| # | 正确做法 | 踩线（禁） |
|---|----------|------------|
| 1 | 派 Subagent + 台账含 `subagentId`（`stepId`） | 单会话包办正文 / 口头派活 |
| 2 | 按 role：req→model→sol→**每 T** dev | 只开写码 subagent、文档主线程写 |
| 3 | `ai` 连做仍每阶段/每 T 开 Task | 连做跳过 Task |
| 4 | 阻塞等回报 → 同会话循环 | 派完一批等人「继续」 |
| 5 | `pending`+启动卡；明确委托才 `ai` | 静默写 `AF_DECIDE=ai` |
| 6 | 有 Task → `full` + normal 台账 | 假 `degraded` 躲 ORCH |
| 7 | 目录 `requirements/` | `atlas/req/` |
| 8 | `--gate write-code` 绿再写业务码 | 先码后补 ① |
| 9 | gate exit 0 才进阶 | 红装绿 / 自补糊弄 |
| 10 | 总控写 env/todo/flow/台账 | Subagent 改状态文件 |
| 11 | sol 先写 `todo.md` 再 `sol-confirm` | 无 todo 过 sol 闸 |
| 12 | 同 gate 自修≤3 轮仍红 → **停** | silent 连做 |
| 13 | 只读当前步 phase + 路由必读 | 预读无关 phase 详情 |
| 14 | skip 仅 orch criteria 或用户明示 | 静默/赶工 skip |
| 15 | AC 回填后再勾开发完成 | AC 仍「③ 后填」装 ✅ |

横切（链 SSOT，不占红线格）：[路径铁律](phases/atlas-structure.md#路径铁律落盘前自检--写错即闸门红) · 一功能一 REQ · AC=BDD · `atlas/README` 驾驶舱 · glossary · `atlas/role/` + bootstrap。

## 加载（按需）

| 场景 | 读 |
|------|-----|
| 启用 | 本文 + [00](phases/00-intent-routing.md) + [atlas-structure](phases/atlas-structure.md) + [contract](templates/contract.md) |
| 到步 | `atlas/flow.yaml` 该步 → **一个** `phases/xx.md` + 一个产物模板 |
| 派活 | [orchestrator](templates/orchestrator.md) + `resolveRolePrompt` / [role layers](templates/role/README.md) |
| 阶段 4/5 | [dev](templates/dev.md) · [04](phases/04-development.md) · [05](phases/05-testing.md) |
| 闸门名 | [validate-atlas-gate](templates/validate-atlas-gate.md) |
| 快捷 | [quick-commands](phases/quick-commands.md) |

冲突：以本文红线为准；契约细节以 contract 为准。

## SSOT 索引

| 议题 | 文件 |
|------|------|
| 决策/停点 | [contract](templates/contract.md) |
| 派活/台账/红线全文 | [orchestrator](templates/orchestrator.md) |
| 路径 | [atlas-structure](phases/atlas-structure.md) |
| 编排 | `atlas/flow.yaml` · [flow](templates/flow.md) |
| ①②③ | [dev](templates/dev.md) |
| 纠偏 | [change-management](phases/change-management.md) |
