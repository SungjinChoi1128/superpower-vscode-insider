---
name: executing-plans
description: >
  Use when you have a written implementation plan to execute step by step with
  review checkpoints. Use after writing-plans is complete. Executes tasks
  sequentially with verification between each task.
manualInvoke: false
---

# Executing Plans — Step-by-Step Implementation

Execute a written implementation plan with verification at every step.
Do NOT skip steps. Do NOT mark incomplete work as done.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST follow steps exactly** — no skipping, no reordering, no "optimizing"
2. **You MUST verify each step before proceeding** — run tests, show output
3. **You MUST checkpoint every 3 tasks** — pause, report status, wait for acknowledgment
4. **You MUST NOT mark incomplete work as done** — if it fails, it fails. Report it.
5. **You MUST commit after each task** — use the exact commit message from the plan
6. **You MUST pause on failure** — do not continue without user guidance
7. **You MUST report task completion** — announce before moving to next task

**Remember: Your role is to EXECUTE VERIFIABLY, not to rush. Slow and correct beats fast and broken.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (skipping verification):
> "I've implemented the feature, moving on to the next task..."
> ❌ **WRONG** — Must run verification commands and show output

### BAD (not reporting checkpoint status):
> "Okay I've done 3 tasks, continuing..."
> ❌ **WRONG** — Must explicitly report checkpoint with: completed, test status, commits, deviations

### BAD (continuing after failure without guidance):
> "The test failed but I'll fix it in the next commit..."
> ❌ **WRONG** — Must stop, report failure details, and wait for user guidance

### BAD (marking incomplete work as done):
> "Task 2 is done (well, mostly, there's one failing test but it's minor)..."
> ❌ **WRONG** — Incomplete is incomplete. Report accurately.

### GOOD (exact step following with verification):
> **Task 2: Implement user authentication**
> 
> Running implementation steps...
> 
> **Verification:**
> ```bash
> $ pytest tests/auth/test_login.py -v
> ================= test session starts =================
> tests/auth/test_login.py::test_valid_login PASSED
> tests/auth/test_login.py::test_invalid_password PASSED
> ================= 2 passed in 0.45s =================
> ```
> 
> ✅ **Task 2 complete.**
> 
> **Commit:** `git commit -m "feat: add user authentication"`
> 
> ---
> 
> **Ready for Task 3.**
> ✅ **CORRECT** — Step followed exactly, verification shown, commit done, completion announced

---

## Phase Gates Overview

| Phase | Purpose | Entry Criteria | Exit Criteria |
|-------|---------|----------------|---------------|
| **Phase 1: Before Starting** | Set up context and load plan | User invokes `@sp /execute-plan` | Plan document read, git context confirmed |
| **Phase 2: Executing Tasks** | Run each task sequentially | Phase 1 complete | All tasks from plan executed |
| **Phase 3: Checkpoints** | Review progress every 3 tasks | Every 3rd task completed | Status reported, user acknowledged |
| **Phase 4: After All Tasks** | Final verification and completion | All tasks from plan done | Full test suite passed, `@sp /verify` invoked |

---

## Phase 1: Before Starting

**Purpose:** Confirm context and load the implementation plan.

**Entry Criteria:** User has invoked `@sp /execute-plan`

**What to do:**
1. Confirm git context (auto-captured for this session):
   > "I can see we are on branch: [X], with recent commits: [Y]. The git status shows: [Z]"

2. Confirm you are on the correct branch. Confirm no uncommitted changes.

3. Ask: **"What is the path to the implementation plan you want to execute?"**
   (e.g., `docs/superpowers/plans/2026-04-06-my-feature.md`)

4. Read the plan document in full before proceeding.

**Phase Transition:** After plan is loaded and confirmed, proceed to Phase 2.

---

## Phase 2: Executing Tasks

**Purpose:** Execute each task from the plan sequentially with verification.

**Entry Criteria:** Phase 1 complete, plan document loaded

**For each task in the plan:**

1. **Announce** the task you are starting:
   ```
   ---
   
   **Task [N]: [Task Title from Plan]**
   
   Starting execution...
   ```

2. **Follow the steps exactly** — do not skip or reorder

3. **Run verification commands** and show actual output:
   ```bash
   $ [verification command]
   [actual output here]
   ```

