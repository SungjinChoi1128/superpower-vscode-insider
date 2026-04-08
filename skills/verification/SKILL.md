---
name: verification
description: >
  Use before claiming any work is complete, fixed, or passing. Use before
  committing, creating a PR, or telling the user something works. Evidence
  before assertions — run verification commands and show actual output.
manualInvoke: false
---

# Verification Before Completion

Verify before you claim. Show evidence, not promises.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST NOT claim success without showing command output** — never say "tests pass" without showing the actual output
2. **Evidence before assertions ALWAYS** — run commands first, then state conclusions based on what the output shows
3. **Show output, don't summarize** — paste the actual command results, not your interpretation
4. **You MUST run the relevant tests** for the technology stack being used
5. **You MUST check git status** and display current state before claiming completion
6. **You MUST verify the specific behavior** described in the task actually works
7. **You MUST complete ALL items in the Definition of Done** before proceeding to PR

**Remember: Claims without evidence are worthless. Show the work.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (claiming success without evidence):
> "Tests pass. Everything looks good."
>
> ❌ **WRONG** — No command output shown, no evidence provided

### BAD (summarizing instead of showing):
> "I ran the tests and they all passed. The output showed 5 tests completed successfully."
>
> ❌ **WRONG** — Summarizing instead of pasting actual output

### BAD (assertion before evidence):
> "The fix works. Let me run the tests to confirm..."
>
> ❌ **WRONG** — Claiming it works BEFORE running verification

### BAD (skipping verification):
> "I made the changes, so it should work now."
>
> ❌ **WRONG** — "Should work" is not verification. Run the tests.

### BAD (partial verification):
> "Tests pass" (but linting errors exist and git status shows uncommitted changes)
>
> ❌ **WRONG** — Must complete ALL Definition of Done items

### GOOD (evidence first, then conclusion):
> ```bash
> pytest tests/test_feature.py -v
> ```
>
> **Output:**
> ```
> tests/test_feature.py::test_case_1 PASSED
> tests/test_feature.py::test_case_2 PASSED
> ================= 2 passed in 0.45s =================
> ```
>
> ✅ **CORRECT** — Command shown, actual output pasted, conclusion follows evidence

---

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

Work is complete when ALL items are checked:

- [ ] **All tests pass** — command output shown, not summarized
- [ ] **No linting errors** — linter output shown
- [ ] **Data quality assertions pass** (if applicable) — assertion results shown
- [ ] **Git status is clean** — or changes are intentional and documented
- [ ] **Specific behavior works** — the exact behavior described in the task verified
- [ ] **Evidence shown for every claim** — no assertions without supporting output

**Do NOT proceed to PR creation if ANY item above is not checked.**

---

## Verification Workflow

### Step 1: Display Git State
Show current git status and context.

### Step 2: Run Verification Commands
Execute tests, linters, and any relevant checks. Paste full output.

### Step 3: State Conclusions
ONLY after showing output, state what the evidence proves.

### Step 4: Check Definition of Done
Verify ALL items are complete before claiming done.

---

## Emergency Reminders

If tempted to say "it works" without running commands:
- **STOP** — Run the verification command first
- **SHOW** — Paste the actual output
- **THEN** — State your conclusion based on that evidence
