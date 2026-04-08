---
name: tdd
description: >
  Use when implementing any feature or bugfix, before writing implementation code.
  Write failing tests first, then minimal implementation to pass. Applies to
  PySpark transformations, dbt models, MSSQL stored procedures, Python utilities,
  and TypeScript code. Never write implementation before a failing test exists.
manualInvoke: false
---

# Test-Driven Development — Red, Green, Refactor

Write failing tests first. Then write the minimal code to pass. Then refactor.

---

## ⛔ CRITICAL CONSTRAINTS — READ BEFORE ANYTHING ELSE

**VIOLATING THESE RULES IS A CRITICAL FAILURE:**

1. **You MUST write the failing test BEFORE any implementation code**
2. **You MUST verify the test fails with the EXPECTED error** (not an import error, NameError, or syntax error)
3. **You MUST write the MINIMAL implementation** to make the test pass (no more, no less)
4. **You MUST commit after each passing test cycle** (red → green → commit)
5. **You MUST NOT skip the red phase** — seeing the test fail is mandatory
6. **You MUST NOT write multiple tests at once** — one failing test at a time
7. **You MUST NOT refactor while the test is red** — only refactor on green

**Remember: The cycle is RED → GREEN → REFACTOR → COMMIT → REPEAT. Never out of order.**

---

## ❌ Anti-Patterns — Do NOT Do These

### BAD (writing implementation before test):
> "I'll write the function first, then add tests..."
> ```python
> def calculate_total(items):
>     return sum(item.price for item in items)
> ```
> ❌ **WRONG** — Write the test first, watch it fail, then implement

### BAD (mocking everything):
> ```python
> mock_db = Mock()
> mock_cursor = Mock()
> mock_cursor.fetchall.return_value = [(1, "Alice")]
> mock_db.cursor.return_value = mock_cursor
> ```
> ❌ **WRONG** — Don't mock what you don't own. Use real test fixtures for databases

### BAD (tests that don't verify behavior):
> ```python
> def test_function_runs():
>     result = my_function()
>     assert result is not None  # What does it actually return?
> ```
> ❌ **WRONG** — Tests must verify specific behavior and expected outcomes

### BAD (skipping the red phase):
> "I know this test will pass because I already implemented it"
> ❌ **WRONG** — You must SEE the test fail first to trust it when it passes

### GOOD (red-green-refactor cycle):
> ```python
> # Step 1: RED — Write failing test
> def test_deduplicate_removes_duplicates():
>     input_df = spark.createDataFrame([
>         (1, "Alice"), (1, "Alice")  # duplicate
>     ], ["id", "name"])
>     
>     result = deduplicate(input_df)
>     
>     expected = spark.createDataFrame([(1, "Alice")], ["id", "name"])
>     assertDataFrameEqual(result, expected)  # FAILS: function doesn't exist yet
> 
> # Step 2: GREEN — Minimal implementation
> def deduplicate(df):
>     return df.dropDuplicates()
> 
> # Step 3: Verify test passes, then COMMIT
> # Step 4: REFACTOR if needed (while test is green)
> ```
> ✅ **CORRECT** — Follow red → green → refactor → commit

---

## The TDD Cycle (follow in order)

For every unit of behavior, complete ALL steps before moving to the next behavior.

### Phase 1: RED — Write Failing Test

**Purpose:** Define the behavior you want before implementing it.

**What to do:**
1. Find existing tests to understand the testing patterns
2. Identify the test framework configuration (pytest.ini, setup.cfg, dbt_project.yml)
3. Write ONE test that describes a single behavior
4. Run the test and verify it FAILS with the EXPECTED error
5. If it fails with import/syntax error, fix that first

**Output format:**
```
## Phase 1: RED — Writing Failing Test

Test: `test_<what>_<condition>_<expected>`
Location: `tests/test_module.py`

Expected error: [NameError: function not defined] or [AssertionError: expected X, got Y]

Running test...
❌ FAILED as expected: [error message]

Phase 1 complete. Proceeding to Phase 2.
```

**Phase gate:** Test must fail with EXPECTED error, not import/syntax error.

---

### Phase 2: GREEN — Minimal Implementation

**Purpose:** Write just enough code to make the test pass.

