# 阶段 2：数据建模（按需）

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> **本阶段完成 = `atlas/model/` 文件已写出（或 todo 标跳过）**，不是聊过建模。
> 文档模板与确认卡片：[templates/modeling-output.md](../templates/modeling-output.md)
> **何时需要建模**：见下方 [§建模按需判定](#建模按需判定)

## 何时执行本阶段

| 场景 | 动作 |
|------|------|
| 建议跳过且 **user 已确认**（卡或原话） | **不进入本阶段**，落盘建模判定后可进阶段 3 |
| 建议跳过且 **`AF_DECIDE=ai`** | 落盘建模判定 → 审阅闸门 → 停（禁止再发确认卡） |
| 建议跳过且 **user 尚未确认** | AskQuestion 建模判定确认 → 停；见 [跳过确认](#跳过须用户确认堵静默) |
| 路由判定「建模：增量」 | 只更新受影响的 model 文件章节 |
| 路由判定「建模：全量」 | 执行下文完整流程 |
| 用户前缀 `mod:` | 进入本阶段；`user` 可 AskQuestion 跳过/增量/全量（`model:` = `mod:`） |
| 首个 REQ、尚无 model/ | **全量**建模 |

**Agent 须在阶段 1 结束或阶段 3 入口**先给出建议：`📋 建模判定：跳过 | 增量({文件}) | 全量`。可跳过时：`user` 问人；`ai` 落盘+审阅。依据见 [建模按需判定](#建模按需判定)。

> **「落盘」含义**：① 回复输出建模判定模板；② todo「流程进度」标 `⏭️`/`📊`；③ 跳过须有确认留痕——`user`=卡或原话，`ai`=自判+审阅闸门。禁止无判定静默进 sol。

## 建模按需判定

Agent 先按条件表**建议**「跳过 / 增量 / 全量」，再按下方规则问人或落盘。**禁止**自行静默跳过。

### 建议「跳过」的条件（须**全部**满足）

- 已有 `atlas/model/README.md` 为 **已确认**
- 本次工作**不引入**新聚合根/实体/值对象
- **不改变**实体间关系（基数、归属、外键）
- **不新增/修改**领域规则、状态机、存储结构

### 跳过须确认（堵静默）

建议跳过时：

- **`AF_DECIDE=ai`**：落盘「建模判定：跳过」+ todo `⏭️` → **审阅闸门** → 停（**禁止**再发下方确认卡）
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
- 覆盖依据：{本次改动点} → 已由 {实际存在的文件：model-overview.md §x 或 domain-model.md §x / …} 覆盖
- 自检四项：无新实体 ✅ / 无关系变更 ✅ / 无新规则 ✅ / 无存储结构变更 ✅
- 确认：AskQuestion skip_confirm | 原话「{摘录}」 | AF_DECIDE=ai 自判
```

缺「覆盖依据」、四项未勾 → **禁止跳过**。`user_decide` 另须用户确认（卡或原话）；`ai` 须有上表自判留痕 + 审阅闸门。
> **覆盖依据校验（Agent 自检）**：写入覆盖依据前，Agent 须先 Read 引用的文件路径，确认文件存在且引用的章节存在。引用不存在的文件/章节 = 跳过判定无效，须进阶段 2。

**必须进入或增量更新 model/**（**不问「能否跳过」**，直接进阶段 2），当**任一**命中：

- 新实体或新聚合根
- 实体关系变化（1:N→N:M、新增外键、拆分表）
- 新业务规则/状态机/不变量
- 持久化层结构变化（新表、改字段、改索引）
- 首个 REQ 且尚无 model/（首次需完整建模）
- **greenfield 且有 DB/持久化**（禁止「无 model 就跳过」）
- **model/README.md 状态为「草稿」**（须完成确认或更新后才能跳过）

**增量更新**：只改**实际存在**的文件章节（快速→`model-overview.md`；严谨→对应五件套）；改完结束闸门 → 停止。

**阶段前缀 `mod:`**（=`model:`）：强制进入阶段 2；AskQuestion 提供跳过/增量/全量。

---

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
| `atlas/README.md` | 人类驾驶舱（本阶段结束必更新） |
| `atlas/model/README.md` | 索引 + 状态权威（必有；子文件状态须与此一致） |
| `atlas/model/model-overview.md` | **快速**单文件 |
| `atlas/model/domain-model.md` 等五件套 | **严谨** |
| `atlas/todo.md` | 数据建模 ✅ |
| `atlas/humanTodo.md` | 待业务确认项 |

`README.md` 未标「已确认」且未走「跳过」判定 → 禁止进入阶段 3。  
阶段结束闸门前：更新 [atlas/README.md](../templates/atlas-readme.md)「现在 / 导读」。
