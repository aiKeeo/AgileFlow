# 阶段 2：数据建模（按需）

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> **本阶段完成 = `atlas/model/` 文件已写出（或 todo 标跳过）**，不是聊过建模。
> 文档模板与确认卡片：[templates/modeling-output.md](../templates/modeling-output.md)
> **何时需要建模**：见下方 [§建模按需判定](#建模按需判定)
> **Template ON** 时先读 `atlas/template/model/` 下对应 `template-*.md`（无则回退 skill templates/）

## 何时执行本阶段

| 场景 | 动作 |
|------|------|
| 建议跳过且 **user 已确认**（卡或原话） | **不进入本阶段**，落盘建模判定后可进阶段 3 |
| 建议跳过且 **`AF_DECIDE=ai`**（自检齐） | **快路径**：落盘建模判定 → **本条直接进 sol 落盘**（禁止再发确认卡/审阅闸门） |
| 建议跳过且 **`AF_DECIDE=ai`**（灰区/自检不全） | 落盘建模判定 → 审阅闸门 → 停（禁止再发确认卡） |
| 建议跳过且 **user 尚未确认** | AskQuestion 建模判定确认 → 停；见 [跳过确认](#跳过须用户确认堵静默) |
| 路由判定「建模：增量」 | 只更新受影响的 model 文件 |
| 路由判定「建模：全量」 | 执行下文完整流程 |
| 用户前缀 `mod:` | 进入本阶段；`user` 可 AskQuestion 跳过/增量/全量（`model:` = `mod:`） |
| 首个 REQ、尚无 model/ | **全量**建模 |

**Agent 须在阶段 1 结束或阶段 3 入口**先给出建议：`📋 建模判定：跳过 | 增量({文件}) | 全量`。可跳过时：`user` 问人；`ai` 自检齐→快路径进 sol，否则落盘+审阅。依据见 [建模按需判定](#建模按需判定)。

> **「落盘」含义**：① 回复输出建模判定模板；② todo「流程进度」标 `⏭️`/`📊`；③ 跳过须有确认留痕——`user`=卡或原话，`ai`=自判（快路径）或自判+审阅闸门（灰区）。禁止无判定静默进 sol。

## 建模按需判定

Agent 先按条件表**建议**「跳过 / 增量 / 全量」，再按下方规则问人或落盘。**禁止**自行静默跳过。

### 建议「跳过」的条件（须**全部**满足）

- 已有 `atlas/model/README.md` 为 **已确认**
- 本次工作**不引入**新聚合根/实体/值对象
- **不改变**实体间关系（基数、归属、外键）
- **不新增/修改**领域规则、状态机、存储结构

### 跳过须确认（堵静默）

建议跳过时：

- **`AF_DECIDE=ai` · 快路径**（须**同时**满足）：四项自检全 ✅、覆盖依据已 Read 校验存在、判定模板已写入回复与 todo `⏭️` → **本条直接进阶段 3 写 solution/**（**禁止**再发确认卡；**禁止**再发审阅闸门）。首行声明：`建模跳过快路径：同条进 sol`。此为「禁同回复跨阶段」的**唯一例外**（仅跳过→sol；增量/全量不适用）。
- **`AF_DECIDE=ai` · 灰区**（自检任一项不确定、覆盖依据弱、或命中下方「必须进入」灰边）→ 落盘「建模判定：跳过」+ todo `⏭️` → **审阅闸门** → 停（**禁止**再发下方确认卡；**禁止**同条进 sol）
- **`user_decide`**：落盘前必须 AskQuestion → **停**（除非用户本轮原话已含「跳过建模 / 不用建模 / 模型不用改」）：

```yaml
title: "建模判定确认"
questions:
  - id: modeling_action
    prompt: |
      建议【跳过】阶段 2（自检：无新实体/无关系变更/无新规则/无存储结构变更）。
      覆盖依据预览：{文件路径 §章节}
      请确认：
    options:
      - id: skip_confirm
        label: "确认跳过（写建模判定，进方案）"
      - id: do_incremental
        label: "仍要增量建模"
      - id: do_full
        label: "仍要全量建模"
```

| 选项 | 下条动作 |
|------|----------|
| skip_confirm | 落盘「建模判定：跳过」+ todo `⏭️` → 可进阶段 3 |
| do_incremental / do_full | 进阶段 2 对应路径 |

**跳过确认后必须落盘「建模判定」**（禁止只口头跳过）：

```markdown
📋 建模判定：跳过
- 已确认 model：atlas/model/README.md（v{x}）
- 覆盖依据：{本次改动点} → 已由 {实际存在的文件：conceptual/entity-relations.md §x 或 entities/User.md §x / …} 覆盖
- 自检四项：无新实体 ✅ / 无关系变更 ✅ / 无新规则 ✅ / 无存储结构变更 ✅
- 确认：AskQuestion skip_confirm | 原话「{摘录}」 | AF_DECIDE=ai 自判
```

缺「覆盖依据」、四项未勾 → **禁止跳过**。`user_decide` 另须用户确认（卡或原话）；`ai` 须有上表自判留痕——自检齐走快路径，否则审阅闸门。
> **覆盖依据校验（Agent 自检）**：写入覆盖依据前，Agent 须先 Read 引用的文件路径，确认文件存在且引用的章节存在。引用不存在的文件/章节 = 跳过判定无效，须进阶段 2。

**必须进入或增量更新 model/**（**不问「能否跳过」**，直接进阶段 2），当**任一**命中：

- 新实体或新聚合根
- 实体关系变化（1:N→N:M、新增外键、拆分表）
- 新业务规则/状态机/不变量
- 持久化层结构变化（新表、改字段、改索引）
- 首个 REQ 且尚无 model/（首次需完整建模）
- **greenfield 且有 DB/持久化**（禁止「无 model 就跳过」）
- **model/README.md 状态为「草稿」**（须完成确认或更新后才能跳过）

**增量更新**：只改**实际存在**的文件章节（`entities/` 或 `conceptual/` / `physical/`）；改完结束闸门 → 停止。

**阶段前缀 `mod:`**（=`model:`）：强制进入阶段 2；AskQuestion 提供跳过/增量/全量。

---

## 目标

基于已确认 REQ，将业务世界建模为**可阅读的独立文档**，只写入 `atlas/model/`（**禁止**写回 REQ 或与方案混文件）。

**本阶段只回答「业务世界是什么」**，不定义 API、不拆开发任务。

## 目录结构（必须 — 概念 / 逻辑 / 物理三层）

```
atlas/model/
├── README.md                         # 索引 + 状态（根目录唯一入口文件）
├── conceptual/                       # 概念层：世界有什么、怎么约束
│   ├── entity-relations.md           # ER 图 + 关系表
│   └── domain-rules.md               # 不变量 / 状态机 / 跨实体规则
├── entities/                         # 逻辑层：每个实体一份
│   └── {EntityName}.md               # User.md, WeightRecord.md, …
└── physical/                         # 物理层：怎么落库
    └── schema.md                     # 表结构 / 索引 / DDL（无持久化写 N/A）
```

> 与 `init/data/`（as-is：`entities/` · `relations/`）对应：`model/` 是 to-be。  
> **禁止**把实体、关系、规则、DDL 平铺在 `model/` 根下。  
> **禁止**用 `model-overview.md` 单文件收敛所有实体。

## 执行流程

0. **决策权**：入口卡或 todo 全局 → [stage-delegation.md](../templates/stage-delegation.md)
1. 阅读已确认 REQ（`atlas/requirements/REQ-*.md`）
2. 若 `atlas/model/` 不存在，按模板初始化三层目录与 `README.md`

**全量**：

3. 识别全部实体，**每个实体写 `entities/{EntityName}.md`**（字段表 + 约束 + 职责 + 关联）
4. 编写 `conceptual/entity-relations.md`：文本 ER 图 + 关系表 + 关键约束
5. 编写 `conceptual/domain-rules.md`：不变量 + 状态机 + 值对象校验
6. 有持久化则编写 `physical/schema.md`（表/约束/索引/DDL）；无则 `N/A` + 存放方式
7. 更新 `README.md` 索引（列出三层全部文件），状态 **草稿**
8. **user_decide**：AskQuestion 确认 → 停 · **ai_decide**：AI 决策记录 → 结束闸门（`fast+ai` 免发卡 / `strict+ai` 审阅卡） → 停
9. 确认后 README **已确认**，更新 todo

**增量**：只改实际存在的文件章节（`entities/` 或 `conceptual/` / `physical/`）。

### 第 10 步：阶段收尾 — **阶段闸门**（仅 user_decide）

> **AI 自主**：结束闸门已处理是否继续（`fast+ai` 免发卡 / `strict+ai` 审阅卡），**不走本步**。

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
- 草稿后须结束闸门（user_decide 确认卡 / ai_decide 结束闸门），禁止静默标「已确认」
- **每个实体独立文件**，落在 `entities/{EntityName}.md`，须含「## 字段」表
- `conceptual/entity-relations.md` 须含「## ER 图」
- `conceptual/domain-rules.md` 须含「## 不变量」
- 有持久化时 `physical/schema.md` 须有表结构 / DDL
- **禁止**实体/关系/规则/DDL 平铺在 `model/` 根下
- **禁止**用 `model-overview.md` 单文件收敛所有实体
- **禁止**本阶段写 API、功能清单、开发任务；**禁止**与 REQ/solution 混文件

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/README.md` | 人类驾驶舱（本阶段结束必更新） |
| `atlas/model/README.md` | 索引 + 状态权威（必有；子文件状态须与此一致） |
| `atlas/model/conceptual/entity-relations.md` | ER 图 + 关系表（必有） |
| `atlas/model/conceptual/domain-rules.md` | 不变量 + 状态机（必有） |
| `atlas/model/entities/{EntityName}.md` | 每个实体一个文件（必有，至少 1 个） |
| `atlas/model/physical/schema.md` | 表结构 / DDL（有持久化时；无则 N/A） |
| `atlas/todo.md` | 数据建模 ✅ |
| `atlas/humanTodo.md` | 待业务确认项 |

`README.md` 未标「已确认」且未走「跳过」判定 → 禁止进入阶段 3。  
阶段结束闸门前：更新 [atlas/README.md](../templates/atlas-readme.md)「现在 / 导读」。
