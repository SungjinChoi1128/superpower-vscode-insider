---
name: parallel-agents
description: >
  Use when facing 2 or more independent tasks that can be worked on without
  shared state or sequential dependencies. Helps decompose and parallelize
  independent work streams.
manualInvoke: false
disable-model-invocation: false
---

# Dispatching Parallel Work

> **Note:** This skill is degraded vs the superpowers equivalent. VS Code Copilot
> does not support isolated parallel subagents. Work is parallelized by decomposition
> and sequential execution, or by using VS Code background agent sessions manually.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST verify independence BEFORE parallelizing** — tasks must not share mutable state or have input/output dependencies
2. **You MUST use the decomposition template** — draw dependency arrows and identify tasks with no incoming arrows as parallelizable
3. **You MUST NOT create dependencies DURING parallel work** — do not modify shared files or introduce coupling between tasks
4. **You MUST aggregate results properly** — after parallel tasks complete, merge branches and run full test suite
5. **You MUST follow the independence checklist** — confirm each task can be tested independently before splitting
6. **If tasks share state, DO NOT parallelize** — execute them sequentially instead

**Remember: Parallel work requires true independence. False independence leads to merge conflicts, broken tests, and lost work.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (parallelizing dependent tasks):
> "I'll work on the database schema and the API endpoints in parallel."
>
> ❌ **WRONG** — API endpoints depend on the schema. These are not independent.

### BAD (sharing mutable state):
> "Both tasks need to update the config file, but they'll coordinate."
>
> ❌ **WRONG** — Shared mutable state creates race conditions and conflicts.

### BAD (skipping independence verification):
> "These look independent, let's start both."
>
> ❌ **WRONG** — Must explicitly verify using the independence checklist.

### BAD (poor result aggregation):
> "Both tasks are done. Let's see what happened."
>
> ❌ **WRONG** — Must use `git log --oneline --all --graph` and run full test suite after recombination.

### BAD (not using decomposition template):
> "I can keep the dependencies in my head."
>
> ❌ **WRONG** — Must list tasks and draw dependency arrows to identify true parallelizable work.

### GOOD (verifying independence with checklist):
> **Independence Check for Task A and Task B:**
> - [x] No shared mutable state
> - [x] Task A output is not Task B input
> - [x] Task B output is not Task A input
> - [x] Can be tested independently
>
> ✅ **CORRECT** — Explicit verification before parallelizing

### GOOD (clear decomposition with dependency map):
> ```
> Task A (no dependencies) ──┐
>                            ├──> Task C ──> Task E
> Task B (no dependencies) ──┘
>
> Task D (no dependencies)
> ```
> **Parallelizable:** Task A, Task B, Task D (all have no incoming arrows)
>
> ✅ **CORRECT** — Visual dependency map identifies true parallel work

---

> **Note:** This skill is degraded vs the superpowers equivalent. VS Code Copilot
> does not support isolated parallel subagents. Work is parallelized by decomposition
> and sequential execution, or by using VS Code background agent sessions manually.

## When Tasks Can Be Parallelized

Tasks are independent if:
- They don't share mutable state
- Neither task's output is the other's input
- They can be tested independently

## How to Parallelize in VS Code

**Option 1: Background sessions (manual)**
Open multiple VS Code Copilot chat panels.
Assign one independent task per panel.
Each panel works on its task in isolation.

**Option 2: Sequential decomposition**
Order tasks by dependency. Execute them sequentially.
Commit after each task so progress is saved.

## Decomposition Template

Before splitting work:
1. List all tasks
2. Draw dependency arrows between tasks
3. Tasks with no incoming arrows are safe to parallelize
4. Tasks with incoming arrows must wait for their dependencies

## Recombining Work

After parallel tasks complete:
```
git log --oneline --all --graph
```
Merge or rebase branches as appropriate.
Run full test suite after recombination.
