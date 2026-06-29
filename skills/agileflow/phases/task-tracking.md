# 任务跟踪（贯穿各阶段）

> todo 模板：[templates/todo.md](../templates/todo.md)
> humanTodo / 阻塞检查：[templates/human-todo.md](../templates/human-todo.md)

## 作用

维护 `specs/todo.md`（AI/开发者任务）、`specs/humanTodo.md`（人类待办）、`specs/active-edits.md`（并行改文件锁）。

## 执行时机

1. 项目初始化：创建 todo + humanTodo 模板
2. 阶段 3（sol:）：拆解开发任务 + **功能依赖表**写入 `specs/todo.md`；用户显式并行出方案时走 [parallel-orchestration.md](parallel-orchestration.md) 批次 A
3. 阶段 4：**默认单 Agent 串行** — 取 todo 首个 **① 未勾** 的 T-xxx → **`TodoWrite` 同步三步** → 严格 **①→②→③** 逐项勾选（见 [todo.md 开发任务](../templates/todo.md#开发任务)）→ 父任务 ✅ → 下一任务。**Write 业务源码前须过 W0–W7**（[04-development Write 拦截](04-development.md#write-拦截构思未完成--禁止写码)）；用户显式并行时读 parallel-orchestration 批次 B→C；**仅主 Agent** 更新 todo / dev **九** / active-edits
4. 各阶段：**识别人类依赖 → 当次追加 humanTodo**（见 [human-todo 沉淀铁律](../templates/human-todo.md#沉淀铁律易忘)）；阶段 4 写 dev 时同步检查
5. **阶段 4 开始前、阶段 5 开始前**：humanTodo 阻塞检查
6. 阶段 5 完成：testing 更新 README；本模块更新 todo 状态

## 强制规则

- AI 任务 → todo；人类待办 → humanTodo，**识别即追加，禁止只口头不写入**
- 完成即更新；禁止跳步标完成
- todo「变更历史」须记录每次更新
- 阻塞检查逻辑见 human-todo.md
- 用户反馈人类待办完成 → 更新状态并重新检查
- 并行写码前须维护 `specs/active-edits.md`；见 [templates/active-edits.md](../templates/active-edits.md)

## 强制文档产出

| 文件 | 说明 |
|------|------|
| `specs/README.md` | 项目总览 |
| `specs/todo.md` | AI 任务 + 流程进度 |
| `specs/humanTodo.md` | 人类待办 |
| `specs/model/` | 数据建模（阶段 2） |
| `specs/solution/` | 方案（sol:，阶段 3） |
| `specs/dev/` | 功能实现思路（阶段 4） |
| `specs/tests/REQ-*-验收报告.md` | 每 REQ 一份（**阶段 5** 产出） |
| `specs/tests/README.md` | 索引 + 交付汇总 |
| `specs/active-edits.md` | 并行改文件锁（阶段 4 并行时） |

## 项目初始化

若 `specs/` 不存在，创建：

```
specs/
├── README.md
├── todo.md
├── humanTodo.md
├── active-edits.md         # 并行改文件锁（阶段 4 并行前启用）
├── requirements/
│   ├── README.md
│   └── ui/README.md        # UID 索引（有界面时阶段 1 填充）
├── model/                  # 阶段 2 填充
└── tests/README.md
```

阶段 2 初始化 `specs/model/`；阶段 3 初始化 `specs/solution/`；阶段 4 初始化 `specs/dev/`。

模板见 [templates/todo.md](../templates/todo.md)、[templates/human-todo.md](../templates/human-todo.md)、[templates/active-edits.md](../templates/active-edits.md)。

## 产出

| 时机 | 文件 |
|------|------|
| 初始化 | todo.md, humanTodo.md, active-edits.md（空表） |
| 阶段 1 | REQ + **ui/UID**（有界面时） |
| 阶段 2 | model/ 目录 |
| 阶段 3 | solution/ 目录 + todo.md 开发任务 |
| 阶段 4 | dev/ 功能思路 + 代码 |
| 状态变化 | todo.md |
| 追加/更新 | humanTodo.md |
| 全流程结束 | tests/README.md（阶段 5 生成）+ todo 状态 |
