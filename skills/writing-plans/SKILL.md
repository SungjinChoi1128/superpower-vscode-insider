---
name: writing-plans
description: >
  Use when you have a spec or requirements for a multi-step task and need to create
  a detailed implementation plan before touching code. Use after brainstorming is
  complete. Creates bite-sized TDD tasks with exact file paths and commands.
  Required before executing-plans.
manualInvoke: false
---

# Writing Plans — Implementation Planning

Turn approved designs into executable, bite-sized TDD tasks.
Do NOT execute any code or implementation until the plan is complete.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST NOT execute ANY code** (no running commands, no tests, no builds) — this is planning ONLY
2. **You MUST create the plan at the exact path:** `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
3. **You MUST follow TDD format for ALL tasks:** failing test → verify fail → implement → verify pass → commit
4. **You MUST include exact commands with expected output** for every verification step
5. **You MUST end with the EXACT transition phrase** (see Phase 3)
6. **You MUST follow the phases IN ORDER** — do not skip phases
7. **If the user asks you to start coding, REFUSE and redirect** back to planning
8. **Each task MUST be 2-5 minutes of work** — break down large tasks

**Remember: Your role is to PLAN, not to EXECUTE. Execution comes AFTER the plan is complete.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (vague task description):
> "Task 1: Implement the feature"
> 
> ❌ **WRONG** — Not specific, no file paths, no verification steps

### BAD (missing verification steps):
> "Task 2: Write the authentication logic"
> 
> ❌ **WRONG** — No command to verify, no expected output

### BAD (starting execution):
> "I'll start by creating the test file..."
> 
> ❌ **WRONG** — Must NOT execute, only plan

### BAD (not following transition format):
> "Ready to start coding?"
> 
> ❌ **WRONG** — Must use exact transition phrase

### GOOD (specific TDD task format):
> #### Task 1: Create failing test for user authentication
> 
> **Files:** Create `tests/test_auth.py`
> 
> **Command:**
> ```bash
> python -m pytest tests/test_auth.py::test_user_login -v
> ```
> 
> **Expected output:**
> ```
> FAILED tests/test_auth.py::test_user_login - ImportError: cannot import name 'authenticate_user'
> ```
> 
> ✅ **CORRECT** — Specific file, TDD approach, exact command and expected output

---

## Process (follow in order)

### Phase 1: Gather Context (Turn 1/1)

**Purpose:** Understand the spec and project state before writing the plan.

**What to do:**
1. **First, check if specFilePath is available in state** — if the user invoked `@sp /write-plan` after `@sp /brainstorm`, the spec path may have been stored in state. If available, use that path directly.
2. If specFilePath is NOT in state, ask the user: "What is the path to your spec document?"
3. Read the spec document at the determined path (e.g., `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`)
4. Check git context: current branch, recent commits
5. List existing relevant files in the codebase
6. Display summary to user

**Output format — you MUST produce exactly:**
```
> 📋 **Planning Context**
> 
> **Spec location:** `docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md`
> 
> **Key design decisions from spec:**
> - [decision 1]
> - [decision 2]
> - [decision 3]
> 
> **Current branch:** `[branch name]`
> 
> **Relevant existing files:**
> - [file 1]
> - [file 2]
> 
> **Estimated scope:** [N] tasks, approximately [X] minutes
```

**Phase transition:** After 1 turn, automatically proceed to Phase 2.

---

### Phase 2: Write Implementation Plan (Turns 1-N, as needed)

**Purpose:** Create detailed, executable TDD tasks.

**What to do:**
1. Break the spec into bite-sized tasks (2-5 minutes each)
2. Each task MUST follow TDD format
3. Include exact file paths for every create/modify action
4. Include exact commands with expected output for verification
5. Include complete code snippets, not descriptions
6. Save to exact path: `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

**Task format — each task MUST be:**
```
#### Task [N]: [Brief action description]

**Files:** [Create/Modify] `path/to/file.ext`

**Action:** [One sentence description]

**Command:**
```bash
[exact command to run]
```

**Expected output:**
```
[exact expected output]
```

**Code to write:**
```[language]
[complete code snippet]
```
```

**Domain-Specific Testing Patterns:**

For PySpark:
```python
from pyspark.testing import assertDataFrameEqual
```

For MSSQL (tSQLt):
```sql
EXEC tSQLt.NewTestClass 'TestSchema';
```

For dbt:
```bash
dbt test --select model_name
```

For DAB:
```bash
databricks bundle validate
databricks bundle deploy --target dev
```

**Plan header format:**
```markdown
# [Feature] Implementation Plan

> **For agentic workers:** Use @sp /execute-plan or subagent-driven-development.

**Goal:** [one sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [key technologies]
**Estimated Time:** [X] minutes
**Number of Tasks:** [N]
```

**Rules:**
- Do NOT execute any code
- Each step is 2-5 minutes of work
- "Write the failing test" — one step
- "Run it to verify it fails" — one step
- "Write minimal implementation" — one step
- "Run to verify pass" — one step
- "Commit" — one step

**Phase transition:** After all tasks are written and plan is saved, proceed to Phase 3.

---

### Phase 3: Transition (Turn 1/1)

**Purpose:** Explicitly end planning and hand off to execution.

**What to do:**
1. Summarize the plan (number of tasks, estimated time)
2. Tell user EXACTLY what to do next
3. Do NOT start executing

**Output format — you MUST output EXACTLY this:**
```
✅ **Plan Complete!**

**Summary:**
- **Number of tasks:** [N]
- **Estimated time:** [X] minutes
- **Plan location:** `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

**What the plan includes:**
- [Bullet summary of task categories]
- [Key testing approach]
- [Major milestones]

---

**🚀 To execute this plan, type:**

```
@sp /execute-plan
```

**Do NOT start executing. Wait for the execute-plan skill.**
```

**Rules:**
- Must use EXACT format above
- Must NOT start executing
- Must NOT run any commands
- Must tell user to invoke `@sp /execute-plan`

---

## Summary of Phase Gates

| Phase | Min Turns | Max Turns | No Code | Exit Criteria |
|-------|-----------|-----------|---------|---------------|
| 1. Context | 1 | 1 | ✅ | Display context, show spec summary |
| 2. Writing | 1 | N | ✅ | Plan saved with all TDD tasks |
| 3. Transition | 1 | 1 | ✅ | User told to invoke @sp /execute-plan |

---

## Emergency Escape Hatches

If the user REALLY wants to skip ahead:

1. **"Just start coding"** → Refuse politely: "I can't start coding during the planning phase. Let's complete the plan first, then execution will be smooth and systematic."

2. **"Skip the plan"** → If user already has clear tasks: "If you already have clear tasks defined, I can document them in the plan format. What are the specific steps you want to include?"

3. **"I changed my mind"** → Allow going back: "No problem! Would you like me to go back to brainstorming, or modify the current plan?"
