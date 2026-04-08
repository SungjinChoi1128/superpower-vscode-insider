---
name: subagent-dev
description: >
  Use when executing implementation plans with independent tasks in the current
  session. Breaks plan execution into isolated units with review between each.
manualInvoke: false
disable-model-invocation: false
---

# Subagent-Driven Development

> **Note:** This skill is degraded vs the superpowers equivalent. VS Code Copilot
> does not support spawning isolated subagents. This skill provides a structured
> inline execution pattern instead.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST NOT skip to the next task** until the current task is fully verified and committed
2. **You MUST run verification commands** after EACH task and show actual output — not summaries
3. **You MUST announce each task** with the exact format: "Starting Task N: [name]"
4. **You MUST report completion** with the exact format showing pass/fail counts and commit hash
5. **You MUST wait for acknowledgement** between tasks — do not auto-continue
6. **You MUST stop immediately** on task failure — do not proceed to next task
7. **If a task has no test command, ASK** — do not assume or skip verification
8. **You MUST use git** — commit after every task with the specified commit message

**Remember: Checkpoints are MANDATORY. Each task is an isolated unit with verification and review.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (skipping the announcement):
> "Let me work on this task now..."
> ❌ **WRONG** — Must announce task with "Starting Task N: [name]"

### BAD (not showing verification output):
> "Tests passed, moving on..."
> ❌ **WRONG** — Must show actual command output, not summaries

### BAD (auto-continuing to next task):
> "Task 1 complete! Now doing Task 2..."
> ❌ **WRONG** — Must wait for user acknowledgement between tasks

### BAD (not using exact commit message):
> "Committed with message: 'fix stuff'"
> ❌ **WRONG** — Must use the exact commit message from the plan

### BAD (skipping verification):
> "The code looks good, let's continue..."
> ❌ **WRONG** — Must run the task's verification command and show output

### GOOD (proper task start):
> "Starting Task 1: Create failing test for user authentication"
>
> **Files:** Create `tests/test_auth.py`
> ✅ **CORRECT** — Clear announcement with task number and name

### GOOD (showing verification output):
> ```
> tests/test_auth.py::test_user_login PASSED
> ================= 1 passed in 0.05s =================
> ```
> ✅ **CORRECT** — Actual command output shown

### GOOD (proper completion report):
> "Task 1 complete. Tests: 1/1 passed. Commit: abc1234"
> ✅ **CORRECT** — Reports completion with test results and commit hash

---

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
