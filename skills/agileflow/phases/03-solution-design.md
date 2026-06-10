# 阶段 3：技术方案设计

> §6/§7 模板与自检：[templates/section-003.md](../templates/section-003.md)
> L1–L5：[templates/l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)
> 任务同步：[phases/task-tracking.md](task-tracking.md)

## 执行流程

1. 阅读已确认 REQ 与 `specs/002-data-model.md`
2. 设计架构，建立**领域模型 → API** 映射
3. 定义 RESTful API 契约
4. 拆分模块与文件结构（对齐仓库既有布局）
5. 编写 **§测试环境与外部依赖**（模板见 section-003.md）
6. 编写 **§可观测性方案**（强制；模板见 [section-003.md](../templates/section-003.md)、[observability-logging.md](../templates/observability-logging.md)）
7. 密钥/沙箱写入 `specs/humanTodo.md`
8. 拆解原子任务（含可观测性基建，每项 ≤4h）
9. 按 [task-tracking.md](task-tracking.md) 同步 `specs/todo.md`
10. **自检**（见 section-003.md）：缺 §可观测性 或 event 未覆盖核心 REQ → 禁止进入阶段 4
11. **AskQuestion 阶段闸门** → 停止（见 [askquestion-gate.md](../templates/askquestion-gate.md)）

## 前置条件

- 至少一个 REQ「已确认」
- `002-data-model.md` 已确认

## 003-solution.md 必须章节

1. 技术栈
2. 系统架构图（ASCII）
3. 领域模型 → API 映射
4. 文件结构
5. API 契约（方法、路径、请求/响应、错误码）
6. 测试环境与外部依赖
7. 可观测性方案（**独立章节**）
8. 验证方式（L1–L5 命令）
9. 原子任务列表（含可观测性基建）

## 强制规则

- 每 API 追溯到 REQ + 聚合/实体
- §测试环境、§可观测性不可为空；REQ→event 表不可缺行
- 人类依赖本阶段写入 humanTodo
- **不在此阶段问"是否进入开发"**

## 产出

| 文件 | 说明 |
|------|------|
| `specs/003-solution.md` | 技术方案全文 |
| `specs/todo.md` | 技术方案 ✅ + 开发任务 |
