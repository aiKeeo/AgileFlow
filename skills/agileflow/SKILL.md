---
name: agileflow
description: >-
  把想法拆解到实现落地的一套流程。按序把需求/方案/任务/构思写入 atlas/，再写码与验收。
  防幻觉服从拆解，不反客为主。触发：用户要做功能或项目、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/test:/tests:/init: 前缀。
version: 9.15.0
---
# Agileflow

> **核心思想**：流程即产品——把想法拆解到实现落地。防幻觉、防跳阶段、防空跑是加固，服从拆解，不反客为主。

## 裁决表（冲突时以此为准）

### 全局铁律

| 议题 | 裁决 |
|------|------|
| **首启契约（最高）** | 无 `atlas/agileflow.env`，或 `AF_FLOW`/`AF_DECIDE` 为 `pending` → **必须**先发[流程启动卡](templates/stage-delegation.md#流程启动卡首启强制)（模式+决策权）→ **停**。**禁止**静默写成 `fast`/`ai` 后落盘。用户原话命中[委托交付](templates/stage-delegation.md#委托交付fastai用户不想自己决策)（如「你定/别问我」；未说严谨则含 `fast+ai`）或同时点明两边（如「快速+你定」）才可跳过 |
| **流程状态文件** | **`atlas/agileflow.env`**（AI 维护）：`AF_PHASE` / `AF_FLOW` / `AF_DECIDE` / `AF_TIER` / `AF_STACK_SOURCE`。闸门必读；`pending` 或与产物不一致 → **A 档报错卡住**。模板 → [agileflow.env](templates/agileflow.env) |
| **阶段结束（AI自主）** | 落盘 → **结束闸门** → **停**。`fast+ai`+A档绿 → 一行摘要+自动 skip_review（免发卡）；`strict+ai` → 审阅闸门卡。禁止同回复写下一阶段（建模跳过快路径除外） |
| **阶段结束（user_decide）** | 落盘 → **阶段闸门**（快速可与确认合并）→ **停** |
| **术语落盘** | **唯一** `atlas/glossary.md`；greenfield **禁止**写 `atlas/init/**` |
| **REQ 拆分** | 每个可独立验收功能 **一个** `REQ-*.md`；MVP 是范围标签，不是合并文件理由 |
| **只链不抄（SSOT）** | 验收=REQ AC；线框=UID；API 形状=contracts/API；**FE 接线=contracts/UI §字段绑定**；边界=features/F。下游只链不粘贴。dev **禁止**字段映射表 |
| **AC = BDD** | REQ **禁止**再写独立「BDD 验收场景」节；AC 表 Given/When/Then 即 BDD |
| **人类驾驶舱** | **强制** `atlas/README.md`（产品一句话/现在卡点/已拍板/未决/导读）；每阶段结束更新。模板 → [atlas-readme](templates/atlas-readme.md) |
| **信息充分少问** | `user_decide` 阶段内澄清卡：用户原话已覆盖的字段**禁止复问**；REQ 四项充分 → 跳过第 1 步整卡（**快速·严谨共用**）。**不**豁免首启启动卡、结束/审阅闸门、并行启动卡。权威清单 → [flow-modes §REQ 信息充分例外](templates/flow-modes.md#req-信息充分例外快速严谨共用)。同类：技术栈已指定可跳 sol 技术栈卡；init 写法锚点已记录可跳 |
| **纠偏阶梯** | 中途发现不对 → 按 L0→L3 选级，禁止硬扛继续写码。权威 → [change-management §纠偏阶梯](phases/change-management.md#纠偏阶梯全阶段) |

### 阶段机制

| 议题 | 裁决 |
|------|------|
| **sol F 极简** | F 只留 **边界+暴露面**；**禁止** F 联调卡/字段绑定/验收要点。UI 链 API 时 **§字段绑定** 在 contracts/UI |
| **dev 文档** | 全档 **摘要+步骤+结果**；标准/完整步骤优先 **流程表**（动作/输入→输出/注意点含落点）；精简可用一行 **改**；摘要须 **本T/做/不做/上游/AC**（**做**含接法）。`AF_DECIDE=ai` **不减**完整档流程拆解。完整另字面量严检 |
| **快速 vs 严谨** | 只控：文档厚度、model 单文件 vs 五件套、**user_decide 时**停点合并、覆盖率阈值；**不**改 todo ①②③；**不**把 AI自主改成逐步追问（严谨+AI = 厚文档 + 审阅闸门）。<br><br>**硬边界**：快速只减「停点次数」与「非关键段落厚度」，不减标题格式、不减 AC 表、不减范围提示、不减 F/契约/dev 文件数、不减可运行闸门；精简档仍须 `## 摘要`（含本T/做/不做/上游/AC）、`## 步骤`（≥1 步）、`## 结果` |
| **「用户不用管」** | = **AI 自主**（`AF_DECIDE=ai`），≠ 跳阶段、≠ 薄 todo |
| **委托交付（fast+ai）** | **用户不想自己决策**的典型组合：`AF_FLOW=fast` + `AF_DECIDE=ai` → 阶段内不澄清、A 档绿免审阅卡；**仍**按序落盘、禁跳阶段/①/可运行闸门。原话只点明「你定/别问我」未说模式 → **默认 fast+ai**（用户另说「严谨」→ `strict+ai`） |
| **建模跳过** | `user_decide`：建议跳过时须 AskQuestion 确认（或原话已点明）。`AF_DECIDE=ai`：自行落盘建模判定（跳过/增量/全量），**禁止**再发「建模判定确认」卡。跳过且四项自检+覆盖依据齐 → **快路径**：本条可写判定并直接进 sol 落盘（**唯一**允许同回复跨入 sol 的例外）；灰区/自检不全 → 审阅闸门→停。禁止静默进 sol（无判定） |
| **决策权已确认后** | `AF_DECIDE=ai`：跳过阶段内澄清卡 → 落盘 → 结束闸门（见下）→ 停（**每阶段最多 1 张审阅**；禁止再叠确认/阶段闸门）。**`fast+ai` 且本阶段 A 档闸门绿** → **免发卡**：输出一行审阅摘要 → 自动按 skip_review 标已确认 → 停（下条「继续」进下一阶段）；**`strict+ai`** → 仍发审阅闸门。阶段 4：F/MVP 切片对 `ai` **默认不停问**（可运行闸门仍强制；用户说「先给我看/演示」才发阶段性确认）。`AF_DECIDE=user`：信息充分则跳过澄清、只走确认/闸门；否则**只问缺口**。**禁止**把「首启启动卡」当成可跳过的过程审批。**仍禁**同回复跨阶段写下一阶段文档（建模跳过快路径除外） |
| **user_decide** | 须阶段内确认/闸门；澄清卡按「信息充分少问」；严谨默认**分步停**；快速默认可合并确认+闸门；`AF_DECIDE=user` 时技术栈未问清（`AF_STACK_SOURCE=pending`）→ **sol-confirm 必挡** |
| **写法锚点路径** | brownfield：`atlas/init/codebase/p1-{端}.md`；greenfield：`atlas/solution/code-patterns-{端}.md` |
| **测试入场** | 以 [05-testing 合并验证](phases/05-testing.md#测试入场门禁与阶段-4③-合并验证) 为准（同会话增量 / 跨会话全量） |
| **A 档闸门全集** | 以 [validate-atlas-gate](templates/validate-atlas-gate.md) 为准（含 init/req/mod/sol/dev/test） |
| **文档形态 SSOT（双模式）** | **默认 legacy**（v9.11 legacy + skill `templates/` 提示词）。**Template ON** 仅 `AF_TEMPLATE=yes` 时启用：形态规则读 **`atlas/template/`**（缺文件回退同 preset 默认，见 README `preset:`）；legacy REQ-F/DEV-SEC/SOL-F **关闭**。bootstrap：`validate-atlas --bootstrap-template minimal\|standard`（自动写入 `AF_TEMPLATE=yes`）。文件存在不等于自动开启 |

### 反模式（催进度时仍禁止）

> 裁决表已覆盖的反模式不再重复（首启/快速模式/阶段跨步），以下为裁决表未覆盖项。

| ❌ | ✅ |
|----|----|
| 旧项目想改模式却让用户手改 env | 契约重选（pending + 启动卡） |
| 建模建议跳过却无判定进 sol | `user`：确认卡→停；`ai`：须落盘建模判定（快路径可同条进 sol；灰区/自检不全才审阅停） |
| 首次 init 静默落盘模式 B | 写法锚点模式卡 → 再落盘 |
| 已确认 AI自主却只发卡不写文件 | 直接落盘 → 审阅闸门 |
| 把多功能揉成一份「MVP 总览 REQ」 | 一功能一 REQ；README 做索引 |
| 向用户解释「旧名/历史迁移/为什么集中」 | 只陈述当前目录约定 |
| UI/dev 粘贴 UID 整图或 API JSON | 链 UID/API/UI §字段绑定；dev 禁映射表 |
| 空壳步骤（无涉及改动/无代码落点） | 摘要+方法级伪代码步骤（legacy 仍用用户/系统/改）（格式权威 → [dev-quickstart §构思闸门](templates/dev-quickstart.md#构思闸门勾-①-前)） |
| **空跑勾选**（勾①无 `atlas/dev/`、勾③无可运行、假标开发✅） | 先落盘再勾；脚本 `TODO-CHECK-*` A 档硬挡（见 [validate-atlas-gate §勾选证据](templates/validate-atlas-gate.md#勾选证据a--todo-todo-check-)） |
| REQ 链 UID 但 ui/ 空文件 | 先写 UID 再标 REQ 已确认；脚本 `REQ-UID-断链` |
| 信息已写清仍整卡复问 | 跳过或只问缺口 + 首行声明依据 |
| 中途发现上游错却硬扛写码 | 声明 `纠偏：L{n}` 并按阶梯回改 |
| 严谨+AI自主仍逐步澄清/确认 | 落盘 → 审阅闸门；严谨只加厚文档 |

### 常见借口 vs 真实情况（反合理化）

> AI 失败常不是「不知道规则」，而是**找借口绕过**。产生下列念头时按右列执行，禁止自圆其说后跳过。

| AI 的借口 | 真实情况 |
|-----------|----------|
| 「用户说快，所以我跳了闸门」 | **快速 ≠ 跳阶段**；仍走五步，只少问 |
| 「这个 T 太简单，不需要①」 | 简单走**精简档**，①仍须落盘；无①禁写码 |
| 「先写码再补 dev 也算①」 | **事后补写不勾①**；须另开正式① |
| 「闸门没过但用户催了」 | 催进度不改闸门；A 档不过禁止勾 ✅ |
| 「你定 = 可以不写 atlas」 | AI 自主仍须按序落盘；只少澄清卡 |
| 「单测绿了就能给用户看」 | 须过**可运行闸门**（编译+启+冒烟） |
| 「不知道做啥也先写 REQ」 | 先走**探索**出选项，选定后再进 req |
| 「方案写进 solution/README 就够了」 | **须** `architecture.md`（技术栈/模块/本地验证）+ `features/F-*.md`（做/不做+暴露面）+ `contracts/`；README **只做索引**（`SOL-README-MASH`） |
| 「dev/README 汇总各 T 也算构思」 | **1 T = 1 文件** `atlas/dev/T-xxx-*.md`；README 冒充 → `SKIP-README冒充T` |
| 「先把 backend/frontend 搭起来再补 atlas」 | **先码 = 偷懒**；有业务源码无合规 sol/dev → `anti-skip` 硬挡 |
| 「进度打 ✅ 用户看着舒服」 | 假进度 = A 档失败；须闸门 exit 0 再勾 |

排障 → [TROUBLESHOOTING](TROUBLESHOOTING.md) · 交互示例 → [flow-interaction](examples/flow-interaction.md)

## 闸门分档

| 档 | 含义 | 靠什么 | 约束力 |
|----|------|--------|--------|
| **A** | 不过 → 禁止勾 ✅ / 进阶 | `validate-atlas --gate …` exit 0 | **硬阻断** |
| **B** | 可继续，知债 | JS warn | 提醒 |
| **C** | 脚本管不到（AskQuestion / 停止 / TodoWrite / 并行启动卡） | 纪律 | 靠自觉 |

脚本只核验**落盘证据**，不替你编译；可运行须 Agent **实际运行**。

## 主链（不可跳）

```
req → REQ(+UID) → 闸门
mod → model/ → 闸门（可跳须写建模判定）
sol → solution/+todo → 闸门
dev → TodoWrite①②③ → ①→②→可运行闸门→③ → 闸门
tests → 入场 → AC归档 → 回归
```

**写业务源码前**须 `--gate anti-skip`（或任意含 `anti-skip` 的阶段闸门）exit 0。  
CLI 参数是 `--root <项目根>`，不是 `--project`。

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
| 人类入口 | [atlas-readme](templates/atlas-readme.md) → 落盘 `atlas/README.md` |
| 阶段 4 | [dev-quickstart](templates/dev-quickstart.md) + [04](phases/04-development.md) + exemplar + [todo](templates/todo.md) |
| 阶段 5 | [05-testing](phases/05-testing.md) + [l1-l5-pipeline](templates/l1-l5-pipeline.md) |
| 模式/决策细节 | 需要时再读 [flow-modes](templates/flow-modes.md) / [stage-delegation](templates/stage-delegation.md) |
| 落盘自检 | [validate-atlas-gate](templates/validate-atlas-gate.md) |
| 排障 | [TROUBLESHOOTING](TROUBLESHOOTING.md) |
| 交互示例 | [flow-interaction](examples/flow-interaction.md) |
| Template ON | 写文档**前** Read `atlas/template/` 下与产物同路径的 `template-*.md`（如 `requirements/template-req.md`、`requirements/ui/template-ui.md`；无则 `presets/{preset}/template/…`） |

禁止预读无关 phase。跨切规则以**本文裁决表**为准，他处复述冲突时作废。

### 文件关键性分级

| 级别 | 文件 | 缺失时 |
|------|------|--------|
| **关键** | SKILL.md, phases/00-intent-routing.md | Skill 不可用，提示重新安装 |
| **阶段关键** | phases/01~05-*.md | 对应阶段不可用，其他阶段正常 |
| **模板** | templates/*.md | 降级：Agent 按记忆中的格式写，标注 `⚠️ 模板缺失` |
| **脚本** | scripts/validate-atlas.mjs | 降级为人工校验（见 [validate-atlas-gate §降级](templates/validate-atlas-gate.md#脚本不可用时的降级必读)） |
| **范例** | examples/dev-exemplar-*.md | 降级：跳过 exemplar Read，标注 `⚠️ exemplar 缺失` |

## 术语

| 说法 | 意思 |
|------|------|
| 委托交付 / fast+ai | 用户**不想自己决策**：AI 推断并落盘，少停少卡；≠ 跳阶段、≠ 先码后补 |
| atlas/ | 流程文档根容器；子目录分阶段隔离（req/model/sol/dev/tests），**禁止**跨阶段混写或「揉成一份」 |
| ①②③ | 构思→写码→验 AC（每个开发任务 T 的三步） |
| 落盘 | 写入 atlas/ **对应阶段子目录**的文件（不是聊天里说说，也不是把多阶段塞进一个文件） |
| 勾① / 勾② / 勾③ | 在 todo.md 中勾选对应步骤的 checkbox |
| 假段标题 | 纯文本「范围/做法（旧名，现用 ## 步骤）」无 `##` 标记 |
| 可运行证据 | **## 结果** 含编译 + 启/冒烟 + exit0/✅/PASS |
| 像素对比 | 有强制原型 → fe-pixel report PASS |
| 范例 | dev-exemplar-BE.md / dev-exemplar-FE.md，写 dev 前必读的标准示例 |
| 事后补写 | 先写完代码再补 dev 文档（禁止，不算正式①） |

## 首行声明

`📍 Agileflow | 模式：{AF_FLOW} | 决策：{AF_DECIDE} | 阶段：{AF_PHASE} | …`（值读自 `atlas/agileflow.env`）  
豁免：`📍 Agileflow | 豁免：{类型} | …`
