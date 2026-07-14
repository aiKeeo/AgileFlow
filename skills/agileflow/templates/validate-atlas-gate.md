# Atlas 校验（AI 流程闸门）

> **实现**：`scripts/validate-atlas/`（随 skill 安装）· 规范：`lib/phase-spec.mjs`  
> **诚实边界**：JS 只挡 **A 档**（结构 + 落盘证据）。AskQuestion / TodoWrite / 实际编译 = **C 档**，脚本管不到。  
> **路径**：勿写死 `.cursor/skills/agileflow`。用下方探测或 `AGILEFLOW_SKILL_ROOT`。

## 分档

| 档 | 闸门/规则 | 失败效果 |
|----|-----------|----------|
| **A** | `dev-step1-literal`、`dev-complete`(+runnable)、`test-entry`(+smoke)、`sol-confirm`(+architecture+REQ已确认)、todo 三段式 | exit ≠ 0 → 禁止勾 ✅ / 进阶 |
| **B** | BDD、契约命名等 warn | 可继续 |
| **C** | AskQuestion、停止、TodoWrite、并行启动卡 | 靠纪律 |

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

## Agent 必须执行的命令

| 时机 | 闸门 | 不过 → |
|------|------|--------|
| init 落盘 · AskQuestion 前 | `init-confirm` | 禁止 init 确认 |
| REQ 落盘 · 确认卡前 | `req-confirm` | 禁止 REQ 确认 |
| model 落盘 · 确认前 | `mod-confirm` | 禁止进 sol |
| 方案+todo · 闸门前 | `sol-confirm` | 禁止进 dev（**须** architecture + REQ 已确认） |
| **勾①前** | `dev-step1-literal --dev-file atlas/dev/T-xxx-*.md` | **禁止勾①** |
| **开发✅前** | `dev-complete` | 禁止 ✅（**须 ## 结果** 可运行证据；**有原型须** fe-pixel PASS） |
| **进阶段 5 前** | `test-entry` | 禁止 AC 归档（**须** logs smoke；**有原型须** fe-pixel PASS） |
| **验收归档前** | `req-trace` | 检查 REQ→F→T→AC→报告 链完整性（B 档：warn 不阻塞） |

列出：`--list-gates` · 旧名 `dev-a7` ≡ `dev-step1-literal`

## 可运行证据（A · runnable）

写入每个 T 的 **## 结果**，须同时可 grep 到：

1. **编译**：`编译` / `build` / `package` / `mvn` / …  
2. **启或冒烟**：`启动` / `health` / `冒烟` / `curl` / …  
3. **结果**：`exit 0` / `✅` / `通过` / `PASS` / `UP`

禁止空表或只写「③ 验收后填写」。

## 入场日志（A · smoke）

`atlas/logs/` 下至少一个文件名含 `smoke|compile|probe|test-entry|fe-smoke|be-smoke`，正文含通过痕迹。

## 像素对比（A · 有强制原型时）

规则与目录 → [fe-pixel-compare](fe-pixel-compare.md)。  
闸门读 `atlas/tests/fe-pixel/report.json`（`dev-complete` / `test-entry`）。

## 回复格式（勾①时）

```
字面量校验：## 范围 · ## 做法 · #### 步骤 · 代码落点 已命中
validate: exit 0 — <print-cmd 给出的命令>
```

勾③ / 开发✅ 时另报：`dev-complete` / `runnable` exit 0。
