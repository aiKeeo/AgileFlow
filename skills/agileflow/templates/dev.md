# dev 速查（阶段 4 唯一执行清单）

> **闸门 SSOT**：构思 / 写码 / 可运行 / 开发完成格式 — **本文件**；[04-development.md](../phases/04-development.md) 等人读流程，**只链不抄**本文件检查表。  
> 范例：BE [dev-exemplar-BE.md](../examples/dev-exemplar-BE.md) · FE [dev-exemplar-FE.md](../examples/dev-exemplar-FE.md)  
> exemplar 路径：`{skill_root}/examples/dev-exemplar-{端}.md`，skill_root 可通过 `node <validate-atlas.mjs> --print-skill-root` 获取  
> [FULL] 端须 Read 两个 exemplar；非 BE/FE 项目（CLI/库/桌面/移动端）Read 最接近端（CLI→BE；桌面→FE）  
> exemplar 文件不存在时：标注 `⚠️ exemplar 缺失`，跳过该检查项（不阻塞），但须在 dev 中写出等价的步骤颗粒度参考  
> 细则：[04-development.md](../phases/04-development.md) · 模板：[dev.md](dev.md)  
> 角色：[role-dev.md](role/role-dev.md) · 总控派活：[orchestrator.md](orchestrator.md)

---

## 序（不可跳、不可批量①、不可 Subagent 外包、不可交不能跑的码）

```
【默认·总控串行 · 每 T 一次派活】
0. todo 已是 ### T-xxx + ①②③（扁平须先改写）
1. TodoWrite 展开每 T 三条
2. 取 T → 派 role-dev（**一次** · 内须 ①→②→③）→ 回报
   → 总控：literal 绿→勾① → `--gate write-code` 绿→勾② → 证据/`--only todo` 绿→勾③
3. 下一 T；全部 T 齐 → `dev-complete`。无并行许可时默认逐 T 串行。
权威流程 → orchestrator.md · 角色正文 → role/role-dev.md
```

