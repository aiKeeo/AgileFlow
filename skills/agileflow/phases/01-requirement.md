# 阶段 1：需求澄清

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> 提问卡片：[templates/requirement-askquestion.md](../templates/requirement-askquestion.md)
> 文档模板：[templates/req-doc.md](../templates/req-doc.md)
> **UI 描述**：[templates/req-ui-design.md](../templates/req-ui-design.md)

## 模式差异

| 快速 | 严谨 |
|------|------|
| 完整 PRD + `req:` → 可**跳过第 1 步**需求卡（**仅 user_decide**） | 必须先 AskQuestion 需求卡 |
| 写完 REQ → **确认+阶段闸门合并 1 卡**（user_decide） | 确认卡 → 闸门卡（分步） |
| **AI 自主** → 跳过需求卡与确认卡 → 落盘 → **审阅闸门** | 同左 |

决策委派细则 → [stage-delegation.md](../templates/stage-delegation.md)

## 入口铁律（最高优先级）

**契约未确认**（无 `atlas/agileflow.env` 或 `AF_FLOW`/`AF_DECIDE=pending`）→ **先**[流程启动卡](../templates/stage-delegation.md#流程启动卡首启强制) → **停**。禁止本条写 REQ。

**用户决策 + 严谨**：契约已确认且 `AF_DECIDE=user` → 必须先 AskQuestion 需求卡 → 立即停止。

**AI 自主**（`AF_DECIDE=ai` 已确认）：**本条回复直接落盘 REQ** → **审阅闸门** → 停。不发需求澄清卡。

**快速 + user_decide**：满足 [REQ 入口例外](../templates/flow-modes.md#快速模式req-入口例外) 时可跳过需求卡。

- ❌ **禁止**契约未确认就落盘或静默写 `AF_FLOW=fast`/`AF_DECIDE=ai`
- ❌ **禁止**用聊天文字追问代替 AskQuestion 卡片（**user_decide** 时）
- ❌ **禁止**AskQuestion 后在同一回复里继续写 REQ 文档
- ~~即使用户已写很长需求，仍须 AskQuestion 确认~~ → **仅 user_decide+严谨**；快速完整 PRD 或 **ai_decide** 见上表

**唯一例外**：用户明确说「REQ 已确认、不要问了直接进阶段 2/3/4」且仓库中确有已确认 REQ → 走 [00-intent-routing.md](00-intent-routing.md) 路由，不进本阶段第 1 步。

### 用户回答 AskQuestion 之后（必须落盘）

| 上一步 | 用户动作 | **本回复 Agent 必须做** |
|--------|----------|-------------------------|
| 第 1 步需求卡片 | 点选/回复 | **第 2 步**：写 `atlas/requirements/REQ-*.md` 草稿 + README + todo（禁止空回复） |
| 第 3 步确认卡片 | 选「确认」 | 标 REQ **已确认** → **第 4 步**阶段闸门 AskQuestion → 停止 |
| 阶段闸门 | 选「是，继续」 | **下条回复**进入阶段 2 或 3，**写 model/ 或 solution/**（禁止只说不写） |

---

## 执行流程

### 第 0 步：流程契约 + 决策权（阶段入口）

1. 无 env / `AF_FLOW`·`AF_DECIDE=pending` → [流程启动卡](../templates/stage-delegation.md#流程启动卡首启强制) → **停**（禁止落盘）
2. 读 env + todo「决策委派」；`AF_DECIDE=ai` → **跳过**阶段决策权卡，进 [第 2 步 AI 自主](#第-2-步-ai-自主仅-ai_decide)
3. `AF_DECIDE=user` 或用户显式「这阶段我来」→ 走第 1 步需求卡（或按需再确认决策权卡）
4. 用户原话已同时点明模式+决策 → 写 env 后按上表分支，可跳过启动卡

### 第 1 步：AskQuestion 澄清（仅 user_decide）

1. 输出首行声明：`📍 Agileflow | 模式：{快速/严谨} | 阶段：1-需求澄清`
2. 根据用户已述内容**预填** requirement-askquestion.md 卡片选项（勿用占位符糊弄）
3. 调用 **AskQuestion** → **立即停止**，等待用户选择

### 第 2 步：生成需求草稿

#### 第 2 步 · user_decide（用户回答第 1 步之后）

1. 提炼需求清单（**每个可独立验收的功能一个 REQ**；禁止把 F-001~F-00N 揉进一份「MVP 总览」交差）
2. 生成 `atlas/requirements/REQ-XXX-名称.md`（状态：**草稿**；一功能一文件）
3. 生成 `atlas/requirements/README.md`、初始化 `atlas/todo.md`、`atlas/humanTodo.md`（若无）；**复制** [agileflow.env](../templates/agileflow.env) → `atlas/agileflow.env`（`AF_PHASE=1`，按用户话术设 `AF_DECIDE`）
4. **UI 设计描述（按需）**：
   - AskQuestion `ui_scope` 选「有界面」→ 评估页面/流程 → 新建 `atlas/requirements/ui/UID-xxx-名称.md`（见 [req-ui-design.md](../templates/req-ui-design.md)）
   - **只写结构与交互**；布局节须 **区域表 + ASCII 布局线条图**（强制，见 [req-ui-design](../templates/req-ui-design.md)）；**视觉样式标「待定」**
   - 落盘后过 UID 自检 U1–U5；不过禁止标已确认
   - 无 UI → REQ「界面描述」节写「无 UI」，不建 UID
   - 维护 `atlas/requirements/ui/README.md` 索引；REQ 头部链对应 UID
5. 需求中需人类确认/提供的事项 → **追加 humanTodo**（含「提供视觉参考稿/定样式」若用户尚未给）
6. **术语扫描**：从 REQ 标题/BDD 场景提取业务名词 → **一律**追加 `atlas/glossary.md`（标 `<!-- auto -->`；无则创建）。**禁止** greenfield 写 `atlas/init/**`；**禁止**用「术语少」改写 `p0-business.md`

#### 第 2 步 · AI 自主（用户已确认 `AF_DECIDE=ai`；本条或启动卡答完后的下条执行）

1. 从用户描述 + 仓库上下文**自行推断**：目标用户、平台、MVP 范围、功能清单、ui_scope
2. **拆分**：≥2 个可独立验收功能 → **≥2 个** `REQ-*.md`（MVP 只写在 README/决策记录的范围说明里，**不是**合并文件理由）
3. 执行与 user_decide 相同的落盘（多 REQ + README + todo + glossary + 按需 UID）；确保 env 中 `AF_FLOW`/`AF_DECIDE` 已非 `pending`
4. 在 `requirements/README.md` 追加 **[AI 决策记录](../templates/stage-delegation.md#ai-决策记录落盘必填)**（含：MVP 范围、**REQ 拆成几份及理由**）
5. REQ 状态先标 **草稿**，README 汇总决策摘要
6. **不**发需求澄清卡/草稿确认卡 → 直接 **[审阅闸门](../templates/stage-delegation.md#审阅闸门ai-自主专属)** → 停止

### 第 3 步：AskQuestion 确认草稿（仅 user_decide）

草稿完成后 **必须再次 AskQuestion**：

- **严谨模式**：[requirement-askquestion 第 3 步](../templates/requirement-askquestion.md#第-3-步草稿确认写完-req-草稿后) → 停止 → 确认后 → **第 4 步**阶段闸门
- **快速模式**：[flow-modes 确认+闸门合并](../templates/flow-modes.md#阶段-1--确认闸门合并) **一张卡** → 停止

- 选「确认」→ REQ 改 **已确认** → 更新 todo
- 快速且选「是，继续」→ **下条回复**进阶段 2/3（本回复仍停止）
- 严谨 → 确认后另发 **第 4 步**阶段闸门

### 第 3b 步：变更已确认/已实现 REQ

→ [change-management.md](change-management.md)，不重复第 1/3 步普通确认。

### 第 4 步：阶段收尾 — **阶段闸门**（仅 user_decide）

> **AI 自主**：由 [审阅闸门](../templates/stage-delegation.md#审阅闸门ai-自主专属) 一步完成，**不走本步**。

REQ 全部 **已确认**、todo 已更新、**本阶段人类依赖已写入 humanTodo** 后 → 调用 [阶段闸门](../templates/askquestion-gate.md#阶段闸门模板)（prompt：`需求澄清已完成。是否继续进入【数据建模】阶段？`）→ **停止**。

---

## 核心规则

- 一个需求 → 一个文档；BDD Given-When-Then；AC 表见 [ac-guide.md](../templates/ac-guide.md)
- **有 UI 时**：REQ 链 **UID**；每个 UID **§2 须含布局线条图**（区域表 alone 不合格）
- **UID ≠ UI-xxx**：UID 属 REQ；`solution/contracts/UI-xxx` 属阶段 3 技术契约（须保留/转写线条图）
- 状态：草稿 → 已确认 → 已实现 → 已废弃
- 未「已确认」不能进入阶段 2

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/requirements/REQ-XXX-*.md` | 每需求一份 |
| `atlas/requirements/ui/UID-xxx-*.md` | **可选** — 界面结构与交互描述（样式待定） |
| `atlas/requirements/ui/README.md` | UID 索引 |
| `atlas/requirements/README.md` | 索引 |
| `atlas/todo.md` / `atlas/humanTodo.md` | 进度与人类依赖 |
