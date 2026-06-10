# 阶段 2：数据建模

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> 确认模板与输出结构：[templates/modeling-output.md](../templates/modeling-output.md)

## 执行流程

1. 基于已确认 REQ（`specs/requirements/REQ-*.md`）建模
2. 识别聚合根、实体、值对象
3. 提炼领域规则：不变量、状态机、值对象验证
4. 设计表结构、约束、索引
5. 生成文本 ER 图
6. 写入 `specs/002-data-model.md` 与 `sql/init.sql`（**草稿**）
7. **AskQuestion 确认领域规则**（见 modeling-output.md）
8. 确认后状态改「已确认」，更新 todo，**AskQuestion 阶段闸门** → 停止

## 前置条件

- 至少一个 REQ 状态为「已确认」

## 强制规则

- 必须基于已确认需求
- 草稿后必须 AskQuestion，禁止自动标「已确认」
- 必须显式列出每个聚合根的不变量
- 字段须明确类型、约束、说明
- 须考虑主键、外键、常用索引
- 须生成可运行 SQL 或说明迁移路径

## 产出

| 文件 | 说明 |
|------|------|
| `specs/002-data-model.md` | 含领域规则 |
| `sql/init.sql` | DDL |
| `specs/todo.md` | 数据建模 ✅ |
| `specs/humanTodo.md` | 待业务确认项 |

未「已确认」禁止进入阶段 3。
