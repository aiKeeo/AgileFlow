# 阶段 2：数据建模（按需）

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
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

基于已确认 REQ，将业务世界建模为**可阅读的独立文档**，统一放在 `specs/model/` 目录。

**本阶段只回答「业务世界是什么」**，不定义 API、不拆开发任务。

## 目录结构（必须）

```
specs/model/
├── README.md              # 索引 + 整体状态（草稿/已确认）
├── domain-model.md        # 领域模型：聚合根、实体、值对象
├── entity-relations.md    # 实体关系：ER 图、关系说明
├── domain-rules.md        # 领域规则：不变量、状态机、值对象校验
└── physical-model.md      # 物理模型：表结构/DDL（无 DB 项目写 N/A）
```

## 执行流程

1. 阅读已确认 REQ（`specs/requirements/REQ-*.md`）
2. 若 `specs/model/` 不存在，按模板初始化目录与 `README.md`
3. 编写 `domain-model.md`：识别聚合根、实体、值对象及职责
4. 编写 `entity-relations.md`：文本 ER 图 + 关系表（基数、方向、说明）
5. 编写 `domain-rules.md`：每个聚合根的不变量、状态机、值对象校验
6. 编写 `physical-model.md`：
   - 有持久化：表结构、约束、索引、DDL（可内嵌或附录 `schema.sql`）
   - 无持久化：标注 `N/A`，说明数据存放方式（内存/文件/第三方）
7. 更新 `README.md` 索引，整体状态标 **草稿**
8. **AskQuestion 确认建模**（见 modeling-output.md）→ 停止
9. 确认后 `README.md` 状态改 **已确认**，更新 todo

### 第 10 步：阶段收尾 — **强制 AskQuestion 阶段闸门**

`model/README.md` 标 **已确认** 后，本阶段完成。**必须**：

1. **调用 `AskQuestion` 工具**，弹出 [阶段闸门小卡片](../templates/askquestion-gate.md#阶段闸门模板)
2. prompt：`数据建模已完成。是否继续进入【方案设计】阶段？`
3. **调用后立即停止**——禁止同回复写 `specs/solution/`

| 禁止 | 说明 |
|------|------|
| ❌ 建模确认后直接出方案 | 须等小卡片「是，继续」 |
| ❌ 文字问「要做方案吗？」 | 须用 AskQuestion 小卡片 |

## 前置条件

- 至少一个 REQ 状态为「已确认」（**跳过建模时仍须 REQ 已确认才能进阶段 3**）

## 跳过时的 todo 记录

建模跳过时，在 `specs/todo.md`「流程进度」区标注：

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
| `specs/model/README.md` | 索引 + 状态 |
| `specs/model/domain-model.md` | 领域模型 |
| `specs/model/entity-relations.md` | 实体关系 |
| `specs/model/domain-rules.md` | 领域规则 |
| `specs/model/physical-model.md` | 物理/存储模型 |
| `specs/todo.md` | 数据建模 ✅ |
| `specs/humanTodo.md` | 待业务确认项 |

`README.md` 未标「已确认」且未走「跳过」判定 → 禁止进入阶段 3。
