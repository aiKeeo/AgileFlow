---
name: agileflow
description: >-
  规范交付：按序把需求/方案/任务/构思写入 atlas/，再写码与验收。
  触发：用户要做功能或项目、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/test:/tests:/init: 前缀。
version: 9.6.2
---
# Agileflow

## 闸门分档（先读这张表）

| 档 | 含义 | 例子 | 靠什么 |
|----|------|------|--------|
| **A 挡门** | 不过 → 禁止勾 ✅ / 进下一阶段 | todo 三段式、dev 字面量、**九段可运行证据**、**atlas/logs 入场日志**、architecture、REQ 已确认 | `validate-atlas --gate …` exit 0 |
| **B 告警** | 可继续，须知债 | BDD 缺、契约命名、层标签 | JS warn |
| **C 纪律** | 脚本管不到 | AskQuestion、停止本回复、TodoWrite 展开、并行开闸卡 | 首行声明 + 用户盯 |

> **「JS 权威」仅指 A 档。** 可运行优先的**终端动作**仍须 Agent 真跑；脚本只核验**落盘证据**，不替你编译。

## 硬约束

### 主链（不可跳）

```
req → REQ+UID → 闸门
mod → model/ → 闸门（可跳须写建模判定）
sol → solution/+todo → 闸门
dev → TodoWrite①②③ → ①→②→可运行闸门→③ → 闸门
tests → 测试入场门禁 → AC归档 → 回归
```

「继续」= 进入下一阶段并落盘。快速模式**仍走完整阶段链**；「用户不用管」= **AI 自主**，≠ 快速、≠ 跳阶段。

**跨会话续作**：先读 `atlas/todo.md` 的 **checkpoint / ①②③ 勾选**，再重建 TodoWrite（权威在 atlas，不在会话内存）。

### A 档必须过的 JS 闸门

| 时机 | 命令 | 不过 → |
|------|------|--------|
| 勾①前 | `--gate dev-step1-literal --dev-file …` | 禁止勾① |
| 标开发✅前 | `--gate dev-complete`（含 **runnable**：九段编译+启/冒烟+结果） | 禁止 ✅ |
| 进阶段5前 | `--gate test-entry`（含 **smoke**：`atlas/logs/*`） | 禁止 AC 归档 |
| 方案确认前 | `--gate sol-confirm`（architecture + REQ 已确认） | 禁止进 dev |

细则与**可移植路径** → [validate-atlas-gate](templates/validate-atlas-gate.md)

### 阶段 4 执行清单（唯一）

→ **[dev-quickstart](templates/dev-quickstart.md)** · [04-development](phases/04-development.md)

```
0. todo 已是 ### T-xxx + ①②③（禁扁平 - [ ] T-001）
1. TodoWrite：每 T 三条「①构思 / ②写码 / ③AC」  ← C档
2. ① → 构思闸门(A) → 勾① → 写码闸门 → ② → 可运行(真跑+九段落证 A) → ③
禁止：先码后补、空壳九段、Subagent 无①写码、「全部开发」当并行
```

### 豁免（须首行声明）

命中微型/hotfix/快速通道/纯问答 → **首行写** `豁免：{类型}`，再动手。  
灰区禁止自评 → AskQuestion。MVP/API/DB/多模块/**禁止**连环 ≤20 行豁免。  
权威表 → [00-intent-routing §豁免](phases/00-intent-routing.md#①-豁免判定最先做)

### 并行 / Subagent

默认串行。「全部开发」≠ 并行。仅用户原话含「并行/subagent」且过开闸卡；1 Task=1 T；① 只属主 Agent。→ [parallel-orchestration](phases/parallel-orchestration.md)

---

## 模式 + 决策

| 维度 | 文件 |
|------|------|
| 快速/严谨 | [flow-modes](templates/flow-modes.md)（**T≥3 或 BE+FE → 校验器强制严谨**） |
| 用户/AI自主 | [stage-delegation](templates/stage-delegation.md) |

## 加载

| 场景 | 必读 |
|------|------|
| 启用 | [00-intent-routing](phases/00-intent-routing.md) + flow-modes + stage-delegation |
| 当前阶段 | **一个** `phases/xx.md` + 该 phase 显式链接的 templates |
| 阶段 4 / `dev:` | [dev-quickstart](templates/dev-quickstart.md) + [04-development](phases/04-development.md) + exemplar + [todo](templates/todo.md)；**有原型**另读 [fe-pixel-compare](templates/fe-pixel-compare.md) |
| 阶段 5 / `test:` | [05-testing](phases/05-testing.md) + [l1-l5-pipeline](templates/l1-l5-pipeline.md)；`test:smoke-fe` → fe-smoke；`test:pixel-fe` → fe-pixel |
| 显式并行 | [parallel-orchestration](phases/parallel-orchestration.md) |
| 落盘自检 | [validate-atlas-gate](templates/validate-atlas-gate.md) |

禁止预读无关 phase。

## 术语（短）

| 说法 | 意思 |
|------|------|
| ①②③ | 构思→写码→验 AC |
| 假九段 / 薄稿 | 无 `##` 或 `一、目标`+`五、可执行方案` |
| 可运行证据 | 九段含编译 + 启/冒烟 + exit0/✅/PASS（A档扫） |
| 像素对比 | UID「原型图」∪ `tests/fe-pixel/pages.json` → report PASS（[fe-pixel-compare](templates/fe-pixel-compare.md)） |

## 铁律（压缩）

1. 大阶段结束 → AskQuestion（C）→ 停；产出在 `atlas/`  
2. greenfield 不做 init；T≥3/BE+FE → 严谨  
3. 逐 T：TodoWrite→①(A字面量)→②→可运行(真跑+A证据)→③；禁合并洗 ✅  
4. AC 只在 REQ；FE 冒烟 `fe-smoke.*`；**强制原型须像素 PASS**（见 fe-pixel-compare）  
5. todo 必须 `### T-xxx`+①②③；`dev/README`/`temp` ≠ ①  

## 首行声明

`📍 Agileflow | 模式：{快速/严谨} | 决策：{用户/AI自主} | 阶段：{N} | …`  
豁免时：`📍 Agileflow | 豁免：{微型|hotfix|快速通道|问答} | …`
