---
name: requesting-review
description: >
  Use when completing a task or feature and preparing to create an ADO pull request.
  Use before creating a PR to verify the work is complete and well-documented.
  Runs git checks and prepares the PR description.
manualInvoke: false
---

# Requesting Code Review

Prepare your work for ADO pull request review.

## Before Creating the PR

Run these checks:
```
git log --oneline -10
git diff main...HEAD
git status
```

Confirm:
- All tests pass (run the full test suite, show output)
- No debug code, no commented-out blocks, no TODOs left
- Commit messages are clean and descriptive

## Self-Review Checklist

For PySpark/Python:
- [ ] Functions have clear single responsibilities
- [ ] Error handling for null values and schema mismatches
- [ ] No hardcoded paths, connection strings, or credentials
- [ ] Tests cover the main behavior and edge cases

For SQL (MSSQL / Databricks SQL):
- [ ] No SELECT * in production queries
- [ ] Joins have explicit ON conditions
- [ ] NULL handling is explicit (COALESCE, IS NULL checks)
- [ ] Indexes considered for MSSQL queries

For DAB / YAML configs:
- [ ] `databricks bundle validate` passes
- [ ] Target environments are correct (dev/staging/prod)
- [ ] No hardcoded workspace paths

For Azure Pipelines:
- [ ] Pipeline runs successfully in dev/test
- [ ] Service connections are correct
- [ ] Artifact paths are correct

## Draft PR Description

```
## Summary
- [what changed]
- [why it changed]

## Test Plan
- [ ] [test command and expected output]
- [ ] [manual verification step if needed]
```

Create the ADO PR with this description. Link to the ADO work item.
