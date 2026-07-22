# AgileFlow — AI Agent Skill

**English** | [中文](README.zh-CN.md)

> **The pipeline is the product.** Built for teams that need **deliverable, auditable, handoff-ready** output — not code trapped in chat history.

[![Version](https://img.shields.io/badge/version-9.31.0-blue.svg)](skills/agileflow/SKILL.md)
[![Enterprise Ready](https://img.shields.io/badge/Enterprise-Deliverable%20Evidence-green.svg)](#enterprise-grade-deliverables)

---

## One-liner

Typical AI coding delivers **code**. Enterprise delivery needs an **evidence package** — how to accept, who dispatched what, what actually ran, what's blocked, whether you can sign off.

AgileFlow: **standard artifacts at every stage + script-verifiable gates**, full REQ → implementation → acceptance report trace. Solo speed still works (`AF_DECIDE=ai` ~1h), but the design center is **team review, audit, and handoff**.

---

## Enterprise-grade deliverables

**OpenSpec** excels at the **spec layer** (brownfield increments). **Superpowers** excels at the **execution layer** (TDD + subagents). **AgileFlow** excels at the **delivery layer** — stage-gated evidence you can review, audit, and sign off.

| Deliverable | Enterprise use |
|-------------|----------------|
| `REQ-*.md` + BDD AC | Requirements baseline; single acceptance authority — downstream links only |
| `solution/` contracts + `F-*.md` | Architecture/API/boundary review before code |
| `dev/T-*.md` + `## 结果` | Per-task design notes + **runnable proof** — not empty checkboxes |
| `tests/REQ-*-验收报告.md` | Per-REQ sign-off: PASS / FAIL / `BLOCKED-HUMAN` |
| `agileflow-dispatch.json` | Subagent dispatch ledger (`subagentId` / `taskId`) — process audit |
| `humanTodo.md` | External deps explicit; never fake "delivered" when blocked |
| `validate-atlas` (9 gates) | CI-ready: `exit 0` to advance — no verbal "done" |

**In one line**: OpenSpec tracks *how specs evolve*; Superpowers tracks *how to execute the plan*; AgileFlow tracks **whether the delivery package is complete, evidenced, and traceable**.

---

## How we compare

vs. **[OpenSpec](https://openspec.dev)** and **[Superpowers](https://github.com/obra/superpowers)** — all three stop blind coding, different layers:

| | **OpenSpec** | **Superpowers** | **AgileFlow** |
|---|-------------|-----------------|---------------|
| **Layer** | Individual/team **spec** (brownfield) | Individual/squad **execution** (TDD + subagents) | **Delivery** (stage evidence + hard blocks) |
| **One-liner** | Lightweight spec-driven: align before code | Brainstorm → plan → subagent execution | Standard artifacts per stage; script says when to advance |
| **Strength** | Delta specs, fluid `/opsx:*` workflow | TDD enforced, dual review per task | 9 gates, full AC chain, acceptance reports, dispatch ledger |
| **Trade-off** | No hard gates — verify is soft | No unified CLI gate — discipline via skills | Heavier — not for one-line hotfixes |

### Dimension comparison (with raw AI baseline)

| Dimension | Raw AI chat | [OpenSpec](https://openspec.dev) | [Superpowers](https://github.com/obra/superpowers) | **AgileFlow** |
|-----------|:-----------:|:--------------------------------:|:--------------------------------------------------:|:-------------:|
| Structured stages (idea → ship) | ❌ | ⚠️ Fluid OPSX (explore→propose→apply→verify) | ✅ Brainstorm→plan→subagent execution | ✅ **req→model→sol→dev→test** |
| Machine hard-blocks (CLI fail = can't advance) | ❌ | ❌ `/opsx:verify` is soft | ❌ Skills + review, no unified gate | ✅ **`validate-atlas` — 9 gates** |
| Checkbox / task done = files + proof | ❌ | ⚠️ `tasks.md` honor system | ⚠️ Plan tasks + review | ✅ **`TODO-CHECK-*` enforced** |
| Enterprise delivery / compliance trace | ❌ | ⚠️ Spec deltas, no acceptance report chain | ⚠️ Plan + review | ✅ **REQ AC backfill + per-REQ reports + `req-trace`** |
| Role-based review (docs by zone) | ❌ | ⚠️ proposal/design split | ⚠️ Plan-centric | ✅ **requirements / model / solution / dev / tests isolated** |
| CI-gatable "done" definition | ❌ | ❌ | ❌ | ✅ **`validate-atlas` exit 0** |
| Explicit external-dependency blocks | ❌ | ❌ | ❌ | ✅ **`humanTodo` + `BLOCKED-HUMAN`** |
| Resume after closing chat | ❌ | ✅ `changes/` per change | ⚠️ Session/plan dependent | ✅ **`todo.md` + `agileflow.env`** |
| Auditable subagent dispatch | ❌ | ❌ | ✅ Per-task dispatch + compliance/quality review | ✅ **`agileflow-dispatch.json` (incl. subagentId)** |
| TDD / test discipline | ❌ | ⚠️ Not core | ✅ **RED-GREEN-REFACTOR enforced** | ✅ Step ③ proves AC + runnable evidence in `## 结果` |
| Full BDD / DDD / SDD chain | ❌ | ⚠️ SDD + spec deltas | ⚠️ Plan + TDD focus | ✅ **REQ→model→sol→dev artifacts** |
| Brownfield incremental change | ❌ | ✅ **Strong** (specs live with code) | ⚠️ | ✅ `init` inventory + code anchors |
| "You decide" vs "I decide" | — | — | — | ✅ **`AF_DECIDE=ai/user`** |
| Setup cost | zero | **low** (`openspec init` + slash commands) | **low** (Cursor `/plugin-add superpowers`) | **medium** (install skill, one sentence) |
| Simple CRUD typical time | 30min–2h (often no docs) | **faster** (lightweight, fewer gates) | 1–3h (brainstorm + plan overhead) | **~1h (full atlas included)** |
| Handoff / auditability | low | high (`specs/`) | medium (plan + code) | **highest** (full evidence pack + ledger + gate logs) |

### Which to pick

| Your situation | Better fit |
|----------------|------------|
| Mature codebase, small increments, specs evolve long-term | **OpenSpec** |
| Solo/squad, strong TDD, long subagent execution runs | **Superpowers** |
| **Vendor handoff, internal audit, multi-role review, sign-off reports** | **AgileFlow** |
| Zero-to-MVP that must demo **and** hand off documentation | **AgileFlow** |
| One-line bugfix, pure Q&A | All three heavy → raw AI or AF exempt path |

### Measurable facts (AgileFlow itself)

| Metric | Value | What it means |
|--------|-------|---------------|
| Hard-block gates | **9** | Full chain `init`→`req`→`mod`→`sol`→`dev`→`test`; `write-code` blocks stage-skipping |
| Validation fixtures | **63+** | Positive/negative regression; CI via `npm run test:validate` |
| Rule modules | **40+** | Design-note literals, fake checkboxes, broken UID links, dispatch ledger, etc. |
| Phase playbooks | **8** | `phases/` — routing, change management, all five stages |
| Dev quality tier | **1 (full)** | Five-part design notes + numbered logic blocks — autonomy doesn't thin docs |
| E2E agent retest | **ai + user** | Real agent smoke tests → [AGENT-RETEST.md](AGENT-RETEST.md) |

### Where AgileFlow wins (enterprise delivery)

1. **Nothing advances without complete artifacts** — 9 gates + 63+ fixtures; "done" is script-verifiable and CI-ready.
2. **REQ owns acceptance** — BDD AC backfilled into sign-off reports; auditors can answer "how was this requirement proven?"
3. **Process is auditable** — dispatch ledger logs `subagentId`; `AF_DECIDE=user` supports governance gates.
4. **Clear human/machine boundary** — `humanTodo` + `BLOCKED-HUMAN`; missing keys or sign-off never marked PASS.
5. **Fast solo, strict enterprise** — `ai` cuts friction; `user` for payments/auth/compliance-sensitive work.

> One-line bugfixes and pure Q&A? AgileFlow is intentionally heavy — that's by design, not a gap.

---

## The pipeline

```
req → model (as needed) → sol → dev (①②③) → test
```

| Stage | What it delivers |
|-------|------------------|
| **req** | One REQ per feature, Given/When/Then acceptance criteria |
| **model** | Domain model when complexity warrants it — or an explicit skip decision |
| **sol** | Boundaries, contracts, architecture, dev tasks in `todo.md` |
| **dev** | Design notes per task, business code, runnable proof in `## 结果` |
| **test** | Batch delivery proof — not "unit tests green = shipped" |

Methods map cleanly: **BDD → DDD → SDD → TDD**, but the point is **traceable stages**, not ceremony for its own sake.

Philosophy and constraints → [majorflow.md](majorflow.md). Execution details → [SKILL.md](skills/agileflow/SKILL.md).

---

## Two ways to work with it

| | **`AF_DECIDE=ai`** | **`AF_DECIDE=user`** |
|---|-------------------|----------------------|
| You say | "You decide" / "Don't ask me" | "I'll decide" |
| Friction | Fewer clarification cards, fewer stage pauses | Stage gates — you approve before advancing |
| Speed | Best for demos, CRUD, internal tools | Best for payments, auth, core business |
| What doesn't change | Full pipeline, `atlas/` artifacts, ①②③, runnable evidence | Same |

> **"You decide" ≠ skip stages.** It means less asking — not thinner docs, not unchecked boxes, not code-before-design.

---

## Why you can trust the output

Three guardrails keep AI from hallucinating, going off-script, or faking completion:

| Pillar | What it enforces |
|--------|------------------|
| **Shape** | Right artifacts in `atlas/`; checkboxes match real files (`validate-atlas` hard-blocks) |
| **Command** | You steer direction; AI executes — startup card, stage gates, resume from `todo.md` |
| **Run** | Compile / start / smoke evidence in dev notes — scripts verify form, **you** run the proof |

Blocked on your side? `humanTodo.md` lists what only a human can provide. Incomplete → **`BLOCKED-HUMAN`**, never falsely "delivered".

---

## What lands in `atlas/`

```
atlas/
├── requirements/REQ-*.md      # BDD + optional UID
├── model/                     # DDD (or skip rationale)
├── solution/                  # architecture, contracts, features
├── dev/T-*.md                 # per-task ① design notes
├── tests/                     # per-REQ acceptance reports
├── todo.md                    # pipeline + task ①②③ progress
├── humanTodo.md               # what needs you
└── agileflow-dispatch.json    # subagent dispatch ledger
```

Close the chat, come back, say **"continue agileflow"** — AI reads `todo.md` and picks up. No re-explaining.

---

## Who it's for

| You | AgileFlow helps when… |
|-----|----------------------|
| **Enterprise tech lead / delivery owner** | You need role-based review, stage gates, sign-off reports — not just code |
| **Compliance / QA / internal audit** | Full REQ → impl → acceptance trace; no fake checkboxes |
| **Agencies / vendor handoff** | You deliver an `atlas/` evidence pack, not just a repo |
| **Founders / indie devs** | You need something demoable **and** handoff-ready for the next person |

**Best for enterprise-grade delivery**; casual one-liners and hotfixes → too heavy; use raw AI or AF exempt path.

---

## Install

```bash
git clone https://github.com/aiKeeo/AgileFlow.git
cp -r AgileFlow/skills/agileflow YOUR_PROJECT/.cursor/skills/
```

| Tool | Project path | Global path |
|------|--------------|-------------|
| **Cursor** | `.cursor/skills/agileflow` | `~/.cursor/skills/agileflow` |
| **Claude Code** | `.claude/skills/agileflow` | `~/.claude/skills/agileflow` |
| **Trae** | `.trae/skills/agileflow` | `~/.trae/skills/agileflow` |

Step-by-step → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)

---

## Usage

```
Run agileflow — ship a todo-list API today
```

```
Continue agileflow
```

Stage shortcuts: `write requirements` / `model data` / `design solution` / `implement` / `run acceptance tests`

---

## Repo layout

```
AgileFlow/
├── majorflow.md           # core philosophy
├── AGENT-RETEST.md        # agent smoke-test playbook
├── README.md / README.zh-CN.md
└── skills/agileflow/      # the Skill (SKILL.md, phases/, templates/, scripts/)
```

---

## License

MIT — Issues and PRs welcome.
