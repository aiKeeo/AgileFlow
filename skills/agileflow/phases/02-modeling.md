# 阶段 2：数据建模（按需）

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> **本阶段完成 = `atlas/model/` 文件已写出（或 todo 标跳过）**，不是聊过建模。
> 文档模板与确认卡片：[templates/modeling-output.md](../templates/modeling-output.md)
> **何时需要建模**：[00-intent-routing 建模按需判定](00-intent-routing.md#建模按需判定阶段-2-非必经)

## 何时执行本阶段

| 场景 | 动作 |
|------|------|
| 建议跳过且**用户已确认**（卡或原话） | **不进入本阶段**，落盘建模判定后可进阶段 3 |
| 建议跳过但**尚未问用户** | AskQuestion 建模判定确认 → 停；见 [建模按需判定](00-intent-routing.md#跳过须用户确认堵静默) |
| 路由判定「建模：增量」 | 只更新受影响的 model 文件章节 |
| 路由判定「建模：全量」 | 执行下文完整流程 |
| 用户前缀 `mod:` | 进入本阶段；AskQuestion 提供跳过/增量/全量（`model:` = `mod:`） |
| 首个 REQ、尚无 model/ | **全量**建模 |

**Agent 须在阶段 1 结束或阶段 3 入口**先给出建议，再问人（可跳过时）或直接进 2：`📋 建模判定：跳过 | 增量({文件}) | 全量`，依据见 [建模按需判定](00-intent-routing.md#建模按需判定阶段-2-非必经)。

> **「落盘」含义**：① 在回复中输出建模判定模板（📋 建模判定：…）；② 在 `atlas/todo.md`「流程进度」区标注 `⏭️ 跳过` + 依据或 `📊 增量/全量`。③ **跳过须有用户确认**（AskQuestion 或原话）。三者均不可省略。

## 目标

基于已确认 REQ，将业务世界建模为**可阅读的独立文档**，只写入 `atlas/model/`（**禁止**写回 REQ 或与方案混文件）。

**本阶段只回答「业务世界是什么」**，不定义 API、不拆开发任务。

## 目录结构（必须）

**严谨模式** — 五件套：

```
atlas/model/
├── README.md
├── domain-model.md
├── entity-relations.md
├── domain-rules.md
└── physical-model.md
```

**快速模式** — 可单文件（见 [flow-modes.md](../templates/flow-modes.md#快速模式建模精简)）：

```
atlas/model/
├── README.md
└── model-overview.md
```

## 执行流程

> **按模式二选一**，禁止快速模式仍去写五件套、或严谨模式只写 overview。

0. **决策权**：入口卡或 todo 全局 → [stage-delegation.md](../templates/stage-delegation.md)
1. 阅读已确认 REQ（`atlas/requirements/REQ-*.md`）
2. 若 `atlas/model/` 不存在，按模板初始化目录与 `README.md`

**快速 · 全量**（单文件）：

3. 编写 `model-overview.md`：聚合根/实体/关系/规则/物理模型要点（可分节，仍一个文件）
4. 更新 `README.md` 索引，状态 **草稿**
5. **user_decide**：AskQuestion 确认 → 停 · **ai_decide**：AI 决策记录 → 审阅闸门 → 停
6. 确认后 README **已确认**，更新 todo

**严谨 · 全量**（五件套）：

3. 编写 `domain-model.md`：聚合根、实体、值对象及职责
4. 编写 `entity-relations.md`：文本 ER 图 + 关系表
5. 编写 `domain-rules.md`：不变量、状态机、值对象校验
6. 编写 `physical-model.md`：有持久化则表/约束/索引/DDL；无则 `N/A` + 存放方式
7. 更新 `README.md` 索引，状态 **草稿**
8. **user_decide**：AskQuestion 确认 → 停 · **ai_decide**：AI 决策记录 → 审阅闸门 → 停
9. 确认后 README **已确认**，更新 todo

**增量**（任一模式）：只改实际存在的文件章节（快速改 `model-overview`；严谨改对应五件套文件）。

### 第 10 步：阶段收尾 — **阶段闸门**（仅 user_decide）

> **AI 自主**：审阅闸门已处理是否继续，**不走本步**。

`model/README.md` 标 **已确认** 后 → 调用 [阶段闸门](../templates/askquestion-gate.md#阶段闸门模板)（prompt：`数据建模已完成。是否继续进入【方案设计】阶段？`）→ **停止**。

## 前置条件

- 至少一个 REQ 状态为「已确认」（**跳过建模时仍须 REQ 已确认才能进阶段 3**）

## 跳过时的 todo 记录

建模跳过时，在 `atlas/todo.md`「流程进度」区标注：

```markdown
- 数据建模：⏭️ 跳过（依据：无新实体/关系/规则，model 已确认 v{x}）
```

## 强制规则（全量/增量时适用）

- 必须基于已确认需求，每个聚合根追溯到 REQ
- 草稿后须结束闸门（user_decide 确认卡 / ai_decide 审阅闸门），禁止静默标「已确认」
- **快速**：`model-overview.md` 须覆盖聚合根清单 + 关系要点 + 关键规则 + 存储要点
- **严谨**：五件套各文件齐全；`domain-model` 列全聚合根；`entity-relations` 含 ER；每聚合根 ≥1 不变量；物理模型有类型/约束
- **禁止**本阶段写 API、功能清单、开发任务；**禁止**与 REQ/solution 混文件

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/model/README.md` | 索引 + 状态（必有） |
| `atlas/model/model-overview.md` | **快速**单文件 |
| `atlas/model/domain-model.md` 等五件套 | **严谨** |
| `atlas/todo.md` | 数据建模 ✅ |
| `atlas/humanTodo.md` | 待业务确认项 |

`README.md` 未标「已确认」且未走「跳过」判定 → 禁止进入阶段 3。
