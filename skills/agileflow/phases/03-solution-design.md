# 阶段 3：方案设计（sol:）

> **用户前缀**：`sol:` = `specs/solution/`  
> 模板：[templates/solution-core.md](../templates/solution-core.md)  
> **默认**：主 Agent **串行**写 features + todo。**并行出方案**仅用户显式要求时 → [parallel-orchestration.md](parallel-orchestration.md) 批次 A。

## 方案设计四要素

| # | 要素 | 落在哪里 |
|---|------|----------|
| **1** | **功能（含边界）** | `features/F-xxx.md` — 说明 + **§边界** + 验收要点 |
| **2** | **契约 / 接口文档（按需）** | `contracts/` — **暴露面详细规格集中存放**；feature 只链 ID |
| **3** | **架构（全局一份）** | `architecture.md` — 全项目共享，不按功能拆 |
| **4** | **任务编排** | `specs/todo.md` + 功能依赖表（供阶段 4 **串行**排序；并行时作批次参考） |

**阶段 4 才写**：源码、AC 测试代码、dev/ 实现步骤。

## 目录结构

```
specs/solution/
├── README.md
├── features/          # 含 §边界，无单独 boundaries.md
├── contracts/         # 接口/暴露面文档库（有 API/UI/JOB/EVT 才写）
└── architecture.md    # 全局唯一
```

## 标准流程（默认）

1. 读已确认 REQ +（按需）model/ + **有 UID 时读 `requirements/ui/`**
2. 初始化 `solution/`：README、features/、contracts/（目录即可）
3. 写 `features/F-xxx.md`：映射 REQ、**暴露面**、**§边界**、验收要点
4. **按需**写 `contracts/`（有暴露面才建文件）；**UI-xxx 须基于 UID** 补充路由、组件树、API 绑定（见 [req-ui-design 阶段衔接](../templates/req-ui-design.md#阶段衔接)）
5. **AskQuestion 技术栈** → 停止
6. 写或更新 **`architecture.md`（全局一份）**：栈、模块、`test/ac/`、L1–L5
7. 根据 AskQuestion **`ui_style`** 答案：更新 UID/UI-xxx 样式状态；`style_reference` → humanTodo；**禁止 Agent 替用户定配色**
8. **humanTodo 沉淀**（必做）：密钥/沙箱/证书/AppID/第三方账号/**视觉参考稿**等 → **逐条追加** [humanTodo.md](../templates/human-todo.md)，architecture 中 mock 项须对应 humanTodo 序号
9. 拆解任务 → `todo.md` 开发任务（**每 T-xxx 含 ①②③ 三步子项 + dev 路径**）+ **功能依赖表**（阶段 4 一任务一 dev）
10. 更新 README 索引 → **AskQuestion 确认方案** → 停止
11. 确认后 README **已确认** → 更新 todo

### 第 12 步：阶段收尾 — **强制 AskQuestion 阶段闸门**

`solution/README.md` 标 **已确认**、todo 已写入、**humanTodo 已沉淀本阶段人类依赖** 后，本阶段完成。**必须**：

1. **调用 `AskQuestion` 工具**，弹出 [阶段闸门小卡片](../templates/askquestion-gate.md#阶段闸门模板)
2. prompt：`方案设计已完成。是否继续进入【开发实现】阶段？`
3. **调用后立即停止**——禁止同回复写 `specs/dev/` 或业务源码

| 禁止 | 说明 |
|------|------|
| ❌ 方案确认后直接写码 | 须等小卡片「是，继续」 |
| ❌ 用户上轮说「全部做完」就跳过本闸门 | 催进度不豁免阶段闸门 |
| ❌ 文字问「开始开发吗？」 | 须用 AskQuestion 小卡片 |

并行批次 A 路径：方案审阅 AskQuestion 之后，仍须再发**本阶段闸门** → 停止。

## 批次 A（可选 — 仅用户显式要求并行出方案）

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
- **禁止** `boundaries.md`；**禁止** 每功能一份 architecture
- `architecture.md` 全项目**只维护一份**；Write architecture 前须 AskQuestion 技术栈
- 任务只写 `todo.md`

## 产出

| 文件 | 说明 |
|------|------|
| `features/F-xxx-*.md` | 功能 + §边界 |
| `contracts/*` | 契约（按需） |
| `architecture.md` | 全局架构（唯一） |
| `todo.md` | 开发任务（有序列表） |

`README.md` 未「已确认」→ 禁止进阶段 4。
