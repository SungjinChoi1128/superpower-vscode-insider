---
name: writing-plans
description: >
  Use when you have a spec or requirements for a multi-step task and need to create
  a detailed implementation plan before touching code. Use after brainstorming is
  complete. Creates bite-sized TDD tasks with exact file paths and commands.
  Required before executing-plans.
manualInvoke: false
---

# Writing Plans

Create a comprehensive implementation plan from a spec. Assume the implementer
knows the tools but not the codebase or domain.

## Before Writing

**IMPORTANT:** Git context has been auto-captured. Display what you found:

> "Based on recent commits, this project uses: [tech stack clues from commits]. Current branch: [X]"

Read the spec document. Understand what already exists.

## Plan Structure

Save to: `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`

Header:
```markdown
# [Feature] Implementation Plan

> **For agentic workers:** Use @sp /execute-plan or subagent-driven-development.

**Goal:** [one sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [key technologies]
```

## Task Format

Each task:
- Lists exact files to create/modify
- Follows TDD: failing test → verify fail → implement → verify pass → commit
- Includes exact commands with expected output
- Includes complete code, not descriptions

## Granularity

Each step is 2-5 minutes:
- "Write the failing test" — one step
- "Run it to verify it fails" — one step
- "Write minimal implementation" — one step
- "Run to verify pass" — one step
- "Commit" — one step

## DE-Specific Testing Patterns

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

## After Writing

Offer execution options:
1. Subagent-driven (recommended): fresh subagent per task
2. Inline: execute in this session with `@sp /execute-plan`
