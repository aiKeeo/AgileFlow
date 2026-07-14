# 任务跟踪（贯穿各阶段）

> todo 模板：[templates/todo.md](../templates/todo.md)
> humanTodo / 阻塞检查：[templates/human-todo.md](../templates/human-todo.md)

## 作用

维护 `atlas/todo.md`（AI/开发者任务）、`atlas/humanTodo.md`（人类待办）、`atlas/active-edits.md`（并行改文件锁）。

## 执行时机

1. 项目初始化：创建 todo + humanTodo 模板
2. 阶段 3（sol:）：拆解开发任务 + **功能依赖表**写入 `atlas/todo.md`；用户显式并行出方案时走 [parallel-orchestration.md](parallel-orchestration.md) 批量出方案
3. 阶段 4：**默认主 Agent 串行** — **先 `TodoWrite` 为每个 T 展开①②③三条** → 取首个 **① 未勾** 的 T-xxx → 严格 **①→②→可运行闸门→③**（见 [todo.md TodoWrite 强制展开](../templates/todo.md#todowrite-强制展开防漏①--最高优先级)）→ 父任务 ✅ → 下一任务。**Write 业务源码前**：TodoWrite 已展开 **且** 过构思闸门/写码闸门。「全部开发」**≠** 可启 Task 批量写码，**必须先展开清单**。用户显式「并行/subagent」时读 [parallel-orchestration](parallel-orchestration.md)（须并行启动卡）。**仅主 Agent** 更新 todo / 勾 ✅；标「开发实现 ✅」前须 **开发完成格式门槛 全过**
4. 各阶段：**识别人类依赖 → 当次追加 humanTodo**（见 [human-todo 沉淀铁律](../templates/human-todo.md#沉淀铁律易忘)）；阶段 4 写 dev 时同步检查
5. **阶段 4 开始前、阶段 5 开始前**：humanTodo 阻塞检查
6. 阶段 5 完成：testing 更新 README；本模块更新 todo 状态

## 强制规则

- AI 任务 → todo；人类待办 → humanTodo，**识别即追加，禁止只口头不写入**
- 完成即更新；禁止跳步标完成
- todo「变更历史」须记录每次更新
- 阻塞检查逻辑见 human-todo.md
- 用户反馈人类待办完成 → 更新状态并重新检查
- 并行写码前须维护 `atlas/active-edits.md`；见 [templates/active-edits.md](../templates/active-edits.md)

## 强制文档产出

| 文件 | 说明 |
|------|------|
| `atlas/README.md` | 项目总览 |
| `atlas/todo.md` | AI 任务 + 流程进度 |
| `atlas/humanTodo.md` | 人类待办 |
| `atlas/model/` | 数据建模（阶段 2） |
| `atlas/solution/` | 方案（sol:，阶段 3） |
| `atlas/dev/` | 功能实现思路（阶段 4） |
| `atlas/tests/REQ-*-验收报告.md` | 每 REQ 一份（**阶段 5** 产出） |
| `atlas/tests/README.md` | 索引 + 交付汇总 |
| `atlas/debt.md` | 技术债看板（待回溯/事后补写/质疑；阶段 5 须清零） |
| `atlas/active-edits.md` | 并行改文件锁（阶段 4 并行时） |

## 项目初始化

若 `atlas/` 不存在，创建：

```
atlas/
├── README.md
├── todo.md
├── humanTodo.md
├── glossary.md             # 阶段 1 首个 REQ 时建（术语唯一权威）
├── debt.md                 # 阶段 4 首次记待回溯/事后补写时建（阶段 5 须清零）
├── requirements/
│   ├── README.md
│   └── ui/README.md        # UID 索引（有界面时阶段 1 填充）
├── model/                  # 阶段 2 填充
└── tests/README.md
```

阶段 2 初始化 `atlas/model/`；阶段 3 初始化 `atlas/solution/`；阶段 4 初始化 `atlas/dev/`。`active-edits.md` **仅并行启用时**创建（串行模式不建）。

模板见 [templates/todo.md](../templates/todo.md)、[templates/human-todo.md](../templates/human-todo.md)、[templates/active-edits.md](../templates/active-edits.md)。

## 产出

| 时机 | 文件 |
|------|------|
| 初始化 | todo.md, humanTodo.md |
| 阶段 1 | REQ + **ui/UID**（有界面时）+ glossary.md（首个 REQ 时建） |
| 阶段 2 | model/ 目录 |
| 阶段 3 | solution/ 目录 + todo.md 开发任务 |
| 阶段 4 | dev/ 功能思路 + 代码 + debt.md（首次记待回溯/事后补写时建） |
| 并行启用 | active-edits.md |
| 状态变化 | todo.md |
| 追加/更新 | humanTodo.md · glossary.md（新术语） |
| 全流程结束 | tests/README.md（阶段 5 生成）+ todo 状态 + debt.md 清零 |
