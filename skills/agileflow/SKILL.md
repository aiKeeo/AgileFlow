---
name: agileflow
description: >-
  规范交付：按序把需求/方案/任务/构思写入 atlas/，再写码与验收。
  触发：用户要做功能或项目、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/test:/tests:/init: 前缀。
version: 9.9.0
---
# Agileflow

## 裁决表（冲突时以此为准）

| 议题 | 裁决 |
|------|------|
| **dev 文档厚度** | **只看风险档位**：精简=范围/做法/结果；标准·完整=+契约+AC（完整另字面量严检）。**无一二三编号、无强制段数** |
| **快速 vs 严谨** | 只控：AskQuestion 合并次数、model 单文件 vs 五件套、覆盖率是否卡阈值 |
| **「用户不用管」** | = **AI 自主**，≠ 快速、≠ 跳阶段、≠ 薄 todo |
| **阶段结束（AI自主）** | 落盘 → **审阅闸门** → **停**。禁止同回复写下一阶段 |
| **阶段结束（user_decide）** | 落盘 → **阶段闸门**（可与确认合并 1 卡）→ **停** |
| **未设决策委派** | **默认 AI自主**（跳过入口决策权卡）；用户说「这阶段我来」才 user_decide |
| **A 档闸门全集** | 以 [validate-atlas-gate](templates/validate-atlas-gate.md) 为准（含 init/req/mod/sol/dev/test） |

## 闸门分档

| 档 | 含义 | 靠什么 |
|----|------|--------|
| **A** | 不过 → 禁止勾 ✅ / 进阶 | `validate-atlas --gate …` exit 0 |
| **B** | 可继续，知债 | JS warn |
| **C** | 脚本管不到（AskQuestion / 停止 / TodoWrite / 并行开闸） | 纪律 |

脚本只核验**落盘证据**，不替你编译；可运行须 Agent **实际运行**。

## 主链（不可跳）

```
req → REQ(+UID) → 闸门
mod → model/ → 闸门（可跳须写建模判定）
sol → solution/+todo → 闸门
dev → TodoWrite①②③ → ①→②→可运行→③ → 闸门
tests → 入场 → AC归档 → 回归
```

「继续」= **下一条回复**进下一阶段并落盘。  
**续作**：读 `atlas/todo.md` checkpoint / ①②③，再重建 TodoWrite。

### 阶段 4（唯一清单）

→ [dev-quickstart](templates/dev-quickstart.md) · [04-development](phases/04-development.md)

```
0. todo：### T-xxx + ①②③ + [精简|标准|完整]（禁扁平列表）
1. TodoWrite 每 T 三条 ①构思/②写码/③AC
2. ① → 写码前检查 → 勾① → ② → 可运行(实际运行+证据) → ③
   · ②中微调① → 追加「设计调整」≤5行（根本性变更才回①）
   · model/sol 小改 →「待回溯」；**改表/改契约语义**须当前 T ③前最小同步
禁止：先码后补、空壳、无①派 Subagent、「全部开发」当并行
```

### 豁免 / 并行

豁免须首行 `豁免：{微型|hotfix|快速通道|问答}`；灰区 AskQuestion。→ [00-intent-routing](phases/00-intent-routing.md#①-豁免判定最先做)  
默认串行；显式「并行/subagent」+并行启动卡。→ [parallel-orchestration](phases/parallel-orchestration.md)

## 加载

| 场景 | 必读 |
|------|------|
| 启用 | [00-intent-routing](phases/00-intent-routing.md) + 本文裁决表 |
| 当前阶段 | **一个** `phases/xx.md` + 其显式链接的 templates |
| 阶段 4 | [dev-quickstart](templates/dev-quickstart.md) + [04](phases/04-development.md) + exemplar + [todo](templates/todo.md) |
| 阶段 5 | [05-testing](phases/05-testing.md) + [l1-l5-pipeline](templates/l1-l5-pipeline.md) |
| 模式/决策细节 | 需要时再读 [flow-modes](templates/flow-modes.md) / [stage-delegation](templates/stage-delegation.md) |
| 落盘自检 | [validate-atlas-gate](templates/validate-atlas-gate.md) |

禁止预读无关 phase。跨切规则以**本文裁决表**为准，他处复述冲突时作废。

## 术语

| 说法 | 意思 |
|------|------|
| ①②③ | 构思→写码→验 AC（每个开发任务 T 的三步） |
| 落盘 | 写入 atlas/ 文件（不是聊天里说说，是写到磁盘文件） |
| 勾① / 勾② / 勾③ | 在 todo.md 中勾选对应步骤的 checkbox |
| 假段标题 | 纯文本「范围/做法」无 `##` 标记 |
| 可运行证据 | **## 结果** 含编译 + 启/冒烟 + exit0/✅/PASS |
| 像素对比 | 有强制原型 → fe-pixel report PASS |
| 范例 | dev-exemplar-BE.md / dev-exemplar-FE.md，写 dev 前必读的标准示例 |
| 事后补写 | 先写完代码再补 dev 文档（禁止，不算正式①） |

## 首行声明

`📍 Agileflow | 模式：{快速/严谨} | 决策：{用户/AI自主} | 阶段：{N} | …`  
豁免：`📍 Agileflow | 豁免：{类型} | …`
