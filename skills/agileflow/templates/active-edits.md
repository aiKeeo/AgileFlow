# 并行改文件锁（atlas/active-edits.md）

> 并行模式、多 subagent 写码时引用本文件（**默认串行开发可不启用**）。
> **同一源码/spec 文件同一时刻只允许一个 Agent/subagent 占用。**

## 作用

维护 `atlas/active-edits.md`，记录**当前正在被修改的文件路径**，避免并行 subagent 同时改同一文件导致冲突。

## 文件位置

```
atlas/active-edits.md    # 运行时锁表（项目初始化时创建）
```

## 模板

```markdown
# 并行改文件锁

> 占用者：`主Agent` | `subagent-{角色}-{功能ID}` | `subagent-{批次}-{端}`
> 规则：**改前先登记 → 改完必释放**；他人见占用须跳过并回报主 Agent。

| 文件路径 | 占用者 | 关联任务 | 开始时间 | 状态 |
|----------|--------|----------|----------|------|
| server/src/order/OrderService.ts | subagent-BE-F-001 | T-002 | 2026-06-18 10:00 | 进行中 |
| atlas/solution/features/F-001-创建订单.md | subagent-用户域 | 批次A | 2026-06-18 09:30 | 进行中 |

## 历史（最近 10 条，可选）

| 文件路径 | 占用者 | 释放时间 |
|----------|--------|----------|
| miniapp/src/pages/order/index.tsx | subagent-FE-F-001 | 2026-06-18 10:15 ✅ |
```

## 使用规则

### 改前（占用）

1. 读取 `atlas/active-edits.md`
2. 目标路径已在表中且 `状态=进行中` → **禁止修改**，向主 Agent 报告冲突
3. 未占用 → 追加一行（路径、占用者、关联任务、开始时间、进行中）
4. **仅主 Agent** 可改 `atlas/todo.md`、`atlas/active-edits.md` 本身（subagent 禁止）

### 改后（释放）

1. 该文件全部改动完成 → 将对应行 `状态` 改为 `已完成` 或删除该行
2. 主 Agent 在每批次合并后统一清理已完成行
3. 流程结束或阶段闸门前 → 表应为空（无「进行中」行）

### 并行切片时的路径分配

| 场景 | 谁写 | 原则 |
|------|------|------|
| 方案齐批 | Subagent 可写 feature/contract | 每 subagent 只写 `features/F-xxx.md` + 按需 `contracts/*`；`architecture`/`todo` **仅主 Agent** |
| **构思齐批（①）** | **仅主 Agent** | 主 Agent 写 `atlas/dev/T-xxx-*-{FE\|BE}.md`（**禁止** Subagent 创建/改①）；锁表一般不登记 atlas/dev |
| 写码执行批（②） | Subagent 只改**业务源码** | 按该 T「五」涉及路径登记 `active-edits`；**禁止**两 subagent 同路径；**禁止**改 `atlas/**` |
| 合并文件 | 仅主 Agent | `architecture.md`、`README.md`、`todo.md`、`active-edits.md` |

> **① 归属**：与 [parallel-orchestration](../phases/parallel-orchestration.md) 一致——Subagent **不得**写 `atlas/dev/T-xxx*.md`。旧写法 `dev/F-xxx-*-FE.md` **作废**，一律 `T-xxx`。

### 冲突处理

```
subagent 发现目标文件已被占用
  → 停止写入
  → 回报主 Agent：{路径} 被 {占用者} 占用
  → 主 Agent：换任务 / 等释放 / 重新拆批次
```

## 正误示例

**✅**：BE subagent 写 `OrderService.ts` 前登记 → 写完释放

**✅**：方案齐批 三域 subagent 各写 `F-001.md`、`F-002.md`、`F-003.md`，无重叠

**❌**：两个 subagent 同时改 `contracts/API-001-xxx.md`

**❌**：subagent 自行更新 `active-edits.md` 或 `todo.md`

**❌**：批次结束未释放，表中残留大量「进行中」