**连续做 / 全部开发 / yes_all** = **先展开 TodoWrite**，再按清单逐条做（每条含可运行闸门）；**≠** 摘要 / 空壳 / 合并多 T / **从不编译启动** / **跳过 TodoWrite** / **扁平 todo** / **薄写构思**。`ai` 连做同样遵守：无①禁写码、禁合并 T、禁跳过闸门；**sol/dev 质量线唯一**（铁律 → [contract §1](../templates/contract.md#1-env)）。

| 用户说 / 决策 | 总控必须 | 禁止 |
|---------------|---------------|------|
| 全部开发 / 直接全开发 | 展开 todo → 扫描 FE+BE / 无依赖 T → `ai` 自动并行或串行 | 有可并发却强行串行；跳步；薄写 |
| 并行 / FE+BE / 无依赖 T | `ai`：**扫描即开**；`user`：并行卡 | 有 depends_on 仍硬并行 |
| 给用户看 / MVP 演示 | 存在端编译+启动+MVP 主路径冒烟全过 | 「代码齐了」就直接交给用户 |

**未开并行启动卡 → 禁止启用「串行约束」并行例外。** 要加速 → 推并发，不是薄①。对照 → [contract §4](../templates/contract.md#4-停点总表)。

**标「开发实现 ✅」前**：须过 [开发完成格式门槛](#开发完成格式门槛) 全项。

### 开发完成格式门槛

> **权威**：本段为开发完成格式门槛唯一完整定义；04-development / 05-testing 等他处仅链接此处。

标「开发实现 ✅」前须**同时**满足：

1. 合法 T 头（`^#{3,4} T-\d+`）≥ 1
2. 每个 T 头下有 ①②③ 三行
3. `dev/T-*.md` 数 = 合法 T 头数（**README/temp 不算**）
4. TodoWrite ①②③ 均为 completed
5. 每 T 可运行闸门有终端证据

若开发任务区有 `T-\d+` 但合法 T 头 = 0（扁平列表）或有头无三段式 → **禁止 ✅**。

---

## 构思闸门（勾 ① 前）

> **权威**：本表为构思闸门唯一完整检查表（含「不过→」列）；04-development 等他处仅链接此处，不再复述，避免双维护漂移。

| 检查项 | 通过标准 | 不过 → |
|--------|----------|--------|
| **读范例** | 已 Read 本端 exemplar（BE→exemplar-BE / FE→exemplar-FE） | 先 Read |
| **串行约束** | **串行**：仅 1 个进行中 T。**并行批**（≤3）：每 T 独立一次派活 · 内 ①→②→③；判定 → [parallel §谁可以并行](../phases/04-development.md#并行阶段-4#谁可以并行总控扫描--须同时满足) | 伪并行 / 「全部开发」当并行许可 |
| **文件存在** | `atlas/dev/T-xxx-*.md` 已落盘 | 先写文件 |
| **段标题** | 全端：`## 摘要` / `## 主流程` / `## 边界` / `## 实现说明` / `## 结果`；**禁** `## 步骤` / `## 范围` / `## 做法` | 按 exemplar 重写 |
| **摘要** | `## 摘要` 含 **本 T** / **做** / **不做** / **上游** / **AC** | 补摘要 |
| **步骤可执行** | **主流程** 3～8 步 + **边界** ≥2（挂第 N 步）+ **实现说明**（目的+做什么+怎么做；逻辑块编号 ≥2） | 按 [dev-granularity](dev-granularity.md) 重写 |
| **链 sol** | BE 链 API-xxx；FE 链 UI-xxx（+UID）；dev **禁**字段映射表 | 补链 |
| **先写再码** | ①前摘要+主流程+边界+实现说明写满；**仅「## 结果」可写码后填证据**；禁「写码后填」当构思 | 重写构思；脚本 `DEV-STUB-*` / `DEV-RESULT-PLACEHOLDER` |
| **非事后补写** | 无 `顺序：⚠️` / 先码后补 | 标 ⚠️；重写 |
| **反假标题** | 纯文本段名无 `##` → 不过；文档过短且无主流程/步骤 → 不过 | 按 exemplar 重写整份 |
| **字面量校验** | `--gate dev-step1-literal --dev-file atlas/dev/T-xxx-*.md` exit 0；勾①后 `TODO-CHECK-①格式` 再验 | 补后重跑；**禁止勾① / 写码** |

### 段标题

> 段标题与步骤形态 → [dev-granularity](dev-granularity.md) · exemplar。摘要五 bullet + 主流程 + 边界 + 实现说明 + 结果。

步骤：**全端统一 · 唯一完整质量线** → 主流程（3～8）+ 边界（≥2）+ 实现说明（逻辑块怎么做编号 ≥2）。BE 主流程写请求链；FE 写用户动作链。颗粒度（每段解释 + few-shot）→ [dev-granularity](dev-granularity.md) · 例子 → [dev-reuse-examples](../examples/dev-reuse-examples.md) · exemplar-BE/FE。

---

## 写码闸门（Write 前）

> **权威**：04-development 写码闸门仅链接此处，不再复述。

| 检查项 | 通过标准 | 不过 → |
|--------|----------|--------|
| **① 已勾** | 该 T 构思已勾① | 回 ① |
| **单任务约束** | 仍只做一个 T；Write ⊆ 当前 `## 实现说明` 中【新写/改动】落点 | 收窄范围 |
| **读过写法锚点** | 已 Read **本端**写法锚点 | 先 Read |
| **链 sol** | BE 已链 API；FE 已链 UI-xxx（调 API 时） | 补链 |

---

## 可运行闸门（每 T / 每模块强制）

> **写完码 ≠ 能用。** 勾 ③、父任务 ✅、或说「可以给用户看」之前，Agent **必须亲自跑终端**通过。  
> 命令以 `architecture.md` 为准；无约定用下表默认。  
> **architecture.md 无启动命令时**：从构建文件推断（package.json→npm/yarn；pom.xml→mvn；go.mod→go；Cargo.toml→cargo；requirements.txt→python）；推断不出→AskQuestion 用户提供命令；**禁止因不知道命令而跳过可运行闸门**。  
> **纯前端/纯后端项目**：可运行闸门只验存在的端；dev 文件标注 `端：FE` 或 `端：BE`；无 BE 跳过 BE 编译/启动/冒烟，反之亦然。

### 何时跑

| 时机 | 范围 |
|------|------|
| **每个 T** 在 ② 写完、勾 ③ 前 | 本 T 涉及的端 + 本 T 主路径 |
| **一个 F-xxx / MVP 切片** 相关 T 全 ✅ 时 | ① 该模块编译 + 模块冒烟（可运行闸门）→ ② `user`：AskQuestion 阶段性确认 → 停；`ai`：默认继续（演示时才问）。**进 `test-entry` 前**有 FE 须齐 [Playwright+截图+目视](../tools/fe-smoke-playwright.md) |
| **给用户看 / MVP 演示 / 交付体验** | 存在端全量：编译 + 启动探针 + MVP 主路径冒烟 → **可询问** FE Playwright → 再问用户或给出启动步骤 |

### 通过标准（须同时满足适用项）

| 检查项 | 标准 | BE | FE/小程序 |
|--------|------|----|-----------|
| **编译构建** | lint/type 无 error + build 成功 | `mvn -q -DskipTests package`（或约定） | `build` / `build:weapp` 成功 |
| **能启能调** | 见下方「能启能调分档」（**不削弱**原可运行要求） | 见下 | 见下 |
| **主路径冒烟** | 本 T（或本模块）主路径不炸 | 该 T 的核心写/读接口：200/业务成功，不 500 | 该页能打开、核心按钮能走完（可人工点，须记录结果） |

#### 能启能调分档

> 防止「单测绿但起不来」· 不改流程

| 场景 | 能启能调最低标准 |
|------|-------------|
| **该端（BE 或 FE）本阶段第 1 个 T 勾③前** | **必须真实启动**：BE 进程+health/探针 UP；FE `dev` 能起或开发者工具可开 |
| **同端后续单 T** | BE：health UP **或** 本 T API 用 curl/MockMvc/集成测打通 happy path（非 500）；FE：能启或关键页不白屏 |
| **同端后续判定** | 检查 atlas/todo 中该端是否有③已勾 **且** 对应 dev `## 结果` 含真实启动证据；无→视为该端第 1 个 T |
| **F-xxx / MVP 切片确认前** | **必须真实启动**（同第 1 个 T） |
| **给用户看 / MVP 演示** | **必须真实启动**；**禁止**仅用 MockMvc 代替 |

> 同端第 1 个 T 强制真启，避免「一路 MockMvc 绿、切片才发现起不来」。中间 T 可用 MockMvc 保节奏；切片/演示仍须真启。


**与 ③ / 测试入场门禁的关系**：

| | 可运行闸门 | 步骤 ③（AC） | 阶段 5 测试入场门禁 |
|--|--------|--------------|----------------|
| 目的 | **能编、能启、主路径不炸** | Given/When/Then **对不对** | 进 tests 前**按证据可解析性**：可解析→增量；不可解析→全量重验（见 [05 §合并验证](../phases/05-testing.md#测试入场门禁与阶段-4③-合并验证)） |
| 深度 | 编译+探针/接口+轻量冒烟 | 1 AC ↔ 1 UT（主）+ 薄 ac | 编译+启动+功能冒烟（全端） |
| 失败 | **禁止勾③ / 禁止说可给用户看** | 回修代码 | 禁止 AC 验收归档 |

### 证据（勾③前必须有 · runnable 闸门会扫）

写入 dev `## 结果`（权威；todo 可镜像）：

- 编译构建 / 能启能调 / 主路径冒烟 各一行：命令 + 结果（exit 0 / health UP / 冒烟通过）
- **有 FE**：进 `test-entry` 前须齐 [Playwright 三件套](../tools/fe-smoke-playwright.md)（report + shots + visual-review）；`## 结果` 可附 report summary
- **有强制原型**：勾③前跑 [fe-pixel-compare](../tools/fe-pixel-compare.md)；`## 结果` 写 `atlas/tests/fe-pixel/report.json` PASS
- **禁止**只写「测过了」无命令无结果；**禁止**空表「③ 验收后填写」就勾③
- 标「开发实现 ✅」前须 `--gate dev-complete`（含 runnable、**REQ AC 回填**；有原型含 pixel）exit 0；进阶段 5 前须 `--gate test-entry` exit 0（有 FE 含 `FE-SMOKE-*`）  
  → [validate-atlas-gate](validate-atlas-gate.md)

### ❌ 不过

- 只跑 `test/ac` 单测、从不 `package` / `build`  
- 编译红仍标 T ✅  
- 服务起不来 / 登录 500 / 首页白屏仍说「MVP 好了给用户看」  
- 把可运行闸门 推到「等阶段 5 再说」

---

## 结构速记

```
FE/MP：
## 摘要 → ## 主流程(≥3) → ## 边界 → ## 实现说明 → ## 结果
BE：
## 摘要 → ## 主流程+边界+实现说明 → ## 结果
```

颗粒度 → [dev-granularity](dev-granularity.md) · FE 范例 → [dev-exemplar-FE](../examples/dev-exemplar-FE.md)

FE 字段绑定 → **contracts/UI §字段绑定**；BE 接口 → **API-xxx**；dev 内禁止映射表。

首行：`📍 Agileflow | 决策：{AI全权/我来} | 阶段：4 | 步骤：{①|②|③} | 任务：T-xxx`
