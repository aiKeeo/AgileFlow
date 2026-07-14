# 阶段 2：数据建模（按需）

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> **本阶段完成 = `atlas/model/` 文件已写出（或 todo 标跳过）**，不是聊过建模。
> 文档模板与确认卡片：[templates/modeling-output.md](../templates/modeling-output.md)
> **何时需要建模**：[00-intent-routing 建模按需判定](00-intent-routing.md#建模按需判定阶段-2-非必经)

## 何时执行本阶段

| 场景 | 动作 |
|------|------|
| 路由判定「建模：跳过」 | **不进入本阶段**，REQ 确认后直接阶段 3 |
| 路由判定「建模：增量」 | 只更新受影响的 model 文件章节 |
| 路由判定「建模：全量」 | 执行下文完整流程 |
| 用户前缀 `mod:` | 进入本阶段；AskQuestion 提供跳过/增量/全量（`model:` 同义） |
| 首个 REQ、尚无 model/ | **全量**建模 |

**Agent 须在阶段 1 结束或阶段 3 入口**输出建模判定：`📋 建模判定：跳过 | 增量({文件}) | 全量`，依据见 [建模按需判定](00-intent-routing.md#建模按需判定阶段-2-非必经)。

## 目标

基于已确认 REQ，将业务世界建模为**可阅读的独立文档**，统一放在 `atlas/model/` 目录。

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

0. **决策权**：入口卡或 todo 全局 → [stage-delegation.md](../templates/stage-delegation.md)
1. 阅读已确认 REQ（`atlas/requirements/REQ-*.md`）
2. 若 `atlas/model/` 不存在，按模板初始化目录与 `README.md`
3. 编写 `domain-model.md`：识别聚合根、实体、值对象及职责
4. 编写 `entity-relations.md`：文本 ER 图 + 关系表（基数、方向、说明）
5. 编写 `domain-rules.md`：每个聚合根的不变量、状态机、值对象校验
6. 编写 `physical-model.md`：
   - 有持久化：表结构、约束、索引、DDL（可内嵌或附录 `schema.sql`）
   - 无持久化：标注 `N/A`，说明数据存放方式（内存/文件/第三方）
7. 更新 `README.md` 索引，整体状态标 **草稿**
8. **user_decide**：AskQuestion 确认建模（见 modeling-output.md）→ 停止  
   **ai_decide**：追加 **AI 决策记录** → **审阅闸门** → 停止（跳过建模确认卡）
9. 确认后（或审阅闸门 confirm/skip）`README.md` 状态改 **已确认**，更新 todo

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
- 草稿后必须 AskQuestion，禁止自动标「已确认」
- `domain-model.md` 必须列出所有聚合根及一句话职责
- `entity-relations.md` 必须含文本 ER 图和关系表
- `domain-rules.md` 每个聚合根至少 1 条不变量
- `physical-model.md` 字段须明确类型、约束；有 DB 须考虑主键、外键、索引
- **禁止**在本阶段写 API、功能清单、开发任务
- **禁止**将领域模型与方案文档混写

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/model/README.md` | 索引 + 状态 |
| `atlas/model/domain-model.md` | 领域模型 |
| `atlas/model/entity-relations.md` | 实体关系 |
| `atlas/model/domain-rules.md` | 领域规则 |
| `atlas/model/physical-model.md` | 物理/存储模型 |
| `atlas/todo.md` | 数据建模 ✅ |
| `atlas/humanTodo.md` | 待业务确认项 |

`README.md` 未标「已确认」且未走「跳过」判定 → 禁止进入阶段 3。
