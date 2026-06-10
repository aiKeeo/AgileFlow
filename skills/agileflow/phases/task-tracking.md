# 任务跟踪（贯穿各阶段）

> todo 模板：[templates/todo.md](../templates/todo.md)
> humanTodo / 阻塞检查：[templates/human-todo.md](../templates/human-todo.md)

## 作用

维护 `specs/todo.md`（AI/开发者任务）与 `specs/humanTodo.md`（人类待办）。

## 执行时机

1. 项目初始化：创建 todo + humanTodo 模板
2. 阶段 3：从 003 原子任务生成/追加开发任务
3. 阶段 4：每完成子任务立即更新 todo
4. 各阶段：识别人类依赖时追加 humanTodo
5. **阶段 4 开始前、阶段 5 开始前**：阻塞检查
6. 阶段 5 完成：testing 更新 README；本模块更新 todo 状态

## 强制规则

- AI 任务 → todo；人类待办 → humanTodo，禁止混用
- 完成即更新；禁止跳步标完成
- todo「变更历史」须记录每次更新
- 阻塞检查逻辑见 human-todo.md
- 用户反馈人类待办完成 → 更新状态并重新检查

## 强制文档产出

| 文件 | 说明 |
|------|------|
| `specs/README.md` | 项目总览 |
| `specs/todo.md` | AI 任务 + 流程进度 |
| `specs/humanTodo.md` | 人类待办 |
| `specs/tests/REQ-*-验收报告.md` | 每 REQ 一份 |
| `specs/tests/README.md` | 索引 + 交付汇总 |

## 项目初始化

若 `specs/` 不存在，创建：

```
specs/
├── README.md
├── todo.md
├── humanTodo.md
├── requirements/README.md
└── tests/README.md
```

模板见 [templates/todo.md](../templates/todo.md)、[templates/human-todo.md](../templates/human-todo.md)。

## 产出

| 时机 | 文件 |
|------|------|
| 初始化 | todo.md, humanTodo.md |
| 状态变化 | todo.md |
| 追加/更新 | humanTodo.md |
| 全流程结束 | tests/README.md（阶段 5 生成）+ todo 状态 |
