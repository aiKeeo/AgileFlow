# 需求变更管理

> AskQuestion 规范：[templates/askquestion-gate.md](../templates/askquestion-gate.md)
> 变更提问卡片：[templates/req-change-askquestion.md](../templates/req-change-askquestion.md)

## 何时触发

| 触发条件 | 动作 |
|----------|------|
| 用户说改需求、变更 REQ、调整场景、需求不对 | 进入本章 |
| 修改「已确认」或「已实现」的 REQ | **必须**走本章，禁止直接改代码 |
| 修改「草稿」REQ | 走阶段 1 正常流程即可 |
| 新增 REQ | 走阶段 1；若影响已有 model/solution，变更后走影响分析 |
| **dev 中发现 model/sol 需小改**（加字段/调参数/小范围UI） | **走轻量反馈回路**（见下），不走 5 步 |

## 轻量反馈回路（dev → model/sol 待回溯）

> **dev 里发现 model/sol 需要小改时，不要走 5 步变更管理。** 先记笔，后批量回溯。详见 [04-development §轻量反馈回路](04-development.md#轻量反馈回路dev--modelsol-待回溯)。

| 走轻量反馈回路 | 走完整 5 步 |
|----------------|-------------|
| 加字段、加参数、调校验规则 | 新增/删除实体或聚合根 |
| 调接口参数（不改语义） | 改实体关系（1:N→N:M） |
| 小范围 UI 调整 | 改业务流程/状态机 |
| 回溯不影响已确认 REQ 的 AC | 回溯使已确认 REQ 的 AC 失效 |

**轻量路径**：dev 记「待回溯」→ todo 标 `🔄待回溯` → **改表/改契约字段须当前 T ③前最小同步** → 该 REQ 所有 T 完成后统一确认卡。

---

**首行声明**：`📍 Agileflow | 模式：{快速/严谨} | 阶段：变更-需求影响分析 | REQ：{编号}`

---

## 执行流程（固定 5 步 + 默认重跑）

```
① 更新 REQ → ② 影响分析 AskQuestion → ③ 按选择改文档 → ④ 是否实现 AskQuestion → ⑤ 重跑开发→测试（默认）
```

> **默认策略**：已确认/已实现 REQ 变更后，**默认重跑**「开发实现 → 测试验收」，直至阶段 5 PASS。不再保留「已实现」状态。

### ① 更新 REQ 文档

1. 定位 `atlas/requirements/REQ-XXX-*.md`
2. 修改 BDD 场景 / 验收标准 / 用户故事
3. 版本号 +0.1（如 v1.0 → v1.1），追加「变更记录」
4. 若原状态为「已实现」→ 改回 **已确认**（待重新开发验收）；若「已确认」→ 标 **变更中**
5. 更新 `atlas/todo.md` 变更历史

### ② 影响分析 AskQuestion（必须）

REQ 改完后 **立即 AskQuestion**（见 [req-change-askquestion 影响分析](../templates/req-change-askquestion.md#影响分析req-改完后第一步)），**调用后停止**。

AI 须先给出**影响摘要**（再弹卡片），例如：

```markdown
## REQ-001 变更影响摘要

**变更内容**：新增「优惠券抵扣」场景

**可能影响**：
- model/domain-rules.md：订单金额计算规则
- model/physical-model.md：orders 表新增 coupon_id
- solution/features/F-003-退款.md：新增 F-003 + §边界
- solution/contracts/API-003-退款.md：按需
- todo.md：T-005 等开发任务
- dev/F-002-*.md：实现思路需更新
```

卡片让用户勾选**实际需要改的层**（可多选）。

### ③ 按用户选择更新文档

按固定顺序执行，只改用户勾选的部分：

| 顺序 | 目录/文件 | 改什么 |
|------|-----------|--------|
| 1 | `atlas/model/` | 领域模型、实体关系、规则、物理模型 |
| 2 | `atlas/solution/` | `features/`（含 §边界）、`contracts/`（按需）、`architecture.md` |
| 3 | `atlas/todo.md` | 增删改开发任务，关联功能/契约 ID |
| 4 | `atlas/dev/` | 更新或新建受影响的功能思路文档 |

规则：
- 每改完一层，该层 README 状态改 **草稿** → 小改确认后可保持 **已确认**（见下）
- model/solution 有实质变更须重新 **AskQuestion 确认**该层（可合并为一次）
- **禁止**未更新 solution 就改代码

### ④ 是否实现 AskQuestion（必须）

文档改完后 **AskQuestion**（见 [req-change-askquestion 是否实现](../templates/req-change-askquestion.md#是否实现文档改完后第二步)），**调用后停止**。

| 用户选择 | 动作 |
|----------|------|
| **是，重跑开发到测试（默认推荐）** | 进入阶段 4 → 完成后**必须**进阶段 5 重新验收 |
| 是，仅开发暂不测 | 进入阶段 4；todo 标「待重验」 |
| 否，仅更新文档 | 流程暂停，todo 记「待开发」 |
| 先验收影响范围 | 列出待改任务清单，不写代码 |

**卡片默认首选项**：「是，重跑开发到测试」——与用户「需求变动一般默认重启流程」一致。

### ⑤ 重跑开发 → 测试（默认路径）

- 选「重跑开发到测试」→ 读 [04-development.md](04-development.md) 按 todo 执行三步序 → **不跳过阶段 5**
- 开发完成后 **自动 AskQuestion 阶段闸门进阶段 5**（变更语境下建议默认选「是，继续」由用户点选）
- 阶段 5 须覆盖**变更涉及的全部 AC**（含新增场景），旧验收报告标「待更新」
- 选「仅文档」→ 更新 todo 变更历史，**不发**阶段 4 闸门

---

## 强制规则

- 已确认/已实现 REQ 变更 → **必须先影响分析 AskQuestion**，禁止猜范围
- 影响分析 → 改文档 → 是否实现，**两步 AskQuestion 不可合并、不可跳过**
- **默认**：变更后重跑阶段 4→5，已实现状态不可保留
- 若变更使原验收报告失效，在 `atlas/tests/` 标注「待更新」

## 产出

| 文件 | 说明 |
|------|------|
| 更新的 REQ | 版本 + 变更记录 |
| 按需更新的 model/、solution/、dev/ | 用户勾选范围 |
| `atlas/todo.md` | 任务增删 + 变更历史 |
| 可选：阶段 4 代码 | 用户确认「要实现」后 |
