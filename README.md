<!--
  DevFlow - Human-Gated AI Development Workflow
  https://github.com/yourusername/devflow
-->

<p align="center">
  <img src="https://img.shields.io/badge/BDD%20→%20DDD%20→%20SDD%20→%20TDD-8A2BE2" alt="BDD→DDD→SDD→TDD" />
  <img src="https://img.shields.io/badge/1_Hour-Full_Stack_App-brightgreen" alt="1 Hour Full Stack App" />
  <img src="https://img.shields.io/badge/Human_Gate-mandatory-blue" alt="Human Gate Mandatory" />
  <img src="https://img.shields.io/badge/Cursor-Agent_Ready-orange" alt="Cursor Agent Ready" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT" />
</p>

<h1 align="center">DevFlow</h1>
<p align="center">
  <strong>Stop AI from jumping ahead.<br />Enforce real engineering discipline – with your approval at every gate.</strong>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-why-devflow">Why DevFlow?</a> •
  <a href="#-the-5-phases">The 5 Phases</a> •
  <a href="#-skills">Skills</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-faq">FAQ</a> •
  <a href="README.zh-CN.md">中文文档</a>
</p>

---

## 🧠 What Is DevFlow?

**DevFlow is a human‑gated AI development workflow** that turns vague prompts into production‑ready code – without letting the AI skip design, tests, or your approval.

It integrates **BDD, DDD, SDD, and TDD** into a linear, phase‑gated process:

```
Requirements → Data Modeling → Solution Design → Development → Testing
```

At the end of each phase, DevFlow **stops and asks for your confirmation** using `ask_followup_question`. No surprises, no “magic” leaps.

## 🚀 Quick Start

### 1. Install Skills
Copy the `skills/` folder into your Cursor workspace:

```bash
cp -r skills/ .cursor/skills/
```

### 2. Start the flow
In Cursor, type:

```
/dev-flow I need a user authentication system
```

### 3. Follow the gates
Answer a few questions at each phase. In about **one hour**, you'll have:

- ✅ Clear requirements (with Given‑When‑Then scenarios)
- ✅ A domain model and database schema
- ✅ API contracts and task breakdown
- ✅ Fully tested backend + frontend code
- ✅ A delivery report

> **Real example** – from blank project to a running full‑stack app in ~60 minutes.

## 🔥 Why DevFlow?

Most AI tools are **too eager** – they jump straight to code, ignore domain logic, skip tests, and produce “works‑on‑my‑machine” throwaways.

**DevFlow is different.**

| Problem | DevFlow Solution |
|---------|------------------|
| AI writes code without understanding the domain | **DDD** – aggregates, invariants, state machines |
| No shared understanding of behavior | **BDD** – each requirement has Given‑When‑Then scenarios |
| No design, just random files | **SDD** – API contracts + atomic tasks before coding |
| Zero tests, untestable code | **TDD** – red‑green‑refactor, 100% core coverage in rigorous mode |
| AI decides everything without asking you | **Mandatory human gates** – after every phase, you must click “continue” |
| External dependencies block the flow | `specs/humanTodo.md` – AI pauses and waits for your input |

## 📐 The 5 Phases

| Phase | Skill | Output | Human Gate |
|-------|-------|--------|------------|
| 1. **Requirements** | `product-requirement` | `REQ-*.md` (BDD scenarios) | ✅ must confirm |
| 2. **Data Modeling** | `data-modeling` | Domain model, ER diagram, `sql/init.sql` | ✅ must confirm |
| 3. **Solution Design** | `solution-design` | API contracts, task list (`todo.md`) | ✅ must confirm |
| 4. **Development** | `development` | `src/`, `tests/` (TDD driven) | ✅ must confirm |
| 5. **Testing** | `testing` | Test report, delivery report | – flow ends |

> **No phase can start without your explicit “yes”.**  
> The AI physically cannot jump ahead – it uses `ask_followup_question` and stops.

## 🧩 Skills Included

| Skill | Responsibility |
|-------|----------------|
| `dev-flow` | Orchestrates the 5‑phase flow, enforces gates, manages `todo.md` and `humanTodo.md` |
| `product-requirement` | Writes REQ‑*.md with BDD scenarios, version tracking |
| `data-modeling` | Creates domain model (aggregates, invariants), ER diagram, SQL DDL |
| `solution-design` | Writes technical solution, API contracts, atomic tasks |
| `development` | Implements code (fast mode or strict TDD), updates task status |
| `testing` | Runs all tests, validates against BDD scenarios, produces delivery report |
| `task-tracking` | Maintains `specs/todo.md` and `specs/humanTodo.md` |

All skills are **atomic**, **self‑contained**, and designed to work with Cursor’s Agent mode.

## 🎬 How It Works (Minimal Example)

```text
User: /dev-flow Build a simple login page
─────────────────────────────────────────────
✅ Phase 1 done → REQ-001-login.md
⏸️   DevFlow: "Continue to Data Modeling?" [Yes] [No]

User clicks Yes
─────────────────────────────────────────────
✅ Phase 2 done → Domain model (User), ER diagram
⏸️   DevFlow: "Continue to Solution Design?" [Yes] [No]

User clicks Yes
─────────────────────────────────────────────
✅ Phase 3 done → API spec (POST /login), task list
⏸️   DevFlow: "Continue to Development?" [Yes] [No]

User clicks Yes
─────────────────────────────────────────────
✅ Phase 4 done → src/ + tests/ (TDD)
⏸️   DevFlow: "Continue to Testing?" [Yes] [No]

User clicks Yes
─────────────────────────────────────────────
✅ Phase 5 done → Tests pass, delivery report generated.
🎉 Flow complete.
```

## 📁 Project Structure After Running DevFlow

```
specs/
├── requirements/            # REQ-*.md (BDD scenarios)
├── 002-data-model.md        # Domain model, ER, SQL
├── 003-solution.md          # API contracts, architecture
├── 004-test-report.md       # Test results
├── delivery-report.md       # Final deliverable summary
├── todo.md                  # Atomic task list (auto‑updated)
├── humanTodo.md             # Human tasks (API keys, approvals…)
sql/
└── init.sql                 # Database DDL
src/                         # Generated application code
tests/                       # Unit & integration tests
```

## ❓ FAQ

### Does DevFlow only work with Cursor?
It’s designed for **Cursor (Agent mode)** because it uses `ask_followup_question`. But the skills can be adapted to other AI coding assistants that support similar tool calls.

### Can I skip the gates?
**No.** The AI is instructed to **never** proceed without calling `ask_followup_question`. This is enforced at the prompt level. You remain in control.

### How is DevFlow different from `agents-setup` or `cursor-team-kit`?
Those provide many individual skills. DevFlow is **a single opinionated workflow** that chains them together with mandatory human gates and explicit BDD→DDD→SDD→TDD methodology.

### What if I already have existing requirements?
You can skip Phase 1 and manually place your own `REQ-*.md` files, then start from Phase 2.

## 🤝 Contributing

We welcome new skills, improvements to existing ones, or better gate mechanisms. Please open an issue or PR.

## 📄 License

MIT © yourname

---

<p align="center">
  Built for developers who want AI to be a teammate, not a runaway train.
</p>


