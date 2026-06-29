# 阶段 1：需求澄清

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> 提问卡片：[templates/requirement-askquestion.md](../templates/requirement-askquestion.md)
> 文档模板：[templates/req-doc.md](../templates/req-doc.md)
> **UI 描述**：[templates/req-ui-design.md](../templates/req-ui-design.md)

## 入口铁律（最高优先级）

**用户发来需求（无论长短、无论是否像 PRD）→ 必须先 AskQuestion → 立即停止。**

- ❌ **禁止**未 AskQuestion 就创建 `specs/requirements/`、写 REQ 草稿、写 AC 表
- ❌ **禁止**用聊天文字追问代替 AskQuestion 卡片
- ❌ **禁止**AskQuestion 后在同一回复里继续写 REQ 文档
- ✅ 即使用户已写很长需求，仍须 AskQuestion **确认/补充**（见 requirement-askquestion.md），用户选完后再进入第 2 步

**唯一例外**：用户明确说「REQ 已确认、不要问了直接进阶段 2/3/4」且仓库中确有已确认 REQ → 走 [00-intent-routing.md](00-intent-routing.md) 路由，不进本阶段第 1 步。

---

## 执行流程

### 第 1 步：AskQuestion 澄清（无条件，最先执行）

1. 输出首行声明：`📍 Agileflow | 模式：{快速/严谨} | 阶段：1-需求澄清`
2. 根据用户已述内容**预填** requirement-askquestion.md 卡片选项（勿用占位符糊弄）
3. 调用 **AskQuestion** → **立即停止**，等待用户选择

### 第 2 步：生成需求草稿（仅用户回答第 1 步之后）

1. 提炼需求清单（每个独立功能一个 REQ）
2. 生成 `specs/requirements/REQ-XXX-名称.md`（状态：**草稿**）
3. 生成 `specs/requirements/README.md`、初始化 `specs/todo.md`、`specs/humanTodo.md`（若无）
4. **UI 设计描述（按需）**：
   - AskQuestion `ui_scope` 选「有界面」→ 评估页面/流程 → 新建 `specs/requirements/ui/UID-xxx-名称.md`（见 [req-ui-design.md](../templates/req-ui-design.md)）
   - **只写结构与交互**（布局区块、组件、状态、跳转）；**视觉样式标「待定」**，由用户后续决定
   - 无 UI → REQ「界面描述」节写「无 UI」，不建 UID
   - 维护 `specs/requirements/ui/README.md` 索引；REQ 头部链对应 UID
5. 需求中需人类确认/提供的事项 → **追加 humanTodo**（含「提供视觉参考稿/定样式」若用户尚未给）

### 第 3 步：AskQuestion 确认草稿（必须）

草稿完成后 **必须再次 AskQuestion**（[requirement-askquestion 第 3 步](../templates/requirement-askquestion.md#第-3-步草稿确认写完-req-草稿后)）→ **立即停止**。

- 选「确认」→ REQ 改 **已确认** → 更新 todo → **AskQuestion 阶段闸门** → 停止
- 选「补充/调整」→ 修改后再 AskQuestion

### 第 3b 步：变更已确认/已实现 REQ

→ [change-management.md](change-management.md)，不重复第 1/3 步普通确认。

### 第 4 步：阶段收尾 — **强制 AskQuestion 阶段闸门**

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
- **有 UI 时**：REQ 链 **UID**（`requirements/ui/`）描述页面与交互；**不在 REQ 定视觉样式**
- **UID ≠ UI-xxx**：UID 属 REQ；`solution/contracts/UI-xxx` 属阶段 3 技术契约
- 状态：草稿 → 已确认 → 已实现 → 已废弃
- 未「已确认」不能进入阶段 2

## 产出

| 文件 | 说明 |
|------|------|
| `specs/requirements/REQ-XXX-*.md` | 每需求一份 |
| `specs/requirements/ui/UID-xxx-*.md` | **可选** — 界面结构与交互描述（样式待定） |
| `specs/requirements/ui/README.md` | UID 索引 |
| `specs/requirements/README.md` | 索引 |
| `specs/todo.md` / `specs/humanTodo.md` | 进度与人类依赖 |

## 正误示例

**✅ 用户**：「我想做个旅游 App，要能规划行程、订酒店…」
→ 首行声明 → **AskQuestion 需求卡片** → **停止**（不写 REQ）
→ 用户选完 → 写 REQ 草稿 → **AskQuestion 确认** → **AskQuestion 阶段闸门** → **停止**

**❌ 用户发需求后直接写 REQ**（须先 AskQuestion 需求卡片）

**❌ REQ 已确认后直接写 model/ 或 solution/**（须 **AskQuestion 阶段闸门** → 下回复再进下一阶段）
