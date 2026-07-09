# 阶段 5：测试验收

> **AC / 验收全流程**：[ac-guide.md](../templates/ac-guide.md)（权威）  
> humanTodo：[human-todo.md](../templates/human-todo.md) · L1–L5：[l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)  
> 报告模板：[test-report.md](../templates/test-report.md)

## 本阶段做什么

阶段 4 **步骤 ③** 已在 `test/ac/` 按 REQ AC 写完验收测试并跑绿；本阶段**不重写测试**（缺测回阶段 4 从 ③ 补），负责：

1. **5-0 入场门禁**（强制，先于 5A）：**architecture 中存在的端** **编译/构建** → **启动探针** → **功能冒烟清单**  
2. **5A 归档**（逐 REQ）：复跑 `test/ac/` → 更新 AC 状态列 → 出 `atlas/tests/REQ-XXX-验收报告.md` → REQ 已实现  
3. **5B 回归**（全部完成后）：全量 L1–L5 → 更新 `atlas/tests/README.md` → PASS / BLOCKED-HUMAN / FAIL

步骤细则见 [ac-guide 阶段 5](../templates/ac-guide.md#阶段-5tests) · 门禁细则见 [l1-l5-pipeline](../templates/l1-l5-pipeline.md#阶段-5-入场门禁50)。

## 前置

- 阶段 4 全部开发任务 ✅（`atlas/dev/T-*.md` 数 = T 头数；T 头 = `^#{2,4} T-\d+`）
- **5-0 入场门禁已过**（见下）后才允许 5A
- 5A：该 REQ 的 AC 验收测试已在阶段 4 **步骤 ③** 通过
- 5B：全部 REQ 验收报告已出

## 5-0 入场门禁（强制）

> **顺序不可跳**：编译 → 能跑 → 冒烟 → 再 5A。冒烟挂了禁止进 5A。

| 步 | 名称 | 过线标准 | 对应层 |
|----|------|----------|--------|
| **G1** | 存在端编译/构建 | `architecture` 中**每个存在的端**：lint/type 无 error + build 成功（BE 例：`mvn -q -DskipTests package`；FE 例：`build`/`build:weapp`） | L1 + L2 |
| **G2** | 启动探针 | **仅可启动的存在端**：BE → health/等价 UP；FE/小程序 → 可启动或开发者工具可开 | L2 扩展 |
| **G3** | 功能冒烟清单 | 按 `architecture.md` / features 列出的**每条主路径 happy path** 走通：不 500、关键页能开、核心写操作不炸（**不做细断言**；细断言在 5A / L3） | L5 轻量 |

**端范围**：无 FE 不要求 FE build；无 BE 不要求 BE health。以 architecture 为准。

**禁止**：

- 跳过 G1/G2 直接复跑 AC 出报告  
- 冒烟失败仍标 5A ✅  
- 用「阶段 4 测过了」豁免 5-0（阶段 5 开头须**再跑一次全量**编译+探针+冒烟）

命令与探针路径以 **`atlas/solution/architecture.md`** 为准；无约定时用上表默认。

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/tests/REQ-XXX-验收报告.md` | 每 REQ 一份 |
| `atlas/tests/README.md` | 索引 + 交付汇总（含 5-0 门禁证据） |

humanTodo 未清 → **禁止**标 PASS。

## init 刷新（5A 完成后）

该 REQ **5A 归档**完成且标 **已实现** 后，若 as-is 已变（表/目录/环境）→ **AskQuestion** [init 增量 refresh](../templates/init-askquestion.md#init-增量-refreshreq-开发完毕后)（与阶段 4 该 REQ 任务全 ③ ✅ 时二选一，**同 REQ 不重复弹**）。
