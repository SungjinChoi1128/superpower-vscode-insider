# VS Code Copilot Superpowers Harness — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Context:** Data engineer, GitHub Copilot Business subscription, VS Code Insider

---

## Overview

A global harness for VS Code Insider that replicates the [obra/superpowers](https://github.com/obra/superpowers) experience inside GitHub Copilot Chat. Built on VS Code Insider's native agent skills system (v1.108+), hooks (v1.110+), and a thin VS Code extension.

Works globally across all projects and repositories — not tied to any specific workspace.

**Tech stack context:** Azure DevOps (repos, wiki, CI/CD, boards), Databricks, MSSQL, Databricks Asset Bundle (DAB), Azure Pipelines, MSSQL→Databricks Lakehouse migration.

**Replication fidelity:** ~95% of superpowers experience. Remaining 5% gap is parallel subagent dispatch (no VS Code equivalent of Claude Code's `Agent` tool).

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
│  - inject-memory.sh (context injector)              │
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
  <one paragraph — used by Copilot for auto-detection and invocation>
manualInvoke: false
---

<skill instructions>
```

`manualInvoke: false` — Copilot auto-detects and injects the skill based on prompt context, no manual `/` invocation required. Skills can also be explicitly invoked via the `@sp` participant.

### Skills (15 total)

All skills replicate their superpowers equivalents' full behavior — including project context exploration steps specific to each skill — adapted for the data engineering tech stack.

| Folder | Superpowers equivalent | DE adaptation |
|---|---|---|
| `using-sp` | `using-superpowers` | Bootstrap — teaches Copilot the skill system, loaded every session |
| `brainstorming` | `brainstorming` | Data pipeline design, lakehouse architecture, migration scoping. Starts by running `git log`, `git status`, reading docs |
| `writing-plans` | `writing-plans` | DAB deployments, pipeline tasks, migration sprints |
| `executing-plans` | `executing-plans` | Step execution with DE-aware review checkpoints. Reads plan doc + git status before each step |
| `tdd` | `test-driven-development` | PySpark unit tests, dbt tests, SQL unit tests (tSQLt/pytest). Reads existing tests + test framework config first |
| `debugging` | `systematic-debugging` | Spark errors, pipeline failures, MSSQL/Databricks query issues. Reads error output + recent commits first |
| `requesting-review` | `requesting-code-review` | PySpark, SQL, YAML (Azure Pipelines, DAB configs). Runs `git log` + `git diff [base]...HEAD` first |
| `receiving-review` | `receiving-code-review` | Technical rigor — verify before accepting suggestions |
| `verification` | `verification-before-completion` | Data quality checks, pipeline validation, row count assertions. Checks test results + pipeline output first |
| `finishing-branch` | `finishing-a-development-branch` | ADO PR creation. Runs `git log`, `git diff`, `git status` first |
| `git-worktrees` | `using-git-worktrees` | Adapted for Azure DevOps Git repos |
| `parallel-agents` | `dispatching-parallel-agents` | Best-effort via VS Code background sessions |
| `subagent-dev` | `subagent-driven-development` | Best-effort inline |
| `writing-skills` | `writing-skills` | Create new SKILL.md files for this system |
| `simplify` | `simplify` | Review changed code for reuse, quality, efficiency |

### Context Exploration
Every skill replicates its superpowers equivalent's project context gathering. In agent mode, skills instruct Copilot to run terminal commands (`git log`, `git status`, file reads) before any work. Fallback instruction included for Ask/Chat mode: use `@workspace` for codebase context.

---

## Layer 2: Hook System

### sessionStart Hook

**File:** `~/.copilot/hooks/session-start.json`
```json
{
  "hooks": {
    "sessionStart": [{
      "type": "command",
      "command": "bash ~/.copilot/scripts/inject-memory.sh",
      "timeout": 5
    }]
  }
}
```

**Script:** `~/.copilot/scripts/inject-memory.sh`
Reads `~/.copilot/memory/MEMORY.md` and outputs JSON with `additionalInstructions` key, injecting memory content into the session context at startup.

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
- Receives session JSON via stdin (includes `transcript_path`)
- Reads transcript file
- Regex-parses for `<!-- MEMORY: {...} -->` markers
- Appends extracted entries to appropriate memory files
- Updates `~/.copilot/memory/MEMORY.md` index

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
├── MEMORY.md           ← index, loaded every session via sessionStart hook
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
Markers are invisible to the user. `extract-memory.py` materialises them at session end.

### Global Instruction
**File:** `~/.copilot/instructions/memory.instructions.md`

Instructs Copilot to embed memory markers when it learns: user preferences, corrections, project context, tech stack details, external resource locations.

### Auto-approve
`chat.tools.edits.autoApprove: "~/.copilot/memory/**"` — memory writes don't prompt for confirmation.

---

## Layer 4: VS Code Extension

Thin TypeScript extension (~300 lines). Three responsibilities only.

### 1. `@sp` Chat Participant
Registers a chat participant for explicit skill invocation:
```
@sp /brainstorm design a medallion lakehouse for MSSQL migration
@sp /debug Spark OOM on Bronze layer ingestion
@sp /tdd write tests for this transformation function
```
Each slash command reads the relevant `SKILL.md` and prepends its content to context before passing the message to Copilot. Complements (does not replace) native auto-detection.

### 2. Skill Browser Panel
VS Code tree view in sidebar listing all installed skills with descriptions. Click → opens SKILL.md. Discoverability only — no logic.

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
│   ├── participant.ts    ← @sp chat participant + slash commands
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
│   └── memory.instructions.md
├── scripts/
│   ├── inject-memory.sh
│   └── extract-memory.py
├── extension/
│   ├── package.json
│   ├── src/
│   └── tsconfig.json
├── setup.sh
└── README.md
```

### setup.sh (one-time)
1. Creates `~/.copilot/memory/` directory structure
2. Registers hooks with VS Code Insider
3. Adds `chat.agentSkillsLocations` to VS Code user settings
4. Adds `memory.instructions.md` to global Copilot instructions
5. Builds and installs extension as local VSIX
6. Initialises empty `MEMORY.md`

### VS Code Settings (applied by setup.sh)
```json
{
  "chat.agentSkillsLocations": ["~/.copilot/skills"],
  "chat.useAgentSkills": true,
  "github.copilot.chat.codeGeneration.instructions": [
    {"file": "~/.copilot/instructions/memory.instructions.md"}
  ],
  "chat.tools.edits.autoApprove": "~/.copilot/memory/**"
}
```

### Updating
- Skills/hooks/scripts: `git pull` in `~/.copilot/` — no reinstall needed
- Extension changes: re-run `setup.sh`

---

## Known Gaps vs Superpowers

| Gap | Impact | Mitigation |
|---|---|---|
| Skill chaining (invoke next skill) | Less deterministic transitions between workflows | Skills include explicit "next step" instructions; user invokes manually if auto-detection misses |
| Parallel subagent dispatch | No isolated subagent contexts | Skills adapted for inline execution; background VS Code sessions used where possible |
| Memory write timing | Written at session end, not mid-conversation | Functionally equivalent — markers captured in transcript, materialised on exit |
| Ask/Chat mode context exploration | No terminal access for `git log` etc. | Fallback to `@workspace`; agent mode recommended for all workflow skills |
