# 阶段 1：需求澄清

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> 提问卡片模板：[templates/requirement-askquestion.md](../templates/requirement-askquestion.md)
> 文档模板：[templates/req-doc.md](../templates/req-doc.md)

## 执行流程

### 第 1 步：初次提问（信息不足时必须执行）

用户描述模糊时，**禁止直接写需求文档**。AskQuestion（见 requirement-askquestion.md），**调用后立即停止**。

### 第 2 步：生成需求草稿

1. 提炼需求清单（每个独立功能一个 REQ）
2. 生成 `specs/requirements/REQ-XXX-名称.md`（状态：**草稿**）
3. 生成 `specs/requirements/README.md`

### 第 3 步：确认提问（必须执行）

草稿后 **必须再次 AskQuestion**（见 requirement-askquestion.md）。

- 选「确认」→ REQ 改为 **已确认**，更新 todo，**AskQuestion 阶段闸门**（见 [askquestion-gate.md](../templates/askquestion-gate.md)）→ 停止
- 选「补充/调整」→ 修改后可再 AskQuestion

### 第 4 步：阶段收尾

- 更新 `specs/todo.md`：需求澄清完成，列出已确认 REQ
- 人类依赖写入 `specs/humanTodo.md`
- **不在此阶段问"是否进入数据建模"**——由 [askquestion-gate.md](../templates/askquestion-gate.md) 阶段闸门负责

## 核心规则

- 一个需求 → 一个文档：`REQ-XXX-名称.md`
- 版本管理：v1.0 → v1.1
- BDD：Given-When-Then
- 状态：草稿 → 已确认 → 已实现 → 已废弃
- 未「已确认」不能进入阶段 2

## 强制规则

- 信息不足必须先 AskQuestion
- 草稿后必须 AskQuestion 确认，禁止自动标「已确认」
- 编号：`REQ-三位数字-简短名称.md`
- BDD 至少一个正常 + 一个异常流程
- 场景标题：`### 场景N：名称`（供阶段 5 映射）
- 禁止一个文档多个不相关需求

## 产出

| 文件 | 说明 |
|------|------|
| `specs/requirements/REQ-XXX-*.md` | 每需求一份 |
| `specs/requirements/README.md` | 索引 |
| `specs/todo.md` | 进度更新 |
| `specs/humanTodo.md` | 人类依赖 |
