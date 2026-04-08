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

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST reproduce the error first** — never fix what you cannot see fail
2. **You MUST read the full error** — not just the last line, the complete stack trace
3. **You MUST form a hypothesis** — explicitly state what you think is wrong before checking
4. **You MUST verify your hypothesis** — confirm the root cause before writing any fix
5. **You MUST fix the root cause** — not symptoms, not workarounds, the actual problem
6. **You MUST verify the fix** — run the failing test/pipeline again and confirm it passes
7. **You MUST follow the phases IN ORDER** — do not skip steps

**Remember: Debugging is diagnosis, not guessing. Understand first, fix second.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (fixing without reproducing):
> "I see the error message. Let me fix that..."
> ❌ **WRONG** — Never fix what you have not seen fail

### BAD (reading only the last error line):
> "The error says 'NullPointerException'. Let me add a null check..."
> ❌ **WRONG** — Read the full stack trace to find the root cause

### BAD (fixing symptoms):
> "The pipeline is failing on null values. I'll filter them out..."
> ❌ **WRONG** — Why are nulls appearing? Fix the source, not the symptom

### BAD (no hypothesis):
> "Let me try changing this and see if it works..."
> ❌ **WRONG** — Random changes waste time. Form a hypothesis first

### BAD (skipping verification):
> "I've made the fix. It should work now..."
> ❌ **WRONG** — Always verify the fix actually resolves the issue

### GOOD (systematic diagnosis):
> "I reproduced the error. The full stack trace shows... My hypothesis is... Let me verify by checking..."
> ✅ **CORRECT** — Follow the process step by step

---

## Process (follow in order)

### Phase 1: Reproduce (Turn 1/N)

**Purpose:** See the error fail in the simplest possible way.

**What to do:**
1. Find the exact failing test, step, or query
2. Run it and capture the failure
3. For pipelines: identify the exact failing step and its input
4. For Spark errors: identify the exact transformation and the data causing it
5. For MSSQL errors: isolate the query and the data state

**Output format:**
```
> 🔴 **Error Reproduced**
> 
> **Location:** [file/line or pipeline step]
> **Command:** [how you reproduced it]
> **Result:** Confirmed failure
```

**Rules:**
- Cannot proceed without reproduction
- Simplify the reproduction case if possible
- Document the exact steps

**Phase transition:** After error is reproduced, proceed to Phase 2.

---

### Phase 2: Read the Full Error (Turn 1/1)

**Purpose:** Understand the complete error message and stack trace.

**What to do:**
1. Read the complete error — not just the last line
2. For Spark: scroll up past the "Caused by" chain to the root cause
3. For Azure Pipeline: check the full job log, not just the summary
4. For Python: trace from the exception back through the call stack
5. For MSSQL: check error number, severity, and state

**Output format:**
```
> 📋 **Full Error Analysis**
> 
> **Root cause location:** [file/line]
> **Error type:** [exception type or error code]
> **Error message:** [complete message]
> **Stack trace summary:** [key frames]
> **Key insight:** [what the error is actually telling you]
```

**Rules:**
- Do NOT stop at the first line
- Look for the deepest "Caused by" in the chain
- Note file paths and line numbers

**Phase transition:** After full error is analyzed, proceed to Phase 3.

---

### Phase 3: Form a Hypothesis (Turn 1/1)

**Purpose:** Explicitly state what you believe is wrong before investigating.

**What to do:**
1. State your hypothesis clearly
2. Explain why you think this is the cause
3. Connect it to the error message

**Output format:**
```
> 💭 **Hypothesis**
> 
> **I think the error is caused by:** [clear statement]
> **Because:** [reasoning based on error analysis]
> **This would explain:** [how it connects to the observed failure]
```

**Rules:**
- Must be explicit and testable
- Should connect error symptom to root cause
- Do NOT start fixing yet

**Phase transition:** After hypothesis is stated, proceed to Phase 4.

---

### Phase 4: Verify the Hypothesis (Turn 1-3, max 3 turns)

**Purpose:** Confirm the root cause with minimal investigation.

