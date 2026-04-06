---
name: tdd
description: >
  Use when implementing any feature or bug fix. Write failing tests first, then
  implement. Applies to PySpark transformations, dbt models, MSSQL stored procedures,
  Python utilities, and TypeScript code. Never write implementation before a failing
  test exists.
manualInvoke: false
---

# Test-Driven Development

Red → Green → Refactor. Never write implementation before a failing test.

## Before Writing Any Code

**IMPORTANT:** Git context has been auto-captured for this session. Display what you found:

> "Based on the project context, I can see: [recent commits, current branch, test framework being used]"

Find existing tests to understand the testing patterns used.
Find the test framework configuration (pytest.ini, setup.cfg, dbt_project.yml).

## The Cycle

For every unit of behavior:

1. **Write a failing test** that describes the behavior
2. **Run it** — verify it fails with the expected error (not an import error)
3. **Write the minimal implementation** to make it pass
4. **Run it** — verify it passes
5. **Refactor** if needed, keeping tests green
6. **Commit**

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
    input_df = spark.createDataFrame([
        (1, "2024-01-01", "A"),
        (1, "2024-01-01", "A"),  # duplicate
    ], ["id", "date", "value"])

    result = deduplicate(input_df)

    expected = spark.createDataFrame([(1, "2024-01-01", "A")], ["id", "date", "value"])
    assertDataFrameEqual(result, expected)
```

Run: `pytest tests/test_transformation.py -v`

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

### MSSQL (tSQLt)
```sql
EXEC tSQLt.NewTestClass 'TestSilver';
GO
CREATE PROCEDURE TestSilver.[test deduplication removes duplicates]
AS
BEGIN
    EXEC tSQLt.FakeTable 'silver.customers';
    INSERT INTO silver.customers VALUES (1, 'Alice'), (1, 'Alice');
    EXEC silver.usp_deduplicate_customers;
    EXEC tSQLt.AssertEqualsTable 'expected', 'silver.customers';
END;
```

### Python utilities
Standard pytest. One test file per source file. Test file mirrors source path.

## Rules

- Test one behavior per test function
- Test names describe the behavior: `test_<what>_<condition>_<expected>`
- No mocking of database connections in integration tests — use test fixtures
- Commit after each passing test cycle, not at the end
