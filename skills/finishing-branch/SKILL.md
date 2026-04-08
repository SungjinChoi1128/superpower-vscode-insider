---
name: finishing-branch
description: >
  Use when implementation is complete, all tests pass, and you need to create
  an ADO pull request to merge the branch. Guides completion of development
  work by checking git state and presenting PR options.
manualInvoke: false
disable-model-invocation: false
---

# Finishing a Development Branch

Complete your branch and create an ADO pull request.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **ALL tests MUST pass BEFORE creating the PR** — run `@sp /verify` first, every time
2. **NO exceptions for "minor" changes** — even one-line fixes need passing tests
3. **NO uncommitted changes allowed** — stage and commit everything before PR
4. **Squash OR rebase — NEVER merge commit mess** — clean history is non-negotiable
5. **Target branch MUST be correct** — confirm main (or appropriate base) before creating PR
6. **ADO work item MUST be linked** — every PR links to a tracked work item
7. **PR description MUST NOT be empty** — use the template, fill every section

**Remember: A PR with failing tests wastes everyone's time. Verify first, PR second.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (creating PR with failing tests):
> "The tests are failing but it's just a minor change..."
>
> ❌ **WRONG** — ALL tests must pass. No exceptions. Run `@sp /verify` first.

### BAD (skipping verification):
> "I'm sure the tests pass, let me create the PR..."
>
> ❌ **WRONG** — Verify every time. Confidence is not evidence.

### BAD (leaving uncommitted changes):
> Creates PR while `git status` shows modified files
>
> ❌ **WRONG** — Commit everything. PRs should represent complete, reviewable work.

### BAD (messy merge commits):
> Merges branch with 20 commits including "WIP", "fix", "oops", "try again"
>
> ❌ **WRONG** — Squash or rebase. Reviewers deserve a clean story.

### BAD (empty PR description):
> PR created with title only, no description, no test plan
>
> ❌ **WRONG** — Use the template. Context helps reviewers help you.

### GOOD (verified before PR):
> "All tests verified passing. Branch is clean. Creating PR now..."
>
> ✅ **CORRECT** — Verify first, then create PR with full context.

### GOOD (clean commit history):
> Single commit: `feat: add Silver dedup transformation` with clear message
>
> ✅ **CORRECT** — Squashed into logical, reviewable units.

---

## Before Creating the PR

**IMPORTANT:** Git context has been auto-captured. Display what you found:

> "This branch is: [X]. Commits since main: [count]. Git status: [Y]."

Run these checks (if not already shown):

Confirm:
- All commits are on this branch (not accidentally on main)
- No uncommitted changes
- All tests pass — run `@sp /verify` first (NON-NEGOTIABLE)

---

## Squash or Not? — Decision Guide

Review the commit history (`git log --oneline main..HEAD`).

### When to KEEP individual commits:
- Each commit represents a distinct, logical change
- Commit messages tell a clear story of development
- Commits are already clean and reviewable
- You want reviewers to see the implementation journey

### When to SQUASH:
- Commits include "WIP", "fixup", "temp", "try this"
- Multiple commits that should be one logical change
- You were experimenting and the history is messy
- This is the final delivery of a feature branch

### When to REBASE (instead of squash):
- You want to keep multiple commits but clean up the history
- Some commits should be reordered for clarity
- You need to split or combine specific commits
- Interactive rebase: `git rebase -i main`

### Decision Rule:
```
IF messy_history AND single_feature:
    → SQUASH to one commit
ELSE IF messy_history AND multiple_features:
    → REBASE interactively to clean up
ELSE:
    → KEEP as-is (commits tell a clean story)
```

**Default recommendation:** When in doubt, squash. Clean > clever.

---

## Push and Create ADO PR

Push the branch:
```
git push -u origin <branch-name>
```

Create the ADO PR with:
- **Title:** `<type>: <what changed>` (e.g., `feat: add Silver dedup transformation`)
- **Description:** (see template below) — MUST NOT be empty
- **Reviewers:** Add relevant team members
- **Work item link:** Link to the ADO board item — REQUIRED
- **Target branch:** main (or the appropriate base branch) — CONFIRM FIRST

PR description template:
```
## Summary
- [bullet: what changed]
- [bullet: why it changed]

## Test Plan
- [ ] ALL tests pass: [paste results from @sp /verify]
- [ ] Pipeline validation: [link or output]
- [ ] Manual testing: [what was tested]

## Notes for Reviewer
[anything that needs context or special attention]
```

---

## After PR is Created

Move the ADO work item to "In Review" status.
Notify reviewers in Teams/email if required by team process.

When feedback arrives, tell the user: "When you receive review feedback, type `@sp /receive-review` to process it with the two-stage review method."

---

## Summary Checklist

| Step | Requirement | Critical |
|------|-------------|----------|
| Verify | ALL tests pass | ⛔ YES |
| Status | No uncommitted changes | ⛔ YES |
| History | Squash or clean commits | ⛔ YES |
| Link | ADO work item attached | ⛔ YES |
| Target | Correct base branch | ⛔ YES |
| Desc | PR description complete | ⛔ YES |

---

## Emergency Escape Hatches

1. **"Tests are failing but I need this merged"** → Fix the tests first. No exceptions. A failing PR helps no one.

2. **"I already pushed messy commits"** → Use interactive rebase: `git rebase -i main`, clean up, then force push: `git push --force-with-lease`

3. **"I forgot to link the work item"** → Edit the PR after creation. Add the link immediately.

4. **"I created the PR against the wrong branch"** → Close and recreate, or use ADO's "Change target branch" feature.
