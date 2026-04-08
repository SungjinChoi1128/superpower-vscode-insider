---
name: simplify
description: >
  Use when reviewing recently changed code for reuse opportunities, quality issues,
  and efficiency improvements. Use after implementing a feature to check if the
  code can be simplified. Reviews for DRY, YAGNI, readability, and performance.
manualInvoke: false
---

# Simplify

Review changed code for quality and efficiency. Fix what you find.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST NOT refactor code you did NOT change** — only review files from `git diff HEAD~1`
2. **You MUST run tests after EACH fix** — confirm nothing broke before proceeding
3. **You MUST commit each simplification separately** with message `refactor: <what and why>`
4. **You MUST preserve existing behavior** — refactoring changes structure, not functionality
5. **You MUST NOT combine multiple refactorings** into a single commit
6. **You MUST stop if tests fail** — fix or revert before continuing

**Remember: Your role is to REVIEW AND SIMPLIFY changed code, not to refactor the entire codebase.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (refactoring unchanged files):
> "I noticed some similar patterns in `other_module.py`, so I'll refactor those too..."
>
> ❌ **WRONG** — Only refactor files you changed in this branch

### BAD (skipping tests):
> "This is just a simple rename, it should be fine..."
>
> ❌ **WRONG** — Always run tests after any change

### BAD (combining multiple changes):
> "While I'm at it, I'll also clean up these imports and extract this helper and fix this typo..."
>
> ❌ **WRONG** — One simplification per commit

### BAD (changing behavior):
> "This logic is cleaner if I change the return value from None to empty list..."
>
> ❌ **WRONG** — Refactoring must preserve behavior

### GOOD (focused simplification):
> **Task:** Extract duplicate DataFrame transformation into shared utility
>
> **Files changed:** `src/transforms.py` (extracted `normalize_columns()`)
>
> **Test command:** `python -m pytest tests/test_transforms.py -v`
>
> **Result:** All tests pass
>
> **Commit:** `refactor: extract normalize_columns() utility for DRY`
>
> ✅ **CORRECT** — Single focused change, tested, committed separately

---

## Before Reviewing

Check what changed:
```
git diff HEAD~1
git diff --stat HEAD~1
```

Read the changed files in full context.

## Review Checklist

**DRY (Don't Repeat Yourself):**
- [ ] Is any logic duplicated that could be extracted into a function?
- [ ] Are there similar transformations that could share a utility?

**YAGNI (You Aren't Gonna Need It):**
- [ ] Is there code that handles scenarios that can't happen?
- [ ] Are there parameters/options that have only one possible value?
- [ ] Is there commented-out code that should be deleted?

**Readability:**
- [ ] Do variable and function names describe what they do?
- [ ] Are complex transformations broken into named steps?
- [ ] Are magic numbers/strings replaced with named constants?

**DE-Specific:**
- [ ] PySpark: are there unnecessary `.collect()` calls on large DataFrames?
- [ ] PySpark: are joins using broadcast hint where appropriate?
- [ ] SQL: are there subqueries that could be CTEs for readability?
- [ ] DAB: are there hardcoded paths that should be parameters?

## Applying Fixes

For each issue found:
1. Make the change
2. Run the tests — confirm nothing broke
3. Commit with message: `refactor: <what you simplified and why>`

Do NOT refactor code you didn't change. Stay focused on the current changes.
