---
name: finishing-branch
description: >
  Use when implementation is complete, all tests pass, and you need to create
  an ADO pull request to merge the branch. Guides completion of development
  work by checking git state and presenting PR options.
manualInvoke: false
---

# Finishing a Development Branch

Complete your branch and create an ADO pull request.

## Before Creating the PR

**IMPORTANT:** Git context has been auto-captured. Display what you found:

> "This branch is: [X]. Commits since main: [count]. Git status: [Y]."

Run these checks (if not already shown):

Confirm:
- All commits are on this branch (not accidentally on main)
- No uncommitted changes
- All tests pass — run `@sp /verify` first

## Squash or Not?

Review the commit history (`git log --oneline main..HEAD`).

- If commits tell a clean story (one commit per logical change): keep as-is
- If commits are messy (WIP, fixup, temp): consider squashing
- If in doubt: keep individual commits — reviewers can see the journey

## Push and Create ADO PR

Push the branch:
```
git push -u origin <branch-name>
```

Create the ADO PR with:
- **Title:** `<type>: <what changed>` (e.g., `feat: add Silver dedup transformation`)
- **Description:** (see template below)
- **Reviewers:** Add relevant team members
- **Work item link:** Link to the ADO board item
- **Target branch:** main (or the appropriate base branch)

PR description template:
```
## Summary
- [bullet: what changed]
- [bullet: why it changed]

## Test Plan
- [ ] pytest output: [paste key results]
- [ ] Pipeline validation: [link or output]

## Notes for Reviewer
[anything that needs context or special attention]
```

## After PR is Created

Move the ADO work item to "In Review" status.
Notify reviewers in Teams/email if required by team process.

When feedback arrives, tell the user: "When you receive review feedback, type `@sp /receive-review` to process it with the two-stage review method."
