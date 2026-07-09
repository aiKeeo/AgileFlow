# 阶段 5：测试验收

> **AC / 验收全流程**：[ac-guide.md](../templates/ac-guide.md)（权威）  
> humanTodo：[human-todo.md](../templates/human-todo.md) · L1–L5：[l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)  
> 报告模板：[test-report.md](../templates/test-report.md)

## 本阶段做什么

阶段 4 **步骤 ③** 已在 `test/ac/` 按 REQ AC 写完验收测试并跑绿；本阶段**不重写测试**（缺测回阶段 4 从 ③ 补），负责：

1. **5A 归档**（逐 REQ）：复跑 `test/ac/` → 更新 AC 状态列 → 出 `atlas/tests/REQ-XXX-验收报告.md` → REQ 已实现
2. **5B 回归**（全部完成后）：全量 L1–L5 → 更新 `atlas/tests/README.md` → PASS / BLOCKED-HUMAN / FAIL

步骤细则见 [ac-guide 阶段 5](../templates/ac-guide.md#阶段-5tests)。

## 前置

- 阶段 4 全部开发任务 ✅
- 5A：该 REQ 的 AC 验收测试已在阶段 4 **步骤 ③** 通过
- 5B：全部 REQ 验收报告已出

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/tests/REQ-XXX-验收报告.md` | 每 REQ 一份 |
| `atlas/tests/README.md` | 索引 + 交付汇总 |

humanTodo 未清 → **禁止**标 PASS。

## init 刷新（5A 完成后）

该 REQ **5A 归档**完成且标 **已实现** 后，若 as-is 已变（表/目录/环境）→ **AskQuestion** [init 增量 refresh](../templates/init-askquestion.md#init-增量-refreshreq-开发完毕后)（与阶段 4 该 REQ 任务全 ③ ✅ 时二选一，**同 REQ 不重复弹**）。
