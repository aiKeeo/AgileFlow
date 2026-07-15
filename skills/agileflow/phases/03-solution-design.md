# 阶段 3：方案设计（sol:）

> **本阶段完成 = `atlas/solution/` + `atlas/todo.md` 开发任务已写出**。
> 用户阶段闸门选「是，继续」后，下条回复进入 dev 须写 `atlas/dev/T-xxx.md`。
> **用户前缀**：`sol:` = `atlas/solution/`
> 模板：[templates/solution-core.md](../templates/solution-core.md)  
> **默认**：主 Agent **串行**写 features + todo。**并行出方案**仅用户显式要求时 → [parallel-orchestration.md](parallel-orchestration.md) 批量出方案。

## 方案设计四要素

| # | 要素 | 落在哪里 |
|---|------|----------|
| **1** | **功能（含边界）** | `features/F-xxx.md` — 说明 + **§边界** + 验收要点 |
| **2** | **契约 / 接口文档（按需）** | `contracts/` — **暴露面详细规格集中存放**；feature 只链 ID |
| **3** | **架构（全局一份）** | `architecture.md` — 全项目共享，不按功能拆 |
| **4** | **任务编排** | `atlas/todo.md` + 功能依赖表（供阶段 4 **串行**排序；并行时作批次参考） |

**阶段 4 才写**：源码、AC 测试代码、dev/ 实现步骤。

## 目录结构

```
atlas/solution/
├── README.md
├── features/
├── contracts/         # 按需
├── architecture.md    # 全局唯一
└── code-patterns-{端}.md   # greenfield 模式 B 🌱（§三待补充；默认）
```

## 标准流程（默认）

0. **契约/决策权**：无 env 或 pending → [流程启动卡](../templates/stage-delegation.md#流程启动卡首启强制) → 停；已确认则按 `AF_DECIDE` 分支（见 [stage-delegation](../templates/stage-delegation.md)）
1. 读已确认 REQ +（按需）model/ + **有 UID 时读 `requirements/ui/`**
2. 初始化 `solution/`：README、features/、contracts/（目录即可）
3. 写 `features/F-xxx.md`：映射 REQ、**暴露面**、**§边界**、验收要点
4. **按需**写 `contracts/`（有暴露面才建文件）；**UI-xxx 须基于 UID** 补充路由、组件树、API 绑定（见 [req-ui-design 阶段衔接](../templates/req-ui-design.md#阶段衔接)）

**user_decide 分支**（**先落盘再确认**，见 [flow-modes 阶段 3](../templates/flow-modes.md#阶段-3--先落盘再确认快速也适用)）：

5. **AskQuestion 技术栈** → 停止（禁止此时确认「方案」——architecture 尚未写）
6. **下条**写 `architecture.md` + `code-patterns` + 补全 features/contracts + 拆解 `todo.md`
7. **AskQuestion**：  
   - **快速**：方案确认 + 是否继续 **合并 1 卡** → 停止（含继续则不再单独阶段闸门）  
   - **严谨**：方案确认卡 → 停止 → 再 **阶段闸门** → 停止  
8. 确认后 README **已确认**

**ai_decide 分支**（须 `AF_DECIDE=ai` 已由启动卡/用户原话确认；跳过技术栈/确认用户卡）：

5. Agent **自行选定**技术栈（写入决策记录）；更新 `atlas/agileflow.env`：`AF_PHASE=3`、`AF_STACK_SOURCE=ai_record`（**禁止**把 `AF_DECIDE` 从 user 改成 ai）
6. 写 `architecture.md` + `code-patterns-*.md` + features/contracts + `todo` + **AI 决策记录**
7. 跑 `validate-atlas --gate sol-confirm`（不过 → 按报错改 env/落盘）→ **审阅闸门** → 停止（用户可选「不审继续」→ 下条进 dev，并把 `AF_PHASE=4`）

### 阶段收尾 — **阶段闸门**（仅 user_decide · 严谨）

> **AI 自主**：审阅闸门已含「继续下一阶段」，**不走本步**。  
> **快速**：若确认卡已含「是，继续」→ **不走本步**（见 flow-modes）。

`solution/README.md` 标 **已确认**、todo 已写入、**humanTodo 已沉淀**（**已决事项须从 humanTodo 删除**；用户原话/本阶段已答清的项禁止留在 humanTodo；禁止与 `architecture` 已选栈矛盾）、**`atlas/README.md` 已更新**（已拍板栈 / 现在 / 未决）后 → 调用 [阶段闸门](../templates/askquestion-gate.md#阶段闸门模板)（prompt：`方案设计已完成。是否继续进入【开发实现】阶段？`）→ **停止**。
## 批量出方案（可选 — 仅用户显式要求并行出方案）

> 用户说「并行出方案 / 多 subagent 写 features」且功能 ≥2 或全栈 FE+BE 时启用。

| 步 | 主 Agent | Subagent |
|----|----------|----------|
| 1 | 读 REQ + model | — |
| 2 | AskQuestion 技术栈 → 停 | — |
| 2.5 | **AskQuestion 并行启动卡**（确认并行出方案 + 本批功能数 ≤3）→ 停 | — |
| 3 | 拆片启 Task（路径无冲突） | 各写 `features/F-xxx`（含 §边界）+ 按需 `contracts/*` |
| 4 | 合并 README 索引、去重 ID | — |
| 5 | 写/更新 **architecture.md** + todo + 功能依赖 | — |
| 6 | AskQuestion 方案审阅 → 停 | — |
| 7 | **AskQuestion 阶段闸门** → 停 | — |

## 强制规则

- 每个 REQ → 至少 1 个 feature；每个 feature → **必须**有 `## 边界`
- 暴露面：`无` | API/UI/JOB/EVT 组合；**有则写 contracts，无则跳过**
- greenfield **sol:** 默认建 `solution/code-patterns-*.md` 🌱；**默认不建** `conventions/`
- `architecture.md` 全项目**只维护一份**；**user_decide** 时 Write 前须 AskQuestion 技术栈；**ai_decide** 跳过卡片但须落盘选型依据
- 任务只写 `todo.md`；**必须** `### T-xxx` + ①②③（含 dev 路径）；禁止扁平 `- [ ] T-001` 一行完事

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/README.md` | 人类驾驶舱（栈已拍板 / 现在 / 未决） |
| `features/F-xxx-*.md` | 功能 + §边界（短；禁复述用户故事） |
| `contracts/*` | 契约（按需；UI 只链 UID） |
| `architecture.md` | 全局架构（唯一） |
| `todo.md` | 开发任务：**每个 `### T-xxx` + ①②③ 三步**（见 [todo](../templates/todo.md)） |

`README.md` 未「已确认」→ 禁止进阶段 4。  
**todo 未过阶段 3 自检（无三段式）→ 禁止标方案已确认、禁止进阶段 4。**
