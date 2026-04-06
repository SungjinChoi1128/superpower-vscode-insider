---
name: verification
description: >
  Use before claiming any work is complete, fixed, or passing. Use before
  committing, creating a PR, or telling the user something works. Evidence
  before assertions — run verification commands and show actual output.
manualInvoke: false
---

# Verification Before Completion

Never claim work is done without running verification. Show evidence.

## Before Claiming Anything Works

**IMPORTANT:** Git context has been auto-captured. Display the current state:

> "Current git status shows: [X]. [Y] uncommitted changes."

Then show the output of verification commands.

Then run the relevant tests:

```bash
# Python/PySpark
pytest tests/ -v --tb=short

# dbt
dbt test --select changed_models+

# DAB
databricks bundle validate
databricks bundle deploy --target dev --dry-run

# Azure Pipeline
# Trigger a pipeline run and link to the run URL
```

Show the ACTUAL output. Do not summarize. Do not say "tests pass" without showing the output.

## Data Quality Checks

For data pipeline work, also verify:
```python
# Row count check
source_count = source_df.count()
target_count = target_df.count()
assert source_count == target_count, f"Row count mismatch: {source_count} vs {target_count}"

# Null check on key columns
null_count = df.filter(df.key_column.isNull()).count()
assert null_count == 0, f"Found {null_count} nulls in key_column"

# Duplicate check
dup_count = df.count() - df.dropDuplicates(["id"]).count()
assert dup_count == 0, f"Found {dup_count} duplicates"
```

## Definition of Done

Work is complete when:
- [ ] All tests pass (output shown)
- [ ] No linting errors
- [ ] Data quality assertions pass (if applicable)
- [ ] Git status is clean (or changes are intentional)
- [ ] The specific behavior described in the task works as described

Do NOT proceed to PR creation if any item above is not checked.
