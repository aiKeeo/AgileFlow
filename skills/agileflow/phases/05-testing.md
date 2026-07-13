# 阶段 5：测试验收

> **AC / 验收全流程**：[ac-guide.md](../templates/ac-guide.md)（权威）  
> humanTodo：[human-todo.md](../templates/human-todo.md) · 测试流水线：[l1-l5-pipeline.md](../templates/l1-l5-pipeline.md)  
> 报告模板：[test-report.md](../templates/test-report.md)  
> **分层入口**：`test:` / `test:smoke` / `test:smoke-be` … → [00-intent `test:` 分层](00-intent-routing.md#test-分层可指定层--单端)

## 本阶段做什么

阶段 4 **步骤 ③** 已在 `test/ac/` 按 REQ AC 写完验收测试并跑绿；本阶段**不重写测试**（缺测回阶段 4 从 ③ 补），负责：

1. **测试入场门禁**（强制，先于 AC 验收归档）：**architecture 中存在的端** **编译/构建** → **启动探针** → **功能冒烟清单**  
2. **AC 验收归档**（逐 REQ）：复跑 `test/ac/` → 更新 AC 状态列 → 出 `atlas/tests/REQ-XXX-验收报告.md` → REQ 已实现  
3. **全量回归归档**（全部完成后）：全量静态检查→构建→AC单测→集成→冒烟 → 更新 `atlas/tests/README.md` → PASS / BLOCKED-HUMAN / FAIL

步骤细则见 [ac-guide 阶段 5](../templates/ac-guide.md#阶段-5tests) · 门禁细则见 [测试流水线](../templates/l1-l5-pipeline.md#测试入场门禁)。

## `test:` 分层入口

> 用户可**全量**或**点名一层/单端**。分层 ≠ 跳过全量验收义务；只是本次只跑指定层。

| 前缀 | 执行范围 | 读什么 |
|------|----------|--------|
| `tests:` / `test:` | 全量：测试入场→AC归档→全量回归 | 本文全文 |
| `test:unit` / `test:l3` | AC 单测 | architecture 测试命令 + `test/ac` |
| `test:l1` / `test:l2` | 静态检查或构建 | architecture |
| `test:smoke` | 存在端功能冒烟（be+fe） | 下文功能冒烟 + [fe-smoke](../templates/fe-smoke-playwright.md) |
| `test:smoke-be` | 仅 BE 功能冒烟 | 下文「BE 冒烟」 |
| `test:smoke-fe` | 仅 FE Playwright 冒烟 | [fe-smoke-playwright](../templates/fe-smoke-playwright.md) |
| `test:pixel-fe` | FE 像素对比（有原型） | [fe-pixel-compare](../templates/fe-pixel-compare.md) |
| `test:5-0` / `test:5a` / `test:5b` | 仅对应子阶段（CLI 短名） | 本文对应节 |

分层跑完 → 证据写入 `atlas/logs/` 或 tests README → AskQuestion（继续全量 / 修 / 停）。

### BE 冒烟（`test:smoke-be`）

| 步 | 做什么 | 过线 |
|----|--------|------|
| 1 | 按 architecture 启动 BE（若未启） | 进程起来 |
| 2 | health / 等价探针 | UP |
| 3 | 冒烟清单主路径 API（登录、核心写/读） | 不 500；业务成功码按契约 |

证据：终端摘要或 `atlas/logs/be-smoke.log`。无 BE → 跳过并注明。

### FE 冒烟（`test:smoke-fe`）

见 [fe-smoke-playwright](../templates/fe-smoke-playwright.md)。Web/后台正常 `dev`；小程序仅 H5。

### FE 像素对比（`test:pixel-fe`）

权威流程（目录、强制清单、没过怎么办、命令）→ **[fe-pixel-compare](../templates/fe-pixel-compare.md)**。  
落库：`atlas/tests/fe-pixel/`。有强制原型时勾③ / 入场须 `report.json` PASS。

### `test:smoke`（两端）

存在 BE → 跑 `smoke-be`；存在 FE → 跑 `smoke-fe`（可 AskQuestion 是否 Playwright）。两端都过才算本命令 PASS。

## 前置

- 阶段 4 全部开发任务 ✅（开发完成格式门槛 全过：合法 T 头=`^#{3,4} T-\d+`；每头①②③；`dev/T-*.md` 数=头数；**README/temp 不算**；扁平/有头无三段式=违规须先改写）
- **全量 `tests:` / `test:`**：测试入场门禁已过（见下）后才允许 AC 验收归档
- **分层**（如仅 `test:smoke-be`）：不要求阶段 4 全 ✅，但须有可跑端；**不能**用分层结果把未完成的开发标 ✅
- AC 验收归档：该 REQ 的 AC 验收测试已在阶段 4 **步骤 ③** 通过
- 全量回归归档：全部 REQ 验收报告已出

## 测试入场门禁（强制）

> **顺序不可跳**：编译 → 能跑 → 冒烟 → 再 AC 验收归档。冒烟挂了禁止进 AC 验收归档。

| 步骤 | 名称 | 过线标准 | 对应测试层 |
|------|------|----------|------------|
| **编译构建** | 存在端编译/构建 | `architecture` 中**每个存在的端**：lint/type 无 error + build 成功 | 静态检查 + 构建 |
| **启动探针** | 启动探针 | **仅可启动的存在端**：BE → health UP；FE → 可启动或开发者工具可开 | 构建扩展 |
| **功能冒烟** | 功能冒烟清单 | 每条主路径 happy path 走通：不 500、关键页能开、核心写操作不炸（细断言在 AC 单测） | 冒烟 |
| **像素对比**（有强制原型） | `test:pixel-fe` | [fe-pixel-compare](../templates/fe-pixel-compare.md) · `report.json` PASS | 像素 |

**有 FE 时**：功能冒烟见 [fe-smoke-playwright](../templates/fe-smoke-playwright.md)。  
**有强制原型**（UID「原型图」∪ `tests/fe-pixel/pages.json`）：入场须过像素对比，细则只认 fe-pixel-compare。

**禁止**：

- 跳过编译/启动直接复跑 AC 出报告  
- 冒烟失败仍标 AC 验收归档 ✅  
- 用「阶段 4 测过了」豁免测试入场门禁（阶段 5 开头须**再跑一次全量**）
- 用 `test:unit` 绿代替 `test:smoke` / 可运行闸门

命令与探针路径以 **`atlas/solution/architecture.md`** 为准；无约定时用上表默认。

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/tests/REQ-XXX-验收报告.md` | 每 REQ 一份（全量 / `test:5a`） |
| `atlas/tests/README.md` | 索引 + 交付汇总（含测试入场门禁证据） |
| `atlas/logs/be-smoke.*` / `fe-smoke.*` | 分层冒烟证据 |

humanTodo 未清 → **禁止**标 PASS。

## init 刷新（AC 验收归档完成后）

该 REQ **AC 验收归档**完成且标 **已实现** 后，若 as-is 已变（表/目录/环境）→ **AskQuestion** [init 增量 refresh](../templates/init-askquestion.md#init-增量-refreshreq-开发完毕后)（与阶段 4 该 REQ 任务全 ③ ✅ 时二选一，**同 REQ 不重复弹**）。
