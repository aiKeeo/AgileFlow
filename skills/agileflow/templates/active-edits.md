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

> 占用者：`总控` | `subagent-dev-{Tid}-{端}` | `subagent-sol-{Fid}` | `subagent-req-{REQid}`
> 规则：**改前先登记 → 改完必释放**；他人见占用须跳过并回报总控。

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
2. 目标路径已在表中且 `状态=进行中` → **禁止修改**，向总控报告冲突
3. 未占用 → 追加一行（路径、占用者、关联任务、开始时间、进行中）
4. **仅总控**可改 `atlas/todo.md`；`active-edits.md`：**总控**可清理；**Dev（role-dev 子阶段②）**仅可增删**本 T 占用行**

### 改后（释放）

1. 该文件全部改动完成 → 将对应行 `状态` 改为 `已完成` 或删除该行
2. 总控在每批次合并后统一清理已完成行
3. 流程结束或阶段闸门前 → 表应为空（无「进行中」行）

### 并行切片（每 T 一次派活）

| 场景 | 谁写 | 原则 |
|------|------|------|
| **FE + BE 同批** | 各 1 个 Dev Worker（T-xxx-BE / T-yyy-FE） | 目录分离（`server/` vs `src/`/`miniapp/`）；链同一 API/UI 契约；**active-edits 只锁各自步骤路径** |
| **无依赖 T 同批** | 各 1 个 Dev Worker | `depends_on` 不互卡；步骤路径零交集 |
| 写码（②） | Dev Worker 登记**本 T** 业务路径 | 禁止两 Worker 同路径；dev 文件不同 T 各写各的，一般不锁 |
| 合并文件 | 仅总控 | `architecture.md`、`README.md`、`atlas/todo.md`、`active-edits.md` |

判定算法 → [parallel §谁可以并行](../phases/04-development.md#并行阶段-4#谁可以并行总控扫描--须同时满足)

### 冲突处理

```
Subagent 发现目标文件已被占用
  → 停止写入
  → 回报总控：{路径} 被 {占用者} 占用
  → 总控：换任务 / 等释放 / 重新拆批次
```
