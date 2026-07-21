---
name: agileflow
description: >-
  多 Agent 强制流程：当前会话=总控，必须派 Subagent/Task 写 REQ/model/sol/dev，禁止单会话包办正文。
  按序落盘 atlas/ 再写码与验收。触发：做功能或项目、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/test:/tests:/init: 前缀。
version: 9.23.0
---
# Agileflow

> **核心思想**：流程即产品——把想法拆解到实现落地。防幻觉、防跳阶段、防空跑是加固，服从拆解，不反客为主。

## 多 Agent（横幅）

读到本 skill = **你是总控**。阶段 1–4 必须派 Subagent/Task 写产物正文；禁止本会话包办 REQ/sol/dev/码。无子代理能力（含部分 WorkBuddy 环境）→ 首行 `⚠️ 宿主无 Subagent…` 后仍按角色边界分步 + 每阶段 gate。  
> **AI 自主连做 ≠ 单会话包办**：连做仍须**每阶段 / 每 T 真调用 Task**；连做的是停点，不是跳过 Subagent。  
> 首行：`📍 Agileflow | 决策：{AF_DECIDE→AI全权/我来} | 阶段：{AF_PHASE} | …`（env 值须译成用户能懂的中文）

## 裁决表（冲突时以此为准）

### 全局铁律

