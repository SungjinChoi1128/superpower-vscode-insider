---
name: subagent-dev
description: >
  Use when executing implementation plans with independent tasks in the current
  session. Breaks plan execution into isolated units with review between each.
manualInvoke: false
---

# Subagent-Driven Development

> **Note:** This skill is degraded vs the superpowers equivalent. VS Code Copilot
> does not support spawning isolated subagents. This skill provides a structured
> inline execution pattern instead.

## Process

For each task in the implementation plan:

1. **Announce** the task: "Starting Task N: [name]"
2. **Read** the task's file list and steps
3. **Execute** each step exactly as written
4. **Verify** using the task's test commands — show actual output
5. **Commit** using the task's commit message
6. **Report** completion: "Task N complete. Tests: [pass/fail count]. Commit: [hash]"

## Between Tasks

After each task:
```
git log --oneline -3
pytest tests/ -q  (or relevant test command)
```

Report status. Wait for acknowledgement before continuing.

## If a Task Fails

Stop immediately. Do not continue to the next task.
Report: failing step, error output, diagnosis.
Wait for guidance.
