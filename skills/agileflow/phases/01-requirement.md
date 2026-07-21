# 阶段 1：需求澄清

> AskQuestion 规范：[templates/contract.md](../templates/contract.md)
> 提问卡片：[templates/contract.md](../templates/contract.md)
> 文档模板：[templates/req.md](../templates/req.md)
> **UI 描述**：[templates/uid.md](../templates/uid.md)
> **Template ON** 时先读 `atlas/template/requirements/` 下对应 `template-*.md`（无则回退 skill templates/）  
> **角色提示词**：[role-req.md](../templates/role/role-req.md)（项目可覆盖 `atlas/role/role-req.md`）· 总控 → [orchestrator](../templates/orchestrator.md)

## 决策差异

| | `user` | `ai` |
|--|--------|------|
| **信息充分** | 跳过第 1 步澄清卡（四项齐） | 不问澄清卡 |
| **阶段结束** | 确认卡（可与阶段闸门合并）→ **停** | 闸门绿 → 摘要 → **同会话连做** |
| **REQ 撰写** | 缺口卡 → 派 role-req | 总控派 role-req → 不问 |

决策委派细则 → [contract.md](../templates/contract.md)  
充分性清单 → [contract §5](../templates/contract.md#5-信息充分少问user)

## 入口铁律（最高优先级）

**契约未确认** → **pending + [启动卡](../templates/contract.md#71-流程启动卡)→停**（默认问人）；**禁止**静默写 `AF_DECIDE=ai`。仅话术明确委托 → 写 `AF_DECIDE=ai` 可跳。

**用户决策**（`AF_DECIDE=user` 已确认）：

1. **信息充分**（四项齐）→ **跳过第 1 步**，本条派 role-req 落盘 → 第 3 步确认/闸门 → 停；首行声明依据
2. **有缺口** → AskQuestion **仅缺口题** → 立即停止（禁止复问已明确项）
3. 缺口 = 0 → 按充分处理

**AI 自主**（`AF_DECIDE=ai`）：总控派 **role-req** → 跑 `req-confirm` 绿 → **摘要后连做**。不发需求澄清卡。

- ❌ 契约未确认却静默默认 `AF_DECIDE=ai`
- ❌ 「我来决策」却不问启动卡就当 user 乱写
- ❌ `user` 有缺口时用聊天代替 AskQuestion
- ❌ AskQuestion 后同回复继续写 REQ
- ❌ 信息已齐仍发整卡
- ❌ 总控自己写 REQ（须派 role-req）

仓库已有「已确认」REQ 且用户说直接进后续阶段 → [00-intent-routing](00-intent-routing.md) 路由，不重走本阶段第 1 步。
### 用户回答 AskQuestion 之后（必须落盘）

| 上一步 | 用户动作 | **本回复总控必须做** |
|--------|----------|-------------------------|
| 第 1 步需求卡片 | 点选/回复 | **派 role-req** 写 REQ 草稿；收产物后总控初始化 todo/env（禁止空回复） |
| 第 3 步确认 | 选「确认」 | 标 REQ 已确认 → **另发**阶段闸门 → 停 |
| 第 3 步确认+闸门（合并卡） | 选「确认」+「是，继续」 | 标 REQ 已确认 → **停**（下条派下一阶段；禁止本回复再发闸门） |
| 阶段闸门 | 选「是，继续」 | **下条回复**派下一阶段角色 |

---

## 执行流程

### 第 0 步：流程契约 + 决策权

契约未确认 → **启动卡问人**（pending）；明确委托 → `AF_DECIDE=ai` 可跳。已确认：`ai` → [第 2 步](#第-2-步总控派-role-req)；`user` → 充分性/缺口判定。

### 第 1 步：AskQuestion 澄清（仅 user · 仅缺口）

1. 对照 [信息充分四项](../templates/contract.md#5-信息充分少问user) + 缺口判定（只问未覆盖项）
2. 充分或缺口=0 → **跳过本步**，首行写 `信息充分：跳过需求澄清卡（依据：…）` → 进第 2 步落盘
3. 有缺口 → 首行声明：`📍 Agileflow | 决策：我来 | 阶段：1-需求澄清 | 缺口卡`
4. **只**生成未覆盖题；选项来自用户原话（禁占位糊弄）
5. 调用 **AskQuestion** → **立即停止**，等待用户选择

### 第 2 步：总控派 role-req

按 [orchestrator](../templates/orchestrator.md) 加载 **`atlas/role/role-req.md`**（首启 `--bootstrap-scaffold`），注入本次任务后派出。

| 分支 | 总控动作 |
|------|----------|
| `user`（答完缺口卡后） | 派 role-req（Read `atlas/role/role-req.md`）；收产物后初始化 `agileflow.env`（`AF_PHASE=1`）+ `todo.md`；若无 `atlas/role/`/`humanTodo.md` → `--bootstrap-scaffold`；更新 README；进第 3 步确认卡 |
| `ai` | 派 role-req（自行推断、不问）；收产物后写 env/todo；跑 `req-confirm`；绿 → **总控标 REQ 已确认**（`requirements/README` 索引 + 各 REQ 文件头；**非**写正文）→ **连做**下一阶段 |

角色正文（拆 REQ、UID、glossary、决策记录）**只维护在 role-req**，本文件不复述。

### 第 3 步：总控发 AskQuestion 确认草稿（仅 user）

草稿完成后，**总控**发确认卡（REQ Writer 不发卡）：

- **默认**：确认卡 → 停 → 确认后 → **第 4 步**阶段闸门
- **可合并**：[contract 确认+闸门合并](../templates/contract.md#72-阶段闸门user) **一张卡** → 停止

- 选「确认」→ **总控**把 REQ 改 **已确认**、更新 todo
- 合并卡且选「是，继续」→ **下条回复**总控派下一阶段 Subagent（本回复仍停止；**勿再发第 4 步闸门**）
- 分步确认 → 确认后另发 **第 4 步**阶段闸门

### 第 3b 步：变更已确认/已实现 REQ

→ [change-management.md](change-management.md)，不重复第 1/3 步普通确认。由总控路由。

### 第 4 步：阶段收尾 — **阶段闸门**（仅 user）

> **AI 自主**：不走本步（结束处理见上）。

REQ 全部 **已确认**、todo 已更新、**本阶段人类依赖已写入 humanTodo**、**`atlas/README.md` 已更新**（[atlas-readme](../templates/atlas-readme.md)）后 → **总控**调用 [阶段闸门](../templates/contract.md#72-阶段闸门user)（prompt：`需求澄清已完成。是否继续进入【数据建模】阶段？`）→ **停止**。

---

## 核心规则

- 一个需求 → 一个文档；**AC 表即 BDD**（Given/When/Then 列）；见 [../phases/05-testing.md](../phases/05-testing.md)；禁止独立 BDD 专节
- **有 UI 时**：REQ 链 **UID**；每个 UID **§2 须含布局线条图**（区域表 alone 不合格；线框唯一权威）
- **UID ≠ UI-xxx**：UID 属 REQ；`solution/contracts/UI-xxx` 属阶段 3 **增量**契约（只链 UID，禁粘贴整图）
- 状态：草稿 → 已确认 → 已实现 → 已废弃（**索引 README 为状态权威**，子文件须一致）
- 未「已确认」不能进入阶段 2
- 阶段结束须更新 [atlas/README.md](../templates/atlas-readme.md)

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/README.md` | 人类驾驶舱（必更新） |
| `atlas/requirements/REQ-XXX-*.md` | 每需求一份 |
| `atlas/requirements/ui/UID-xxx-*.md` | **可选** — 界面结构与交互描述（样式待定） |
| `atlas/requirements/ui/README.md` | UID 索引 |
| `atlas/requirements/README.md` | 索引（状态权威） |
| `atlas/todo.md` / `atlas/humanTodo.md` | 进度与人类依赖 |
