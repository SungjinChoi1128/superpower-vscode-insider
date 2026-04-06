---
name: parallel-agents
description: >
  Use when facing 2 or more independent tasks that can be worked on without
  shared state or sequential dependencies. Helps decompose and parallelize
  independent work streams.
manualInvoke: false
---

# Dispatching Parallel Work

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
