# am-algos-agentic

> Claude and other LLMs: read this file before making changes to this repository.
> It describes the project, tech stack, conventions, and how to reason before building.

## Purpose

Algorithm and analysis engine that retrieves data from the Data Service (`am-ds-agentic`), performs complex financial and trading analysis (e.g., LIFO matching, price range analysis, fixed allocation recommendations), and distributes results via Mailgun and n8n/Notion integrations.

## Tech Stack

- **Language**: Node.js (ES Modules)
- **Framework**: [N/A - Script/CLI based]
- **Package manager**: npm
- **Key dependencies**: csv-parse, csv-stringify, dotenv, mailgun.js, node-fetch, sqlite3, ejs

## Conventions

- **Commits**: Use conventional commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **Branches**: `feature/<name>`, `fix/<name>`, `chore/<name>`
- **Code style**: Standard JavaScript with ES Modules.
- **Tests**: [No test suite defined yet; verify behavior via sandbox scripts]

---

## Before You Build

When asked to implement a new feature, integration, or utility, run this check **before writing any code**:

1. **Search for existing solutions.** Look for well-maintained open-source libraries (npm, PyPI, crates.io, etc.) or established tools/services that already solve the problem.
2. **Evaluate fit.** If something exists, assess:
   - Does it cover at least ~80% of the requirement without significant workarounds?
   - Is it actively maintained (recent releases, issues responded to)?
   - Is the license compatible with this project?
   - Is the added dependency weight justified for the scope of the problem?
3. **Recommend or proceed.**
   - If a good fit exists: propose using it and briefly explain the trade-offs vs. building custom.
   - If nothing suitable exists, or building custom is clearly better (too heavy, wrong license, poor fit): proceed with implementation and note why in one line.

Do not silently skip this step. A brief note like *"No existing library handles this cleanly — building custom"* is enough when that's the conclusion.

---

## Working in This Repo

When making changes to this pre-existing codebase:

- **Read before writing.** Understand the surrounding code before modifying. Check how similar problems are already solved here.
- **Follow existing patterns.** Match the naming, file structure, and error-handling style already in use — even if you'd do it differently from scratch. Introduce new patterns only when clearly justified.
- **Check for existing abstractions.** Before adding a new utility or helper, search for one that already does it.
- **Minimal footprint.** Change only what's necessary for the task. Don't refactor unrelated code in the same change.
- **Test before and after.** Run the existing test suite before making changes to establish a baseline, and again after to confirm nothing regressed.
- **Explain non-obvious decisions.** Leave a short inline comment when doing something that looks wrong but is intentional.

---

## System Diagram

This project maintains `_alive/system-diagram.md` — a human-readable architecture document written for the developer, not for AI agents.

**Purpose**: Teach someone unfamiliar with this codebase how it works. Assume general programming knowledge but not deep familiarity with every library or language used here. Explain *what* things are and *why* they exist, not just *how* to use them.

**This is not `agent.md`.** `agent.md` is the operational primer for AI agents (conventions, constraints, how to work here). `system-diagram.md` is a human learning document. Do not collapse them.

**When to update `system-diagram.md`**: After any change that meaningfully affects:
- The high-level architecture or system boundaries
- The data flow through the app
- The folder/file structure
- Any major library added, removed, or significantly changed

The file opens with a **Structure manifest** — a short labeled list of its own sections so agents and developers can navigate without reading the whole file. The manifest lives inside `system-diagram.md` (not in `agent.md`) to prevent sync drift between the two files.

Standard headings: Overview, Architecture, Data Flow, Tech Stack, File Map, Next

---

## Design Decisions

This project tracks its design history in [`_alive/`](./_alive/):

- [`_alive/decisions.md`](./_alive/decisions.md) — current decisions (finalized and pending). **Read this before starting any task.**
- [`_alive/timeline.md`](./_alive/timeline.md) — chronological log of discussions, disagreements, and how decisions were reached

Before implementing anything non-trivial, check `_alive/decisions.md` for prior resolutions. After a significant discussion or decision, update both files.

---

## Multi-Agent Setup

This project uses multiple AI agents. All agent instructions live in this file (`agent.md`) — the single source of truth for every agent.

Each agent has a thin pointer file in its own config folder (`.claude/CLAUDE.md`, `.gemini/GEMINI.md`, etc.) that contains one instruction: read `agent.md`. Do not place shared instructions in those pointer files.

**Rules:**
- All conventions, constraints, and architecture context live here in `agent.md`.
- Never put substantive instructions in pointer files — they are navigation only.
- For time-sensitive cross-agent notes (e.g. "I left off mid-task at X"), add a dated entry under a `## Session Notes` section at the bottom of this file.
- If a third agent is added, create a pointer file in its config folder (e.g. `.jules/JULES.md`) pointing to `agent.md`.

---

## Agent Notes

- **Environment**: Configuration via `.env` files (located in `./.dotenv/`).
- **Algos**: Core logic resides in `modules/` (lifo-match, priceRange, etc.).

---

## Template Info

This `agent.md` was generated by the `app-repo-initialize` command.
Canonical template: `app-repo-agent.md` in the workflow-hub agent-md-templates.
Per-project substitutions (project name, purpose) are applied at init time.
