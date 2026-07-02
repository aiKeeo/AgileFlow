---
name: agileflow
description: >-
  Agileflow 结构化交付（init→req→mod→sol→dev→tests），文档落盘 atlas/，开发须构思落盘再写码。
  写法锚点默认模式 B：init/codebase 或 solution/code-patterns 单文件（结构+规范+模板），不建 conventions/。
  init: 仅 brownfield。在用户 @agileflow、init:/req:/mod:/sol:/dev:/tests: 或走完整流程时使用。
version: 8.0.0
---

# Agileflow

## 两条硬约束（最高优先级，覆盖速度/催进度/委派）

### A. 阶段结束 → 必须 AskQuestion 小卡片 → 停止

| 时机 | 必须 | 禁止 |
|------|------|------|
| 阶段 **0/1–4** 本阶段产出完成 | **调用 `AskQuestion` 工具**（阶段 0 用 [init 确认](templates/init-doc.md#init-确认-askquestion)；1–4 用[阶段闸门](templates/askquestion-gate.md#阶段闸门模板)）→ **本回复结束** | 自然语言问「是否继续」；假设用户同意；**同一回复**进入下一阶段 |
| 阶段 1 收到需求 | AskQuestion 需求卡片 → 停止 → 再写 REQ | 未问就写 REQ |
| 子步骤确认后（如方案确认、REQ 草稿） | 仍须再发**阶段闸门**（若本阶段已结束） | 确认后直接开下一阶段 |

**催进度**：仅可少**阶段内**重复审阅卡；**不可少阶段闸门、不可跳开发三步序**。

### B. 阶段 4：开发 = todo 三步 + 构思落盘 → 写码 → AC 验收

**todo ① 未勾 = 禁止写码。** 细则 → [dev-rationale](templates/dev-rationale.md) · 速查 → [dev-quickstart](templates/dev-quickstart.md)

```
① 构思落盘 → ② 按 五 写码（对齐写法锚点 §三）→ ③ 对照 八 验收 AC
```

| 步骤 | 落盘/勾选 | 禁止 |
|------|-----------|------|
| **①** | `atlas/dev/T-xxx.md` + 勾 todo ① | 跳过构思直接写码 |
| **②** | 源码 + 勾 todo ② | 脱离 **五**；不读写法锚点就写码（W8） |
| **③** | test/ac 全绿 + **九** + 勾 todo ③ | 自造 AC |

---

## 加载与阅读（按场景）

| 场景 | 必读 |
|------|------|
| 任意启用 | [00-intent-routing.md](phases/00-intent-routing.md) |
| 当前阶段 | **一个** `phases/xx.md` + 文内链接的 templates |
| `init:` | [init-doc.md](templates/init-doc.md) + **[init-scan-checklist.md](templates/init-scan-checklist.md)**（逐步勾选） |
| `dev:` | [dev-quickstart.md](templates/dev-quickstart.md) + [04-development.md](phases/04-development.md) |
| 阶段结束 | [askquestion-gate.md](templates/askquestion-gate.md) |

**禁止**预读无关 phase。

---

## 术语

| ✅ | ❌ |
|----|-----|
| **写法锚点** · 默认模式 B · `codebase/p1-*.md` 或 `code-patterns-*.md` | 默认建 `atlas/conventions/`（除非模式 A） |
| **init:** brownfield as-is | greenfield 建 init/ |
| **data/entities/** | 每张表 **干什么、用户怎么用**；不是字段字典 | 只列字段不写业务用途 |
| **① 构思落盘** | 口头想想直接写码 |
| **UID**（REQ 界面描述） | REQ 里定配色/px |

---

## 阶段路由

| 阶段 | 文件 | 产出 |
|------|------|------|
| 0 | [00-project-init.md](phases/00-project-init.md) | init/（**仅 brownfield**） |
| 1 | [01-requirement.md](phases/01-requirement.md) | REQ + UID |
| 2 | [02-modeling.md](phases/02-modeling.md) | model/ |
| 3 | [03-solution-design.md](phases/03-solution-design.md) | solution/ + todo |
| 4 | [04-development.md](phases/04-development.md) | dev + 源码 + test/ac |
| 5 | [05-testing.md](phases/05-testing.md) | tests/ |
| 变更 | [change-management.md](phases/change-management.md) | 影响分析 |

---

## 铁律摘要

1. 阶段 0/1–4 结束 → **AskQuestion → 停止**
2. **greenfield 不做 init**；brownfield 进 dev/sol 前须 init 已确认或本轮完成 init
3. **开发** ①→②→③ 不可跳；委派不豁免
4. **AC 只在 REQ**；dev **八** 只引用 REQ
5. **写法锚点默认模式 B**——单文件四段式；**禁止** conventions 与 codebase 双份维护
6. **dev ② 前** Read 写法锚点 §三；首个典型功能 **③ 后 refresh §三**
7. **init 不建 p1-architecture**——架构模块进 `codebase/p1-*.md` §一
8. **init AskQuestion 前** → [init-scan-checklist](templates/init-scan-checklist.md) 落盘自检全 ✅
9. humanTodo 未清 → 禁止 tests 标 PASS
10. REQ 开发完毕 → 可选 `init: refresh codebase`

---

## 首行声明

`📍 Agileflow | 模式：{快速/严谨} | 阶段：{N-名} | 入口：{前缀|@agileflow}`

阶段 4：`步骤：{①|②|③} | 任务：T-xxx | 写法：{codebase §3.x | code-patterns §3.x}`

示例 → [flow-interaction.md](examples/flow-interaction.md)
