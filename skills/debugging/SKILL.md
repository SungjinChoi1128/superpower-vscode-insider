---
name: debugging
description: >
  Use when encountering any bug, test failure, pipeline error, Spark exception,
  MSSQL error, or unexpected behavior. Use before proposing any fix. Systematic
  diagnosis before solution.
manualInvoke: false
---

# Systematic Debugging

Diagnose before fixing. Never propose a fix without first understanding the cause.

## Before Anything

**IMPORTANT:** Git log and recent changes have been auto-captured for this session. Display what you found:

> "Based on git history, the last change was: [summary]. When did this last work?"

## Step 1: Reproduce

Reproduce the error in the simplest possible way.
For pipeline failures: find the exact failing step and its input.
For Spark errors: identify the exact transformation and the data causing it.
For MSSQL errors: isolate the query and the data state.

## Step 2: Read the Full Error

Read the complete error message and stack trace — not just the last line.
For Spark: scroll up past the "Caused by" chain to the root cause.
For Azure Pipeline: check the full job log, not just the summary.

## Step 3: Form a Hypothesis

State your hypothesis explicitly before checking it:
> "I think the error is caused by X because Y."

## Step 4: Verify the Hypothesis

Check the hypothesis with the smallest possible change:
- Add a print/log statement
- Inspect the data at the failing step
- Check schema mismatches
- Check null handling

For PySpark data issues:
```python
df.printSchema()
df.show(5, truncate=False)
df.filter(df.column.isNull()).count()
```

For MSSQL:
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
-- your query
```

## Step 5: Fix

Make the minimal fix that addresses the root cause.
Do NOT fix symptoms.

## Step 6: Verify Fix

Run the failing test/pipeline again. Confirm it passes.
Run the full test suite. Confirm nothing else broke.

## Step 7: Commit

Commit with a message that explains the root cause:
```
fix: handle null customer_id in Silver dedup transformation

Root cause: Bronze layer was not filtering null IDs before passing to Silver.
```

## Common DE Patterns

**Spark OOM:** Check partition count (`df.rdd.getNumPartitions()`), data skew, broadcast joins on large tables.

**Schema mismatch:** `df.printSchema()` on both source and target. Check nullable flags.

**DAB deployment failure:** `databricks bundle validate` first. Check workspace permissions.

**Azure Pipeline failure:** Check agent pool, service connection permissions, artifact paths.

**MSSQL deadlock:** Check `sys.dm_exec_requests`, `sys.dm_os_waiting_tasks`.
