# 阶段 3：方案设计（sol:）

> 完成 = `atlas/solution/` **与** `atlas/todo.md`（根）已写出。进 dev 须写 `atlas/dev/T-xxx.md`。  
> **禁止** `atlas/solution/todo.md`。  
> 模板：[solution-core](../templates/solution.md) · Template ON 先读 `atlas/template/solution/`  
> **角色**：[role-sol.md](../templates/role/role-sol.md)（可覆盖 `atlas/role/role-sol.md`）· 总控 → [orchestrator](../templates/orchestrator.md)  
> 并行出方案仅用户显式要求 → [parallel](04-development.md#并行阶段-4)

## 方案设计四要素

| # | 要素 | 落在哪里 |
|---|------|----------|
| **1** | **功能（含边界）** | `features/F-xxx.md` — 可选 1 句说明 + **§边界** + 暴露面 |
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

0. **契约/决策权**：无 env/pending → **启动卡问人**（默认）；明确委托 → `AF_DECIDE=ai` 可跳。→ [启动卡](../templates/contract.md#71-流程启动卡)。**总控**判断，不写产物正文。
1. **总控**读已确认 REQ +（按需）model/ + UID
2. **总控派 role-sol**（加载 [role-sol](../templates/role/role-sol.md)）写 solution/ + T 头建议  
   - `user`：技术栈未定时先 AskQuestion → 停；再派 role-sol 补 architecture；先落盘再确认（见 [contract 阶段 3](../templates/contract.md#阶段-3-先落盘再确认)）
   - `ai`：role-sol 自选栈；总控写 `AF_STACK_SOURCE=ai_record`
3. **钉死时序**：收 T 头建议 → **总控写入 `atlas/todo.md`（根）** → 跑 `sol-confirm` → 绿才 `AF_PHASE=4`  
   - `ai`：同条连做 dev（每 T 一次派 role-dev）· `user`：确认/闸门卡→停
4. 确认后总控标 README **已确认**、沉淀 humanTodo、更新驾驶舱

F/contracts/architecture 怎么写 → **只维护在 role-sol**；强制规则见下表。

### 阶段收尾 — **阶段闸门**（仅 user）

> **AI 自主**：不走本步。

产物齐、todo 已写、humanTodo 已沉淀、`atlas/README.md` 已更新后 → **总控**发 [阶段闸门](../templates/contract.md#72-阶段闸门user) → **停止**。

## 批量出方案（可选 — 仅用户显式要求）

总控拆片，每片派 **role-sol**（1–3 个 F）；合并 README 后总控写 todo → `sol-confirm`。  
`user` 须并行启动卡；`ai` 不问直接拆。

## 强制规则

| 标记 | 规则 | 说明 |
|------|------|------|
| 🔴 | **REQ→feature 映射** | 每个 REQ 至少 1 feature；每个 feature 必须有 `## 边界` 且含 `← REQ-` 回溯；**禁止** F `## 联调卡` |
| 🟢 | **UI 链 API** | 通过 `contracts/UI` §字段绑定；README 须含 **AC→主 T** |
| 🟠 | **暴露面** | `无` / API/UI/JOB/EVT 组合；**有则写 contracts，无则跳过** |
| 🔴 | **技术栈与架构** | `architecture.md` 全项目**只维护一份**；`user_decide` Write 前须 AskQuestion 技术栈；`ai_decide` 跳过卡片但须落盘选型依据 |
| 🟢 | **代码模式** | greenfield `sol:` 默认建 `solution/code-patterns-*.md` 🌱；**默认不建** `conventions/` |
| 🔴 | **Todo 格式** | 任务只写 **`atlas/todo.md`（根）**；必须 `### T-xxx` + ①②③（含 dev 路径）；禁止扁平 `- [ ] T-001`；禁止 `solution/todo.md` |
| 🟢 | **dev 质量** | 全端：摘要+主流程+边界+实现说明（完整质量线）→ [04 §质量要求](04-development.md#质量要求) · [dev-granularity](../templates/dev-granularity.md) |

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/README.md` | 人类驾驶舱（栈已拍板 / 现在 / 未决） |
| `features/F-xxx-*.md` | 功能 + §边界（短；禁复述用户故事） |
| `contracts/*` | 契约（按需；UI 只链 UID） |
| `architecture.md` | 全局架构（唯一） |
| `atlas/todo.md` | 开发任务（**根路径**）：**每个 `### T-xxx` + ①②③ 三步**（见 [todo](../templates/todo.md)） |

`README.md` 未「已确认」→ 禁止进阶段 4。  
**todo 未过阶段 3 自检（无三段式）→ 禁止标方案已确认、禁止进阶段 4。**