**What to do:**
1. Add print/log statements to inspect values
2. Check data at the failing step
3. Verify schema mismatches
4. Check null handling
5. For PySpark data issues:
   ```python
   df.printSchema()
   df.show(5, truncate=False)
   df.filter(df.column.isNull()).count()
   ```
6. For MSSQL:
   ```sql
   SET STATISTICS IO ON;
   SET STATISTICS TIME ON;
   -- your query
   ```

**Output format:**
```
> 🔍 **Verification Step [N]**
> 
> **Checking:** [what you are verifying]
> **Method:** [how you are checking]
> **Result:** [what you found]
> **Conclusion:** [hypothesis confirmed/modified/rejected]
```

**Rules:**
- Smallest possible change to verify
- One verification per turn
- Update hypothesis if needed

**Phase transition:** After hypothesis is verified, proceed to Phase 5.

---

### Phase 5: Fix (Turn 1/N)

**Purpose:** Make the minimal fix that addresses the root cause.

**What to do:**
1. Write the minimal fix for the verified root cause
2. Do NOT fix symptoms
3. Do NOT add workarounds
4. Fix the actual problem

**Output format:**
```
> 🔧 **Fix Applied**
> 
> **Root cause:** [what was wrong]
> **Fix:** [what you changed]
> **Location:** [file/line]
> **Why this fixes it:** [explanation]
```

**Rules:**
- Minimal change principle
- Address root cause only
- No speculative fixes

**Phase transition:** After fix is applied, proceed to Phase 6.

---

### Phase 6: Verify Fix (Turn 1/2)

**Purpose:** Confirm the fix actually resolves the issue.

**What to do:**
1. Run the failing test/pipeline again
2. Confirm it passes
3. Run the full test suite
4. Confirm nothing else broke

**Output format:**
```
> ✅ **Fix Verified**
> 
> **Original failing test:** [name]
> **Result:** PASS
> **Full test suite:** [pass/fail]
> **Regression check:** [any new failures?]
```

**Rules:**
- Must run the original failing case
- Must check for regressions
- Cannot skip this step

**Phase transition:** After fix is verified, proceed to Phase 7.

---

### Phase 7: Commit (Turn 1/1)

**Purpose:** Commit with a message that explains the root cause.

**What to do:**
1. Stage the changes
2. Write a commit message explaining the root cause

**Output format:**
```
> 💾 **Changes Committed**
> 
> **Commit message:**
> fix: [what was fixed]
> 
> Root cause: [explanation of the actual problem]
> [Additional context if needed]
```

**Commit example:**
```
fix: handle null customer_id in Silver dedup transformation

Root cause: Bronze layer was not filtering null IDs before passing to Silver.
```

**Rules:**
- Message must explain root cause
- Not just "fix bug" — explain what and why

---

## Summary of Phase Gates

| Phase | Min Turns | Max Turns | Purpose | Exit Criteria |
|-------|-----------|-----------|---------|---------------|
| 1. Reproduce | 1 | 3 | See the error fail | Error confirmed failing |
| 2. Read Error | 1 | 1 | Full stack trace analysis | Root cause location identified |
| 3. Hypothesis | 1 | 1 | State belief about cause | Clear, testable hypothesis stated |
| 4. Verify | 1 | 3 | Confirm root cause | Hypothesis confirmed |
| 5. Fix | 1 | 2 | Apply minimal fix | Fix applied to root cause |
| 6. Verify Fix | 1 | 2 | Confirm resolution | Original test passes, no regressions |
| 7. Commit | 1 | 1 | Document the fix | Commit with root cause explanation |

---

## Common DE Patterns

**Spark OOM:** Check partition count (`df.rdd.getNumPartitions()`), data skew, broadcast joins on large tables.

**Schema mismatch:** `df.printSchema()` on both source and target. Check nullable flags.

**DAB deployment failure:** `databricks bundle validate` first. Check workspace permissions.

**Azure Pipeline failure:** Check agent pool, service connection permissions, artifact paths.

**MSSQL deadlock:** Check `sys.dm_exec_requests`, `sys.dm_os_waiting_tasks`.

**NullPointerException in Spark:** Check for nulls in join keys, group by columns, or UDF inputs.

**Partition skew:** Check `df.groupBy("key").count().orderBy(col("count").desc()).show()` to find hot keys.
