# AgileFlow

**English** | [中文](README.zh-CN.md)

# When the chat closes — what's still in your hands?

Typical AI coding: **close the window = the delivery evaporates**. Code lives in a diff, acceptance criteria live in scrollback, and nobody can prove "done."

**AgileFlow makes the pipeline the product.**
You speak once in plain language. When the run finishes, the repo holds an **`atlas/` evidence pack** you can review, audit, and hand off — not leftovers from a chat thread.

[![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)](skills/agileflow/SKILL.md)
[![npm](https://img.shields.io/badge/npm-%40agileflow%2Fcli-cb3837.svg)](https://www.npmjs.com/package/@agileflow/cli)
[![Gates](https://img.shields.io/badge/validate--atlas-9%20hard%20gates-brightgreen.svg)](skills/agileflow/templates/validate-atlas-gate.md)

```bash
npx @agileflow/cli init          # ~1 minute
/af ship a todo-list API today   # then speak normally
```

---

## What the session actually feels like

| Moment | You do | You get |
|--------|--------|---------|
| **Start** | Type `/af` + what you want | Auto-route: quick fix? explore? or full delivery pipeline |
| **Authority** | Say "you decide" or "I'll decide" | `AF_DECIDE=ai` = fewer stops; `user` = you approve each stage — **docs stay full either way** |
| **Progress** | Watch it move | Orchestrator routes; Subagents write REQ / design / code; ledger records who did what |
| **Hard stop** | Try to code first, docs later | **Gate red = blocked.** No `write-code` green → no business code |
| **Done** | Open `atlas/` | REQ, solution, design notes, runnable `## 结果` proof, acceptance reports — present |
| **Tomorrow** | Just `/af` or "continue" | Resume from `todo.md` — no re-briefing |

**One-line feel:** a delivery partner that lands artifacts, passes gates, and hands off cleanly — not a chat buddy that says "done" in the thread.

---

## Four moves that are hard to copy

### 1. "Done" is decided by a script, not by the model

Nine hard gates (`validate-atlas`). Checkbox without files? Red. Skip design and jump to code? Red.
Done = `exit 0`. CI-ready. Verbal "shipped" does not count.

### 2. One entry: `/af` auto-routes

Don't memorize stage commands. `/af fix login bug` → quick track; `/af build a refund API` → requirements pipeline; bare `/af` → resume.
Power users still jump with `/af-req` `/af-sol` `/af-dev`.

### 3. "You decide" means faster — not thinner

"Don't ask me" / "just finish it" → fewer stops, same-session continue.
You still run req→sol→dev→test and still fill `atlas/`. Speed = less asking + concurrency — **not** fewer docs, **not** skipped stages.

### 4. You hand off an evidence pack, not just a repo

| Typical handoff | AgileFlow handoff |
|-----------------|-------------------|
| Code + "we tested it" | `atlas/`: how to accept, boundaries, per-task run proof, per-REQ sign-off |
| Acceptance criteria in chat | BDD AC owned by REQ (single authority) |
| "We used subagents… somewhere" | `agileflow-dispatch.json` ledger (who / which step / which task) |

Close the IDE and still hand off. Auditors can answer: *how was this requirement proven?*

---

## Get started in ~1 minute

```bash
npx @agileflow/cli init
# → ~/.cursor|claude|qoder|agents|workbuddy|codebuddy/skills/ (agileflow + /af* doorplates)
```

In Cursor / Claude / Qoder / Codex / WorkBuddy:

```
/af build a user login API
```

| Remember one | What it does |
|--------------|--------------|
| **`/af` + plain language** | Auto-match mode and run |
| `/af` | Resume from checkpoint |
| `/af-fix` … `/af-test` | Quick track or jump to a stage |

> Use **`npx @agileflow/cli`** — not bare `npx agileflow` (unrelated package on npm). Details → [QUICKSTART.md](skills/agileflow/QUICKSTART.md).

---

## The pipeline at a glance

```
idea ──▶ req ──▶ model? ──▶ sol ──▶ dev(① design ② code ③ proof) ──▶ test
              │                │         │
              ▼                ▼         ▼
           BDD accept       contracts  ## 结果 really ran
```

Methods map to **BDD → DDD → SDD → TDD**. The point is **traceable stage artifacts**, not ceremony.

Philosophy → [majorflow.md](majorflow.md) · Execution → [SKILL.md](skills/agileflow/SKILL.md)

---

## Open `atlas/` — this is what you see

```
atlas/
├── requirements/REQ-*.md       ← acceptance authority (Given/When/Then)
├── solution/                   ← architecture · contracts · boundaries
├── dev/T-*.md                  ← per-task design + ## 结果 (command + exit code)
├── tests/REQ-*-验收报告.md     ← PASS / FAIL / BLOCKED-HUMAN
├── todo.md                     ← progress bar; survives closed chats
├── humanTodo.md                ← only humans can unblock (no fake PASS)
└── agileflow-dispatch.json     ← auditable dispatch ledger
```

That's the gap vs "chat and scatter": **artifacts on disk, process replayable.**

---

## vs OpenSpec / Superpowers — different layer

All three stop blind coding. **Different job:**

| | OpenSpec | Superpowers | **AgileFlow** |
|---|----------|-------------|---------------|
| Owns | How specs evolve | How the plan executes (TDD) | **Whether the delivery pack is complete & evidenced** |
| "Done" | Soft / honor | Skills + review | **CLI hard-block; exit 0 to advance** |
| You leave with | Living `specs/` | Plan + code discipline | **Full `atlas/` + sign-off reports + ledger** |

| Your situation | Better fit |
|----------------|------------|
| Mature repo, small increments, long-lived specs | OpenSpec |
| Solo/squad, strong TDD, long subagent runs | Superpowers |
| **Handoff, audit, sign-off, demo *and* docs** | **AgileFlow** |
| One-line fix / pure Q&A | Raw AI or AF exempt / quick track |

Full dimension table + metrics (9 gates · 63+ fixtures · 40+ rules) → appendix below.

---

## Who it's for · who it's not

**You'll love it if…**

- Agency / vendor: client wants "how do we accept?" not only "does it run?"
- Tech lead: role-based review (req / sol / dev zones), not everything in chat
- Compliance / QA: full REQ → impl → acceptance chain; no fake checkboxes
- Zero-to-MVP: demo today, hand off to someone else tomorrow

**It will feel heavy if…**

- You only need a one-line copy tweak or a concept answer — use raw AI or `/af-fix` / exempt paths
  (The main chain is heavy on purpose: delivery evidence is not optional.)

---

## Install

**Recommended — user-level (all hosts once):**

```bash
npx @agileflow/cli init
```

**Project-level:**

```bash
cd YOUR_PROJECT
npx @agileflow/cli init --root . --tools cursor
# optional: --tools cursor,claude,codex,workbuddy,codebuddy,qoder
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

| Host | User-level | Project |
|------|------------|---------|
| Cursor | `~/.cursor/skills/` | `.cursor/skills/` |
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.agents/skills/` | `.agents/skills/` |
| WorkBuddy | `~/.workbuddy/skills/` | `.workbuddy/skills/` |
| CodeBuddy | `~/.codebuddy/skills/` | `.codebuddy/skills/` |
| Qoder | `~/.qoder/skills/` | `.qoder/skills/` |

`phases/*` resolve against the **agileflow skill root** (usually sibling to doorplates), not an empty workspace root. After `flow.yaml` changes: `npx @agileflow/cli update --step-skills-only --root .`

Gate example:

```bash
npx @agileflow/cli gate --gate write-code --root .
```

---

## Repo layout

```
AgileFlow/
├── majorflow.md
├── AGENT-RETEST.md
├── README.md / README.zh-CN.md
└── skills/agileflow/            # npm @agileflow/cli
    ├── SKILL.md · phases/ · templates/
    ├── cli/ · bin/
    └── scripts/validate-atlas/
```

---

## License

MIT — Issues and PRs welcome.

---

<details>
<summary><b>Appendix: full comparison table & metrics</b></summary>

### Dimension comparison

| Dimension | Raw AI | [OpenSpec](https://openspec.dev) | [Superpowers](https://github.com/obra/superpowers) | **AgileFlow** |
|-----------|:------:|:--------------------------------:|:--------------------------------------------------:|:-------------:|
| Structured stages | ❌ | ⚠️ Fluid OPSX | ✅ Brainstorm→plan→execute | ✅ **req→model→sol→dev→test** |
| Machine hard-block | ❌ | ❌ Soft verify | ❌ No unified gate | ✅ **9 gates** |
| Checkbox = files + proof | ❌ | ⚠️ Honor | ⚠️ Review | ✅ **Enforced** |
| Enterprise delivery trace | ❌ | ⚠️ Spec deltas | ⚠️ Plan + review | ✅ **AC backfill + reports** |
| Role-based review | ❌ | ⚠️ | ⚠️ | ✅ **Five zones** |
| CI "done" | ❌ | ❌ | ❌ | ✅ **exit 0** |
| External dep blocks | ❌ | ❌ | ❌ | ✅ **humanTodo** |
| Resume after chat | ❌ | ✅ | ⚠️ | ✅ **todo + env** |
| Auditable dispatch | ❌ | ❌ | ✅ | ✅ **dispatch ledger** |
| You decide / I decide | — | — | — | ✅ **AF_DECIDE** |
| Simple CRUD with docs | Often none | Faster | 1–3h | **~1h with full atlas** |

### Metrics

| Metric | Value |
|--------|-------|
| Hard-block gates | **9** |
| Validation fixtures | **63+** |
| Rule modules | **40+** |
| Phase playbooks | **8** |
| E2E agent retest | [AGENT-RETEST.md](AGENT-RETEST.md) |

</details>
