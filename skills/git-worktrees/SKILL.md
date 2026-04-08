---
name: git-worktrees
description: >
  Use when starting feature work that needs isolation from the current workspace,
  or before executing implementation plans that touch many files. Creates an
  isolated git worktree so work doesn't interfere with the current branch.
  Adapted for Azure DevOps Git repositories.
manualInvoke: false
---

# Using Git Worktrees

## ⛔ CRITICAL CONSTRAINTS

**Worktrees are for isolation - use them.** Don't work in the main checkout when implementing multi-step plans.

**Always clean up.** Remove worktrees and delete branches after merge. Don't leave stale worktrees hanging around.

**Verify before creating.** Run `git worktree list` first to avoid collisions with existing worktrees.

---

## ❌ Anti-Patterns

### BAD (working in main checkout when you should use worktree):
> "I'll just implement this in the current directory..."
> ❌ **WRONG** — Use worktrees for isolation during multi-step work

### BAD (leaving stale worktrees):
> "The branch was merged last week but I'll keep the worktree just in case..."
> ❌ **WRONG** — Remove worktrees promptly after merge with `git worktree remove`

### BAD (naming collisions):
> Creating `../project-fix` when `../project-fix` already exists
> ❌ **WRONG** — Always check `git worktree list` first

---

## When to Use

Isolate feature work without stashing or switching branches.

- Before executing a large implementation plan
- When you need to work on two things simultaneously
- When the current branch has uncommitted work you don't want to disturb

## Creating a Worktree

**IMPORTANT:** Git context has been auto-captured. Display current state:

> "Current branch: [X]. Existing branches: [Y]. Worktrees: [Z]"

Create a worktree for a new branch:
```
git worktree add ../project-feature-name -b feature/feature-name
```

Or for an existing branch:
```
git worktree add ../project-feature-name feature/existing-branch
```

## Working in the Worktree

Open the worktree folder in VS Code:
```
code ../project-feature-name
```

All git operations in the worktree are isolated to that branch.
The original folder stays on its current branch.

## ADO-Specific Notes

Azure DevOps uses standard git — worktrees work the same way.
Branch naming convention: follow your team's ADO branch policy
(typically `feature/ADO-123-description` or `users/name/feature-name`).

Check your repo's branch policy in ADO before creating branches:
ADO → Repos → Branches → Branch policies.

## Cleaning Up

After the branch is merged:
```
git worktree remove ../project-feature-name
git branch -d feature/feature-name
```

List active worktrees:
```
git worktree list
```
