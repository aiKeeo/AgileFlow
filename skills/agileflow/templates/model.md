# 数据建模模板（atlas/model/）

> 三层：`conceptual/`（概念）· `entities/`（逻辑）· `physical/`（物理）。根目录只留 `README.md`。

## README.md 模板

```markdown
# 数据模型

- 状态：草稿 | 已确认
- 版本：1.0
- 关联需求：REQ-001, REQ-002
- 更新时间：{{当前时间}}

## 文档索引

| 文档 | 层 | 说明 | 状态 |
|------|----|------|------|
| [entity-relations.md](conceptual/entity-relations.md) | 概念 | ER 图、关系表 | 草稿 |
| [domain-rules.md](conceptual/domain-rules.md) | 概念 | 不变量、状态机 | 草稿 |
| [User.md](entities/User.md) | 逻辑 | 用户实体 | 草稿 |
| [{Entity}.md](entities/{Entity}.md) | 逻辑 | {一句话职责} | 草稿 |
| [schema.md](physical/schema.md) | 物理 | 表结构 / DDL（按需） | 草稿 |
```

## 实体文件模板（`entities/{EntityName}.md`）

```markdown
# {EntityName}（中文名）

> 关联需求：REQ-001 | 关联实体：[OtherEntity](OtherEntity.md)

## 职责

一句话说明这个实体在业务中扮演什么角色。

## 字段

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| userId | uuid | FK → User.id, not null | |
| name | string(100) | not null | 名称 |
| createdAt | datetime | default now | 创建时间 |

## 约束

- `(userId, recordedAt)` unique — 同一天只保留最后一条
- `weight` 必须 > 0

## 关联

- N:1 → [User](User.md)
- 1:N → [SubItem](SubItem.md)
```

## conceptual/entity-relations.md 模板

```markdown
# 实体关系

## ER 图（文本）

\```
[{Aggregate}] 1───* [{Entity}]
\```

## 关系表

| 实体 A | 关系 | 实体 B | 基数 | 说明 |
|--------|------|--------|------|------|
| {A} | {关系} | {B} | 1:N | {业务含义} |

## 关键约束

- `{Entity}`：`({uniqueKeys})` unique
```

## conceptual/domain-rules.md 模板

```markdown
# 领域规则

## 不变量

| 聚合根 | 规则 | 违反时 |
|--------|------|--------|
| {Aggregate} | {规则} | 拒绝并返回错误 |

## 状态机

### {状态机名}

`{stateA} → {stateB}`
- 禁止：`{非法迁移}`

## 值对象校验

| 值对象 | 校验规则 |
|--------|----------|
| {VO} | {范围/格式} |
```

## physical/schema.md 模板

```markdown
# 物理模型

> 无持久化项目：本章写 `N/A — 无数据库`，说明数据存放方式。

## 表结构

### {table_name}

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| … | … | … | … |

## 索引

| 表 | 索引 | 用途 |
|----|------|------|
| {table} | {idx} | {用途} |

## DDL

\```sql
CREATE TABLE {table_name} ( ... );
\```
```

## AskQuestion 确认（仅 user_decide）

```
title: "数据建模确认"
questions:
  - id: "confirm_entities"
    prompt: "实体清单是否正确？\n\n（列出实体文件名及一句话职责）"
    options:
      - { id: "yes", label: "正确，继续" }
      - { id: "adjust", label: "需要调整实体" }

  - id: "confirm_relations"
    prompt: "实体关系是否正确？"
    options:
      - { id: "yes", label: "正确" }
      - { id: "revise", label: "需要修改关系" }

  - id: "confirm_rules"
    prompt: "领域规则（不变量/状态机）是否完整？"
    options:
      - { id: "complete", label: "完整，确认领域规则" }
      - { id: "missing", label: "有遗漏，我补充说明" }
```
