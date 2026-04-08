---
name: requesting-review
description: >
  Use when completing a task or feature and preparing to create an ADO pull request.
  Use before creating a PR to verify the work is complete and well-documented.
  Runs git checks and prepares the PR description.
manualInvoke: false
disable-model-invocation: false
---

# Requesting Code Review

Prepare your work for ADO pull request review.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST pass the self-review checklist BEFORE creating any PR** — no exceptions
2. **You MUST NOT request external review without completing self-review first** — self-review is mandatory
3. **You MUST run the full test suite and verify ALL tests pass** — partial passes are not acceptable
4. **You MUST check for debug code, commented-out blocks, and TODOs** — clean code only
5. **You MUST verify commit messages are clean and descriptive** — no "WIP" or "fix" commits
6. **You MUST ensure the PR description follows the exact format** — summary and test plan required
7. **You MUST confirm all checklist items are checked** — unchecked items = incomplete review

**Remember: External reviewers catch what you missed. Self-review catches what you should have seen.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (creating PR without self-review):
> "I think it's ready. Let me create the PR and see what the reviewers say."
> ❌ **WRONG** — Must complete self-review checklist first

### BAD (skipping the test suite):
> "The tests should pass. I'll just create the PR."
> ❌ **WRONG** — Must actually run tests and verify output

### BAD (incomplete checklist):
> "Most of these don't apply to my change..."
> ❌ **WRONG** — Every item must be checked or explicitly N/A with reason

### BAD (vague PR description):
> "Fixed the bug. Tests pass."
> ❌ **WRONG** — Must follow format with summary and test plan

### GOOD (thorough self-review):
> "✅ All tests passed (pytest -v output attached)
> ✅ No debug code found (grep -r 'print(' 'debugger' completed)
> ✅ All checklist items verified
> ✅ PR description follows template"
> ✅ **CORRECT** — Complete self-review before requesting external review

---

## Before Creating the PR

**IMPORTANT:** Git context has been auto-captured. Display what you found:

> "Changes since main: [X] commits. Git status: [Y]."

Confirm:
- All tests pass (run the full test suite, show output)
- No debug code, no commented-out blocks, no TODOs left
- Commit messages are clean and descriptive

---

## Self-Review Checklist — MANDATORY

**DO NOT PROCEED TO PR CREATION UNTIL ALL APPLICABLE ITEMS ARE CHECKED**

### Universal Checks (All PRs):
- [ ] Ran full test suite — ALL tests pass
- [ ] No debug code (no `print()`, `debugger`, `console.log`, `import pdb`)
- [ ] No commented-out code blocks
- [ ] No TODO/FIXME comments left in code
- [ ] Commit messages are clean and descriptive
- [ ] Branch is up-to-date with main/trunk
- [ ] No sensitive data (passwords, keys, tokens) in code

### For PySpark/Python:
- [ ] Functions have clear single responsibilities
- [ ] Error handling for null values and schema mismatches
- [ ] No hardcoded paths, connection strings, or credentials
- [ ] Tests cover the main behavior and edge cases

### For SQL (MSSQL / Databricks SQL):
- [ ] No SELECT * in production queries
- [ ] Joins have explicit ON conditions
- [ ] NULL handling is explicit (COALESCE, IS NULL checks)
- [ ] Indexes considered for MSSQL queries

### For DAB / YAML configs:
- [ ] `databricks bundle validate` passes
- [ ] Target environments are correct (dev/staging/prod)
- [ ] No hardcoded workspace paths

### For Azure Pipelines:
- [ ] Pipeline runs successfully in dev/test
- [ ] Service connections are correct
- [ ] Artifact paths are correct

**Self-Review Confirmation:**
> I have completed self-review and verified all applicable checklist items. ✅

---

## Draft PR Description

Use this exact format:

```
## Summary
- [what changed]
- [why it changed]

## Test Plan
- [ ] [test command and expected output]
- [ ] [manual verification step if needed]
```

Create the ADO PR with this description. Link to the ADO work item.

---

## After PR is Created

When done, tell the user: "PR is ready for review! When feedback comes back, type `@sp /receive-review` to process the feedback."

---

## Summary of Requirements

| Step | Requirement | Mandatory |
|------|-------------|-----------|
| 1 | Run full test suite | ✅ Yes |
| 2 | Check for debug code | ✅ Yes |
| 3 | Verify clean commits | ✅ Yes |
| 4 | Complete self-review checklist | ✅ Yes |
| 5 | Follow PR description format | ✅ Yes |
| 6 | Confirm all items checked | ✅ Yes |

---

## Emergency Escape Hatches

If you're tempted to skip self-review:

1. **"I'm in a hurry"** → Self-review takes 5 minutes. Rework from bad PR takes hours. Do the review.

2. **"This is just a small change"** → Small changes break things too. Run the checklist.

3. **"The tests take too long"** → Run them anyway. If they're too slow, that's a separate problem to fix later.

4. **"I already checked most items"** → Check ALL items. Explicitly. No assumptions.
