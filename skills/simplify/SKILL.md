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
