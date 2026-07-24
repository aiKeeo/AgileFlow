# AgileFlow

**English** | [中文](README.zh-CN.md)

<br>

<p align="center">
  <strong>When the chat closes — what's still in your hands?</strong>
</p>

<p align="center">
Typical AI coding: close the window = the delivery evaporates.<br>
Code lives in a diff. Acceptance criteria live in scrollback. Nobody can prove “done.”
</p>

<p align="center">
  <b>AgileFlow makes the pipeline the product.</b><br>
  Speak once in plain language. When the run finishes, the repo holds an <code>atlas/</code> evidence pack you can review, audit, and hand off.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agileflow/cli"><img src="https://img.shields.io/npm/v/@agileflow/cli.svg?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="skills/agileflow/templates/validate-atlas-gate.md"><img src="https://img.shields.io/badge/gates-9%20hard-brightgreen?style=flat-square" alt="gates"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <img src="https://img.shields.io/badge/hosts-Cursor%20%7C%20Claude%20%7C%20Codex%20%7C%20Qoder%20%7C%20WorkBuddy%20%7C%20CodeBuddy-111?style=flat-square" alt="hosts">
</p>

<p align="center">
<pre>
npx @agileflow/cli init
/af ship a todo-list API today
</pre>
</p>

---

## Get started in 30 seconds

```bash
# 1. Install once (user-level, all hosts)
npx @agileflow/cli init

# 2. In Cursor / Claude / Codex / Qoder / WorkBuddy / CodeBuddy, say:
/af build a user login API
```

That's it. The agent picks a track, lands artifacts, writes code, and passes gates. You only choose “you decide” or “I'll decide” at kickoff.

| Remember one | What it does |
|--------------|--------------|
| **`/af` + plain language** | Auto-match: quick fix / explore / full delivery |
| `/af` | Resume from checkpoint |
| `/af-req` … `/af-test` | Power-user stage jumps |

> Use **`npx @agileflow/cli`** — not bare `npx agileflow` (unrelated package on npm).

---

## What a session feels like

```
You  /af build a refund API — demo today
AI   → Routes to full delivery pipeline
     → Asks: you decide, or I decide? (docs stay full either way)
You  You decide
AI   → Subagent writes REQ (BDD AC)
     → Solution + contracts land on disk
     → write-code gate green → implementation
     → Per-task ## 结果 (commands that actually ran)
     → Acceptance report PASS / FAIL
You  Open atlas/ — evidence pack is ready to hand off
```

Tomorrow, just type `/af` or “continue” — resume from `todo.md`. No re-briefing.

---

## Four moves that are hard to copy

### 1. “Done” is decided by a script

Nine hard gates (`validate-atlas`). Checkbox without files? Red. Skip design and jump to code? Red.

**Done = `exit 0`.** Verbal “shipped” does not count. CI-ready.

### 2. One entry: `/af`

Don't memorize stage commands.

- `/af fix login bug` → quick track  
- `/af build a refund API` → requirements pipeline  
- bare `/af` → resume  

### 3. “You decide” means faster — not thinner

Fewer stops, same-session continue — you still run req→sol→dev→test and still fill `atlas/`.  
Speed = less asking + concurrency — **not** fewer docs, **not** skipped stages.

### 4. You hand off an evidence pack

| Typical handoff | AgileFlow handoff |
|-----------------|-------------------|
| Code + “we tested it” | `atlas/`: how to accept, boundaries, run proof, sign-off |
| Acceptance criteria in chat | BDD AC owned by REQ (single authority) |
| “We used subagents… somewhere” | `agileflow-dispatch.json` ledger |

Close the IDE and still hand off. Auditors can answer: **how was this requirement proven?**

---

## The pipeline at a glance

```text
idea ──▶ req ──▶ model? ──▶ sol ──▶ dev (design → code → proof) ──▶ test
           │                  │                │
           ▼                  ▼                ▼
        BDD accept         contracts        ## 结果 really ran
```

Maps to **BDD → DDD → SDD → TDD**. The point is **traceable stage artifacts**, not ceremony.

Philosophy → [majorflow.md](majorflow.md) · Execution → [SKILL.md](skills/agileflow/SKILL.md) · Details → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)

---

## Open `atlas/` — this is what you see

```text
atlas/
├── requirements/REQ-*.md     # acceptance authority (Given / When / Then)
├── solution/                 # architecture · contracts · boundaries
├── dev/T-*.md                # per-task design + ## 结果 (command + exit code)
├── tests/REQ-*-验收报告.md   # PASS / FAIL / BLOCKED-HUMAN
├── todo.md                   # progress bar; survives closed chats
├── humanTodo.md              # only humans can unblock (no fake PASS)
└── agileflow-dispatch.json   # auditable dispatch ledger
```

**Artifacts on disk. Process replayable.** That's the gap vs “chat and scatter.”

---

## vs OpenSpec / Superpowers — different layer

All three stop blind coding. **Different job:**

| | OpenSpec | Superpowers | **AgileFlow** |
|---|----------|-------------|---------------|
| Owns | How specs evolve | How the plan executes (TDD) | **Whether the delivery pack is complete & evidenced** |
| “Done” | Soft verify | Skills + review | **CLI hard-block; `exit 0` to advance** |
| You leave with | `specs/` | Plan + code discipline | **Full `atlas/` + sign-off + ledger** |

| Your situation | Better fit |
|----------------|------------|
| Mature repo, small increments, long-lived specs | OpenSpec |
| Solo / squad, strong TDD, long subagent runs | Superpowers |
| **Handoff, audit, sign-off, demo *and* docs** | **AgileFlow** |
| One-line fix / pure Q&A | Raw AI, or `/af-fix` |

Full comparison + metrics → appendix below.

---

## Who it's for · who it's not

**You'll love it if…**

- **Agency / vendor**: clients want “how do we accept?” — not only “does it run?”
- **Tech lead**: role-based review (req / sol / dev), not everything in chat
- **Compliance / QA**: full REQ → impl → acceptance chain; no fake checkboxes
- **Zero-to-MVP**: demo today, hand off to someone else tomorrow

**It will feel heavy if…**

You only need a one-line copy tweak or a concept answer — use raw AI or `/af-fix`.  
The main chain is heavy on purpose: **delivery evidence is not optional.**

---

## Install

**Recommended — user-level (all hosts once)**

```bash
npx @agileflow/cli init
```

**Project-level**

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

> WorkBuddy and CodeBuddy use different directories; `--tools workbuddy` or `codebuddy` installs **both**.

After `flow.yaml` changes:

```bash
npx @agileflow/cli update --step-skills-only --root .
```

Gate example:

```bash
npx @agileflow/cli gate --gate write-code --root .
```

---

## Repo layout

```text
AgileFlow/
├── majorflow.md                 # methodology
├── AGENT-RETEST.md              # end-to-end retest handbook
├── README.md / README.zh-CN.md
└── skills/agileflow/            # npm: @agileflow/cli
    ├── SKILL.md · phases/ · templates/
    ├── cli/ · bin/
    └── scripts/validate-atlas/
```

---

## License

MIT — [Issues](https://github.com/aiKeeo/AgileFlow/issues) and PRs welcome.

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
| CI “done” | ❌ | ❌ | ❌ | ✅ **exit 0** |
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