4. **Commit** at the end of each task (use the exact commit message from the plan):
   ```bash
   $ git commit -m "[exact message from plan]"
   ```

5. **Report** task completion before moving to the next:
   ```
   ✅ **Task [N] complete.**
   
   **Changes made:**
   - [summary of changes]
   
   **Verification status:** [PASS/FAIL with details]
   
   **Commit:** [commit hash]
   
   ---
   
   Ready for Task [N+1].
   ```

**Phase Transition:** After all tasks from plan are executed, proceed to Phase 4.

---

## Phase 3: Checkpoints

**Purpose:** Pause for review every 3 tasks to ensure quality and alignment.

**Entry Criteria:** Every 3rd task completed (Task 3, 6, 9, etc.)

**Checkpoint Format — you MUST produce exactly:**

```
🔷 **CHECKPOINT — Tasks [N-2] to [N] Complete**

**Completed:**
- Task [N-2]: [title] — ✅
- Task [N-1]: [title] — ✅
- Task [N]: [title] — ✅

**Current Test Status:**
```bash
$ [test command from plan]
[actual output]
```

**Git Log (new commits):**
```
[commit hash] [commit message]
[commit hash] [commit message]
[commit hash] [commit message]
```

**Deviations from Plan:**
- [Any deviations and why, or "None — executed exactly as planned"]

---
**⏸️ PAUSE — Waiting for your acknowledgment to continue.**
Type "continue" or provide feedback.
```

**Checkpoint Rules:**
- Do NOT proceed until user acknowledges
- Be honest about deviations
- Show actual test output, not summaries

**Phase Transition:** After user acknowledgment, return to Phase 2 for next batch of tasks.

---

## If a Step Fails

**CRITICAL:** Do NOT skip failed steps. Do NOT mark incomplete work as done.

**Failure Report Format — you MUST produce exactly:**

```
❌ **TASK [N] FAILED — [Task Title]**

**Command that failed:**
```bash
$ [exact command]
```

**Error output:**
```
[full error output]
```

**Diagnosis:**
[Your analysis of what went wrong]

**Proposed fix:**
[Your suggestion for how to fix it]

---
**⏸️ PAUSE — Waiting for your guidance before proceeding.**
Options:
1. "retry" — Try the step again
2. "skip" — Skip this step and continue (not recommended)
3. "modify" — Adjust the approach (describe your proposal)
4. "abort" — Stop execution
```

---

## Phase 4: After All Tasks

**Purpose:** Final verification and completion.

**Entry Criteria:** All tasks from plan have been executed

**What to do:**

1. **Run the full test suite:**
   ```bash
   $ [full test command]
   [actual output]
   ```

2. **Invoke verification:**
   ```
   Running final verification: `@sp /verify`
   ```

3. **Final status report:**
   ```
   ✅ **All Tasks Complete!**
   
   **Summary:**
   - [N] tasks executed
   - [N] commits made
   - Final test status: [PASS/FAIL]
   
   **Commits in this session:**
   [git log output]
   
   ---
   
   🎉 **To finish and create the PR, type:**
   
   ```
   @sp /finish-branch
   ```
   ```

**Phase Transition:** Complete. User should invoke `@sp /finish-branch` to create PR.

---

## Summary of Phase Gates

| Phase | Trigger | Key Output | Exit Criteria |
|-------|---------|------------|---------------|
| 1. Before Starting | `@sp /execute-plan` invoked | Plan loaded, git confirmed | Plan document read |
| 2. Executing Tasks | Plan loaded | Tasks executed one by one | All plan tasks done |
| 3. Checkpoints | Every 3rd task | Checkpoint report | User acknowledgment |
| 4. After All Tasks | All tasks done | Final verification | User told to invoke `@sp /finish-branch` |

---

## Checkpoint Reminder Format

When starting Tasks 4, 7, 10, etc. (after a checkpoint):

```
🔄 **Resuming after checkpoint...**

Last checkpoint: Tasks [N-2] to [N] — Status: ✅ Approved

**Next up:**
- Task [N+1]: [title]
- Task [N+2]: [title]  
- Task [N+3]: [title] (will trigger next checkpoint)

Proceeding with Task [N+1]...
```
