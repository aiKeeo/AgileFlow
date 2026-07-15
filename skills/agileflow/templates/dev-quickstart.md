# dev 速查（阶段 4 唯一执行清单）

> 范例：BE [dev-exemplar-BE.md](../examples/dev-exemplar-BE.md) · FE [dev-exemplar-FE.md](../examples/dev-exemplar-FE.md)  
> exemplar 路径：`{skill_root}/examples/dev-exemplar-{端}.md`，skill_root 可通过 `node <validate-atlas.mjs> --print-skill-root` 获取  
> [FULL] 端须 Read 两个 exemplar；非 BE/FE 项目（CLI/库/桌面/移动端）Read 最接近端（CLI→BE；桌面→FE）  
> exemplar 文件不存在时：标注 `⚠️ exemplar 缺失`，跳过该检查项（不阻塞），但须在 dev 中写出等价的步骤颗粒度参考  
> 细则：[04-development.md](../phases/04-development.md) · 模板：[dev-rationale.md](dev-rationale.md)

---

## 序（不可跳、不可批量①、不可 Subagent 外包、不可交不能跑的码）

```
【默认·主 Agent 串行】
0. 确认 atlas/todo 已是 ### T-xxx + ①②③（扁平 `- [ ] T-001` 须先改写，禁止直接写码）
1. TodoWrite 展开：每个 T **三条**「①构思 / ②写码 / ③AC」
   ※ 未展开 → 禁止 Write 业务源码（见 todo.md「TodoWrite 强制展开」）
2. 取下一条未完成的① → Read exemplar → 写【该】T 完整 `atlas/dev/T-xxx-*.md`
   →【构思闸门】→ 勾 ①（TodoWrite + atlas/todo.md）→【写码闸门】→ ②
   →【可运行闸门 可运行】→ ③
3. 下一条①再重复。禁止先写完多份 dev 再统一写码（无并行许可时）。
   ※ `dev/README.md` 索引 ≠ ①；每个 T 必须独立文件
```

**连续做 / 全部开发 / yes_all** = **先展开 TodoWrite**，再按清单逐条做（每条含可运行闸门）；**≠** 摘要 / 空壳 / 合并多 T / **从不编译启动** / **跳过 TodoWrite** / **扁平 todo**。

| 用户说 | 主 Agent 必须 | 禁止 |
|--------|---------------|------|
| 全部开发 / 直接全开发 | **先**确认三段式 todo → TodoWrite 为每个 T 建① → 串行 ①→②→可运行闸门→③ | 启 Task 批量写码；扁平 `- [ ] T-001`；1 个 Todo 多 T；无①就写码；跳过可运行闸门；只用 README 假构思 |
| 并行 / 多 subagent（显式） | 先读 [parallel-orchestration](../phases/parallel-orchestration.md)；每 T 先有合规①；②后仍过可运行闸门 | 无 dev 就让 Subagent Write；Subagent 跳过 C |
| 给用户看 / MVP 演示 | 存在端编译+启动+MVP 主路径冒烟全过 | 「代码齐了」就直接交给用户 |

**未读到用户原话含「并行/subagent」→ 禁止启用「串行约束」并行例外。**

**标「开发实现 ✅」前**：开发完成格式门槛 全过——合法 T 头（`^#{3,4} T-\d+`）≥1 **且** 每头下有①②③ **且** `dev/T-*.md` 数 = 头数（**README/temp 不算**）**且** TodoWrite①②③ completed **且** 每 T 可运行闸门 有终端证据。  
若开发任务区有 `T-\d+` 但合法 T 头=0（扁平列表）或有头无三段式 → **禁止 ✅**。

---

## 构思闸门（勾 ① 前）

> **权威**：本表为构思闸门唯一完整检查表（含「不过→」列）；04-development 等他处仅链接此处，不再复述，避免双维护漂移。

