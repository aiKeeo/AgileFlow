---
name: data-modeling
description: >-
  数据建模：基于已确认需求做 DDD 划分，输出 ER 关系、表结构、索引与可执行 SQL 到
  specs/002-data-model.md 和 sql/init.sql。在数据库设计、实体建模、表结构评审时使用。
version: 1.1.0
category: design
priority: 80
disable-model-invocation: true
---

# 数据建模（DDD）

## 执行流程

1. 基于已确认的 `specs/001-requirement.md` 进行建模
2. 按 DDD 规范划分实体、值对象、聚合根
3. 设计数据库表结构、字段类型、约束和索引
4. 生成文本 ER 图
5. 等待用户确认

## 前置条件

- `specs/001-requirement.md` 已存在且用户已确认

## 强制输出格式

写入 `specs/002-data-model.md`，必须包含：

### 1. DDD 领域模型

- 聚合根、实体、值对象、领域服务

### 2. ER 关系图（文本）

示例：`用户 1:N 订单`、`订单 N:M 商品`

### 3. 数据库表结构

每个表用 Markdown 表格：字段名 | 类型 | 约束 | 说明

### 4. SQL 初始化脚本

完整 DDL 写入 `sql/init.sql`，与文档一致、可直接执行。

## 强制文档产出

| 文件 | 说明 |
|------|------|
| `specs/002-data-model.md` | 数据模型设计全文 |
| `sql/init.sql` | 数据库初始化脚本 |
| `specs/todo.md` | 「数据建模」→ ✅ 已完成 |

## 强制规则

- 必须基于已确认的需求进行建模
- 所有字段必须明确类型、约束和说明
- 必须考虑主键、外键和常用查询索引
- 必须生成可直接运行的 SQL 初始化脚本
