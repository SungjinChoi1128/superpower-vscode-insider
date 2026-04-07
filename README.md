# SP Superpowers — VS Code Copilot Harness

A VS Code Insider harness that replicates the [obra/superpowers](https://github.com/obra/superpowers) workflow experience in GitHub Copilot Chat.

**Goal:** Bring structured workflow skills (brainstorming, TDD, code review, etc.) to VS Code Copilot with auto-captured git context and memory persistence.

---

## Features

- **15 Workflow Skills** — brainstorming, TDD, debugging, code review, and more
- **Auto Git Context** — `git log` and `git status` captured automatically for every skill
- **Memory System** — Persistent memory that survives across sessions
- **Skill Chaining** — Skills guide you to the next step automatically
- **VS Code Extension** — `@sp` chat participant for explicit skill invocation

---

## Prerequisites

- Windows 11
- [VS Code Insider](https://code.visualstudio.com/insiders/)
- Python 3.8+
- Git

---

## Installation

### Step 1: Clone or Copy the Repository

```powershell
git clone <your-repo-url> $env:USERPROFILE\ superpower-vscode-insider
cd $env:USERPROFILE\ superpower-vscode-insider
```

### Step 2: Run Setup

```powershell
.\setup.ps1
```

The setup script will:
1. Check Python is installed
2. Create `~/.copilot/memory/` directories
3. Copy skills, hooks, scripts, and instructions to `~/.copilot/`
4. Update VS Code Insider settings
5. Build and install the VS Code extension

### Step 3: Restart VS Code Insider

**Completely close VS Code Insider** (File → Exit), then reopen.

### Step 4: Verify

1. Open Copilot Chat
2. Type: `@sp /help`
3. You should see available skills

---

## Usage

### Available Skills

| Command | Skill | When to Use |
|---------|-------|-------------|
| `@sp /brainstorm` | Brainstorming | Before designing anything new |
| `@sp /write-plan` | Writing Plans | After brainstorming, to create an implementation plan |
| `@sp /execute-plan` | Executing Plans | To execute a written plan step by step |
| `@sp /tdd` | TDD | When implementing features with test-driven development |
| `@sp /debug` | Debugging | When encountering bugs or errors |
| `@sp /verify` | Verification | Before claiming work is complete |
| `@sp /request-review` | Requesting Review | Before creating a PR |
| `@sp /receive-review` | Receiving Review | When handling code review feedback |
| `@sp /finish-branch` | Finishing Branch | When ready to create a PR |
| `@sp /worktree` | Git Worktrees | To create isolated workspaces |
| `@sp /write-skill` | Writing Skills | To create new skills |
| `@sp /simplify` | Simplify | To review code for quality |

### Example Workflow

```
1. @sp /brainstorm
   → Design the feature with guided questions
   → Saves design to docs/superpowers/specs/

2. @sp /write-plan
   → Creates implementation plan with TDD tasks
   → Saves plan to docs/superpowers/plans/

3. @sp /execute-plan
   → Executes tasks step by step with checkpoints

4. @sp /finish-branch
   → Creates PR with clean commit history

5. @sp /receive-review
   → Handles review feedback with two-stage process
```

### Worktree Commands

```
@sp /worktree list                                    — Show all worktrees
@sp /worktree create my-feature -b feature/my-feature  — Create worktree with branch
@sp /worktree remove my-feature                       — Remove worktree
```

---

## Memory System

The memory system persists context across sessions. To save memories:

1. The LLM saves memories automatically at session end via `<!-- MEMORY: ... -->` markers
2. Memories are extracted and stored in `~/.copilot/memory/`
3. On next session, memories are automatically injected into skill context

### Memory File Structure

```
~/.copilot/memory/
├── MEMORY.md           — Index of all memories
├── user/               — User profile and preferences
├── feedback/           — Corrections and guidance
├── project/            — Project context and goals
└── reference/         — External system locations
```

---

## Updating

```powershell
cd $env:USERPROFILE\ superpower-vscode-insider
git pull
.\setup.ps1
```

---

## Troubleshooting

### Python not found
```powershell
# Verify Python
python --version

# Install if needed
winget install Python.Python.3.11
```

### Extension not loading
```powershell
# Reinstall extension
code-insiders --install-extension $env:USERPROFILE\ superpower-vscode-insider\extension\sp-superpowers.vsix
```

### Skills not showing
```powershell
# Check skills directory
dir $env:USERPROFILE\.copilot\skills\
```

### Hooks not firing
Hooks require VS Code Insider restart. If issues persist, the hook API is a preview feature and may have limitations.

---

## Architecture

```
~/.copilot/                   ← Global harness (works across all projects)
├── skills/                   ← 15 SKILL.md files
├── hooks/                    ← session-start.json, session-end.json
├── instructions/            ← Bootstrap and memory instructions
├── scripts/                 ← Python memory scripts
└── memory/                  ← Persistent memory files

extension/                    ← VS Code extension source
├── src/
│   ├── extension.ts         ← Activation entry point
│   ├── participant.ts       ← @sp chat participant (injects git context + memory)
│   ├── skillBrowser.ts      ← SP Skills tree view
│   └── scaffolder.ts        ← SP: New Skill command
└── package.json
```

---

## Tech Stack

- **Skills:** Markdown (SKILL.md files)
- **Memory:** Python 3.8+
- **Extension:** TypeScript + VS Code API
- **Setup:** PowerShell 7+
- **Hooks:** JSON config

---

## License

MIT
