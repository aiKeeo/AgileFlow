---
name: agileflow
description: >-
  走规范交付流程：先按模板把需求/方案/任务/dev构思写进 atlas/，再写码和验收。
  快速也按序req→mod→sol→dev；todo须###/####T+①②③；TodoWrite每T三条；禁扁平列表/temp顶替/补盘洗✅。
  勾①须过闸门A+A7机械grep（##一/五、###目的、####5.；FE+3.1线条图）；假薄稿勾不了①。
  todo①质量门槛冻结禁改写；TodoWrite①须含exemplar/A7。
  写法锚点FE/BE分文件；资产索引靠前；dev须复用盘点（对照原型/能力查库存）。
  大仓init分级P0/P1/P2：P0过即可确认；须覆盖范围声明；禁止假装全量。
  FE冒烟可AskQuestion跑通用Playwright（Web/后台/小程序-H5；console→atlas/logs）。
  Chromium安装须镜像优先；无fe-smoke-report不得声称PASS；H5PASS≠weapp无错。
  test:可分层：test:unit / test:smoke / test:smoke-be / test:smoke-fe；裸test:/tests:=全量阶段5。
  「用户不用管」=AI自主。每T闸门C；F/MVP完须AskQuestion；并行须开闸卡且单批≤3T。
  触发：用户描述要做的东西、@agileflow、继续 agileflow、或 req:/mod:/sol:/dev:/test:/tests:/init: 前缀。
version: 9.4.16
---
# Agileflow

## 硬约束（最高优先级）

### 「停止」≠ 不写文档

| ❌ | ✅ |
|----|-----|
| AskQuestion 后永远不写 | **停止=结束本回复**；用户答后**下条必须落盘** |
| 阶段完成=聊过了 | **`atlas/` 已写出** + 结束闸门 |

```
req → REQ+UID → 闸门
mod → model/ → 闸门
sol → solution/+todo → 闸门
dev →【TodoWrite 展开①②③】→ ①→②→闸门C→③ → 闸门
tests → 5-0 → 5A → 5B
```

「继续」= 进入下一阶段并落盘，禁止只回「好的」。

### 快速模式仍走完整阶段链（最高优先级）