| 检查项 | 通过标准 | 不过 → |
|--------|----------|--------|
| **读范例** | 已 Read 本端 exemplar（BE→exemplar-BE / FE→exemplar-FE） | 先 Read |
| **串行约束** | **默认串行**：仅 1 个进行中 T；无其他 T「①已勾且②未完成」。**显式并行**（须并行启动卡）：批量构思允许多个 T「①已勾、②未开」（≤3）；写码执行批允许多 T 同时②/③（1 Task=1 T）。**禁止**「全部开发」冒充并行 | 串行：先完成或回滚；伪并行：改串行 |
| **文件存在** | `atlas/dev/T-xxx-*.md` 已落盘 | 先写文件 |
| **段标题** | 全档：摘要/步骤/结果；标准+摘要五 bullet | 补标题 |
| **摘要** | `## 摘要` 含 **本 T**；标准+须 **做/不做/上游/AC** | 补摘要 |
| **步骤可执行** | 每 `####` 含 **涉及改动**；行内有 `` `Class.method` `` 或 `` `PageName` ``；标准≥2 / 完整≥3 / 精简≥1 步（legacy：`AF_TEMPLATE=no` 仍用 用户/系统/改） | 按 exemplar 重写 |
| **链 sol** | BE 链 API-xxx；FE 链 UI-xxx（+UID）；dev **禁**字段映射表 | 补链 |
| **非事后补写** | 非事后补写；无 `顺序：⚠️` | 标 ⚠️；重写 |
| **反假标题** | 纯文本段名无 `##` → 不过；文档过短且无 `####` 步骤 → 不过 | 按 exemplar 重写整份 |
| **字面量校验** | 完整档：`--gate dev-step1-literal --dev-file atlas/dev/T-xxx-*.md` exit 0；须有命中证据 | 补字面量后重跑；**禁止勾①** |

### 段标题（按档位）

> 权威 → [04-development §三档定义](../phases/04-development.md#三档定义) · [dev-rationale](dev-rationale.md)。全档=摘要/步骤/结果；标准+摘要五 bullet。

步骤：`#### N. 动作` + `- **涉及改动**：` `` `Class.method()` `` ` — 边界/后果`。禁旧标题 `## 一、目标` / `## 五、可执行方案`。

---

## 写码闸门（Write 前）

> **权威**：04-development 写码闸门仅链接此处，不再复述。

| 检查项 | 通过标准 | 不过 → |
|--------|----------|--------|
| **① 已勾** | 该 T 构思已勾① | 回 ① |
| **单任务约束** | 仍只做一个 T；Write ⊆ 当前 `## 步骤` | 收窄范围 |
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
| **一个 F-xxx / MVP 切片** 相关 T 全 ✅ 时 | ① 该模块编译 + 模块冒烟（可运行闸门）→ ② `user`：AskQuestion 阶段性确认（可含 FE 冒烟，见 [fe-smoke-playwright](fe-smoke-playwright.md)）→ 停；`ai`：默认继续（演示时才问） |
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
| 目的 | **能编、能启、主路径不炸** | Given/When/Then **对不对** | 进 tests 前**全量**再验一遍 |
| 深度 | 编译+探针/接口+轻量冒烟 | 1 AC ↔ 1 自动化测试 | 编译+启动+功能冒烟（全端） |
| 失败 | **禁止勾③ / 禁止说可给用户看** | 回修代码 | 禁止 AC 验收归档 |

### 证据（勾③前必须有 · A 档 runnable 会扫）

写入 dev `## 结果`（权威；todo 可镜像）：

- 编译构建 / 能启能调 / 主路径冒烟 各一行：命令 + 结果（exit 0 / health UP / 冒烟通过）
- 若跑了 FE Playwright：附 `atlas/logs/fe-smoke-report.json` 的 summary（pass/fail/skip）
- **有强制原型**：勾③前跑 [fe-pixel-compare](fe-pixel-compare.md)；`## 结果` 写 `atlas/tests/fe-pixel/report.json` PASS
- **禁止**只写「测过了」无命令无结果；**禁止**空表「③ 验收后填写」就勾③
- 标「开发实现 ✅」前须 `--gate dev-complete`（含 runnable；有原型含 pixel）exit 0；进阶段 5 前须 `--gate test-entry` exit 0  
  → [validate-atlas-gate](validate-atlas-gate.md)

### ❌ 不过

- 只跑 `test/ac` 单测、从不 `package` / `build`  
- 编译红仍标 T ✅  
- 服务起不来 / 登录 500 / 首页白屏仍说「MVP 好了给用户看」  
- 把可运行闸门 推到「等阶段 5 再说」

---

## 结构速记

```
## 摘要          ← 本T/做/不做/上游/AC（标准+五 bullet）
## 步骤          ← #### + 涉及改动（方法级伪代码；AC 只在摘要）
## 结果          ← ③ 可运行证据
```

FE 字段绑定 → **contracts/UI §字段绑定**；BE 接口 → **API-xxx**；dev 内禁止映射表。

首行：`📍 Agileflow | 模式：{快速/严谨} | 阶段：4 | 步骤：{①|②|③} | 任务：T-xxx`
