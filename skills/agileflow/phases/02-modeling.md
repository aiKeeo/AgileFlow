# 阶段 2：数据建模（按需）

> AskQuestion 规范：[templates/contract.md](../templates/contract.md)
> **本阶段完成 = `atlas/model/` 已写出，或总控已在 `atlas/flow.yaml` 将 `model` 标 `skip: true` + `reason`。** 不是聊过建模。
> 文档模板与确认卡片：[templates/model.md](../templates/model.md)
> **何时需要建模**：见下方 [§建模按需判定](#建模按需判定)
> **Template ON** 时先读 `atlas/template/model/` 下对应 `template-*.md`（无则回退 skill templates/）  
> **角色提示词**：[role-model.md](../templates/role/role-model.md)（可覆盖 `atlas/role/role-model.md`）· 总控 → [orchestrator](../templates/orchestrator.md)

## 何时执行本阶段

| 场景 | 动作 |
|------|------|
| 建议跳过且 **user 已确认**（卡或原话） | 总控写 `flow.yaml` model skip+reason → `AF_STEP`+1 进 sol |
| 建议跳过且 **`ai`**（自检齐） | 总控写 `flow.yaml` skip+reason → **同条进 sol**（连做） |
| 建议跳过且 **user 尚未确认** | AskQuestion 建模判定确认 → 停；见 [跳过确认](#跳过须用户确认堵静默) |
| 路由判定「建模：增量」 | 只更新受影响的 model 文件 |
| 路由判定「建模：全量」 | 执行下文完整流程 |
| 用户前缀 `mod:` | 进入本阶段；`user` 可 AskQuestion 跳过/增量/全量（`model:` = `mod:`） |
| 首个 REQ、尚无 model/ | **全量**建模 |

阶段 1 结束或进 sol 前须落盘判定：`跳过 | 增量 | 全量`。`user` 问人；`ai` 自检齐→同条进 sol。禁止无判定静默进 sol。

## 建模按需判定

总控先按条件表**建议**「跳过 / 增量 / 全量」，再按下方规则问人或落盘；由总控派 Model Writer 执行。**禁止**自行静默跳过。

### 建议「跳过」的条件（须**全部**满足）

- 已有 `atlas/model/README.md` 为 **已确认**
- 本次工作**不引入**新聚合根/实体/值对象
- **不改变**实体间关系（基数、归属、外键）
- **不新增/修改**领域规则、状态机、存储结构

### 跳过须确认（堵静默）

### 主路径（有 flow.yaml）

1. `AF_STEP=model`，对照该步 `criteria`
2. 可跳 → 写 `atlas/flow.yaml`：`skip: true` + `reason`（勿只写 todo）
3. `advanceStep(projectRoot, 'sol')`（或成对改 AF_STEP+AF_PHASE）
4. **通常不派** model 角色；同条进 sol

### 建议跳过时的确认

建议跳过时：

- **`ai` · 跳过**（四项自检 ✅ + 覆盖依据已校验）→ 总控写 `flow.yaml` `model.skip`+`reason` → `AF_STEP=sol` → 同条进 sol。首行：`建模跳过：同条进 sol`
- **`user`**：原话未点明跳过 → AskQuestion → **停**：

```yaml
title: "建模判定确认"
questions:
  - id: modeling_action
    prompt: |
      建议【跳过】阶段 2（自检：无新实体/值对象/无关系变更/无新规则/无存储结构变更）。
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
| skip_confirm | 总控写 `flow.yaml` model skip+reason → `AF_STEP`+1 → 可进 sol |
| do_incremental / do_full | 进阶段 2 对应路径 |

**跳过确认后必须落盘 flow skip**（禁止只口头跳过）。可选镜像 todo「建模判定」行（**legacy**，有 flow 时以 flow 为准）：

**（Legacy）无 `atlas/flow.yaml` 时的机器核验行（写进 `atlas/todo.md`）**：

```markdown
建模判定：跳过（依据：{至少一句实质覆盖理由}）⏭️
```

可选补充（可写 model 旁注或 todo 下方，**不能代替**上行）：

```markdown
📋 建模判定：跳过
- 已确认 model：atlas/model/README.md（v{x}）
- 覆盖依据：{本次改动点} → 已由 {实际存在的文件：conceptual/entity-relations.md §x 或 entities/User.md §x / …} 覆盖
- 自检四项：无新实体/值对象 ✅ / 无关系变更 ✅ / 无新规则 ✅ / 无存储结构变更 ✅
- 确认：AskQuestion skip_confirm | 原话「{摘录}」 | AF_DECIDE=ai 自判
```

有 `flow.yaml` 时：**以 flow skip+reason 为准**，todo 行可省略。无 flow 的旧项目：缺同行「依据」+⏭️ → 脚本不认跳过。
> **覆盖依据校验（Model Writer 自检）**：写入覆盖依据前，Model Writer 须先 Read 引用的文件路径，确认文件存在且引用的章节存在。引用不存在的文件/章节 = 跳过判定无效，须进阶段 2。

**必须进入或增量更新 model/**（**不问「能否跳过」**，直接进阶段 2），当**任一**命中：

- 新实体、新聚合根或**新值对象**
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
│   └── {EntityName}.md               # 一实体一文件
└── physical/                         # 物理层：怎么落库
    └── schema.md                     # 表结构 / 索引 / DDL（无持久化写 N/A）
```

> 与 `init/data/`（as-is：`entities/` · `relations/`）对应：`model/` 是 to-be。  
> **禁止**把实体、关系、规则、DDL 平铺在 `model/` 根下。  
> **禁止**用 `model-overview.md` 单文件收敛所有实体。

## 执行流程

0. **总控**读 env/todo/已确认 REQ；按条件表判定 `跳过 | 增量 | 全量`（判定权在总控）
1. **跳过路径**（总控）：
   - `ai` 自检齐 → 派 role-model 落盘「建模判定：跳过」+ 总控 todo `⏭️` → **建模跳过：同条进 sol**（派 role-sol）
   - `user` → AskQuestion 建模判定确认 → 停
2. **增量/全量**：总控按 [orchestrator](../templates/orchestrator.md) 加载 [role-model.md](../templates/role/role-model.md)，注入判定后派出 → 收产物 → 跑 `mod-confirm` → 绿则 **user** 确认停 / **ai** 连做；确认后总控标 README 已确认并更新 todo

角色正文（三层目录怎么写）**只维护在 role-model**，本文件不复述。

### 阶段收尾 — **阶段闸门**（仅 user）

→ [contract §7.2 阶段闸门](../templates/contract.md#72-阶段闸门user)（`ai` 跳过）。  
本阶段前置：`model/README.md` 标 **已确认**、todo 已更新。

## 前置条件

- 至少一个 REQ 状态为「已确认」（**跳过建模时仍须 REQ 已确认才能进阶段 3**）

## 跳过时的 todo 记录

建模跳过时，在 `atlas/todo.md`「流程进度」区标注：

```markdown
- 数据建模：⏭️ 跳过（依据：无新实体/关系/规则，model 已确认 v{x}）
```

## 强制规则（全量/增量时适用）

- 必须基于已确认需求，每个聚合根追溯到 REQ
- 草稿后须结束闸门（user 确认卡 / ai 结束处理），禁止静默标「已确认」
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
