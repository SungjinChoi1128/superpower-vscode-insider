# VS Code Copilot Superpowers Harness — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Context:** Data engineer, GitHub Copilot Business subscription, VS Code Insider

---

## Overview

A global harness for VS Code Insider that replicates the [obra/superpowers](https://github.com/obra/superpowers) experience inside GitHub Copilot Chat. Built on VS Code Insider's native agent skills system (v1.108+), hooks (v1.110+ Preview), and a thin VS Code extension.

Works globally across all projects and repositories — not tied to any specific workspace.

**Tech stack context:** Azure DevOps (repos, wiki, CI/CD, boards), Databricks, MSSQL, Databricks Asset Bundle (DAB), Azure Pipelines, MSSQL→Databricks Lakehouse migration.

**Replication scope:** Replicates all superpowers workflow process skills (brainstorming, TDD, debugging, planning, code review, etc.). ADO/Databricks tool-specific skills are provided by the company environment and are out of scope.

**Known gaps vs superpowers:**

| Gap | Impact | Mitigation |
|---|---|---|
| Skill chaining (invoke next skill) | Less deterministic transitions between workflows | Skills include explicit "next step" instructions; user invokes manually via `@sp` if auto-detection misses |
| Parallel subagent dispatch | No isolated subagent contexts | Skills adapted for inline execution; VS Code background sessions used where possible — **degraded experience** |
| Memory write timing | Written at session end, not mid-conversation | Functionally equivalent — markers captured in transcript, materialised on exit |
| Ask/Chat mode context exploration | No terminal access for `git log` etc. | Fallback to `@workspace`; agent mode required for all workflow skills |

---

## Prerequisites

**Windows 11:** The only runtime prerequisite is **Python 3.8+** accessible on the system PATH. No WSL2, no Git Bash, no bash required.

- All memory scripts are Python (`.py`) — run natively on Windows
- Setup and teardown are PowerShell (`.ps1`) — native on Windows 11
- Hook commands invoke `python` directly

`setup.ps1` checks that Python is accessible and exits with a clear error if not.

---

## Architecture

Four layers:

```
┌─────────────────────────────────────────────────────┐
│  VS Code Extension (@sp chat participant)            │
│  - Skill browser panel                              │
│  - Slash commands  /brainstorm /debug /tdd etc.     │
│  - Skill scaffolding command                        │
└────────────────────┬────────────────────────────────┘
                     │ invokes
┌────────────────────▼────────────────────────────────┐
│  Skills Library  (~/.copilot/skills/)               │
│  - 15 SKILL.md files (superpowers workflows)        │
│  - Auto-detected by VS Code Insider native agent    │
│  - Adapted for data engineering context             │
└────────────────────┬────────────────────────────────┘
                     │ governed by
┌────────────────────▼────────────────────────────────┐
│  Hook System  (~/.copilot/hooks/)                   │
│  - sessionStart → injects MEMORY.md into context    │
│  - sessionEnd  → extracts markers → writes memory   │
└────────────────────┬────────────────────────────────┘
                     │ reads/writes
┌────────────────────▼────────────────────────────────┐
│  Memory System  (~/.copilot/memory/)                │
│  - MEMORY.md (user, feedback, project, reference)   │
│  - extract-memory.py (marker parser)                │
│  - inject-memory.py (context injector)              │
└─────────────────────────────────────────────────────┘
```

---

## Layer 1: Skills Library

### Storage
Global location: `~/.copilot/skills/`
Configured via: `chat.agentSkillsLocations: ["~/.copilot/skills"]`
Auto-detection: `chat.useAgentSkills: true`

### SKILL.md Format
```yaml
---
name: <skill-name>
description: >
  <one paragraph — used by Copilot for auto-detection and invocation.
   Description quality is load-bearing: the more precisely this matches
   the natural language patterns a user would use when triggering this
   workflow, the more reliably Copilot auto-detects it.>
manualInvoke: false
---

<skill instructions>
```

`manualInvoke: false` — Copilot auto-detects and injects the skill based on prompt context. **Auto-detection is best-effort and depends on description quality.** The `@sp /skill-name` explicit invocation via the extension is the reliable, guaranteed invocation path. Auto-detection is a convenience on top of explicit invocation, not the primary path.

### `using-sp` — Always-On Bootstrap Skill

The `using-sp` skill must be active in every session (equivalent to superpowers' `using-superpowers` which is always loaded). Since `manualInvoke: false` relies on context matching and cannot guarantee unconditional loading, `using-sp` content is included in `~/.copilot/instructions/sp-bootstrap.instructions.md` — a global instruction file that Copilot loads automatically on every session. The `skills/using-sp/SKILL.md` exists for discoverability but the bootstrap mechanism is the instruction file.

### Skills (15 total)

All skills replicate their superpowers equivalents' full behavior — including project context exploration steps specific to each skill — adapted for the data engineering tech stack. Every skill instructs Copilot to run context-gathering steps (terminal commands, file reads) before any work, in agent mode.

| Folder | Superpowers equivalent | DE adaptation | Fidelity |
|---|---|---|---|
| `using-sp` | `using-superpowers` | Bootstrap — always loaded via instruction file | Full |
| `brainstorming` | `brainstorming` | Pipeline design, lakehouse architecture, migration scoping. Starts by running `git log`, `git status`, reading docs | Full |
| `writing-plans` | `writing-plans` | DAB deployments, pipeline tasks, migration sprints | Full |
| `executing-plans` | `executing-plans` | Step execution with DE-aware checkpoints. Reads plan doc + git status before each step | Full |
| `tdd` | `test-driven-development` | PySpark unit tests, dbt tests, SQL unit tests (tSQLt/pytest). Reads existing tests + framework config first | Full |
| `debugging` | `systematic-debugging` | Spark errors, pipeline failures, MSSQL/Databricks query issues. Reads error output + recent commits first | Full |
| `requesting-review` | `requesting-code-review` | PySpark, SQL, YAML (Azure Pipelines, DAB). Runs `git log` + `git diff [base]...HEAD` first | Full |
| `receiving-review` | `receiving-code-review` | Technical rigor — verify before accepting suggestions | Full |
| `verification` | `verification-before-completion` | Data quality checks, pipeline validation, row count assertions. Checks test results + pipeline output first | Full |
| `finishing-branch` | `finishing-a-development-branch` | ADO PR creation. Runs `git log`, `git diff`, `git status` first | Full |
| `git-worktrees` | `using-git-worktrees` | Adapted for Azure DevOps Git repos | Full |
| `parallel-agents` | `dispatching-parallel-agents` | Best-effort via VS Code background sessions | **Degraded** |
| `subagent-dev` | `subagent-driven-development` | Best-effort inline | **Degraded** |
| `writing-skills` | `writing-skills` | Create new SKILL.md files for this system | Full |
| `simplify` | `simplify` | Review changed code for reuse, quality, efficiency | Full |

### Context Exploration (all skills)
Every skill replicates its superpowers equivalent's project context gathering. Skills instruct Copilot to run terminal commands (`git log --oneline -10`, `git status`, `git diff`) and read relevant files before any work. Fallback instruction for Ask/Chat mode: use `@workspace`. Agent mode is required for full context exploration.

---

## Layer 2: Hook System

> **Implementation note:** The VS Code Insider hook system (`sessionStart`/`sessionEnd`) is a Preview feature as of v1.110 (February 2026). The JSON contracts described below are based on available documentation. **The first implementation task must be a pilot session to validate the actual hook API shape** — specifically confirming that `inject-memory.sh` stdout is read as the hook response, that `additionalInstructions` is the correct key, and that `transcript_path` is present in the `sessionEnd` stdin payload. If the API differs, scripts must be updated before proceeding to full implementation.

**Fallback if hooks are unavailable or behave differently:** Replace the dynamic injection with a static always-on global instruction file that includes the full memory content (updated by `extract-memory.py` at session end as a standalone script the user runs, or via a VS Code task). This degrades memory to a manual refresh model but preserves all other functionality.

### sessionStart Hook

**File:** `~/.copilot/hooks/session-start.json`
```json
{
  "hooks": {
    "sessionStart": [{
      "type": "command",
      "command": "python ~/.copilot/scripts/inject-memory.py",
      "timeout": 5
    }]
  }
}
```

**Script:** `~/.copilot/scripts/inject-memory.py`

Reads `~/.copilot/memory/MEMORY.md` and writes to stdout the JSON context injection payload:
```json
{
  "additionalInstructions": "## Memory from previous sessions\n\n<MEMORY.md content>"
}
```

- `additionalInstructions` value is a string (not array)
- Script exits 0 on success, exits non-zero if memory file does not exist (treated as no-op by hook runner)
- Invalid JSON output causes hook runner to log a warning and skip injection

### sessionEnd Hook

**File:** `~/.copilot/hooks/session-end.json`
```json
{
  "hooks": {
    "sessionEnd": [{
      "type": "command",
      "command": "python ~/.copilot/scripts/extract-memory.py",
      "timeout": 15
    }]
  }
}
```

**Script:** `~/.copilot/scripts/extract-memory.py`

Receives via stdin:
```json
{
  "timestamp": "<ISO-8601>",
  "session_id": "<uuid>",
  "transcript_path": "<absolute path to transcript file>"
}
```

Transcript format: plain text or JSON (to be confirmed during pilot). Script reads the transcript, regex-parses for memory markers, updates memory files. If no markers found, script exits 0 as a no-op (no changes to MEMORY.md).

---

## Layer 3: Memory System

### Memory Types (same as superpowers)
- `user` — role, preferences, knowledge level
- `feedback` — corrections, guidance, things to avoid or repeat
- `project` — ongoing work, goals, decisions, deadlines
- `reference` — pointers to external systems (ADO boards, Databricks workspace URLs)

### File Structure
```
~/.copilot/memory/
├── MEMORY.md           ← index, injected every session via sessionStart hook
├── user/
│   └── profile.md
├── feedback/
│   └── preferences.md
├── project/
│   └── <project-name>.md
└── reference/
    └── resources.md
```

### Memory Marker Format
Copilot embeds markers in responses when it identifies something memory-worthy:
```
<!-- MEMORY: {"type": "feedback", "content": "...", "file": "preferences.md"} -->
```
Markers are invisible to the user in the rendered chat. `extract-memory.py` materialises them at session end.

The global instruction teaches Copilot to embed markers when it learns: user preferences, corrections, project context, tech stack details, external resource locations.

### Global Instructions

Two global instruction files:

**`~/.copilot/instructions/sp-bootstrap.instructions.md`** — always-on, teaches Copilot the skill system and how to invoke skills. This is the `using-sp` bootstrap mechanism.

**`~/.copilot/instructions/memory.instructions.md`** — always-on, teaches Copilot the memory marker format and when to emit markers.

### File Edit Auto-Approval

Memory writes must not prompt the user for approval on every session exit.

Setting: `chat.tools.edits.autoApprove` with value `"~/.copilot/memory/**"`

> **Validation required:** This setting key must be confirmed against the actual VS Code Insider settings available in the installed version. If this key does not exist, the correct mechanism for auto-approving file edits to a specific glob pattern must be identified during the pilot phase. Without auto-approval, memory writes prompt the user on every session exit.

---

## Layer 4: VS Code Extension

Thin TypeScript extension (~300 lines). Three responsibilities only.

### 1. `@sp` Chat Participant

Registers a chat participant for explicit, guaranteed skill invocation:
```
@sp /brainstorm design a medallion lakehouse for MSSQL migration
@sp /debug Spark OOM on Bronze layer ingestion
@sp /tdd write tests for this transformation function
```

**Implementation detail:** Slash commands are registered as `vscode.ChatCommand` contributions in `package.json` (required for commands to appear in the chat UI autocomplete). In `participant.ts`, each command handler reads the relevant `SKILL.md` from `~/.copilot/skills/<skill-name>/SKILL.md`, prepends its content as a system message, then forwards the user's message to Copilot's language model via `vscode.lm.selectChatModels()`, using the user's currently active model. The participant does not hardcode a model — it inherits the user's active selection.

### 2. Skill Browser Panel

VS Code tree view in sidebar listing all installed skills with descriptions. Click → opens `SKILL.md`. Discoverability only — no logic.

```
SP Skills
├── brainstorming
├── writing-plans
├── executing-plans
├── tdd
├── debugging
├── requesting-review
├── receiving-review
├── verification
├── finishing-branch
├── git-worktrees
├── parallel-agents  (degraded)
├── subagent-dev     (degraded)
├── writing-skills
└── simplify
```

### 3. Skill Scaffolding Command

Command palette: `SP: New Skill` — generates a new `SKILL.md` from template in `~/.copilot/skills/`. For user-created skills beyond the base 15.

### What the extension does NOT do
- No backend, server, or runtime dependency
- No ADO/Databricks API calls (company environment provides these)
- No skill logic (all logic in SKILL.md files)
- No marketplace publishing — installed as local VSIX

### Extension Structure
```
extension/
├── package.json          ← contributes chatParticipants, commands, views
├── src/
│   ├── extension.ts      ← activate(), registers everything
│   ├── participant.ts    ← @sp chat participant + slash command dispatch
│   ├── skillBrowser.ts   ← tree view provider
│   └── scaffolder.ts     ← new skill command
└── tsconfig.json
```

---

## Repository Structure

Single git repo cloned to `~/.copilot/`:

```
~/.copilot/
├── skills/
│   ├── using-sp/SKILL.md
│   ├── brainstorming/SKILL.md
│   ├── writing-plans/SKILL.md
│   ├── executing-plans/SKILL.md
│   ├── tdd/SKILL.md
│   ├── debugging/SKILL.md
│   ├── requesting-review/SKILL.md
│   ├── receiving-review/SKILL.md
│   ├── verification/SKILL.md
│   ├── finishing-branch/SKILL.md
│   ├── git-worktrees/SKILL.md
│   ├── parallel-agents/SKILL.md
│   ├── subagent-dev/SKILL.md
│   ├── writing-skills/SKILL.md
│   └── simplify/SKILL.md
├── hooks/
│   ├── session-start.json
│   └── session-end.json
├── memory/
│   ├── MEMORY.md
│   ├── user/
│   ├── feedback/
│   ├── project/
│   └── reference/
├── instructions/
│   ├── sp-bootstrap.instructions.md
│   └── memory.instructions.md
├── scripts/
│   ├── inject-memory.py
│   └── extract-memory.py
├── extension/
│   ├── package.json
│   ├── src/
│   └── tsconfig.json
├── setup.ps1
├── teardown.ps1
└── README.md
```

### setup.ps1 (one-time)
1. Checks prerequisite: Python 3.8+ accessible on PATH
2. Creates `~/.copilot/memory/` directory structure and empty `MEMORY.md`
3. Registers hooks with VS Code Insider
4. Adds `chat.agentSkillsLocations` and related settings to VS Code user settings
5. Adds instruction files to `github.copilot.chat.codeGeneration.instructions`
6. Builds and installs extension as local VSIX

### teardown.ps1 (rollback)
Reverses all changes made by `setup.ps1`: removes VS Code settings entries, uninstalls VSIX, leaves `~/.copilot/memory/` intact (user data). Documents manual steps if automation is incomplete.

### VS Code Settings (applied by setup.sh)
```json
{
  "chat.agentSkillsLocations": ["~/.copilot/skills"],
  "chat.useAgentSkills": true,
  "github.copilot.chat.codeGeneration.instructions": [
    {"file": "~/.copilot/instructions/sp-bootstrap.instructions.md"},
    {"file": "~/.copilot/instructions/memory.instructions.md"}
  ],
  "chat.tools.edits.autoApprove": "~/.copilot/memory/**"
}
```

### Updating
- Skills/hooks/scripts/instructions: `git pull` in `~/.copilot/` — no reinstall needed
- Extension changes only: re-run `setup.ps1`
- Skills library versioning: user modifications to SKILL.md files should be made in a personal fork or branch to avoid merge conflicts on `git pull`

---

## Implementation Order

1. **Pilot phase** — Validate hook API shape (`sessionStart`/`sessionEnd` JSON contracts, `additionalInstructions` key, `transcript_path`). Validate `chat.tools.edits.autoApprove` setting. Document actual API behaviour before writing any scripts.
2. **Skills library** — Write all 15 SKILL.md files + 2 instruction files
3. **Memory scripts** — `inject-memory.py` + `extract-memory.py` using confirmed API contracts from pilot
4. **Hook config files** — `session-start.json` + `session-end.json`
5. **VS Code extension** — participant, browser, scaffolder
6. **setup.ps1 / teardown.ps1**
7. **End-to-end test** — full session: memory injection at start, workflow skill invocation, memory extraction at end
