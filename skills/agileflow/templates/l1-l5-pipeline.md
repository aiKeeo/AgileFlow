# 测试流水线（静态检查 → 构建 → AC单测 → 集成 → 冒烟）

> 阶段分工与 DoD 见 [ac-guide.md](ac-guide.md)；本文件定义各层含义与**阶段 5 测试入场门禁**。  
> **分层命令**：[00-intent `test:` 分层](../phases/00-intent-routing.md#test-分层可指定层--单端) · [05-testing](../phases/05-testing.md#test-分层入口)  
> **消歧**：本文件是 **测试层**。init 阅读分层叫 **盘点·业务/…/代码**（见 [init-doc](init-doc.md)），**禁止**混称 L1/L3。

## CLI 短名 ↔ 中文全称

| CLI（用户可敲） | 中文全称 | 做什么 |
|-----------------|----------|--------|
| `test:` / `tests:` | 全量阶段 5 | 测试入场 → AC验收归档 → 全量回归 |
| `test:5-0` | **测试入场门禁** | 编译构建 → 启动探针 → 功能冒烟 |
| `test:5a` | **AC 验收归档** | 同会话复用 ③ 证据（默认不复跑）或复跑 test/ac → 出 REQ 验收报告 |
| `test:5b` | **全量回归归档** | 静态检查→构建→AC单测→集成→冒烟 |
| `test:l1` / `test:lint` | **静态检查** | lint/type |
| `test:l2` / `test:build` | **构建** | build |
| `test:unit` / `test:l3` | **AC 单测** | 单测 / AC 自动化 |
| `test:smoke` | **功能冒烟**（两端） | smoke-be +（有 FE）smoke-fe |
| `test:smoke-be` | **功能冒烟·BE** | health + 主路径 API |
| `test:smoke-fe` | **功能冒烟·FE** | Playwright |

开发勾①：`--gate dev-step1-literal --dev-file atlas/dev/T-xxx-*.md`。

## 流水线顺序

```
【进入 tests: / test:（无后缀）】
  测试入场门禁：同会话→跨 T 集成冒烟（硬默认）；跨会话→编译+启动+冒烟
       ↓ 全过
  AC 验收归档：同会话复用 ③ 摘要（默认不复跑）/ 否则复跑 test/ac → AC 状态 → 验收报告
       ↓ 全部 REQ 报告齐
  全量回归归档：0a→0b→0c（若未清）→ 静态检查→构建→AC单测→集成→冒烟 → README PASS
```

步骤 0 详见 [human-todo.md](human-todo.md)。  
测试入场门禁细则见 [05-testing.md](../phases/05-testing.md#测试入场门禁与阶段-4③-合并验证)。

---

## `test:` 分层命令

| 命令 | 对应层 | 说明 |
|------|--------|------|
| `test:` / `tests:` | 全流水线 | 上图完整路径 |
| `test:unit` / `test:l3` | AC 单测 | 单测 / AC 自动化；可单独跑 |
| `test:l1` / `test:lint` | 静态检查 | 仅 lint/type |
| `test:l2` / `test:build` | 构建 | 仅 build |
| `test:smoke` | 功能冒烟 | **两端**：`smoke-be` +（有 FE）`smoke-fe` |
| `test:smoke-be` | 功能冒烟·BE | health + 主路径 API |
| `test:smoke-fe` | 功能冒烟·FE | Playwright 通用 FE 冒烟 |
| `test:pixel-fe` | 像素对比·FE | 有原型图时：截图 vs 原型（[fe-pixel-compare](fe-pixel-compare.md)） |
| `test:5-0` | 测试入场门禁 | 编译构建→启动探针→功能冒烟（+有原型则像素） |
| `test:5a` / `test:5b` | AC验收归档 / 全量回归 | 须已过 `test:5-0` |

**正误**：

- ✅ `test:smoke-be` 只验后端通  
- ✅ `test:smoke` 有啥跑啥  
- ✅ `test:pixel-fe` 有原型时验视觉一致  
- ✅ `test:unit` 只跑单测  
- ❌ 用 `test:unit` 绿声称「可给用户看」  
- ❌ 无 FE 仍强制 `test:smoke-fe`  
- ❌ 有原型却不跑像素对比就声称「按设计稿实现」

---

## 测试入场门禁

> **权威场景表** → [05-testing 合并验证](../phases/05-testing.md#测试入场门禁与阶段-4③-合并验证)。  
> **硬默认**：同会话复用阶段 4③ 证据（入场只做跨 T 集成冒烟；AC 归档默认不复跑）。跨会话 / 证据缺失 / 用户点名全量：全量重验。下文为**全量重验**时的步骤清单。

进入 **AC 验收归档之前**必须通过入场门禁（快速/严谨均强制）：

| 场景 | 做什么 |
|------|--------|
| **同会话增量（硬默认）** | 跨 T 集成冒烟 + 增量 build 无错 + 已验证端探针仍 UP（**不**重跑已过的单 T 编译/启动/单 T 冒烟） |
| **跨会话 / 证据缺失（全量）** | 下表三步（存在端） |
| **AC 归档·同会话有 ③ 证据** | **默认不复跑** test/ac，引用摘要出报告（`证据来源：阶段4③复用`） |
| **AC 归档·须复跑** | 跨会话 / 证据缺失 / 用户点名全量 |

| 步骤（全量） | 做什么 | 通过 | 不过 → |
|------|--------|------|--------|
| **编译构建** | **architecture 中存在的端** 编译/构建 | 静态检查无 error + 构建成功 | 修编译，禁止 AC 归档 |
| **启动探针** | **仅存在的可启动端** | BE health UP；FE 可启 | 修启动，禁止 AC 归档 |
| **功能冒烟** | 冒烟清单 happy path | 不 500、主路径可完成 | 回阶段 4 |
| **像素对比**（有强制原型） | [fe-pixel-compare](fe-pixel-compare.md) | `report.json` PASS | 修 UI |

**有 FE**：冒烟见 [fe-smoke-playwright](fe-smoke-playwright.md)。用户前缀已是 `test:smoke*` → 直接跑。  
**端范围**：以 `architecture.md` 为准；**禁止**对不存在的端要求编译。

### 功能冒烟 vs AC 单测

| | 功能冒烟 | AC 单测 / AC 验收归档 |
|--|---------|----------------|
| 目的 | 证明「通、不炸」 | 证明「对」（Given/When/Then） |
| 深度 | happy path，可手工点 | 1 AC ↔ 1 自动化测试 |
| 失败 | 禁止进 AC 验收归档 | 回阶段 4 补 ③ |
| 点名 | `test:smoke` / `smoke-be` / `smoke-fe` | `test:unit` / `test:5a` |

冒烟清单来源：`architecture.md` 测试依赖 + 各 F-xxx 主路径；无清单时按 MVP 主流程自列并写入 `atlas/tests/README.md`「冒烟清单」节。

---

## 测试层定义

| 层 | 通过标准 | 快速 | 严谨 |
|----|----------|------|------|
| **静态检查** | lint/type 无 error | ✅ | ✅ |
| **构建** | build 成功 | ✅ | ✅ |
| **AC 单测** | 全部 AC 对应单元/验收测试通过 | ✅ | ✅ |
| **集成/E2E** | 覆盖率报告 | **出报告即可**（不卡阈值） | 变更模块 **≥80%** |
| **冒烟** | 冒烟/E2E（architecture.md 测试依赖 + humanTodo 资源） | 未齐不得标 pass | 核心不得无故 skip |

**说明**：阶段 4 **每 T** 可运行闸门拦「交不能跑的码」；阶段 5 入场按上表做增量或全量，**不是**无脑全量重跑每一 T。**禁止**用「等测试入场」豁免阶段 4 可运行闸门。

## 豁免（微型改动 / Hotfix）

改代码后跑 **静态检查 + 相关 AC 测试**；Hotfix 核心路径加冒烟。见 [00-intent-routing ① 豁免判定](../phases/00-intent-routing.md#①-豁免判定最先做)。  
**整阶段进入 tests: / test:** 时**不豁免**测试入场门禁。分层 `test:unit` 等可单独跑，**不**代替全量 PASS。

## 失败重试

AI 亲自跑终端；从失败层重跑，最多 3 轮；仍失败 → 回阶段 4。
