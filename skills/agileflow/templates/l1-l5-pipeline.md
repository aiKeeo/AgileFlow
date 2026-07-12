# L1–L5 测试流水线

> 阶段分工与 DoD 见 [ac-guide.md](ac-guide.md)；本文件只定义各层含义与**阶段 5 入场门禁**。  
> **分层命令**：[00-intent `test:` 分层](../phases/00-intent-routing.md#test-分层可指定层--单端) · [05-testing](../phases/05-testing.md#test-分层入口)

## 流水线顺序

```
【进入 tests: / test:（无后缀）】
  5-0 入场：G1 编译 → G2 启动探针 → G3 功能冒烟
       ↓ 全过
  5A 归档：复跑 test/ac → AC 状态 → 验收报告（可与 human 步骤 0 穿插）
       ↓ 全部 REQ 报告齐
  5B 回归：0a→0b→0c（若未清）→ 再跑 L1→L2→L3→L4→L5 → README PASS
```

步骤 0 详见 [human-todo.md](human-todo.md)。  
5-0 细则见 [05-testing.md](../phases/05-testing.md#5-0-入场门禁强制)。

---

## `test:` 分层命令

| 命令 | 映射层 | 说明 |
|------|--------|------|
| `test:` / `tests:` | 全流水线 | 上图完整路径 |
| `test:unit` / `test:l3` | L3 | 单测 / AC 自动化；可单独跑 |
| `test:l1` / `test:lint` | L1 | 仅静态检查 |
| `test:l2` / `test:build` | L2 | 仅构建 |
| `test:smoke` | G3 / L5 轻量 | **两端**：`smoke-be` +（有 FE）`smoke-fe` |
| `test:smoke-be` | G3·BE | health + 主路径 API |
| `test:smoke-fe` | G3·FE | Playwright 通用 FE 冒烟 |
| `test:5-0` | 入场门禁 | G1→G2→G3 |
| `test:5a` / `test:5b` | 5A / 5B | 须已过 5-0 |

**正误**：

- ✅ `test:smoke-be` 只验后端通  
- ✅ `test:smoke` 有啥跑啥  
- ✅ `test:unit` 只跑单测  
- ❌ 用 `test:unit` 绿声称「可给用户看」  
- ❌ 无 FE 仍强制 `test:smoke-fe`

---

## 阶段 5 入场门禁（5-0）

进入 **5A 归档之前**必须过线（快速/严谨均强制）：

| 步 | 做什么 | 过线 | 不过 → |
|----|--------|------|--------|
| **G1** | **architecture 中存在的端** 编译/构建 | 各存在端：L1（lint/type 无 error）+ L2（build 成功） | 修编译，禁止 5A |
| **G2** | **启动探针**（仅存在的可启动端） | BE 若存在：可启动且 health/等价探针 UP；FE/小程序若存在：可启动或开发者工具可开 | 修启动/配置，禁止 5A |
| **G3** | **功能冒烟清单** | 每条主功能 happy path 不报错（不 500、关键页可开、核心写操作可完成） | 回阶段 4 修功能，禁止 5A |

**有 FE（任意浏览器可打开的前端）**：G3 时可 [AskQuestion 跑 Playwright 页面冒烟](fe-smoke-playwright.md)；日志 → `atlas/logs/fe-smoke.*`。Web 正常 `dev`；小程序用 H5。跳过须记录，不豁免 G1/G2。  
用户前缀已是 `test:smoke` / `test:smoke-fe` → 直接跑，可不再问。

**端范围**：以 `architecture.md` 技术栈为准——只有 BE → 只跑 BE 的 G1/G2；只有 FE → 只跑 FE；全栈 → 两端都跑。**禁止**对不存在的端要求编译。

### G3 冒烟 vs L3/5A

| | 冒烟 G3 | AC / L3 / 5A |
|--|---------|----------------|
| 目的 | 证明「通、不炸」 | 证明「对」（Given/When/Then） |
| 深度 | happy path，可手工点 | 1 AC ↔ 1 自动化测试 |
| 失败 | 禁止进 5A | 回阶段 4 补 ③ |
| 点名 | `test:smoke` / `smoke-be` / `smoke-fe` | `test:unit` / `test:5a` |

冒烟清单来源：`architecture.md` 测试依赖 + 各 F-xxx 主路径；无清单时按 MVP 主流程自列并写入 `atlas/tests/README.md`「冒烟清单」节。

---

## L1–L5 定义

| 层 | 通过标准 | 快速 | 严谨 |
|----|----------|------|------|
| L1 | lint/type 无 error | ✅ | ✅ |
| L2 | build 成功 | ✅ | ✅ |
| L3 | 全部 AC 对应单元/验收测试通过 | ✅ | ✅ |
| L4 | 覆盖率报告 | **出报告即可**（不卡阈值） | 变更模块 **≥80%** |
| L5 | 冒烟/E2E（architecture.md 测试依赖 + humanTodo 资源） | 未齐不得标 pass | 核心不得无故 skip |

**说明**：阶段 4 **每 T** 的闸门 C（编译+能启+冒烟）与阶段 5 开头的 **G3** 同族；C 在开发中拦「交不能跑的码」，5-0 在进 tests 前全量再验。**禁止**用「等 5-0」豁免阶段 4 闸门 C。

## 豁免（微型改动 / Hotfix）

改代码后跑 **L1 + 相关 AC 测试**；Hotfix 核心路径加 L5 冒烟。见 [00-intent-routing ① 豁免判定](../phases/00-intent-routing.md#①-豁免判定最先做)。  
**整阶段进入 tests: / test:** 时**不豁免** 5-0。分层 `test:unit` 等可单独跑，**不**代替全量 PASS。

## 失败重试

AI 亲自跑终端；从失败层重跑，最多 3 轮；仍失败 → 回阶段 4。
