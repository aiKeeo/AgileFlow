# Atlas 校验（AI 流程闸门）

> **实现**：`scripts/validate-atlas/`（随 skill 安装）· 规范：`lib/phase-spec.mjs`  
> **诚实边界**：JS 只挡 **A 档**（结构 + 落盘证据）。AskQuestion / TodoWrite / 实际编译 = **C 档**，脚本管不到。  
> **路径**：勿写死 `.cursor/skills/agileflow`。用下方探测或 `AGILEFLOW_SKILL_ROOT`。

## 分档

| 档 | 闸门/规则 | 失败效果 |
|----|-----------|----------|
| **A** | `atlas/agileflow.env`、`dev-step1-literal`、`dev-complete`(+runnable)、`test-entry`(+smoke)、`sol-confirm`(+architecture+REQ已确认+决策/栈来源)、todo 三段式 | exit ≠ 0 → 禁止勾 ✅ / 进阶；报错含修复动作 |
| **B** | 残留 BDD 专节、契约命名等 warn | 可继续 |
| **C** | AskQuestion 工具调用本身、停止、TodoWrite、并行启动卡 | 靠纪律；**但** user 模式未问栈会以 A 档 `AF-STACK-USER` 卡住 |

## 脚本不可用时的降级（必读）

当 `node` 命令不存在、脚本路径探测失败、或脚本运行时抛出异常时（exit ≠ 0 但非校验失败）：

1. Agent 须在回复首行标注：`⚠️ validate-atlas 不可用（原因：{node未安装/路径未找到/运行时错误}）`
2. 降级为 B 档人工校验：Agent 须逐项声明检查结果（段标题/字面量/证据），格式同脚本输出
3. 降级模式下勾①/✅ 须额外标注 `（人工降级·脚本不可用）`
4. **禁止因脚本不可用而跳过校验项本身——只降级校验手段，不降级校验标准**

## 字面量校验完整清单

