# 数据建模模板（specs/model/）

## README.md 模板

```markdown
# 数据模型

- 状态：草稿 | 已确认
- 版本：1.0
- 关联需求：REQ-001, REQ-002
- 更新时间：{{当前时间}}

## 文档索引

| 文档 | 说明 | 状态 |
|------|------|------|
| [domain-model.md](domain-model.md) | 领域模型：聚合根、实体、值对象 | 草稿 |
| [entity-relations.md](entity-relations.md) | 实体关系：ER 图、关系说明 | 草稿 |
| [domain-rules.md](domain-rules.md) | 领域规则：不变量、状态机 | 草稿 |
| [physical-model.md](physical-model.md) | 物理模型：表结构/DDL（按需） | 草稿 |
```

## domain-model.md 模板

```markdown
# 领域模型

> 关联需求：REQ-001, REQ-002

## 聚合根清单

| 聚合根 | 职责 | 关联 REQ | 包含实体 | 值对象 |
|--------|------|----------|----------|--------|
| Order | 管理订单生命周期 | REQ-001 | OrderItem | Money, Address |

## 聚合详情

### Order（订单）

**职责**：……

**实体**：
- OrderItem：……

**值对象**：
- Money：金额 + 币种，不可变
- Address：收货地址
```

## entity-relations.md 模板

```markdown
# 实体关系

## ER 图（文本）

```
[User] 1───* [Order] 1───* [OrderItem]
                │
                └───1 [Payment]
```

## 关系表

| 实体 A | 关系 | 实体 B | 基数 | 说明 |
|--------|------|--------|------|------|
| User | 拥有 | Order | 1:N | 一个用户多个订单 |
| Order | 包含 | OrderItem | 1:N | 订单行 |
| Order | 关联 | Payment | 1:1 | 一笔订单一次支付 |
```

## domain-rules.md 模板

```markdown
# 领域规则

## 不变量

| 聚合根 | 规则 | 违反时 |
|--------|------|--------|
| Order | 已支付订单不可修改收货地址 | 拒绝并返回错误 |

## 状态机

### Order 状态

`待支付 → 已支付 → 已发货 → 已完成`
- 禁止：`已支付 → 待支付`
- 禁止：`已完成 → 已发货`

## 值对象校验

| 值对象 | 校验规则 |
|--------|----------|
| Money | 金额 ≥ 0；币种为 ISO 4217 |
```

## physical-model.md 模板

```markdown
# 物理模型

> 无持久化项目：本章写 `N/A — 无数据库`，说明数据存放方式。

## 表结构

### orders

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| user_id | UUID | FK, NOT NULL | 用户 |
| status | VARCHAR(20) | NOT NULL | 订单状态 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |

## 索引

| 表 | 索引 | 用途 |
|----|------|------|
| orders | idx_orders_user_id | 按用户查订单 |

## DDL

```sql
CREATE TABLE orders ( ... );
```
```

## AskQuestion 确认（草稿后必须执行）

```
title: "数据建模确认"
questions:
  - id: "confirm_domain_model"
    prompt: "领域模型是否正确？\n\n（列出聚合根名称及一句话职责）"
    options:
      - { id: "yes", label: "正确，继续" }
      - { id: "adjust", label: "需要调整领域模型" }

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

## 正误示例

**✅ 正确**：分文档写入 model/ → AskQuestion 确认 → README 标已确认 → 阶段闸门

**❌ 错误**：全写进一个文件；在 model/ 里写 API；草稿未确认就标「已确认」
