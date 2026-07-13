# 阶段 3：方案设计（sol:）

> **本阶段完成 = `atlas/solution/` + `atlas/todo.md` 开发任务已写出**。
> 用户阶段闸门选「是，继续」后，下条回复进入 dev 须写 `atlas/dev/T-xxx.md`。
> **用户前缀**：`sol:` = `atlas/solution/`
> 模板：[templates/solution-core.md](../templates/solution-core.md)  
> **默认**：主 Agent **串行**写 features + todo。**并行出方案**仅用户显式要求时 → [parallel-orchestration.md](parallel-orchestration.md) 方案齐批。

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

0. **决策权**：入口 AskQuestion 或读 todo 全局委派 → [stage-delegation.md](../templates/stage-delegation.md)
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

**ai_decide 分支**（跳过技术栈/确认/闸门用户卡）：

5. Agent **自行选定**技术栈（写入决策记录）
6. 写 `architecture.md` + `code-patterns-*.md` + features/contracts + `todo` + **AI 决策记录**
7. **审阅闸门** → 停止（用户可选「不审继续」→ 下条进 dev）

### 阶段收尾 — **结束闸门**（仅 user_decide · 严谨）

> **AI 自主**：审阅闸门已含「继续下一阶段」，**不走本步**。  
> **快速**：若确认卡已含「是，继续」→ **不走本步**（见 flow-modes）。

`solution/README.md` 标 **已确认**、todo 已写入、**humanTodo 已沉淀** 后，本阶段完成。**严谨 + user_decide 必须**：

1. **调用 `AskQuestion` 工具**，弹出 [阶段闸门](../templates/askquestion-gate.md#阶段闸门模板)
2. prompt：`方案设计已完成。是否继续进入【开发实现】阶段？`
3. **调用后立即停止**——禁止同回复写 `atlas/dev/` 或业务源码

| 禁止 | 说明 |
|------|------|
| ❌ 未写 architecture 就发方案确认 | 先落盘再确认 |
| ❌ 方案确认后直接写码 | 须等「是，继续」 |
| ❌ 催进度跳过结束闸门 | 不豁免 |
| ❌ 文字问「开始开发吗？」 | 须用 AskQuestion |

并行方案齐批：方案审阅之后，严谨仍须再发**阶段闸门** → 停止。

## 方案齐批（可选 — 仅用户显式要求并行出方案）

> 用户说「并行出方案 / 多 subagent 写 features」且功能 ≥2 或全栈 FE+BE 时启用。

| 步 | 主 Agent | Subagent |
|----|----------|----------|
| 1 | 读 REQ + model | — |
| 2 | AskQuestion 技术栈 → 停 | — |
| 3 | 拆片启 Task | 各写 `features/F-xxx`（含 §边界）+ 按需 `contracts/*` |
| 4 | 合并 README 索引、去重 ID | — |
| 5 | 写/更新 **architecture.md** + todo + 功能依赖 | — |
| 6 | AskQuestion 方案审阅 → 停 | — |
| 7 | **AskQuestion 阶段闸门** → 停 | — |

## 强制规则

- 每个 REQ → 至少 1 个 feature；每个 feature → **必须**有 `## 边界`
- 暴露面：`无` | API/UI/JOB/EVT 组合；**有则写 contracts，无则跳过**
- greenfield **sol:** 默认建 `solution/code-patterns-*.md` 🌱；**默认不建** `conventions/`
- `architecture.md` 全项目**只维护一份**；Write architecture 前须 AskQuestion 技术栈
- 任务只写 `todo.md`；**必须** `### T-xxx` + ①②③（含 dev 路径）；禁止扁平 `- [ ] T-001` 一行完事

## 产出

| 文件 | 说明 |
|------|------|
| `features/F-xxx-*.md` | 功能 + §边界 |
| `contracts/*` | 契约（按需） |
| `architecture.md` | 全局架构（唯一） |
| `todo.md` | 开发任务：**每个 `### T-xxx` + ①②③ 三步**（见 [solution-architecture 开发任务](../templates/solution-architecture.md#开发任务写入-todomd阶段-3-第-8-步)） |

`README.md` 未「已确认」→ 禁止进阶段 4。  
**todo 未过阶段 3 自检（无三段式或无①质量门槛）→ 禁止标方案已确认、禁止进阶段 4。**
