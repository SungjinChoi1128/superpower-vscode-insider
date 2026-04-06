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

Isolate feature work without stashing or switching branches.

## When to Use

- Before executing a large implementation plan
- When you need to work on two things simultaneously
- When the current branch has uncommitted work you don't want to disturb

## Creating a Worktree

Check current state:
```
git status
git branch -a
```

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