**What to do:**
1. Write the MINIMAL code to make the failing test pass
2. Do NOT write extra functionality
3. Do NOT worry about elegance yet
4. Hard-code values if needed (you'll refactor later)

**Rules:**
- Cheating is allowed — return the expected value directly if simplest
- Do NOT add error handling for cases not in the test
- Do NOT optimize yet
- Keep it simple and obvious

**Output format:**
```
## Phase 2: GREEN — Minimal Implementation

Implementation added to: `src/module.py`

Code written:
```python
def my_function():
    return "expected_value"  # Minimal pass
```

Running test...
✅ PASSED

Phase 2 complete. Proceeding to Phase 3.
```

**Phase gate:** Test passes. Stop here if this is good enough for now.

---

### Phase 3: REFACTOR — Clean Up (Optional)

**Purpose:** Improve code quality while keeping tests green.

**What to do:**
1. Clean up duplication
2. Improve naming
3. Add error handling if needed
4. Extract helper functions
5. Run tests after each change to ensure they stay green

**Rules:**
- ONLY refactor when tests are green
- Run tests frequently during refactoring
- If tests break, undo and try again
- Do NOT add new behavior during refactor

**Output format:**
```
## Phase 3: REFACTOR — Code Cleanup

Changes made:
- Extracted helper function `validate_input()`
- Renamed variable `x` to `customer_id`
- Added input validation

Running tests...
✅ All tests still passing

Phase 3 complete. Proceeding to Phase 4.
```

**Phase gate:** Tests remain green after refactoring.

---

### Phase 4: COMMIT — Save Progress

**Purpose:** Create a checkpoint after each complete cycle.

**What to do:**
1. Stage the test file and implementation
2. Commit with a descriptive message
3. Reference the behavior added

**Output format:**
```
## Phase 4: COMMIT — Saving Progress

Files staged:
- tests/test_module.py (new test)
- src/module.py (implementation)

Commit message: "feat: add customer deduplication logic"

Committed successfully.

Cycle complete. Ready for next behavior.
```

**Phase gate:** Commit created with both test and implementation.

---

### Phase 5: REPEAT — Next Behavior

**Purpose:** Continue the cycle for the next piece of functionality.

**What to do:**
1. Identify the next behavior to implement
2. Go back to Phase 1 (RED)
3. Start a new cycle

**Rules:**
- One behavior per cycle
- Do NOT batch multiple tests
- Do NOT batch multiple implementations

---

## Framework-Specific Patterns

### PySpark

```python
# tests/test_transformation.py
from pyspark.testing import assertDataFrameEqual
from pyspark.sql import SparkSession
import pytest

@pytest.fixture(scope="session")
def spark():
    return SparkSession.builder.master("local[1]").appName("test").getOrCreate()

def test_bronze_to_silver_deduplication(spark):
    # Arrange
    input_df = spark.createDataFrame([
        (1, "2024-01-01", "A"),
        (1, "2024-01-01", "A"),  # duplicate
    ], ["id", "date", "value"])

    # Act
    result = deduplicate(input_df)

    # Assert
    expected = spark.createDataFrame([(1, "2024-01-01", "A")], ["id", "date", "value"])
    assertDataFrameEqual(result, expected)
```

Run: `pytest tests/test_transformation.py -v`

---

### dbt

```yaml
# models/silver/schema.yml
models:
  - name: silver_customers
    tests:
      - unique:
          column_name: customer_id
      - not_null:
          column_name: customer_id
```

Run: `dbt test --select silver_customers`

---

### MSSQL (tSQLt)

```sql
-- RED: Write test first (it will fail)
EXEC tSQLt.NewTestClass 'TestSilver';
GO

CREATE PROCEDURE TestSilver.[test deduplication removes duplicates]
AS
BEGIN
    -- Arrange
    EXEC tSQLt.FakeTable 'silver.customers';
    INSERT INTO silver.customers VALUES (1, 'Alice'), (1, 'Alice');
    
    -- Act
    EXEC silver.usp_deduplicate_customers;
    
    -- Assert
    DECLARE @expected TABLE (id INT, name VARCHAR(50));
    INSERT INTO @expected VALUES (1, 'Alice');
    EXEC tSQLt.AssertEqualsTable '@expected', 'silver.customers';
END;
```

Run: `EXEC tSQLt.Run 'TestSilver';`

---

### Python Utilities

Standard pytest. One test file per source file. Mirror the source path.

```
src/
  utils/
    validator.py
tests/
  utils/
    test_validator.py   # Mirrors src structure
```

---

## Naming Conventions

**Test files:** `test_<module>.py`

**Test functions:** `test_<what>_<condition>_<expected>`

Examples:
- `test_calculate_total_with_empty_list_returns_zero`
- `test_validate_email_with_invalid_format_raises_error`
- `test_deduplicate_with_duplicates_removes_them`

---

## Summary of Phase Gates

| Phase | Action | Exit Criteria |
|-------|--------|---------------|
| 1. RED | Write failing test | Test fails with EXPECTED error |
| 2. GREEN | Minimal implementation | Test passes |
| 3. REFACTOR | Clean up code | Tests still green |
| 4. COMMIT | Save progress | Commit created |
| 5. REPEAT | Next behavior | Return to Phase 1 |

---

## Emergency Escape Hatches

1. **"I already have the implementation"** → Back up your code, delete it, write the test first, then re-implement minimally.

2. **"This is too hard to test"** → Your code may need restructuring. Testable code is well-designed code. Refactor first.

3. **"I need to spike first"** → Allowed: Create a `spike/` folder, explore freely, then delete and start TDD fresh with what you learned.

4. **"This is just a one-line fix"** → Still write the test. One line can break everything.

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│  RED  →  GREEN  →  REFACTOR  → COMMIT   │
│   ↑                                    │
│   └──────── REPEAT ────────────────────┘
│                                         │
│  RED:    Write failing test            │
│  GREEN:  Write minimal pass            │
│  REFACTOR: Clean while green           │
│  COMMIT: Save your progress            │
│  REPEAT: Next behavior                 │
└─────────────────────────────────────────┘
```

**Remember:** If you haven't seen the test fail, you don't know it works.
