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

**用户决策 + 严谨**：用户发来需求 → 必须先 AskQuestion 需求卡 → 立即停止。

**AI 自主**：入口决策权卡选 AI 自主（或 todo 全局已设）→ **下条回复直接落盘 REQ**，末尾 **审阅闸门**。

**快速 + user_decide**：满足 [REQ 入口例外](flow-modes.md#快速模式req-入口例外) 时可跳过需求卡。

- ❌ **禁止**用聊天文字追问代替 AskQuestion 卡片（**user_decide** 时）
- ❌ **禁止**AskQuestion 后在同一回复里继续写 REQ 文档
- ~~即使用户已写很长需求，仍须 AskQuestion 确认~~ → **仅 user_decide+严谨**；快速完整 PRD 或 **ai_decide** 见上表

**唯一例外**：用户明确说「REQ 已确认、不要问了直接进阶段 2/3/4」且仓库中确有已确认 REQ → 走 [00-intent-routing.md](00-intent-routing.md) 路由，不进本阶段第 1 步。

### 用户回答 AskQuestion 之后（必须落盘）

| 上一步 | 用户动作 | **本回复 Agent 必须做** |
|--------|----------|-------------------------|
| 第 1 步需求卡片 | 点选/回复 | **第 2 步**：写 `atlas/requirements/REQ-*.md` 草稿 + README + todo（禁止空回复） |
| 第 3 步确认卡片 | 选「确认」 | 标 REQ **已确认** → **第 4 步**阶段构思闸门skQuestion → 停止 |
| 阶段闸门 | 选「是，继续」 | **下条回复**进入阶段 2 或 3，**写 model/ 或 solution/**（禁止只寒暄） |

---

## 执行流程

### 第 0 步：决策权（阶段入口）

1. 读 `atlas/todo.md`「决策委派」；**全局 AI自主** → **跳过本卡**，默认 **ai_decide**
2. 否则 AskQuestion [决策权卡](../templates/stage-delegation.md#阶段入口决策权-askquestion)（可与模式判定合并）
3. **ai_decide** → 跳至 [第 2 步 AI 自主分支](#第-2-步-ai-自主仅-ai_decide)（跳过第 1、3 步用户决策卡）

### 第 1 步：AskQuestion 澄清（仅 user_decide）

1. 输出首行声明：`📍 Agileflow | 模式：{快速/严谨} | 阶段：1-需求澄清`
2. 根据用户已述内容**预填** requirement-askquestion.md 卡片选项（勿用占位符糊弄）
3. 调用 **AskQuestion** → **立即停止**，等待用户选择

### 第 2 步：生成需求草稿

#### 第 2 步 · user_decide（用户回答第 1 步之后）

1. 提炼需求清单（每个独立功能一个 REQ）
2. 生成 `atlas/requirements/REQ-XXX-名称.md`（状态：**草稿**）
3. 生成 `atlas/requirements/README.md`、初始化 `atlas/todo.md`、`atlas/humanTodo.md`（若无）
4. **UI 设计描述（按需）**：
   - AskQuestion `ui_scope` 选「有界面」→ 评估页面/流程 → 新建 `atlas/requirements/ui/UID-xxx-名称.md`（见 [req-ui-design.md](../templates/req-ui-design.md)）
   - **只写结构与交互**；布局节须 **区域表 + ASCII 布局线条图**（强制，见 [req-ui-design](../templates/req-ui-design.md)）；**视觉样式标「待定」**
   - 落盘后过 UID 自检 U1–U5；不过禁止标已确认
   - 无 UI → REQ「界面描述」节写「无 UI」，不建 UID
   - 维护 `atlas/requirements/ui/README.md` 索引；REQ 头部链对应 UID
5. 需求中需人类确认/提供的事项 → **追加 humanTodo**（含「提供视觉参考稿/定样式」若用户尚未给）

#### 第 2 步 · AI 自主（ai_decide 下条回复执行）

1. 从用户描述 + 仓库上下文**自行推断**：目标用户、平台、MVP、功能清单、ui_scope
2. 执行与 user_decide 相同的落盘（REQ + README + todo + 按需 UID）
3. 在 `requirements/README.md` 或各 REQ 末追加 **[AI 决策记录](../templates/stage-delegation.md#ai-决策记录落盘必填)**
4. REQ 状态先标 **草稿**，README 汇总决策摘要
5. **不**发需求澄清卡/草稿确认卡 → 直接 **[审阅闸门](../templates/stage-delegation.md#审阅闸门ai-自主专属)** → 停止

### 第 3 步：AskQuestion 确认草稿（仅 user_decide）

草稿完成后 **必须再次 AskQuestion**：

- **严谨模式**：[requirement-askquestion 第 3 步](../templates/requirement-askquestion.md#第-3-步草稿确认写完-req-草稿后) → 停止 → 确认后 → **第 4 步**阶段闸门
- **快速模式**：[flow-modes 确认+闸门合并](../templates/flow-modes.md#阶段-1--确认闸门合并) **一张卡** → 停止

- 选「确认」→ REQ 改 **已确认** → 更新 todo
- 快速且选「是，继续」→ **下条回复**进阶段 2/3（本回复仍停止）
- 严谨 → 确认后另发 **第 4 步**阶段闸门

### 第 3b 步：变更已确认/已实现 REQ

→ [change-management.md](change-management.md)，不重复第 1/3 步普通确认。

### 第 4 步：阶段收尾 — **强制 AskQuestion 阶段闸门**（仅 user_decide）

> **AI 自主**：由 [审阅闸门](../templates/stage-delegation.md#审阅闸门ai-自主专属) 一步完成确认与是否继续，**不走本步**。

REQ 全部 **已确认**、todo 已更新、**本阶段人类依赖已写入 humanTodo** 后，本阶段视为完成。**必须**：

1. **调用 `AskQuestion` 工具**，弹出 [阶段闸门小卡片](../templates/askquestion-gate.md#阶段闸门模板)
2. prompt：`需求澄清已完成。是否继续进入【数据建模】阶段？`（按需跳过建模时下一阶段写「方案设计」）
3. 选项须含 **「是，继续」** 与 **「否，暂停」**
4. **调用后立即停止生成**——禁止同回复进入阶段 2/3/4

| 禁止 | 说明 |
|------|------|
| ❌ 聊天问「是否继续？」 | 必须用 AskQuestion 小卡片 |
| ❌ REQ 确认后直接写 model/solution | 须等用户在小卡片选「是，继续」 |
| ❌ 假设用户要继续 | 每阶段结束各问一次 |

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

## 正误示例

**✅ 用户**：用原话描述要做的东西（任意具体业务）  
→ 首行声明 → **AskQuestion** → **停止** → 下条写 REQ → 结束闸门 → **停止**

**❌ 用户发需求后直接写 REQ 或直接写码**