| 议题 | 裁决 |
|------|------|
| **首启契约（最高）** | `AF_DECIDE=pending`。没说清谁决策 → [contract 启动卡](templates/contract.md#71-流程启动卡)→停。明确委托（你定/别问我…）→ 可写 `AF_DECIDE=ai`。**禁止**静默写 ai。权威 → [contract](templates/contract.md) |
| **多 Agent / 总控（最高）** | 总控只路由、派 Subagent、**记派活台账**、跑 gate、更新状态。禁写产物正文。可写：`agileflow.env`·`todo.md`·`humanTodo.md`·驾驶舱·REQ 状态行。用户话术委托/接管/重选时**必须**改 `AF_DECIDE`。首启 `--bootstrap-scaffold` 落盘 `atlas/role/` + `humanTodo.md` + `agileflow-dispatch.json`。→ [orchestrator](templates/orchestrator.md) |
| **派活台账（硬挡）** | Subagent 回报后总控写入 `atlas/agileflow-dispatch.json`；**仅** `validate-atlas --gate` 校验 `ORCH-*`（Node CLI，跨 IDE 通用；**无 IDE Hook**）。无 Subagent 宿主 → `mode: degraded-single-session` 跳过。 |
| **自定义 role** | `atlas/role/role-*.md` 相对 bootstrap baseline 有改动 → **跳过该阶段默认文档格式闸门**（`ROLE-CUSTOM-SKIP`）；**ORCH / af-env / dir 仍硬挡**。重置：`--refresh-role-baseline` |
| **流程状态** | `atlas/agileflow.env`：`AF_PHASE`/`AF_DECIDE`/`AF_TIER=full`/`AF_STACK_SOURCE`；pending 或与产物不一致 → 闸门卡住 |
| **阶段结束** | `ai`+闸门绿 → 摘要+**同会话连做**（阻塞式派活，**禁止**甩「继续」给人）；`user` → 阶段闸门→停。细节 → [contract §4](templates/contract.md#4-停点总表) · [orchestrator 自治循环](templates/orchestrator.md) |
| **中途 AI 接管** | 「不想看了/后面都你定/剩下你来」等 → 立刻改 `AF_DECIDE=ai`。→ [contract §3](templates/contract.md#3-话术表必须看上下文) |
| **路径铁律（最高）** | 只认全名 `requirements/`·`model/`·`solution/`·`dev/`·`tests/`；`todo.md` 仅 atlas 根；派活台账 `atlas/agileflow-dispatch.json`；契约一暴露面一文件 `API-XXX-*.md`/`UI-XXX-*.md` |
| **REQ 拆分 / 只链不抄 / AC=BDD** | 一功能一 REQ；下游只链 UID/API/UI§字段绑定/F；AC 即 Given/When/Then |
| **人类驾驶舱** | 强制 `atlas/README.md` → [atlas-readme](templates/atlas-readme.md) |
| **信息充分少问** | → [contract §5](templates/contract.md#5-信息充分少问user) |
| **纠偏阶梯** | L0–L3 → [change-management](phases/change-management.md) |
| **术语落盘** | 唯一 `atlas/glossary.md`；greenfield 禁 `atlas/init/**` |

### 阶段机制

| 议题 | 裁决 |
|------|------|
| **总控派活** | 读 `atlas/role/role-*.md` + 注入任务 → **真派** Subagent（Cursor=`Task`）→ 收回报写 **派活台账** → 再跑 gate。Dev **每 T 一次**（内 ①→②→③）。sol 先写 `atlas/todo.md` 再 `sol-confirm`。阶段 0/5 总控直做，不记 role 台账 |
| **sol F / dev 文档** | F=边界+暴露面；**全端** dev=摘要+主流程+边界+实现说明+结果（唯一完整质量线）→ [dev-granularity](templates/dev-granularity.md) · [dev](templates/dev.md) |
| **决策权 / 委托** | 只控停点与是否问人；文档同质（`AF_TIER=full`）。委托非默认。→ [contract](templates/contract.md) |
| **建模跳过** | user 须确认；ai 落盘判定。`ai`+自检齐可同条进 sol |
| **写法锚点** | brownfield：`init/codebase/p1-{端}.md`；greenfield：`solution/code-patterns-{端}.md` |
| **测试入场 / 闸门全集** | [05-testing](phases/05-testing.md) · [validate-atlas-gate](templates/validate-atlas-gate.md) |
| **文档形态** | 默认 legacy；`AF_TEMPLATE=yes` 才读 `atlas/template/` |

### 错 → 对（合并）

| ❌ | ✅ |
|----|----|
| 单会话包办正文 | 派 Subagent + 记台账（含 `subagentId`） |
| 只开写码 subagent、文档主线程写 | 按 role 派：req/model/sol/每 T dev |
| `ai` 连做跳过 Task | 连做仍每阶段/每 T 开 Subagent |
| 契约未确认静默 `AF_DECIDE=ai` | pending + 启动卡；明确委托才跳过 |
| 你定 = 不写 atlas / 每阶段仍停 | 仍落盘；`ai` 应连做 |
| `ai` 派完一批等人「继续」 | 阻塞等回报 → 同会话循环到交付 |
| `req:` → 目录 `atlas/req/` | 目录必须 `requirements/` |
| 先码后补 ① | 事后补写不勾① |

## 闸门（硬挡）

`validate-atlas --gate …` exit 0 才能进阶/勾 ✅。error=warn=失败。可运行须真跑并写入 `## 结果`。

## 主链（不可跳）

```
req → requirements/ → 闸门
mod → model/ → 闸门（可跳须判定进 todo）
sol → solution/ + atlas/todo.md → 闸门
dev → ①→②→可运行→③ → 闸门
tests → 入场 → AC 归档
```

写业务源码前须 `--gate write-code` 绿（`anti-skip` 为别名）。CLI：`--root` 不是 `--project`。

### 阶段 4

→ [dev](templates/dev.md) · [04](phases/04-development.md)  
每 T：TodoWrite①②③ → 派 1 次 role-dev → 勾选。并行 → [04 §并行](phases/04-development.md#并行阶段-4)。

### 豁免

首行 `豁免：{微型|hotfix|问答}` → [00-intent-routing](phases/00-intent-routing.md)（**仅未启用 AF**：无 `atlas/agileflow.env` 且无 `atlas/requirements/`）

## 加载

| 场景 | 必读 |
|------|------|
| 启用 | 本文 + [00-intent-routing](phases/00-intent-routing.md)；契约 → [contract](templates/contract.md) |
| 当前阶段 | **一个** `phases/xx.md` + 其链接的 **一个** 产物模板 |
| 阶段 4 | [04](phases/04-development.md) + [dev](templates/dev.md) + exemplar + [todo](templates/todo.md) |
| 阶段 5 | [05-testing](phases/05-testing.md) |
| 派活 | [orchestrator](templates/orchestrator.md) + `atlas/role/` |
| 闸门名 | [validate-atlas-gate](templates/validate-atlas-gate.md) |

禁止预读无关 phase。他处与裁决表冲突 → 以本文为准；契约细节以 [contract](templates/contract.md) 为准。

### 关键文件

| 级别 | 文件 |
|------|------|
| 关键 | SKILL.md, phases/00-intent-routing.md, templates/contract.md |
| 阶段关键 | phases/01～05 |
| 脚本 | scripts/validate-atlas.mjs |