> **哪怕是快速**：也必须按序 **需求 →（按需）建模 → 方案 → 开发①落盘 → 写码**。  
> **`atlas/todo` 必须三段式**：每个 `### T-xxx` + ①②③（含 `atlas/dev/T-xxx` 路径）；**禁止** `- [ ] T-001 一行`。  
> **「用户不用管」= AI 自主**（少问选型），**≠** 快速、**≠** 跳阶段、**≠** 省略三段式。细则 → [flow-modes 铁律](templates/flow-modes.md#铁律快速--跳阶段--薄-todo最高优先级)

| ❌ | ✅ |
|----|-----|
| 快速 → 跳过 req/sol 直接写码 | 快速只少卡/薄文档段；阶段顺序不变 |
| 快速 → todo 扁平 `- [x] T-001 …` 无①②③ | **每 T：`### T-xxx` + ①构思落盘 + ② + ③** |
| 只用 `dev/README.md` 索引代替 per-T 文件 | 每个 T 独立 `atlas/dev/T-xxx-*.md` |
| 把「快速」当成「用户不用管」 | 「后面都你定」→ **AI 自主**；仍按序落盘 |

### 可运行优先（防「代码写了但起不来」· 最高优先级）

> **给用户看的东西必须能启动、能点通。** 单测绿 ≠ 能跑。细则 → [dev-quickstart 闸门 C](templates/dev-quickstart.md#闸门-c可运行每-t--每模块强制)  
> **做完还要问用户。** 细则 → [askquestion-gate 阶段性确认卡](templates/askquestion-gate.md#阶段性确认卡阶段-4-内--mvp--f-xxx-切片强制)

| 时机 | Agent 必须 | 禁止 |
|------|------------|------|
| **每个 T 勾③ / 父任务 ✅ 前** | **闸门 C**：编译 → 能启/能调 → 本 T 冒烟；证据写入 dev 九 | 只跑 AC 就 ✅；编译失败仍 ✅ |
| **一个 F-xxx / MVP 切片做完** | ① 模块编译+冒烟（闸门 C）→ ② **AskQuestion 阶段性确认卡**（继续 / 先给我看 / 有问题 / 暂停）→ **停** | 闷头下一模块；C 没过就问用户「好了吗」 |
| **「给用户看 / MVP 演示」** | 存在端启动冒烟全过 → AskQuestion（或用户已选「先给我看」）+ 给出启动步骤 | 甩源码让用户自己猜怎么启 |
| **阶段 4 全部完成** | 闸门 C 证据齐 → **阶段闸门**进 tests → 停 | 不询问就进阶段 5 |

**问用户 ≠ 替代闸门 C**：先 C 过线，再 AskQuestion。催进度 / 「全部开发」**不豁免**阶段性确认卡。

### TodoWrite 强制展开（防漏① · 记不住就靠清单）

> **规范记不住 → 把每个 T 的构思写成 Todo 条目，一个个勾。** 细则 → [todo.md](templates/todo.md#todowrite-强制展开防漏①--最高优先级)

| 时机 | 必须 | 禁止 |
|------|------|------|
| 进阶段 4 / 「全部开发」/ 恢复开发 | **先** `TodoWrite`：每个 T **必须三条**「①构思 / ②写码 / ③AC」；**`atlas/todo` 下①②③三行强制存在** | 一条 Todo 覆盖多 T；扁平 `- [ ] T-001`；只建①；只用 README/temp 假构思 |
| 勾① completed | 对应 `atlas/dev/T-xxx-*.md` 已存在且闸门 A **全过**（含 A6+**A7 机械 grep**） | 空勾①；`一、目标`+`五、可执行方案`薄稿；合并 `T-002~018` |
| 开始② | 该 T 的①已 completed | ①还 pending 就 Write 业务源码 |
| 勾③ / 父任务 ✅ | **闸门 C 已过**（编译+可跑+本 T 冒烟） | 起不来 / 接口 500 仍标完成 |

「全部开发」= **按 TodoWrite 从上到下做完**；≠ 跳过清单出代码。

### 「直接全开发 / 全部做」≠ 跳过 / 压缩 / 空壳 / Subagent 外包

| 用户说 | ❌ | ✅ |
|--------|----|----|
| 直接全实现 / 全部开发 / yes_all | 先码后补；摘要/空壳；**派 Subagent 一次写完 BE+FE**；合并 todo 洗 ✅；**不建 TodoWrite①②③就开写**；**从不编译启动** | **先 TodoWrite 展开每 T 的①②③** → 串行逐条：①→②→闸门C→③ |
| 全部做 / 连续做 | 合并 `T-002~T-018`；跳过①；当成「连进=可压缩」 | 任务间连续；**每 T 仍完整+可运行**；T 头≥3 → 强制严谨 |
| 只看成品 / 给用户看 | 测试绿或「代码齐了」就交 | **闸门 C +（演示前）存在端启动冒烟** 过了才能说可看 |

催进度**不豁免**①，也**不豁免**闸门 C。**「全部开发」≠ 并行许可**（见 [parallel-orchestration](phases/parallel-orchestration.md)）。

### 禁止用 Task/Subagent 绕过阶段 4（最高优先级）

| 禁止 | 说明 |
|------|------|
| 未显式「并行/subagent」就启 Task 写业务源码 | 「全部开发」只触发**串行**逐 T |
| Subagent 无 `atlas/dev/T-xxx.md` 就 Write 业务源码 | 先由**主 Agent**写该 T 的①并过闸门 A、勾① |
| Subagent 写① / 创建 dev | ① 只属主 Agent；Subagent 仅②→闸门C→③ |
| 一个 Subagent 领多个 T / 「全部 API」/ 「全部前端」 | 1 Task = 1 T |
| 主 Agent 自己不写①，整包外包阶段 4 | 违规 |

**显式并行例外**：用户原话含「并行/subagent」**且**过 [并行开闸卡](phases/parallel-orchestration.md#并行开闸卡强制) 后，允许批次 B 先齐①再并行②；**单批最多 3 个 T**。细则 → [parallel-orchestration](phases/parallel-orchestration.md) · [04 A1](phases/04-development.md)。

权威执行清单 → [dev-quickstart](templates/dev-quickstart.md)。

### A. 阶段结束 → AskQuestion 结束闸门 → 本回复停止

| 时机 | 必须 | 禁止 |
|------|------|------|
| 0/1–4 产出完成 | 结束闸门 → 停 | 自然语言问继续；同回复跨阶段 |
| 决策权未设 | 决策权卡（全局 AI自主则跳过） | 未明就假定 |

| 阶段 | 必须落盘 |
|------|----------|
| 1 | REQ(+UID)+README+todo |
| 2 | model/ |
| 3 | features(+contracts)+architecture+todo（**每 T：`### T-xxx`+①②③**；禁止扁平列表） |
| 4 | **逐 T** 合规 `atlas/dev/T-xxx-*.md`① + 源码② + test/ac③；**R16 全过**（合法 T 头=`^#{3,4} T-\d+`；每头下有①②③；dev 数=头数；非 README/temp；非补盘洗 ✅） |
| 5 | **5-0**（存在端：编译→探针→冒烟）过后再 5A/5B；`atlas/tests/` 报告 |

### B. 阶段 4（唯一执行清单）

→ **[dev-quickstart.md](templates/dev-quickstart.md)**  
细则 → [04-development.md](phases/04-development.md)

```
【默认·串行】主 Agent：
0. 确认 atlas/todo 已是 ### T-xxx + ①②③（否则先改写成三段式，禁止直接写码）
1. TodoWrite 展开：每个 T **三条**「①构思 / ②写码 / ③AC」
2. 取下一条未完成的① → Read exemplar → 写该 T 完整 dev →【A】→ 勾①
3. 【B】→ ② →【闸门 C 可运行】→ ③ → 下一条
禁止：扁平 todo；未展开就写码；跳过闸门C；只用 README/temp 假构思；补盘洗 ✅；Subagent 批量写码
```

标「开发实现 ✅」前：R16 全过（合法头+每头①②③+dev 数相等+C 证据；补盘/技术债**不能**洗 ✅）。

---

## 模式 + 决策

| 维度 | 文件 |
|------|------|
| 快速/严谨 | [flow-modes.md](templates/flow-modes.md)（**快速仍按序走完阶段**；T≥3 或 BE+FE → 强制严谨） |
| 用户/AI自主 | [stage-delegation.md](templates/stage-delegation.md)（**「用户不用管」在这里**；全局 AI自主跳过决策权卡） |

## 加载

| 场景 | 必读 |
|------|------|
| 启用 | [00-intent-routing](phases/00-intent-routing.md) + flow-modes + stage-delegation |
| 当前阶段 | **一个** `phases/xx.md` + 该 phase **显式链接**的 templates |
| `dev:` / 阶段 4 / 「全部开发」 | **[dev-quickstart](templates/dev-quickstart.md)** + **[04-development](phases/04-development.md)（必读）** + exemplar（按端）+ **[todo.md TodoWrite](templates/todo.md#todowrite-强制展开防漏①--最高优先级)**；F/MVP 切片齐时另读 **[askquestion-gate 阶段性卡](templates/askquestion-gate.md#阶段性确认卡阶段-4-内--mvp--f-xxx-切片强制)** + 可选 **[fe-smoke-playwright](templates/fe-smoke-playwright.md)** |
| 阶段 5 / `tests:` / `test:`（含分层） | [05-testing](phases/05-testing.md) + [l1-l5-pipeline](templates/l1-l5-pipeline.md)；`test:smoke-fe` 时读 [fe-smoke-playwright](templates/fe-smoke-playwright.md) |
| 显式「并行/subagent」 | 另读 [parallel-orchestration](phases/parallel-orchestration.md) |
| 阶段结束 | [askquestion-gate](templates/askquestion-gate.md) |

禁止预读无关 phase（上表已列的必读不算「无关」）。

## 术语

| 说法 | 意思 |
|------|------|
| atlas/ | 全流程文档 |
| ①②③ | 构思→写码→验 AC |
| 空壳标题 | 有 `## 一、`～`## 九、` 但五无类/方法做法 |
| 假九段 | 纯文本 `一、二、五、关键代码落点` 无 `##`/`#### 5.`（有文件也不过 A） |
| FE 字段映射 | `### 3.2` 契约字段=API 英文名 |
| 布局线条图 | UID/UI/FE-dev **3.1** 的 ASCII 线框；区域表 alone 不合格 |
| 写法锚点 | `p1-frontend`/`p1-backend`（**资产索引靠前**）或 `code-patterns-*`；开发先查库存再抄 §三 |

## 阶段路由

| 阶段 | 文件 |
|------|------|
| 0–5 / 变更 | [00-project-init](phases/00-project-init.md) … [05-testing](phases/05-testing.md) · [change-management](phases/change-management.md) |

## 铁律

1. 大阶段结束 → 结束闸门 → 停  
2. greenfield 不做 init  
3. 逐 T：先 TodoWrite 展开①②③ → A→勾①→B→②→**闸门C**→③；禁合并/摘要/空壳/批量①  
4. AC 只在 REQ  
5. T 头≥3 或 BE+FE → 强制严谨；**快速仍须按序 req→mod→sol→dev，todo 仍详细**  
6. 补盘/空壳不勾①；**技术债也不能**把「开发实现」洗 ✅  
7. ① 只属主 Agent；显式并行须开闸卡；批次 B 单次最多 3 T  
8. 「全部开发」前必须 TodoWrite 为每个 T 建①②③；禁止一条 Todo 多 T；禁止只建①  
9. 每 T/每模块须可运行（闸门 C）；F/MVP 切片完须 AskQuestion 问用户；单测绿 ≠ 能交  
10. 「用户不用管」= AI 自主，≠ 快速、≠ 跳阶段  
11. `atlas/todo` 必须 `### T-xxx`+①②③；禁止扁平 T 列表；`dev/README`/`temp` ≠ ①  
12. 合法 T 头仅 `###`/`####`（`## T-` 不算）；R16 须验每头下①②③三行  
13. 勾①须过闸门 A（含 A6 + **A7 机械 grep**）；无 `### 目的`/`#### 5.` 或薄稿禁形 → **禁止勾①**；todo 质量门槛**冻结禁改写**  
14. 有 FE 时冒烟可 AskQuestion 跑**通用** Playwright（Web 正常启动；小程序仅 H5）；日志 `atlas/logs/fe-smoke.*`；**Chromium 安装镜像优先**；**无 report 不得声称 PASS**；H5 PASS ≠ weapp 无错  
15. `test:` 可分层：`test:unit` / `test:smoke` / `test:smoke-be` / `test:smoke-fe`；裸 `test:`/`tests:`=全量阶段 5  
16. 写法锚点 **FE/BE 分文件**；**资产索引靠前**；有 UI/API 的 T 须 **复用盘点**；闸门 B 须 Read 本端库存  
17. **大仓 init**：P0/P1/P2 分级；**仅 P0 过即可确认**；须「覆盖范围」块；禁止未全量却称全量；refresh 按模块补  

## 首行声明

每条回复首行：`📍 Agileflow | 模式：{快速/严谨} | 决策：{用户/AI自主} | 阶段：{N} | …`