| 检查项 | 要求 | 不过规则 |
|--------|------|---------|
| 段标题 | 全档：`## 摘要` `## 步骤` `## 结果`；标准+摘要五 bullet | DEV-SEC-* |
| 摘要结构 | 标准+：摘要含 **本T/做/不做/上游/AC** | DEV-SUMMARY-结构 |
| 步骤（legacy） | 每 `####` 下 **用户/系统/改**（格式权威 → [dev-quickstart §构思闸门](dev-quickstart.md#构思闸门勾-①-前)）；改行有代码落点；精简≥1 / 标准≥2 / 完整≥3 | DEV-STEP-3 · DEV-STEP-最少 |
| 步骤（template） | 每 `####` 下 **涉及改动**；行内含 `` `anchor` ``；步数同上 | TMPL-DEV-CHANGE · TMPL-DEV-STEPS |
| 步骤（流程表） | `S1…` 行注意点须含代码落点 `` `Class.method` `` / `` `path/` `` / `` `func()` ``（**禁单单词反引号**如 `` `Service` ``）；标准+完整优先此形态 | DEV-STEP-流程落点 |
| 链 sol | BE 链 API；FE 链 UI（调 API 时）；dev 禁字段映射表 | DEV-LINK-* · DEV-BAN-映射 |
| 代码落点 | OOP→反引号内含 `.`；函数式→`` `func()` ``；路径型→`` `path/` ``；**禁单单词反引号**（如 `` `Service` `` `` `todo` ``） | DEV-LIT-代码落点 |
| 禁形旧标题 | 禁 `## 一、目标` `## 五、可执行方案` | DEV-BAN-* |
| JSON 复贴 | dev 内大段 JSON → error | DEV-COPY-JSON |
| 文档长度 | 去空格后 ≥ {精简 200 / 标准 350 / 完整 500} 字 | DEV-FAKE-过短 |
| 假标题 | 纯文本"范围/步骤"无 `##` | DEV-FAKE-标题 |
| 禁冗余段 | 禁止 dev `## 范围` `## 异常` `## AC`；禁止 F `## 联调卡` | DEV-BAN-* · SOL-F-BAN-* |
| UI 字段绑定 | UI 契约链 API 须 `## 字段绑定` 表 | SOL-UI-BIND |

## 如何找到脚本（可移植）

```bash
# 1) 环境变量（任选）
#    export AGILEFLOW_SKILL_ROOT=/path/to/agileflow   # bash
#    $env:AGILEFLOW_SKILL_ROOT="C:\path\to\agileflow" # PowerShell

# 2) 打印 skill 根（从已定位到的 validate-atlas.mjs 调用）
node <任意已知的 validate-atlas.mjs> --print-skill-root

# 3) 打印本机可复制命令
node <skill>/scripts/validate-atlas.mjs --print-cmd --gate sol-confirm --root .

# 4) 在 skill 目录用 npm
cd <skill> && npm run validate:sol
```

探测顺序：`AGILEFLOW_SKILL_ROOT` → 本脚本所在 skill → 项目 `.cursor/skills/agileflow` → `~/.cursor/skills/agileflow`。

## agileflow.env（流程状态 · AI 维护）

路径：`atlas/agileflow.env`（模板 `templates/agileflow.env`）。**不是密钥**，须进库。

| 键 | 用途 |
|----|------|
| `AF_PHASE` | 当前阶段；须与产物推断一致，否则 `AF-ENV-PHASE` |
| `AF_FLOW` | `fast` / `strict` / `pending`（`pending` → `AF-ENV-BOOT`） |
| `AF_DECIDE` | `ai` / `user` / `pending`（`pending` → `AF-ENV-BOOT`；`user` 决定技术栈要不要先问） |
| `AF_TIER` | `lite` / `standard` / `full` |
| `AF_STACK_SOURCE` | `pending` / `ai_record` / `askquestion` / `user_said` / `repo` |

进阶或改决策后**先改 env 再跑闸门**；报错信息含修复动作。

## Agent 必须执行的命令

| 时机 | 闸门 | 不过 → |
|------|------|--------|
| init 落盘 · AskQuestion 前 | `init-confirm` | 禁止 init 确认 |
| REQ 落盘 · 确认卡前 | `req-confirm` | 禁止 REQ 确认 |
| model 落盘 · 确认前 | `mod-confirm` | 禁止进 sol |
| 方案+todo · 闸门前 | `sol-confirm` | 禁止进 dev（**须** env + architecture + REQ 已确认 + 栈来源按决策权落地） |
| **勾①前** | `dev-step1-literal --dev-file atlas/dev/T-xxx-*.md` | **禁止勾①** |
| **勾①/②/③ 后（任意时刻）** | `--only todo`（规则 `TODO-CHECK-*`） | 勾了无文件 / 勾③无可运行证据 / 假标「开发实现 ✅」→ **A 档失败** |
| **开发✅前** | `dev-complete` | 禁止 ✅（**须 ## 结果** 可运行证据；**有原型须** fe-pixel PASS；todo 勾选须与 `atlas/dev/` 对齐） |
| **进阶段 5 前** | `test-entry` | 禁止 AC 归档（**须** logs smoke；**有原型须** fe-pixel PASS） |
| **验收归档前** | `req-trace` | 检查 REQ→F→T→AC→报告 链完整性（B 档：warn 不阻塞） |

列出：`--list-gates`

## 可运行证据（A · runnable）

写入每个 T 的 **## 结果**，须同时可 grep 到：

1. **编译**：`编译` / `build` / `package` / `mvn` / `gradle` / `cargo` / `go build` / `dotnet` / `make` / `cmake` / `webpack` / `构建` / …  
2. **启或冒烟**：`启动` / `health` / `冒烟` / `curl` / `serve` / `dev server` / `docker` / `运行` / …  
3. **结果**：`exit 0` / `✅` / `通过` / `PASS` / `UP` / `BUILD SUCCESS` / `成功` / `完成`

禁止空表或只写「③ 验收后填写」。

## 勾选证据（A · todo `TODO-CHECK-*`）

> 堵「AI 自主 / 委托交付」时空跑勾选：checkbox 是承诺，不是装饰。

| 勾选态 | 脚本要求 |
|--------|----------|
| 勾 ① | 对应 `atlas/dev/T-xxx-*.md` **必须存在** |
| 勾 ② | ① 已勾 + 构思文件存在 |
| 勾 ③ | ② 已勾 + 该文件「## 结果」含可运行证据 |
| 流程进度「开发实现 ✅」 | 每个 T 的 ①②③ 均已勾且证据过关 |

`sol-confirm` 阶段 ①②③ 应仍为 `[ ]`，不触发本表；一旦勾选（任意 phase）即硬挡。

## 入场日志（A · smoke）

`atlas/logs/` 下至少一个文件名含 `smoke|compile|probe|test-entry|fe-smoke|be-smoke`，正文含通过痕迹。

## 像素对比（A · 有强制原型时）

规则与目录 → [fe-pixel-compare](fe-pixel-compare.md)。  
闸门读 `atlas/tests/fe-pixel/report.json`（`dev-complete` / `test-entry`）。

## 回复格式（勾①时）

```
字面量校验：## 摘要 · ## 步骤 · #### 步骤 · 代码落点 已命中
validate: exit 0 — <print-cmd 给出的命令>
```

勾③ / 开发✅ 时另报：`dev-complete` / `runnable` exit 0。
