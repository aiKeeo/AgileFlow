# 阶段决策委派（AI 自主 vs 用户决策）

> **核心**：  
> 1. **首启**必须问清 **流程模式 + 决策权**（见[流程启动卡](#流程启动卡首启强制)）  
> 2. 已确认后：用户决策 → 逐步 AskQuestion；AI 自主 → 推断落盘，产出可审阅（审阅可跳过）  
> 权威搭配：[flow-modes.md](flow-modes.md)（快速/严谨）· [askquestion-gate.md](askquestion-gate.md)

---

## 两维模型

| 维度 | 选项 | 控制什么 | **不**控制 |
|------|------|----------|------------|
| **流程模式** | 快速 / 严谨 | 文档厚度、AskQuestion **合并次数** | 阶段顺序、todo 详细度、能否跳过① |
| **决策权** | 用户决策 / **AI 自主** | 阶段内**选型/澄清**要不要问用户（「用户不用管」） | 阶段顺序、atlas 是否落盘、todo 是否详细 |

**正交**：快速 + AI 自主 = **最少问用户**，但 **仍按序** req→mod→sol→dev，**todo 仍详细**。  
严谨 + 用户决策 = 最多把关。

> **「后面都你定 / 不用问我」→ 设 AI 自主，不要切成「跳阶段的快速」。**  
> 快速模式本身 **不**表示用户不用管、**不**表示可以薄化 todo。

---

## 流程启动卡（首启强制）

> **何时发**（命中任一 → **落盘前**必须 AskQuestion → **停**）：  
> - 无 `atlas/agileflow.env`  
> - 或 `AF_FLOW=pending` / `AF_DECIDE=pending`  
> - 或 todo「决策委派」仍为「未设置」且 env 未写真实值  

> **可跳过**（须在本条回复首行写明依据）：用户**原话已同时点明**模式与决策权（例：「快速，后面都你定」「严谨，逐步问我」）。只点明一边 → 仍发卡，已点明项可预填推荐。

```yaml
title: "Agileflow 流程启动"
questions:
  - id: flow_mode
    prompt: "流程模式？（只影响停点合并/文档厚度，不跳阶段、不薄 todo）"
    options:
      - id: fast
        label: "快速（少停、确认可合并；建模可用单文件）"
      - id: strict
        label: "严谨（分步确认；建模须五件套）"
  - id: decide_mode
    prompt: "关键选型/澄清谁来定？"
    options:
      - id: user_decide
        label: "我来决策（逐步问我，写完再确认）"
      - id: ai_decide
        label: "AI 自行决策（写完落盘，我看不看都行）"
      - id: ai_decide_global
        label: "AI 自行决策，且后续阶段也默认 AI（可随时说「这阶段我来」改回）"
```

**用户答完后（下条回复必须）**：

1. 写/更新 `atlas/agileflow.env`：`AF_FLOW=fast|strict`、`AF_DECIDE=ai|user`（禁止再留 `pending`）  
2. 同步 `atlas/todo.md`「决策委派」  
3. 按选定决策权进入当前阶段（ai → 落盘+审阅闸门；user → 该阶段澄清卡链）  
4. **禁止**答完启动卡同回复跨阶段

---

## 契约重选（旧项目 / 已确认后想改）

> **问题**：旧仓已是 `AF_FLOW=fast` + `AF_DECIDE=ai` 时，不会再弹启动卡。  
> **解法**：用户随时可重选；Agent **禁止**要求用户手改 env。

### 触发（命中任一 → 本条只发卡 → 停）

| 用户原话（例） | 动作 |
|----------------|------|
| 重选模式 / 换流程模式 / 重开启动卡 | 发[流程启动卡](#流程启动卡首启强制)；prompt 注明当前值 |
| 重新选决策权 / 改成我来决策 / 改成 AI 自主 | 同上（可只强调决策题，仍两题一起发） |
| 改成严谨 / 改成快速 | 同上；已点明的模式可预填推荐 |
| 审阅/阶段闸门选「重选流程契约」 | 同上 |

### 执行顺序

1. **先**把 `atlas/agileflow.env` 写成 `AF_FLOW=pending`、`AF_DECIDE=pending`（保留 `AF_PHASE`/`AF_TIER`/`AF_STACK_SOURCE`）  
2. todo「决策委派」标 **未设置（重选中）**  
3. AskQuestion 流程启动卡（prompt 含：`当前曾为 模式={旧} · 决策={旧}`）→ **停**  
4. 用户答完 → 按下节「用户答完后」写回真实值；**不**自动重跑已确认阶段产物（除非用户另说「按新契约重做某阶段」）

**禁止**：口头答应改模式却不改 env；静默改回 fast/ai；用「这阶段我来」冒充完整重选（那只改当阶段决策权）。

---

## 阶段入口：决策权 AskQuestion（契约已确认后）

进入阶段 0/1/2/3/4 **落盘前**（此时 `AF_FLOW`/`AF_DECIDE` 已非 `pending`）：

| 条件 | 动作 |
|------|------|
| `AF_DECIDE=ai` 或 todo 已标 **全局 AI自主**（且用户未说「这阶段我来」） | **跳过**本卡 → 直接按 ai_decide 落盘 → 审阅闸门 |
| 用户本轮已说「你定 / 后面都你定」 | 按话术表设 ai_decide / global，**可跳过**本卡；更新 env |
| `AF_DECIDE=user` 或用户显式「这阶段我来 / 逐步问我」 | 设 **user_decide** → 走该阶段原有 AskQuestion 链 |
| env/todo **未设置或 pending** | **禁止**走本表 → 回[流程启动卡](#流程启动卡首启强制) |

```yaml
title: "{阶段名} - 决策方式"
questions:
  - id: stage_decision_mode
    prompt: "【{阶段名}】本阶段关键选型/澄清，你想？"
    options:
      - id: user_decide
        label: "我来决策（逐步问我，写完再确认）"
      - id: ai_decide
        label: "AI 自行决策（你写完落盘，我看不看都行）"
      - id: ai_decide_global
        label: "AI 自行决策，且后续阶段也默认 AI（可在 todo 改回）"
```

| 选项 | 行为 |
|------|------|
| **user_decide** | 走该阶段原有 AskQuestion 链（需求卡、技术栈等）；`AF_DECIDE=user` |
| **ai_decide** | **仅本阶段**跳过阶段内决策卡；Agent 推断 → 落盘 → [审阅闸门](#审阅闸门ai-自主专属) |
| **ai_decide_global** | 本阶段 AI 自主 + todo 写全局 AI自主；`AF_DECIDE=ai`；后续阶段入口**跳过**决策权卡（用户可说「这阶段我来」覆盖） |

**调用后**：`user_decide` → 按原流程停止等用户；`ai_decide*` → **下条回复必须落盘**（禁止只说不写）。

### 全局委派记录（todo.md + agileflow.env）

**机器权威**：`atlas/agileflow.env`（模板 [agileflow.env](agileflow.env)）。AI 每进阶 / 改决策必须更新，否则 `validate-atlas --gate *` **A 档报错**。

| 键 | 含义 | 卡住行为（摘要） |
|----|------|------------------|
| `AF_PHASE` | 当前阶段 0–5 | 与产物推断不一致 → `AF-ENV-PHASE` |
| `AF_FLOW` | `fast` / `strict` / `pending` | `pending` → 全闸门 `AF-ENV-BOOT` 挡；选定后控停点合并 |
| `AF_DECIDE` | `ai` / `user` / `pending` | `pending` → 同上；`user`+栈 `pending` → sol-confirm 挡 |
| `AF_TIER` | `lite` / `standard` / `full` | 完整档强制机械 grep |
| `AF_STACK_SOURCE` | 技术栈来源 | 见 [solution-tech-askquestion](solution-tech-askquestion.md) |

```markdown
## 决策委派
- 全局：AI自主 | 用户决策 | 未设置（须先走流程启动卡）
- 模式：快速 | 严谨 | 未设置
- 自阶段：{req|mod|sol|dev} 起
- 覆盖：用户说「这阶段我来决策」→ 仅当阶段改回 user_decide，并写 AF_DECIDE=user
```

---

## AI 自主：阶段内跳过什么

| 阶段 | AI 自主时跳过 | AI 必须自行决定并落盘 | 仍不可跳过 |
|------|--------------|----------------------|------------|
| **0 init** | init 确认前的反复澄清 | 扫描结论、分层、实体用途 | 落盘自检；审阅闸门 |
| **1 req** | 需求澄清卡、草稿确认卡 | 用户/平台/MVP/功能拆分/UID 范围 | REQ+AC+README；**AI 决策记录** |
| **2 mod** | 建模确认卡 | 实体/关系/规则/表结构（或 model-overview） | model/ 落盘 |
| **3 sol** | 技术栈卡、方案确认卡 | 技术栈、features、contracts、architecture、todo | solution/ 落盘 |
| **4 dev** | **仅**可选「构思审阅」（白名单）；**不可**跳过 F-xxx 阶段性确认 | 完整模板；逐 T 过构思闸门/写码闸门/可运行闸门；F-xxx 切片完发**阶段性确认卡** | ①②③；可运行闸门；阶段性 AskQuestion；禁批量① |

**禁止 AI 自主时跳过**：阶段顺序（req→mod→sol→dev）、`atlas/` 落盘、**详细** `atlas/todo`（每 T ①②③）、dev ① 构思文件、AC 只引用 REQ、humanTodo 沉淀（密钥/参考稿仍须列出）。

**AI 自主 ≠ 快速通道**：仍走完整流程；只是选型不问用户。
---

## AI 决策记录（落盘必填）

AI 自主完成阶段后，在该阶段 **README.md 或主产出文末**追加：

```markdown
## AI 决策记录（本阶段 Agent 自行决定，供审阅）

| 决策点 | 选择 | 依据 |
|--------|------|------|
| 技术栈 | {按 REQ/仓库选定} | {一句依据} |
| MVP 范围 | {本批纳入哪些功能} | 用户原话优先级（范围标签，非合并文件） |
| REQ 拆分 | {N} 份：REQ-001… | 一功能一文件；说明为何这样拆 |

> 审阅时重点看此表；有异议选审阅闸门「我要调整」。
```

---

## 审阅闸门（AI 自主专属）

AI 自主落盘完成后，**用此卡替代**「草稿确认 + 阶段闸门」两步（快速/严谨均适用）：

```yaml
title: "{阶段名} - 产出审阅（可选）"
questions:
  - id: review_action
    prompt: |
      本阶段已写入：
      - {文件列表摘要}
      
      AI 决策摘要：{3～5 条 bullet}
      可运行证据：{编译命令+结果} | {冒烟主路径+结果}  ← 阶段4必填
      
      你可以打开 atlas/ 细看；也可以不审直接继续。
    options:
      - id: confirm_continue
        label: "看过了，确认并继续下一阶段"
      - id: skip_review_continue
        label: "不审了，信任 AI，直接继续下一阶段"
      - id: need_changes
        label: "我要调整（下轮改文档）"
      - id: reselect_contract
        label: "重选流程契约（快速/严谨 + 谁决策）"
      - id: pause
        label: "暂停，我先自己看文件"
```

| 选项 | Agent 下条回复 |
|------|----------------|
| confirm_continue / skip_review_continue | 标本阶段 **已确认** → **下条回复**进入下一阶段并落盘 |
| need_changes | 按用户文字修改本阶段产出 → 再发审阅闸门。**用户未提供文字时**：AskQuestion「请描述需要调整的内容」→ 停止。禁止猜测用户意图 |
| reselect_contract | 走[契约重选](#契约重选旧项目--已确认后想改) → 启动卡 → 停；**不**进下一阶段 |
| pause | 仅更新 todo，**不写**下一阶段 |

**审阅可跳过**：`skip_review_continue` 合法；标 README **已确认** 等同用户确认。

**阶段 4 审阅闸门须附可运行证据**：编译命令+结果 + 冒烟主路径+结果；无证据禁止发「确认继续」选项当已完成。

---

## 与用户话术对照

| 用户说 | 解析 |
|--------|------|
| 「这阶段你定 / 不用问我了 / 全自动」 | 当阶段 → **ai_decide** |
| 「后面都你定」 | **ai_decide_global** |
| 「这阶段我来」 | 覆盖全局 → **user_decide** |
| 「重选模式 / 换流程 / 重开启动卡 / 重新选决策权」 | **[契约重选](#契约重选旧项目--已确认后想改)** → pending + 启动卡 |
| 「不审了继续 / 跳过审阅」 | 审阅闸门 → **skip_review_continue** |
| 「我自己看，暂停」 | **pause** |

---

## 交互次数对比（阶段 1 例）

| 路径 | 停几次 |
|------|--------|
| 严谨 + 用户决策 | 3（需求卡 → 确认 → 闸门） |
| 快速 + 用户决策 | 2（需求卡或跳过 → 合并确认闸门） |
| 首启（env 未确认） | **+1**（流程启动卡；答完下条才进阶段） |
| 快速 + **AI 自主**（启动卡已选） | **1**（仅审阅闸门；**不**再发阶段决策权卡） |
| AI 自主 + skip_review | 用户选「不审继续」→ 下条直接写下一阶段 |

---