# 阶段 5：测试验收

> **AC / 验收全流程**：本文（阶段 5 权威）· 合并验证 → [测试入场门禁](#测试入场门禁与阶段-4③-合并验证) · ③ 证据定义 → [③ 证据可解析](#③-证据可解析硬定义)  
> humanTodo：[human-todo.md](../templates/human-todo.md) · 报告模板：[test-report.md](../templates/test-report.md)  
> **分层入口**：`test:` / `test:smoke` / `test:smoke-be` … → [00-intent `test:` 分层](00-intent-routing.md#test-分层可指定层--单端)  
> **Template ON**（`AF_TEMPLATE=yes`）时先读 `atlas/template/tests/` 下对应 `template-*.md`（无则回退 skill templates/）

## 本阶段做什么

阶段 4 **步骤 ③** 已由 Dev Worker 在 `test/ac/` 按 REQ AC 写完验收测试并跑绿；本阶段**不重写测试**（缺测见下方 [缺测回阶段 4③](#缺测回阶段-4③)）。**总控**直接负责：

1. **测试入场门禁**（与阶段 4③ 合并验证）：**③ 证据可解析** → 增量；**不可解析** → 全量重验。见下方 [合并验证](#测试入场门禁与阶段-4③-合并验证)
2. **AC 验收归档**（逐 REQ）：③ 证据可解析 → **默认不复跑**，引用 `## 结果`/checkpoint 摘要更新 AC 状态并出报告；**REQ 表「AC 测试方法/状态」须已在阶段 4③ 回填**（`test-entry` 硬拦「③ 后填」）；不可解析 / 用户点名全量 → 复跑 `test/ac/` 后再归档 → REQ 已实现
3. **全量回归归档**（全部完成后）：全量静态检查→构建→单元/AC验收测试→集成→冒烟 → 更新 `atlas/tests/README.md` → PASS / BLOCKED-HUMAN / FAIL

门禁细则 → [测试入场门禁](#测试入场门禁与阶段-4③-合并验证) · AC 归档 → [AC 验收归档与 ③ 证据复用](#ac-验收归档与-③-证据复用硬默认)。

## `test:` 分层入口

> 用户可**全量**或**点名一层/单端**。分层 ≠ 跳过全量验收义务；只是本次只跑指定层。

| 前缀 | 执行范围 | 读什么 |
|------|----------|--------|
| `tests:` / `test:` | 全量：测试入场→AC归档→全量回归 | 本文全文 |
| `test:unit` / `test:l3` | AC 单测 | architecture 测试命令 + `test/ac` |
| `test:l1` / `test:l2` | 静态检查或构建 | architecture |
| `test:smoke` | 存在端功能冒烟（be+fe） | 下文功能冒烟 + [fe-smoke](../templates/../tools/fe-smoke-playwright.md) |
| `test:smoke-be` | 仅 BE 功能冒烟 | 下文「BE 冒烟」 |
| `test:smoke-fe` | 仅 FE Playwright 冒烟 | [fe-smoke-playwright](../templates/../tools/fe-smoke-playwright.md) |
| `test:pixel-fe` | FE 像素对比（有原型） | [fe-pixel-compare](../templates/../tools/fe-pixel-compare.md) |
| `test:5-0` / `test:5a` / `test:5b` | 仅对应子阶段（CLI 短名） | 本文对应节 |

分层跑完 → 证据写入 `atlas/logs/` 或 tests README → **`user`**：总控 AskQuestion（继续全量 / 修 / 停）；**`ai`**：闸门绿则同会话连做全量/收口，不问。

### BE 冒烟（`test:smoke-be`）

| 步 | 做什么 | 通过 |
|----|--------|------|
| 1 | 按 architecture 启动 BE（若未启） | 进程起来 |
| 2 | health / 等价探针 | UP |
| 3 | 冒烟清单主路径 API（核心写/读） | 不 500；业务成功码按契约 |

证据：终端摘要或 `atlas/logs/be-smoke.log`。无 BE → 跳过并注明。

### FE 冒烟（`test:smoke-fe`）

**有 FE 时强制**（Web / 小程序-H5）：见 [fe-smoke-playwright](../tools/fe-smoke-playwright.md)。

须齐三件套后才算本层过：

1. `atlas/logs/fe-smoke-report.json`（`ok === true`）
2. `atlas/logs/fe-smoke-shots/*.png`（每非 skip 页）
3. `atlas/logs/fe-smoke-visual-review.md`（总控 Read 截图；`screenshotsReviewed: true` + 每页 PASS）

小程序必须起 **H5**；不能起 H5 → humanTodo「补 H5」→ **禁止**标测试 PASS。  
**禁止** AskQuestion「跳过 Playwright」仍过关。

### FE 像素对比（`test:pixel-fe`）

权威流程（目录、强制清单、没过怎么办、命令）→ **[fe-pixel-compare](../tools/fe-pixel-compare.md)**。  
落库：`atlas/tests/fe-pixel/`。有强制原型时勾③ / 入场须 `report.json` PASS。与 Playwright 冒烟**并行不互替**。

### `test:smoke`（两端）

存在 BE → 跑 `smoke-be`；存在 FE → **必须**跑 `smoke-fe`（含截图 + AI 目视）。两端都过才算本命令 PASS。

## 前置

- 阶段 4 全部开发任务 ✅（[开发完成格式门槛](../templates/dev.md#开发完成格式门槛) 全过）
- **全量 `tests:` / `test:`**：测试入场门禁已过（见下）后才允许 AC 验收归档
- **分层**（如仅 `test:smoke-be`）：不要求阶段 4 全 ✅，但须有可跑端；**不能**用分层结果把未完成的开发标 ✅
- AC 验收归档：该 REQ 的 AC 验收测试已在阶段 4 **步骤 ③** 通过
- 全量回归归档：全部 REQ 验收报告已出

## 测试入场门禁（与阶段 4③ 合并验证）

> **本闸门 = 阶段 4 可运行闸门的延续。** 默认**增量**（③ 证据可解析时）；**不可解析**时全量重验。判据见 [③ 证据可解析](#③-证据可解析硬定义)。

### ③ 证据可解析（硬定义）

总控须 **Read** 相关 `atlas/dev/T-*.md` 的 `## 结果`，并确认含可 grep 的：

1. **编译/build** 关键词 + **结果**（exit 0 / ✅ / PASS / BUILD SUCCESS 等）
2. **启动/冒烟/health/curl** 等之一 + 结果
3. （AC 归档额外）AC 单测 exit0/✅/PASS 摘要

**可解析** = 以上在文件中真实存在且语义明确；**不可解析** = 文件不存在 / 无法 Read / 只有占位符 / 缺结果关键词。

| 场景 | 入场门禁动作 |
|------|-------------|
| **可解析**：各相关 T ③ 已勾 **且** `## 结果` 满足上表 **且** todo checkpoint 可对应到这些 T | **增量模式（硬默认）**：只验本次变更模块的**跨 T 集成冒烟**；**不**重跑已验证的单 T 编译/启动/单 T 冒烟 |
| **不可解析**：证据缺失 / 占位 / 无法 Read / checkpoint 对不上 | **全量重验**：编译 → 启动 → 冒烟 |
| 用户点名 `tests:` / `test:` 全量且明确要求重验 | **全量重验**（覆盖硬默认） |

**增量模式通过标准**：
- 变更涉及的模块间接口联动 happy path 走通（不 500）
- 无新增编译错误（增量 build）
- 已验证端的启动探针仍 UP
- **有 FE**：`fe-smoke-report.json` + 截图 + `fe-smoke-visual-review.md` 仍齐且 PASS（[fe-smoke-playwright](../tools/fe-smoke-playwright.md)）

### 有 FE 时 Playwright 硬门槛（与 SMOKE-L* 叠加）

`test-entry` 在通用 logs 证据之外，若检测到 `frontend/` / `miniprogram/` / `web/` 等目录：

| 缺什么 | 规则码 |
|--------|--------|
| 无 `fe-smoke-report.json` | `FE-SMOKE-NO-REPORT` |
| `ok !== true` | `FE-SMOKE-REPORT-FAIL` |
| 截图缺失 | `FE-SMOKE-NO-SHOT` / `FE-SMOKE-SHOT-MISSING` |
| 无目视或未全 PASS | `FE-SMOKE-NO-REVIEW` / `FE-SMOKE-REVIEW-FAIL` |

**禁止**：仅用 unit/be-smoke 关键词冒充 FE 已验；禁止「跳过 Playwright」豁免。
### AC 验收归档与 ③ 证据复用（硬默认）

| 场景 | AC 归档动作 |
|------|-------------|
| **可解析** + 该 REQ 相关 T 的③已勾 + `## 结果`/`checkpoint` 含 AC 单测 exit0/✅/PASS 摘要 | **默认不复跑** `test/ac/`：直接引用摘要更新 AC 状态列 → 出 `atlas/tests/REQ-XXX-验收报告.md`（报告须写 `证据来源：阶段4③复用`） |
| 不可解析 / 用户点名全量重验 | **复跑** `test/ac/` → 再更新状态与报告 |

**禁止**：
- 无 ③ 证据时跳过入场/复跑直接出报告
- 冒烟失败仍标 AC 验收归档 ✅
- 用 `test/unit` 绿代替集成冒烟
- 证据可解析却无故全量重跑单 T（浪费；除非用户点名）

### 缺测回阶段 4③

AC 验收归档前发现某 REQ 的 AC **无对应 test/ac 或未在 ③ 跑绿**：

1. 查 `atlas/solution/README.md` **AC → 主 T** 映射 → 定位主责 `T-xxx`
2. Read 该 T 的 `atlas/dev/T-xxx-*.md` → `## 结果` 是否含该 AC 的 exit0/✅/PASS
3. **无 dev 文件 / 无映射 / 无 AC 证据** → 回该 T **步骤 ③** 补写 `test/ac/` 并跑绿，再回阶段 5
4. **有 dev 但映射不完整** → 回补 dev `## 结果` 中 AC 对照表，再归档

命令与探针路径以 **`atlas/solution/architecture.md`** 为准；无约定时用上表默认。

### 环境不可复现时的降级

全量重验启动失败时（临时 DB 已销毁 / 依赖服务不可用 / 环境配置丢失）：

1. **总控** AskQuestion「上次运行环境不可复现（原因：{具体原因}）。选择：(a) 重建环境后重验 (b) 仅验编译+单测 (c) 标注环境依赖待人工处理」
2. 选(b)：总控跑编译+单元/验收测试，跳过启动+冒烟；在 tests/README.md 标注 `⚠️ 冒烟环境待复现·仅验编译+测试`；**同步写入** [debt.md §环境待复现](../templates/debt.md#环境待复现)
3. 选(c)：**总控**暂停阶段 5，todo.md 标注 `环境依赖待处理`，humanTodo 记录环境需求
4. **禁止**因环境不可复现而**无记录**直接标 PASS

**与 tech debt / PASS 的裁定**（打通逻辑链，避免死锁）：

| debt 状态 | 能否标 PASS |
|-----------|-------------|
| `debt.md` 环境待复现 **未清** 且用户**未**确认接受 | **禁止** PASS |
| 环境已恢复 → 补跑冒烟 → debt 标「已偿还」 | **允许** PASS |
| 用户 AskQuestion **明确确认**接受当前验收范围（仅编译+单测） | debt 该行标「用户接受」→ **允许** PASS（报告须注明范围） |

> ⚠️ 冒烟待复现 **算技术债**，但可通过「补跑」或「用户确认接受」清零，**不会**永久卡死 PASS。

## 产出

| 文件 | 说明 |
|------|------|
| `atlas/tests/REQ-XXX-验收报告.md` | 每 REQ 一份（全量 / `test:5a`） |
| `atlas/tests/README.md` | 索引 + 交付汇总（含测试入场门禁证据） |
| `atlas/logs/be-smoke.*` / `fe-smoke.*` / `fe-smoke-shots/` / `fe-smoke-visual-review.md` | 分层冒烟；有 FE 时 Playwright 三件套必齐 |

humanTodo 未清 → **禁止**标 PASS。  
**有 FE 但 Playwright 三件套未齐** → **禁止**标 PASS。  
**技术债未清零** → **禁止**标 PASS（[debt.md](../templates/debt.md) 中待回溯/事后补写/质疑待处理/**环境待复现（未偿还且未用户接受）**须清零或用户确认接受）。

> 环境不可复现降级（仅编译+单测）**默认不豁免** FE Playwright 门槛；不能起 H5/浏览器 → 记 humanTodo，不标 PASS。
## 测试失败回退（5→4）

> AC 语义变了 → [change-management L2](change-management.md)；单 T bug → L0/L1。

**触发**：阶段 5 FAIL / 用户「测试不过先修」/ AC 归档 BLOCKED

1. 首行：`纠偏：测试回退 → 阶段 4`
2. `agileflow.env`：`AF_PHASE=4`
3. todo 流程进度：「开发实现」→ `⚠️ 回退修复中`（原 ✅ 记入变更历史一行）
4. 目标 T：复用原 T 头，②③ 重跑（必要时回 ①）
5. `dev-complete` 绿 → `AF_PHASE=5`
6. 重验：**失败层 + 该 REQ 回归**（沿用上文增量规则，不默认全量）

## init 刷新（AC 验收归档完成后）

该 REQ **AC 验收归档**完成且标 **已实现** 后，若 as-is 已变（表/目录/环境）→ **总控 AskQuestion** [init 增量 refresh](../templates/contract.md#init-增量-refreshreq-开发完毕后)（与阶段 4 该 REQ 任务全 ③ ✅ 时二选一，**同 REQ 不重复弹**）。
