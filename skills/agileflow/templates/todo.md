# todo.md 模板

> **落盘到 `atlas/todo.md` 的只有下方代码块内容。**  
> 纪律 / TodoWrite / 构思闸门 → [dev-quickstart](dev-quickstart.md) · [04-development](../phases/04-development.md)（**禁止**把 skill 长文灌进项目 todo）。

```markdown
# 项目待办事项

## 项目信息
- 项目名称：
- 创建时间：
- 预计完成时间：

## 流程进度
- [ ] 项目盘点（init，仅 brownfield）
- [ ] 需求澄清
- [ ] 数据建模
- [ ] 方案设计（sol:）
- [ ] 开发实现
- [ ] 测试验收

## 决策委派（须与 agileflow.env 同步）
- 全局：未设置 | AI自主 | 用户决策
- 模式：未设置 | 快速 | 严谨
- 自阶段：—
- 备注：—

## 开发任务

> 每 T = `### T-xxx：[端] 描述 — F-xxx [精简|标准|完整]` + ①②③；① 未勾禁止 ②。小任务默认 `[精简]`（单端·无DB·无权限/支付·<100行·无跨模块）；否则标准/完整。细则见 skill。

### T-001：[BE] {简述}（{估时}）— F-001 [精简]
- [ ] **① 构思落盘** → `atlas/dev/T-001-{简述}-BE.md`
- [ ] **② 按 ## 步骤 写码**（FE 链 UI §字段绑定；BE 链 API）
- [ ] **③ 对照 REQ 验收 AC**

### T-002：[FE] {简述}（{估时}）— F-001 [标准]
- [ ] **① 构思落盘** → `atlas/dev/T-002-{简述}-FE.md`
- [ ] **② 按 ## 步骤 写码**（FE 链 UI §字段绑定；BE 链 API）
- [ ] **③ 对照 REQ 验收 AC**

## 功能依赖

| 功能 ID | 依赖 |
|---------|------|
| F-001 | — |

## 进行中
- **checkpoint**：`T-xxx` · 步骤 `①|②|③` · 更新于 `YYYY-MM-DD`
- 无

## 已完成任务
- 无

## 变更历史
| 时间 | 操作 | 说明 |
|------|------|------|
```

---

## TodoWrite 强制展开

> 锚点供阶段文档链接。细则在 [dev-quickstart 序](dev-quickstart.md#序不可跳不可批量①不可-subagent-外包不可交不能跑的码)：1 T = TodoWrite 三条①②③；未展开禁止 Write 业务源码。

## Agent 规则（不写入 atlas/todo.md）

权威：

| 主题 | 文件 |
|------|------|
| TodoWrite 强制展开 / 跨会话续作 | [上文](#todowrite-强制展开) · [dev-quickstart 序](dev-quickstart.md#序不可跳不可批量①不可-subagent-外包不可交不能跑的码) |
| 构思闸门 / 可运行闸门 | [dev-quickstart](dev-quickstart.md) |
| 三段式 / 禁扁平列表 | [04-development](../phases/04-development.md) · validate-atlas todo 规则 |
| 决策委派 | [stage-delegation](stage-delegation.md) |

要点速记：1 T = TodoWrite 三条①②③；勾①前过构思闸门；勾③前过可运行闸门；checkpoint 为跨会话权威。
