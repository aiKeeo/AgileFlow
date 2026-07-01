---
name: agileflow
description: >-
  Agileflow 结构化交付（init 项目盘点→需求→建模→方案→开发→验收），文档落盘 atlas/（项目图谱），开发须构思落盘再写码。
  init: 仅 brownfield 已有项目；greenfield 从零不做 init。REQ 开发完毕后可 refresh init。
  在用户 @agileflow、使用 init:/req:/mod:/sol:/dev:/tests: 前缀、说「走 agileflow/完整流程/从零做系统/继续 agileflow/下一步」、
  或明确要求 init/REQ/建模/方案/dev/验收测试时使用。不用于纯答疑、code review、单行 hotfix。
version: 7.14.0
---

# Agileflow

## 两条硬约束（最高优先级，覆盖速度/催进度/委派）

### A. 阶段结束 → 必须 AskQuestion 小卡片 → 停止

| 时机 | 必须 | 禁止 |
|------|------|------|
| 阶段 **0/1–4** 本阶段产出完成 | **调用 `AskQuestion` 工具**（阶段 0 用 [init 确认](templates/init-doc.md#init-确认-askquestion)；1–4 用[阶段闸门](templates/askquestion-gate.md#阶段闸门模板)）→ **本回复结束** | 自然语言问「是否继续」；假设用户同意；**同一回复**进入下一阶段 |
| 阶段 1 收到需求 | AskQuestion 需求卡片 → 停止 → 再写 REQ | 未问就写 REQ |
| 子步骤确认后（如方案确认、REQ 草稿） | 仍须再发**阶段闸门**（若本阶段已结束） | 确认后直接开下一阶段 |

**催进度（只看成品 / 全部做完 / 快速交付）**：仅可少**阶段内**重复审阅卡；**不可少阶段闸门、不可跳开发三步序**。

### B. 阶段 4：开发 = todo 三步子项 + 构思落盘 → 写码 → AC 验收

**dev 规则核心：todo ① 未勾 = 禁止写码。** 三步须写入 `atlas/todo.md` 子项并 **`TodoWrite` 同步**。细则见 [dev-rationale dev 规则](templates/dev-rationale.md#dev-规则构思先行)。

```
todo/TodoWrite ① 构思落盘（七段模板）→ ② 按 五、核心流程 写码 → ③ 对照 八、REQ验收 AC
```

| 步骤 | 本质 | 落盘/勾选 | 禁止 |
|------|------|-----------|------|
| **① 构思落盘** | 把「怎么写、怎么验、边界在哪」写进 dev | `atlas/dev/T-{id}-*.md` + **勾 todo ①** | 口头想想直接写码；跳过 todo ① |
| **② 按构思开发** | 执行 **五、核心流程** | 源码 + **勾 todo ②** | ① 未勾就写码；脱离 **五** 即兴写码 |
| **③ 对照 REQ 验收 AC** | 按 **八** 引用的 REQ AC 测 | test/ac + **九** + **勾 todo ③** | 自造标准；未全绿标父任务 ✅ |

**构思不落盘 = 接手人看不懂代码。** architecture/contracts **≠** dev 构思文档。

模板 + 构思检查清单 → [dev-rationale.md](templates/dev-rationale.md)。

---

## 加载与阅读

| 须加载 | 不加载 |
|--------|--------|
| 前缀 `init/req/mod/sol/dev/tests:`、`@agileflow`、完整交付、brownfield 接手 | 纯答疑、review、≤20 行小改、hotfix |
| brownfield 首次 `dev:/sol:` 且无 init | greenfield 从零（**跳过 init**） |

1. 必读 [00-intent-routing.md](phases/00-intent-routing.md)
2. brownfield 且 `init:` / 须 init → 读 [00-project-init.md](phases/00-project-init.md) + [init-doc.md](templates/init-doc.md)
3. 再读**一个** phase（init → `00-project-init`；变更 → `change-management.md`）
4. 阶段 4 共读 [dev-rationale.md](templates/dev-rationale.md) + [04-development.md](phases/04-development.md)
5. 阶段结束必读 [askquestion-gate.md](templates/askquestion-gate.md)
6. 并行仅显式要求时读 [parallel-orchestration.md](phases/parallel-orchestration.md)

## 术语

| ✅ | ❌ |
|----|-----|
| **init:** brownfield as-is；`p0-business` + `glossary/` 术语 | greenfield 建 init/；init 写任务/AC |
| 方案 `sol:`、`contracts/`、feature `## 边界` | SDD、interfaces/、boundaries.md |
| **UID**（REQ 界面描述，样式待定） | REQ 里定配色/px；REQ 写 UI-xxx 契约 |
| **批次** | Wave |
| **① 构思落盘** | 口头想想直接写码 |
| **③ 对照 REQ 验收 AC** | 自造验收标准 |

## 阶段路由

| 阶段 | 文件 | 产出 |
|------|------|------|
| 0 | [00-project-init.md](phases/00-project-init.md) | init/（**仅 brownfield**） |
| 1 | [01-requirement.md](phases/01-requirement.md) | REQ + **UID**（可选 UI 描述） |
| 2 | [02-modeling.md](phases/02-modeling.md) | model/ |
| 3 | [03-solution-design.md](phases/03-solution-design.md) | solution/ + todo |
| 4 | [04-development.md](phases/04-development.md) | dev + 源码 + test/ac |
| 5 | [05-testing.md](phases/05-testing.md) | atlas/tests/ |
| 变更 | [change-management.md](phases/change-management.md) | 影响分析 + 重跑 |

## 铁律摘要

1. **前缀=目录**（根目录 **`atlas/`** 项目图谱，含 `init:`）；阶段 0/1–4 结束 → **AskQuestion → 停止**
2. **greenfield 不做 init**；**brownfield** 进 dev/sol 前须 init 已确认或用户本轮完成 init
3. **req 入口**必先 AskQuestion（见 01）
4. **开发** todo 三步 + `TodoWrite` 同步；①→②→③ **顺序不可跳**；委派/subagent 不豁免（见 04）
5. **AC 只在 REQ**；dev **八** 只引用 REQ，③ 按 **八** 测
6. **REQ 变更** → change-management，默认重跑 dev→tests
7. **humanTodo 未清** → 禁止 tests 标 PASS
8. **一任务一 dev 文档**；七段齐全；humanTodo 须沉淀
9. **REQ 开发完毕** → AskQuestion 是否 **增量 refresh init**（实现已改 as-is 时）

## 首行声明

`📍 Agileflow | 模式：{快速/严谨} | 阶段：{0-init|N-名} | 入口：{init:|前缀|续跑|@agileflow}`

阶段 4 每步加：`步骤：{①构思落盘|②按构思开发|③对照REQ验收AC} | 任务：{T-xxx} | dev：{路径}`

示例 → [flow-interaction.md](examples/flow-interaction.md)
