# VS Code Copilot Superpowers Harness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a global VS Code Insider harness that replicates the obra/superpowers workflow experience in GitHub Copilot Chat for a data engineer on Windows 11.

**Architecture:** A git repo cloned to `~/.copilot/` containing 15 SKILL.md files (auto-detected by VS Code Insider's agent skills system), a marker-based memory system driven by `sessionStart`/`sessionEnd` hooks, and a thin TypeScript extension providing `@sp` chat participant + skill browser. Everything is global — works across all projects.

**Tech Stack:** Markdown (SKILL.md), Python 3.8+ (memory scripts), TypeScript + VS Code Extension API (extension), PowerShell (setup/teardown), JSON (hooks)

**Spec:** `docs/superpowers/specs/2026-04-06-vscode-copilot-superpowers-harness-design.md`

---

## File Map

```
~/.copilot/  (= repo root C:\DockerVolumes\superpower-vscode-insider\)
├── skills/
│   ├── using-sp/SKILL.md
│   ├── brainstorming/SKILL.md
│   ├── writing-plans/SKILL.md
│   ├── executing-plans/SKILL.md
│   ├── tdd/SKILL.md
│   ├── debugging/SKILL.md
│   ├── requesting-review/SKILL.md
│   ├── receiving-review/SKILL.md
│   ├── verification/SKILL.md
│   ├── finishing-branch/SKILL.md
│   ├── git-worktrees/SKILL.md
│   ├── parallel-agents/SKILL.md
│   ├── subagent-dev/SKILL.md
│   ├── writing-skills/SKILL.md
│   └── simplify/SKILL.md
├── instructions/
│   ├── sp-bootstrap.instructions.md
│   └── memory.instructions.md
├── hooks/
│   ├── session-start.json
│   └── session-end.json
├── memory/
│   ├── MEMORY.md
│   ├── user/
│   ├── feedback/
│   ├── project/
│   └── reference/
├── scripts/
│   ├── inject-memory.py
│   ├── extract-memory.py
│   └── tests/
│       ├── test_inject_memory.py
│       └── test_extract_memory.py
├── extension/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── extension.ts
│       ├── participant.ts
│       ├── skillBrowser.ts
│       └── scaffolder.ts
├── setup.ps1
├── teardown.ps1
└── README.md
```

---

## Phase 0: Pilot Validation

### Task 1: Validate VS Code Insider Hook API

**Goal:** Confirm the exact JSON contracts for hooks before writing any scripts. This gates Phase 3.

**Files:**
- Create: `docs/superpowers/pilot/hook-api-findings.md`

- [ ] **Step 1: Open VS Code Insider, enable agent mode**

  Open any folder. Switch Copilot Chat to Agent mode.

- [ ] **Step 2: Create a minimal sessionStart hook to observe the API**

  Create `.github/hooks/session-start-test.json` in any workspace:
  ```json
  {
    "hooks": {
      "sessionStart": [{
        "type": "command",
        "command": "python -c \"import sys, json; data = sys.stdin.read(); open('C:/temp/hook-test.txt', 'w').write(data)\"",
        "timeout": 5
      }]
    }
  }
  ```

- [ ] **Step 3: Start a new agent session and inspect `C:/temp/hook-test.txt`**

  Check: what JSON did the hook runner pass via stdin? Document the exact shape.

- [ ] **Step 4: Test hook stdout injection**

  Modify the hook to output JSON and observe whether it is injected into context:
  ```json
  {
    "hooks": {
      "sessionStart": [{
        "type": "command",
        "command": "python -c \"import json; print(json.dumps({'additionalInstructions': 'PILOT TEST: hook injection working'}))\"",
        "timeout": 5
      }]
    }
  }
  ```
  Start a new session. Does "PILOT TEST: hook injection working" appear in Copilot's context?

- [ ] **Step 5: Create a minimal sessionEnd hook to capture transcript**

  ```json
  {
    "hooks": {
      "sessionEnd": [{
        "type": "command",
        "command": "python -c \"import sys; open('C:/temp/transcript-test.txt', 'w').write(sys.stdin.read())\"",
        "timeout": 10
      }]
    }
  }
  ```
  End a session. Inspect `C:/temp/transcript-test.txt`: is `transcript_path` present? What format is the transcript?

- [ ] **Step 6: Check `chat.tools.edits.autoApprove` setting**

  Open VS Code Insider settings (JSON). Search for `chat.tools.edits.autoApprove`. If it exists, note the accepted value format. If not, identify the correct setting for auto-approving file writes to a specific directory.

- [ ] **Step 7: Document findings**

  Create `docs/superpowers/pilot/hook-api-findings.md`:
  ```markdown
  # Hook API Findings

  ## sessionStart
  - stdin JSON shape: <actual shape>
  - stdout injection key: <actual key or "not supported">
  - fallback needed: yes/no

  ## sessionEnd
  - stdin JSON shape: <actual shape>
  - transcript_path present: yes/no
  - transcript format: <plain text / JSON / other>

  ## chat.tools.edits.autoApprove
  - setting exists: yes/no
  - correct mechanism: <setting name and value format>
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add docs/superpowers/pilot/hook-api-findings.md
  git commit -m "docs: add hook API pilot findings"
  ```

  > **STOP HERE if hooks do not work as expected.** Update the spec's fallback design and adjust Phase 3 before continuing.

---

## Phase 1: Repository Scaffold

### Task 2: Directory structure + global instruction files

**Files:**
- Create: `skills/.gitkeep` (placeholder until skills are added)
- Create: `memory/MEMORY.md`
- Create: `memory/user/.gitkeep`
- Create: `memory/feedback/.gitkeep`
- Create: `memory/project/.gitkeep`
- Create: `memory/reference/.gitkeep`
- Create: `instructions/sp-bootstrap.instructions.md`
- Create: `instructions/memory.instructions.md`
- Create: `scripts/tests/.gitkeep`

- [ ] **Step 1: Create directory structure**

  ```powershell
  mkdir skills, hooks, memory\user, memory\feedback, memory\project, memory\reference, instructions, scripts\tests, extension\src, docs\superpowers\pilot -Force
  ```

- [ ] **Step 2: Create empty MEMORY.md**

  Create `memory/MEMORY.md`:
  ```markdown
  # Memory

  No memories recorded yet.
  ```

- [ ] **Step 3: Create sp-bootstrap instruction file**

  Create `instructions/sp-bootstrap.instructions.md`:
  ```markdown
  # SP Superpowers Bootstrap

  You are working with the SP superpowers harness — a system of skills that provide structured workflows for software engineering tasks.

  ## Available Skills

  The following skills are available. They auto-activate based on context, or can be explicitly invoked with `@sp /skill-name`:

  | Skill | When to use |
  |---|---|
  | brainstorming | Before any creative work — designing features, pipelines, architecture |
  | writing-plans | After brainstorming, to create a detailed implementation plan |
  | executing-plans | When you have a written plan to execute step by step |
  | tdd | When implementing any feature or bug fix — write tests first |
  | debugging | When encountering any bug, error, or unexpected behavior |
  | requesting-review | When completing a feature, before creating an ADO PR |
  | receiving-review | When receiving code review feedback |
  | verification | Before claiming any work is complete or passing |
  | finishing-branch | When implementation is complete and you need to create an ADO PR |
  | git-worktrees | When starting feature work that needs isolation |
  | parallel-agents | When facing 2+ independent tasks (best-effort) |
  | subagent-dev | When executing plans with independent tasks (best-effort) |
  | writing-skills | When creating new skills for this system |
  | simplify | When reviewing changed code for quality and efficiency |

  ## Key Principles

  - Always check project context (git log, git status, relevant files) before starting any task
  - Use agent mode for all workflow tasks — terminal access is required
  - When in doubt about which skill to use, default to brainstorming first
  - Skills can be chained: brainstorming → writing-plans → executing-plans
  ```

- [ ] **Step 4: Create memory instruction file**

  Create `instructions/memory.instructions.md`:
  ```markdown
  # Memory System Instructions

  You have access to a persistent memory system. When you learn something worth remembering across sessions, embed a memory marker in your response.

  ## When to Save a Memory

  Save a memory when you learn:
  - **user**: The user's role, preferences, expertise level, working style
  - **feedback**: Corrections or guidance ("don't do X", "always do Y instead")
  - **project**: Ongoing work, goals, decisions, deadlines, project context
  - **reference**: External system locations (ADO board URLs, Databricks workspace, etc.)

  ## Memory Marker Format

  Embed this HTML comment anywhere in your response (invisible to user):

  ```
  <!-- MEMORY: {"type": "feedback", "content": "User prefers PySpark over pandas for large datasets", "file": "preferences.md"} -->
  ```

  - `type`: one of `user`, `feedback`, `project`, `reference`
  - `content`: the memory text to save
  - `file`: filename within the type subdirectory (e.g., `preferences.md`, `profile.md`)

  ## Examples

  User says "don't use pandas for anything over 1GB, always use PySpark":
  ```
  <!-- MEMORY: {"type": "feedback", "content": "Don't use pandas for datasets over 1GB — always use PySpark instead.", "file": "preferences.md"} -->
  ```

  User mentions their ADO board:
  ```
  <!-- MEMORY: {"type": "reference", "content": "ADO board: https://dev.azure.com/company/project/_boards", "file": "resources.md"} -->
  ```

  User mentions they are migrating MSSQL to Databricks Lakehouse:
  ```
  <!-- MEMORY: {"type": "project", "content": "Active project: MSSQL to Databricks Lakehouse migration. Tech stack: Azure DevOps, Databricks, MSSQL, DAB, Azure Pipelines.", "file": "current.md"} -->
  ```
  ```

- [ ] **Step 5: Commit scaffold**

  ```bash
  git add memory/MEMORY.md instructions/sp-bootstrap.instructions.md instructions/memory.instructions.md
  git commit -m "feat: add repository scaffold and global instruction files"
  ```

---

## Phase 2: Skills Library

### Task 3: `using-sp` skill

**Files:**
- Create: `skills/using-sp/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/using-sp/SKILL.md`:
  ```markdown
  ---
  name: using-sp
  description: >
    SP superpowers system overview. Use when the user asks what skills are available,
    how to use the skill system, or how to invoke a specific skill. Also activates
    when starting any new task to check if a more specific skill applies.
  manualInvoke: false
  ---

  # SP Superpowers

  This system provides structured workflow skills for software engineering tasks.
  Each skill gives you a proven process for a specific type of work.

  ## How Skills Work

  Skills activate automatically when your prompt matches their purpose, or you can
  invoke them explicitly with `@sp /skill-name`.

  ## Available Skills

  - `@sp /brainstorm` — Design and spec before building anything
  - `@sp /write-plan` — Turn a spec into a step-by-step implementation plan
  - `@sp /execute-plan` — Execute a written plan with checkpoints
  - `@sp /tdd` — Test-driven development workflow
  - `@sp /debug` — Systematic debugging process
  - `@sp /request-review` — Prepare code for ADO PR review
  - `@sp /receive-review` — Handle incoming code review feedback
  - `@sp /verify` — Verify work before claiming it's done
  - `@sp /finish-branch` — Complete a branch and create ADO PR
  - `@sp /worktree` — Isolate feature work with git worktrees
  - `@sp /write-skill` — Create a new skill for this system
  - `@sp /simplify` — Review code for quality and efficiency

  Two additional skills are available via auto-detection and skill browser only
  (not invocable via `@sp` — degraded, best-effort):
  - `parallel-agents` — decomposing independent parallel work
  - `subagent-dev` — structured inline plan execution

  ## When in Doubt

  If you're not sure which skill to use, start with `/brainstorm`.
  It will guide you to the right next skill.
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/using-sp/SKILL.md
  git commit -m "feat: add using-sp skill"
  ```

---

### Task 4: `brainstorming` skill

**Files:**
- Create: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/brainstorming/SKILL.md`:
  ```markdown
  ---
  name: brainstorming
  description: >
    Use before any creative work — designing data pipelines, lakehouse architecture,
    new features, components, or modifying behavior. Use when the user wants to plan
    or design something before building it. Explores intent, requirements, and design
    before any implementation begins. Required before writing-plans.
  manualInvoke: false
  ---

  # Brainstorming — Design Before Building

  Turn ideas into fully formed designs through collaborative dialogue.
  Do NOT write any code or implementation until design is approved.

  ## Process (follow in order)

  ### 1. Explore Project Context

  Before asking anything, run:
  ```
  git log --oneline -10
  git status
  ```
  Read relevant docs: README.md, any docs/ folder, existing pipeline configs, DAB configs.
  Understand what exists before proposing anything new.

  ### 2. Ask Clarifying Questions

  Ask ONE question at a time. Use multiple choice where possible.
  Focus on: purpose, constraints, success criteria, tech stack specifics.

  For data engineering tasks, consider asking about:
  - Source system (MSSQL, flat files, APIs, streaming)
  - Target (Bronze/Silver/Gold layer, specific Delta table)
  - Data volume and SLA requirements
  - Existing patterns in the codebase to follow
  - ADO pipeline trigger requirements

  ### 3. Propose 2-3 Approaches

  Present options with trade-offs. Lead with your recommendation and why.
  For DE tasks, consider: complexity, reusability, testability, DAB compatibility.

  ### 4. Present Design

  Cover in sections (get approval after each section):
  - Architecture and data flow
  - Components and their responsibilities
  - Error handling and data quality approach
  - Testing strategy
  - ADO pipeline integration points

  ### 5. Write Spec Document

  Save to: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
  Commit the spec.

  ### 6. Transition

  After spec is approved, invoke: `@sp /write-plan`

  ## Rules

  - One question per message
  - NEVER write code before design is approved
  - Always explore project context first
  - For large projects covering multiple independent subsystems, decompose first
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/brainstorming/SKILL.md
  git commit -m "feat: add brainstorming skill"
  ```

---

### Task 5: `writing-plans` skill

**Files:**
- Create: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/writing-plans/SKILL.md`:
  ```markdown
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

  Check project context:
  ```
  git log --oneline -10
  git status
  ```
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/writing-plans/SKILL.md
  git commit -m "feat: add writing-plans skill"
  ```

---

### Task 6: `executing-plans` skill

**Files:**
- Create: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/executing-plans/SKILL.md`:
  ```markdown
  ---
  name: executing-plans
  description: >
    Use when you have a written implementation plan to execute step by step with
    review checkpoints. Use after writing-plans is complete. Executes tasks
    sequentially with verification between each task.
  manualInvoke: false
  ---

  # Executing Plans

  Execute a written implementation plan with checkpoints.

  ## Before Starting

  Read the plan document in full. Then check:
  ```
  git log --oneline -5
  git status
  ```
  Confirm you are on the correct branch. Confirm no uncommitted changes.

  ## Execution Process

  For each task in the plan:

  1. **Announce** the task you are starting
  2. **Follow the steps exactly** — do not skip or reorder
  3. **Run verification commands** and show actual output
  4. **Commit** at the end of each task (the plan specifies the commit message)
  5. **Report** task completion before moving to the next

  ## Checkpoints

  After every 3 tasks, pause and report:
  - What was completed
  - Current test status (`pytest` / `dbt test` / relevant test command)
  - Git log of new commits
  - Any deviations from the plan and why

  Wait for user acknowledgement before continuing.

  ## If a Step Fails

  Do NOT skip failed steps. Do NOT mark incomplete work as done.
  Report the failure with:
  - The exact command that failed
  - The exact error output
  - Your diagnosis
  - Proposed fix

  Wait for user guidance before proceeding.

  ## After All Tasks

  Run the full test suite. Show output.
  Invoke: `@sp /verify`
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/executing-plans/SKILL.md
  git commit -m "feat: add executing-plans skill"
  ```

---

### Task 7: `tdd` skill

**Files:**
- Create: `skills/tdd/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/tdd/SKILL.md`:
  ```markdown
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

  Check project context:
  ```
  git log --oneline -10
  git status
  ```
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
      -- Arrange
      EXEC tSQLt.FakeTable 'silver.customers';
      INSERT INTO silver.customers VALUES (1, 'Alice'), (1, 'Alice');
      -- Act
      EXEC silver.usp_deduplicate_customers;
      -- Assert
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/tdd/SKILL.md
  git commit -m "feat: add tdd skill"
  ```

---

### Task 8: `debugging` skill

**Files:**
- Create: `skills/debugging/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/debugging/SKILL.md`:
  ```markdown
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

  Check recent changes:
  ```
  git log --oneline -10
  git diff HEAD~1
  ```
  When did this last work? What changed?

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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/debugging/SKILL.md
  git commit -m "feat: add debugging skill"
  ```

---

### Task 9: `requesting-review` and `receiving-review` skills

**Files:**
- Create: `skills/requesting-review/SKILL.md`
- Create: `skills/receiving-review/SKILL.md`

- [ ] **Step 1: Create requesting-review**

  Create `skills/requesting-review/SKILL.md`:
  ```markdown
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
  ```

- [ ] **Step 2: Create receiving-review**

  Create `skills/receiving-review/SKILL.md`:
  ```markdown
  ---
  name: receiving-review
  description: >
    Use when receiving code review feedback on an ADO pull request or code review.
    Use before implementing any suggested changes. Requires technical rigor —
    verify suggestions are correct before applying them.
  manualInvoke: false
  ---

  # Receiving Code Review

  Evaluate feedback before implementing it. Not all review comments are correct.

  ## Before Responding

  Read ALL comments first before changing anything.
  Group them: must-fix, should-fix, consider, disagree.

  ## For Each Suggestion

  Before implementing:
  1. **Understand it** — what problem is the reviewer solving?
  2. **Verify it** — is the suggestion technically correct for this codebase?
  3. **Check for side effects** — does applying it break anything?

  For DE-specific suggestions, verify:
  - PySpark API suggestions: confirm the API exists in the installed Spark version
  - SQL rewrites: test performance with `EXPLAIN` or query stats before accepting
  - Schema changes: trace all downstream consumers before agreeing

  ## Responding

  For suggestions you agree with: implement, test, commit.

  For suggestions you disagree with:
  - Respond with specific technical reasoning
  - Provide evidence (docs link, benchmark, counter-example)
  - Do not change code just to avoid conflict

  For suggestions you are unsure about:
  - Ask a clarifying question on the PR
  - Do not implement until you understand

  ## After Implementing All Changes

  Run full test suite. Show output.
  Reply to each comment: "Done — [what you did]" or "Discussed — [resolution]".
  Invoke `@sp /verify` before marking PR ready.
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add skills/requesting-review/SKILL.md skills/receiving-review/SKILL.md
  git commit -m "feat: add requesting-review and receiving-review skills"
  ```

---

### Task 10: `verification` skill

**Files:**
- Create: `skills/verification/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/verification/SKILL.md`:
  ```markdown
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

  Run and show the output of:
  ```
  git status
  git diff --stat
  ```

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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/verification/SKILL.md
  git commit -m "feat: add verification skill"
  ```

---

### Task 11: `finishing-branch` skill

**Files:**
- Create: `skills/finishing-branch/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/finishing-branch/SKILL.md`:
  ```markdown
  ---
  name: finishing-branch
  description: >
    Use when implementation is complete, all tests pass, and you need to create
    an ADO pull request to merge the branch. Guides completion of development
    work by checking git state and presenting PR options.
  manualInvoke: false
  ---

  # Finishing a Development Branch

  Complete your branch and create an ADO pull request.

  ## Before Creating the PR

  Run these checks:
  ```
  git log --oneline main..HEAD
  git diff main...HEAD --stat
  git status
  ```

  Confirm:
  - All commits are on this branch (not accidentally on main)
  - No uncommitted changes
  - All tests pass — run `@sp /verify` first

  ## Squash or Not?

  Review the commit history (`git log --oneline main..HEAD`).

  - If commits tell a clean story (one commit per logical change): keep as-is
  - If commits are messy (WIP, fixup, temp): consider squashing
  - If in doubt: keep individual commits — reviewers can see the journey

  ## Push and Create ADO PR

  Push the branch:
  ```
  git push -u origin <branch-name>
  ```

  Create the ADO PR with:
  - **Title:** `<type>: <what changed>` (e.g., `feat: add Silver dedup transformation`)
  - **Description:** (see template below)
  - **Reviewers:** Add relevant team members
  - **Work item link:** Link to the ADO board item
  - **Target branch:** main (or the appropriate base branch)

  PR description template:
  ```
  ## Summary
  - [bullet: what changed]
  - [bullet: why it changed]

  ## Test Plan
  - [ ] pytest output: [paste key results]
  - [ ] Pipeline validation: [link or output]

  ## Notes for Reviewer
  [anything that needs context or special attention]
  ```

  ## After PR is Created

  Move the ADO work item to "In Review" status.
  Notify reviewers in Teams/email if required by team process.
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/finishing-branch/SKILL.md
  git commit -m "feat: add finishing-branch skill"
  ```

---

### Task 12: `git-worktrees` skill

**Files:**
- Create: `skills/git-worktrees/SKILL.md`

- [ ] **Step 1: Create the skill**

  Create `skills/git-worktrees/SKILL.md`:
  ```markdown
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
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add skills/git-worktrees/SKILL.md
  git commit -m "feat: add git-worktrees skill"
  ```

---

### Task 13: `parallel-agents` and `subagent-dev` skills (degraded)

**Files:**
- Create: `skills/parallel-agents/SKILL.md`
- Create: `skills/subagent-dev/SKILL.md`

- [ ] **Step 1: Create parallel-agents**

  Create `skills/parallel-agents/SKILL.md`:
  ```markdown
  ---
  name: parallel-agents
  description: >
    Use when facing 2 or more independent tasks that can be worked on without
    shared state or sequential dependencies. Helps decompose and parallelize
    independent work streams.
  manualInvoke: false
  ---

  # Dispatching Parallel Work

  > **Note:** This skill is degraded vs the superpowers equivalent. VS Code Copilot
  > does not support isolated parallel subagents. Work is parallelized by decomposition
  > and sequential execution, or by using VS Code background agent sessions manually.

  ## When Tasks Can Be Parallelized

  Tasks are independent if:
  - They don't share mutable state
  - Neither task's output is the other's input
  - They can be tested independently

  ## How to Parallelize in VS Code

  **Option 1: Background sessions (manual)**
  Open multiple VS Code Copilot chat panels.
  Assign one independent task per panel.
  Each panel works on its task in isolation.

  **Option 2: Sequential decomposition**
  Order tasks by dependency. Execute them sequentially.
  Commit after each task so progress is saved.

  ## Decomposition Template

  Before splitting work:
  1. List all tasks
  2. Draw dependency arrows between tasks
  3. Tasks with no incoming arrows are safe to parallelize
  4. Tasks with incoming arrows must wait for their dependencies

  ## Recombining Work

  After parallel tasks complete:
  ```
  git log --oneline --all --graph
  ```
  Merge or rebase branches as appropriate.
  Run full test suite after recombination.
  ```

- [ ] **Step 2: Create subagent-dev**

  Create `skills/subagent-dev/SKILL.md`:
  ```markdown
  ---
  name: subagent-dev
  description: >
    Use when executing implementation plans with independent tasks in the current
    session. Breaks plan execution into isolated units with review between each.
  manualInvoke: false
  ---

  # Subagent-Driven Development

  > **Note:** This skill is degraded vs the superpowers equivalent. VS Code Copilot
  > does not support spawning isolated subagents. This skill provides a structured
  > inline execution pattern instead.

  ## Process

  For each task in the implementation plan:

  1. **Announce** the task: "Starting Task N: [name]"
  2. **Read** the task's file list and steps
  3. **Execute** each step exactly as written
  4. **Verify** using the task's test commands — show actual output
  5. **Commit** using the task's commit message
  6. **Report** completion: "Task N complete. Tests: [pass/fail count]. Commit: [hash]"

  ## Between Tasks

  After each task:
  ```
  git log --oneline -3
  pytest tests/ -q  (or relevant test command)
  ```

  Report status. Wait for acknowledgement before continuing.

  ## If a Task Fails

  Stop immediately. Do not continue to the next task.
  Report: failing step, error output, diagnosis.
  Wait for guidance.
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add skills/parallel-agents/SKILL.md skills/subagent-dev/SKILL.md
  git commit -m "feat: add parallel-agents and subagent-dev skills (degraded)"
  ```

---

### Task 14: `writing-skills` and `simplify` skills

**Files:**
- Create: `skills/writing-skills/SKILL.md`
- Create: `skills/simplify/SKILL.md`

- [ ] **Step 1: Create writing-skills**

  Create `skills/writing-skills/SKILL.md`:
  ```markdown
  ---
  name: writing-skills
  description: >
    Use when creating new skills for the SP superpowers system, editing existing
    skills, or verifying skills work correctly after deployment. Use when the user
    wants to add a new workflow to the skill library.
  manualInvoke: false
  ---

  # Writing Skills

  Create new SKILL.md files for the SP superpowers system.

  ## Skill Structure

  Every skill needs:
  ```yaml
  ---
  name: <kebab-case-name>
  description: >
    <One paragraph. This is used for auto-detection — make it match the natural
    language patterns a user would use when triggering this workflow. Be specific
    about the context and trigger conditions.>
  manualInvoke: false
  ---
  ```

  Followed by: clear step-by-step instructions that tell Copilot exactly what to do.

  ## Writing Good Descriptions

  The description determines when the skill auto-activates.
  Include: trigger phrases, task types, when to use vs when NOT to use.

  Good: "Use when the user wants to create an Azure Pipeline YAML for deploying a DAB bundle. Triggers on 'create pipeline', 'deploy bundle', 'azure pipeline yaml'."

  Bad: "Azure pipeline skill."

  ## Testing a New Skill

  After creating the skill file:
  1. Confirm the file is in `~/.copilot/skills/<skill-name>/SKILL.md`
  2. Open VS Code Insider. Check the SP Skills browser panel — skill should appear.
  3. Type a prompt that should trigger the skill. Verify it activates.
  4. Test with `@sp /<skill-name>` for explicit invocation.

  ## Skill Location

  Save new skills to: `~/.copilot/skills/<skill-name>/SKILL.md`
  Commit to the skills repo: `git add`, `git commit`.
  ```

- [ ] **Step 2: Create simplify**

  Create `skills/simplify/SKILL.md`:
  ```markdown
  ---
  name: simplify
  description: >
    Use when reviewing recently changed code for reuse opportunities, quality issues,
    and efficiency improvements. Use after implementing a feature to check if the
    code can be simplified. Reviews for DRY, YAGNI, readability, and performance.
  manualInvoke: false
  ---

  # Simplify

  Review changed code for quality and efficiency. Fix what you find.

  ## Before Reviewing

  Check what changed:
  ```
  git diff HEAD~1
  git diff --stat HEAD~1
  ```

  Read the changed files in full context.

  ## Review Checklist

  **DRY (Don't Repeat Yourself):**
  - [ ] Is any logic duplicated that could be extracted into a function?
  - [ ] Are there similar transformations that could share a utility?

  **YAGNI (You Aren't Gonna Need It):**
  - [ ] Is there code that handles scenarios that can't happen?
  - [ ] Are there parameters/options that have only one possible value?
  - [ ] Is there commented-out code that should be deleted?

  **Readability:**
  - [ ] Do variable and function names describe what they do?
  - [ ] Are complex transformations broken into named steps?
  - [ ] Are magic numbers/strings replaced with named constants?

  **DE-Specific:**
  - [ ] PySpark: are there unnecessary `.collect()` calls on large DataFrames?
  - [ ] PySpark: are joins using broadcast hint where appropriate?
  - [ ] SQL: are there subqueries that could be CTEs for readability?
  - [ ] DAB: are there hardcoded paths that should be parameters?

  ## Applying Fixes

  For each issue found:
  1. Make the change
  2. Run the tests — confirm nothing broke
  3. Commit with message: `refactor: <what you simplified and why>`

  Do NOT refactor code you didn't change. Stay focused on the current changes.
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add skills/writing-skills/SKILL.md skills/simplify/SKILL.md
  git commit -m "feat: add writing-skills and simplify skills"
  ```

---

## Phase 3: Memory System

> **Prerequisite:** Task 1 (Pilot Validation) must be complete. Use the findings from `docs/superpowers/pilot/hook-api-findings.md` to confirm or adjust the contracts below before implementing.

### Task 15: `inject-memory.py` with tests

**Files:**
- Create: `scripts/inject-memory.py`
- Create: `scripts/tests/test_inject_memory.py`

- [ ] **Step 1: Write failing test**

  Create `scripts/tests/test_inject_memory.py`:
  ```python
  import json
  import os
  import sys
  import tempfile
  from pathlib import Path
  from unittest.mock import patch

  # Add scripts dir to path
  sys.path.insert(0, str(Path(__file__).parent.parent))

  import pytest
  import inject_memory


  def test_outputs_valid_json_with_memory_content(tmp_path):
      memory_file = tmp_path / "MEMORY.md"
      memory_file.write_text("# Memory\n\nUser is a data engineer.")

      result = inject_memory.build_payload(str(memory_file))
      parsed = json.loads(result)

      assert "additionalInstructions" in parsed
      assert "data engineer" in parsed["additionalInstructions"]


  def test_exits_nonzero_when_memory_file_missing(tmp_path):
      missing_path = str(tmp_path / "nonexistent.md")

      with pytest.raises(SystemExit) as exc:
          inject_memory.build_payload(missing_path)

      assert exc.value.code != 0


  def test_memory_content_prefixed_with_header(tmp_path):
      memory_file = tmp_path / "MEMORY.md"
      memory_file.write_text("Some memory content")

      result = inject_memory.build_payload(str(memory_file))
      parsed = json.loads(result)

      assert parsed["additionalInstructions"].startswith("## Memory from previous sessions")
  ```

- [ ] **Step 2: Run test — verify it fails**

  ```bash
  python -m pytest scripts/tests/test_inject_memory.py -v
  ```
  Expected: `ModuleNotFoundError: No module named 'inject_memory'`

- [ ] **Step 3: Implement inject-memory.py**

  Create `scripts/inject-memory.py`:
  ```python
  """
  sessionStart hook script.
  Reads ~/.copilot/memory/MEMORY.md and outputs JSON for VS Code hook runner.
  Output: {"additionalInstructions": "<memory content>"}
  """
  import json
  import sys
  from pathlib import Path


  def build_payload(memory_path: str) -> str:
      path = Path(memory_path)
      if not path.exists():
          print(f"Memory file not found: {memory_path}", file=sys.stderr)
          sys.exit(1)

      content = path.read_text(encoding="utf-8")
      payload = {
          "additionalInstructions": f"## Memory from previous sessions\n\n{content}"
      }
      return json.dumps(payload)


  if __name__ == "__main__":
      memory_path = Path.home() / ".copilot" / "memory" / "MEMORY.md"
      print(build_payload(str(memory_path)))
  ```

- [ ] **Step 4: Run test — verify it passes**

  ```bash
  python -m pytest scripts/tests/test_inject_memory.py -v
  ```
  Expected: 3 passed

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/inject-memory.py scripts/tests/test_inject_memory.py
  git commit -m "feat: add inject-memory.py with tests"
  ```

---

### Task 16: `extract-memory.py` with tests

**Files:**
- Create: `scripts/extract-memory.py`
- Create: `scripts/tests/test_extract_memory.py`

- [ ] **Step 1: Write failing tests**

  Create `scripts/tests/test_extract_memory.py`:
  ```python
  import json
  import sys
  import tempfile
  from pathlib import Path

  import pytest

  sys.path.insert(0, str(Path(__file__).parent.parent))
  import extract_memory


  SAMPLE_TRANSCRIPT = """
  User: don't use pandas for anything over 1GB
  Assistant: Understood, I'll always use PySpark for large datasets.
  <!-- MEMORY: {"type": "feedback", "content": "Don't use pandas for datasets over 1GB", "file": "preferences.md"} -->
  User: our ADO board is at https://dev.azure.com/company/project
  Assistant: Got it, I'll remember that.
  <!-- MEMORY: {"type": "reference", "content": "ADO board: https://dev.azure.com/company/project", "file": "resources.md"} -->
  """


  def test_extracts_single_memory_marker(tmp_path):
      transcript = "Some text\n<!-- MEMORY: {\"type\": \"feedback\", \"content\": \"test content\", \"file\": \"prefs.md\"} -->"
      markers = extract_memory.parse_markers(transcript)
      assert len(markers) == 1
      assert markers[0]["content"] == "test content"
      assert markers[0]["type"] == "feedback"


  def test_extracts_multiple_markers(tmp_path):
      markers = extract_memory.parse_markers(SAMPLE_TRANSCRIPT)
      assert len(markers) == 2


  def test_no_markers_returns_empty_list():
      markers = extract_memory.parse_markers("No markers here.")
      assert markers == []


  def test_writes_memory_to_correct_file(tmp_path):
      memory_root = tmp_path / "memory"
      (memory_root / "feedback").mkdir(parents=True)
      (memory_root / "feedback" / "preferences.md").write_text("# Preferences\n")

      markers = [{"type": "feedback", "content": "Use PySpark for large data", "file": "preferences.md"}]
      extract_memory.write_memories(markers, str(memory_root))

      content = (memory_root / "feedback" / "preferences.md").read_text()
      assert "Use PySpark for large data" in content


  def test_creates_new_memory_file_if_not_exists(tmp_path):
      memory_root = tmp_path / "memory"
      (memory_root / "reference").mkdir(parents=True)

      markers = [{"type": "reference", "content": "ADO URL", "file": "resources.md"}]
      extract_memory.write_memories(markers, str(memory_root))

      assert (memory_root / "reference" / "resources.md").exists()


  def test_reads_transcript_path_from_stdin(tmp_path, monkeypatch, capsys):
      transcript_file = tmp_path / "transcript.txt"
      transcript_file.write_text("No markers.")
      memory_root = tmp_path / "memory"
      memory_root.mkdir()

      stdin_data = json.dumps({"transcript_path": str(transcript_file), "session_id": "test"})
      monkeypatch.setattr("sys.stdin", __import__("io").StringIO(stdin_data))

      extract_memory.main(str(memory_root))
      # No error = success when no markers found
  ```

- [ ] **Step 2: Run — verify fails**

  ```bash
  python -m pytest scripts/tests/test_extract_memory.py -v
  ```
  Expected: `ModuleNotFoundError: No module named 'extract_memory'`

- [ ] **Step 3: Implement extract-memory.py**

  Create `scripts/extract-memory.py`:
  ```python
  """
  sessionEnd hook script.
  Reads session transcript via stdin JSON, extracts MEMORY markers,
  writes to ~/.copilot/memory/ files.

  stdin: {"timestamp": "...", "session_id": "...", "transcript_path": "..."}
  """
  import json
  import re
  import sys
  from pathlib import Path
  from datetime import datetime


  MEMORY_PATTERN = re.compile(
      r'<!--\s*MEMORY:\s*(\{.*?\})\s*-->',
      re.DOTALL
  )


  def parse_markers(text: str) -> list[dict]:
      """Extract all MEMORY markers from transcript text."""
      markers = []
      for match in MEMORY_PATTERN.finditer(text):
          try:
              marker = json.loads(match.group(1))
              if all(k in marker for k in ("type", "content", "file")):
                  markers.append(marker)
          except json.JSONDecodeError:
              pass
      return markers


  def write_memories(markers: list[dict], memory_root: str) -> None:
      """Write extracted markers to memory files and update MEMORY.md index."""
      root = Path(memory_root)
      for marker in markers:
          type_dir = root / marker["type"]
          type_dir.mkdir(parents=True, exist_ok=True)
          file_path = type_dir / marker["file"]

          timestamp = datetime.now().strftime("%Y-%m-%d")
          entry = f"\n- [{timestamp}] {marker['content']}\n"

          if file_path.exists():
              file_path.write_text(file_path.read_text(encoding="utf-8") + entry, encoding="utf-8")
          else:
              file_path.write_text(f"# {marker['file'].replace('.md', '').title()}\n{entry}", encoding="utf-8")

      if markers:
          _update_index(root, markers)


  def _update_index(root: Path, markers: list[dict]) -> None:
      """Update MEMORY.md index with new entries."""
      index_path = root / "MEMORY.md"
      lines = index_path.read_text(encoding="utf-8") if index_path.exists() else "# Memory\n"

      for marker in markers:
          ref = f"- [{marker['type']}] {marker['content'][:80]} → `{marker['type']}/{marker['file']}`"
          if ref not in lines:
              lines += f"\n{ref}"

      index_path.write_text(lines, encoding="utf-8")


  def main(memory_root: str = None) -> None:
      if memory_root is None:
          memory_root = str(Path.home() / ".copilot" / "memory")

      try:
          data = json.loads(sys.stdin.read())
      except json.JSONDecodeError:
          print("Warning: invalid stdin JSON", file=sys.stderr)
          return

      transcript_path = data.get("transcript_path")
      if not transcript_path or not Path(transcript_path).exists():
          return  # No transcript — silent no-op

      transcript = Path(transcript_path).read_text(encoding="utf-8")
      markers = parse_markers(transcript)

      if markers:
          write_memories(markers, memory_root)
          print(f"Extracted {len(markers)} memory marker(s).", file=sys.stderr)


  if __name__ == "__main__":
      main()
  ```

- [ ] **Step 4: Run — verify passes**

  ```bash
  python -m pytest scripts/tests/test_extract_memory.py -v
  ```
  Expected: 6 passed

- [ ] **Step 5: Commit**

  ```bash
  git add scripts/extract-memory.py scripts/tests/test_extract_memory.py
  git commit -m "feat: add extract-memory.py with tests"
  ```

---

### Task 17: Hook config files

**Files:**
- Create: `hooks/session-start.json`
- Create: `hooks/session-end.json`

> Use the findings from `docs/superpowers/pilot/hook-api-findings.md`. Adjust the command paths if needed.

- [ ] **Step 1: Create session-start.json**

  Create `hooks/session-start.json`:
  ```json
  {
    "hooks": {
      "sessionStart": [
        {
          "type": "command",
          "command": "python ~/.copilot/scripts/inject-memory.py",
          "timeout": 5
        }
      ]
    }
  }
  ```

- [ ] **Step 2: Create session-end.json**

  Create `hooks/session-end.json`:
  ```json
  {
    "hooks": {
      "sessionEnd": [
        {
          "type": "command",
          "command": "python ~/.copilot/scripts/extract-memory.py",
          "timeout": 15
        }
      ]
    }
  }
  ```

- [ ] **Step 3: Determine hook registration mechanism**

  Read `docs/superpowers/pilot/hook-api-findings.md`. Determine how VS Code Insider
  discovers hook files (fixed path, settings key, or `.github/hooks/` workspace convention).
  Update `setup.ps1` Step 4 placeholder with the correct registration command.

- [ ] **Step 4: Commit**

  ```bash
  git add hooks/session-start.json hooks/session-end.json
  git commit -m "feat: add hook config files"
  ```

---

## Phase 4: VS Code Extension

### Task 18: Extension scaffold

**Files:**
- Create: `extension/package.json`
- Create: `extension/tsconfig.json`

- [ ] **Step 1: Create package.json**

  Create `extension/package.json`:
  ```json
  {
    "name": "sp-superpowers",
    "displayName": "SP Superpowers",
    "description": "Superpowers workflow skills for GitHub Copilot Chat",
    "version": "1.0.0",
    "engines": { "vscode": "^1.108.0" },
    "categories": ["AI"],
    "activationEvents": ["onStartupFinished"],
    "main": "./out/extension.js",
    "contributes": {
      "chatParticipants": [
        {
          "id": "sp.assistant",
          "name": "sp",
          "fullName": "SP Superpowers",
          "description": "Invoke superpowers workflow skills",
          "isSticky": false,
          "commands": [
            { "name": "brainstorm", "description": "Design before building" },
            { "name": "write-plan", "description": "Create implementation plan" },
            { "name": "execute-plan", "description": "Execute a written plan" },
            { "name": "tdd", "description": "Test-driven development workflow" },
            { "name": "debug", "description": "Systematic debugging" },
            { "name": "request-review", "description": "Prepare ADO PR" },
            { "name": "receive-review", "description": "Handle code review feedback" },
            { "name": "verify", "description": "Verify before claiming done" },
            { "name": "finish-branch", "description": "Complete branch and create ADO PR" },
            { "name": "worktree", "description": "Isolate work with git worktrees" },
            { "name": "write-skill", "description": "Create a new skill" },
            { "name": "simplify", "description": "Review code for quality" }
          ]
        }
      ],
      "views": {
        "explorer": [
          {
            "id": "spSkillBrowser",
            "name": "SP Skills",
            "icon": "$(sparkle)"
          }
        ]
      },
      "commands": [
        {
          "command": "sp.newSkill",
          "title": "SP: New Skill",
          "category": "SP Superpowers"
        }
      ]
    },
    "scripts": {
      "vscode:prepublish": "npm run compile",
      "compile": "tsc -p ./",
      "watch": "tsc -watch -p ./"
    },
    "devDependencies": {
      "@types/vscode": "^1.108.0",
      "@types/node": "^20.0.0",
      "typescript": "^5.3.0",
      "@vscode/vsce": "^2.24.0"
    }
  }
  ```

- [ ] **Step 2: Create tsconfig.json**

  Create `extension/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "module": "Node16",
      "target": "ES2022",
      "outDir": "out",
      "lib": ["ES2022"],
      "sourceMap": true,
      "rootDir": "src",
      "strict": true
    },
    "exclude": ["node_modules", ".vscode-test"]
  }
  ```

- [ ] **Step 3: Install dependencies**

  ```bash
  cd extension
  npm install
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add extension/package.json extension/tsconfig.json extension/package-lock.json
  git commit -m "feat: add extension scaffold"
  ```

---

### Task 19: `extension.ts` — activation entry point

**Files:**
- Create: `extension/src/extension.ts`

- [ ] **Step 1: Create extension.ts**

  Create `extension/src/extension.ts`:
  ```typescript
  import * as vscode from 'vscode';
  import { registerSpParticipant } from './participant';
  import { SkillBrowserProvider } from './skillBrowser';
  import { registerScaffoldCommand } from './scaffolder';

  export function activate(context: vscode.ExtensionContext): void {
      const skillsRoot = getSkillsRoot();

      registerSpParticipant(context, skillsRoot);
      const browserProvider = new SkillBrowserProvider(skillsRoot);
      vscode.window.registerTreeDataProvider('spSkillBrowser', browserProvider);
      registerScaffoldCommand(context, skillsRoot);
  }

  export function deactivate(): void {}

  function getSkillsRoot(): string {
      const homeDir = process.env.USERPROFILE || process.env.HOME || '';
      return require('path').join(homeDir, '.copilot', 'skills');
  }
  ```

- [ ] **Step 2: Compile (will fail until other files exist)**

  ```bash
  npm --prefix extension run compile 2>&1 | head -20
  ```
  Expected: errors about missing modules participant, skillBrowser, scaffolder — that's fine, continue.

- [ ] **Step 3: Commit**

  ```bash
  git add extension/src/extension.ts
  git commit -m "feat: add extension activation entry point"
  ```

---

### Task 20: `participant.ts` — `@sp` chat participant

**Files:**
- Create: `extension/src/participant.ts`

- [ ] **Step 1: Create participant.ts**

  Create `extension/src/participant.ts`:
  ```typescript
  import * as vscode from 'vscode';
  import * as fs from 'fs';
  import * as path from 'path';

  const COMMAND_TO_SKILL: Record<string, string> = {
      'brainstorm': 'brainstorming',
      'write-plan': 'writing-plans',
      'execute-plan': 'executing-plans',
      'tdd': 'tdd',
      'debug': 'debugging',
      'request-review': 'requesting-review',
      'receive-review': 'receiving-review',
      'verify': 'verification',
      'finish-branch': 'finishing-branch',
      'worktree': 'git-worktrees',
      'write-skill': 'writing-skills',
      'simplify': 'simplify',
  };

  export function registerSpParticipant(
      context: vscode.ExtensionContext,
      skillsRoot: string
  ): void {
      const participant = vscode.chat.createChatParticipant(
          'sp.assistant',
          async (request, _chatContext, stream, token) => {
              const skillName = COMMAND_TO_SKILL[request.command ?? ''];

              if (!skillName) {
                  stream.markdown('Unknown command. Available skills:\n');
                  for (const cmd of Object.keys(COMMAND_TO_SKILL)) {
                      stream.markdown(`- \`@sp /${cmd}\`\n`);
                  }
                  return;
              }

              const skillContent = loadSkill(skillsRoot, skillName);
              if (!skillContent) {
                  stream.markdown(`Skill \`${skillName}\` not found at \`${skillsRoot}/${skillName}/SKILL.md\`.`);
                  return;
              }

              const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
              if (!models.length) {
                  stream.markdown('No language model available.');
                  return;
              }

              const messages = [
                  vscode.LanguageModelChatMessage.User(
                      `You are following the "${skillName}" skill. Here are the skill instructions:\n\n${skillContent}\n\n---\n\nUser request: ${request.prompt}`
                  )
              ];

              const response = await models[0].sendRequest(messages, {}, token);
              for await (const chunk of response.text) {
                  stream.markdown(chunk);
              }
          }
      );

      participant.iconPath = new vscode.ThemeIcon('sparkle');
      context.subscriptions.push(participant);
  }

  function loadSkill(skillsRoot: string, skillName: string): string | null {
      const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
          return null;
      }
      return fs.readFileSync(skillPath, 'utf-8');
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add extension/src/participant.ts
  git commit -m "feat: add @sp chat participant with skill dispatch"
  ```

---

### Task 21: `skillBrowser.ts` — skill browser panel

**Files:**
- Create: `extension/src/skillBrowser.ts`

- [ ] **Step 1: Create skillBrowser.ts**

  Create `extension/src/skillBrowser.ts`:
  ```typescript
  import * as vscode from 'vscode';
  import * as fs from 'fs';
  import * as path from 'path';

  interface SkillInfo {
      name: string;
      description: string;
      degraded: boolean;
      skillPath: string;
  }

  const DEGRADED_SKILLS = new Set(['parallel-agents', 'subagent-dev']);

  export class SkillBrowserProvider implements vscode.TreeDataProvider<SkillItem> {
      private _onDidChangeTreeData = new vscode.EventEmitter<SkillItem | undefined>();
      readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

      constructor(private skillsRoot: string) {}

      refresh(): void {
          this._onDidChangeTreeData.fire(undefined);
      }

      getTreeItem(element: SkillItem): vscode.TreeItem {
          return element;
      }

      getChildren(): SkillItem[] {
          if (!fs.existsSync(this.skillsRoot)) {
              return [new SkillItem({ name: 'Skills not found', description: `Check ${this.skillsRoot}`, degraded: false, skillPath: '' })];
          }

          return fs.readdirSync(this.skillsRoot)
              .filter(dir => fs.existsSync(path.join(this.skillsRoot, dir, 'SKILL.md')))
              .map(dir => {
                  const skillPath = path.join(this.skillsRoot, dir, 'SKILL.md');
                  const description = extractDescription(skillPath);
                  return new SkillItem({
                      name: dir,
                      description,
                      degraded: DEGRADED_SKILLS.has(dir),
                      skillPath
                  });
              });
      }
  }

  class SkillItem extends vscode.TreeItem {
      constructor(skill: SkillInfo) {
          const label = skill.degraded ? `${skill.name} (degraded)` : skill.name;
          super(label, vscode.TreeItemCollapsibleState.None);
          this.tooltip = skill.description;
          this.description = skill.description.slice(0, 60) + (skill.description.length > 60 ? '…' : '');
          this.iconPath = new vscode.ThemeIcon(skill.degraded ? 'warning' : 'sparkle');
          if (skill.skillPath) {
              this.command = {
                  command: 'vscode.open',
                  title: 'Open Skill',
                  arguments: [vscode.Uri.file(skill.skillPath)]
              };
          }
      }
  }

  function extractDescription(skillPath: string): string {
      try {
          const content = fs.readFileSync(skillPath, 'utf-8');
          const match = content.match(/description:\s*>\s*([\s\S]*?)(?=\n\w|\n---)/);
          return match ? match[1].replace(/\s+/g, ' ').trim() : 'No description';
      } catch {
          return 'Could not read skill';
      }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add extension/src/skillBrowser.ts
  git commit -m "feat: add skill browser tree view panel"
  ```

---

### Task 22: `scaffolder.ts` — new skill command

**Files:**
- Create: `extension/src/scaffolder.ts`

- [ ] **Step 1: Create scaffolder.ts**

  Create `extension/src/scaffolder.ts`:
  ```typescript
  import * as vscode from 'vscode';
  import * as fs from 'fs';
  import * as path from 'path';

  const SKILL_TEMPLATE = `---
  name: {skill-name}
  description: >
    Use when [describe the trigger conditions and when this skill should activate].
    Include specific phrases and contexts that indicate this skill is needed.
  manualInvoke: false
  ---

  # {Skill Title}

  [Brief description of what this skill does.]

  ## Before Starting

  Check project context:
  \`\`\`
  git log --oneline -10
  git status
  \`\`\`

  ## Process

  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

  ## Rules

  - [Rule 1]
  - [Rule 2]
  `;

  export function registerScaffoldCommand(
      context: vscode.ExtensionContext,
      skillsRoot: string
  ): void {
      const command = vscode.commands.registerCommand('sp.newSkill', async () => {
          const skillName = await vscode.window.showInputBox({
              prompt: 'Skill name (kebab-case, e.g. my-new-skill)',
              validateInput: v => /^[a-z0-9-]+$/.test(v) ? null : 'Use lowercase letters, numbers, and hyphens only'
          });

          if (!skillName) return;

          const skillDir = path.join(skillsRoot, skillName);
          const skillFile = path.join(skillDir, 'SKILL.md');

          if (fs.existsSync(skillFile)) {
              vscode.window.showErrorMessage(`Skill "${skillName}" already exists.`);
              return;
          }

          fs.mkdirSync(skillDir, { recursive: true });
          const content = SKILL_TEMPLATE
              .replace(/{skill-name}/g, skillName)
              .replace(/{Skill Title}/g, skillName.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '));
          fs.writeFileSync(skillFile, content, 'utf-8');

          const doc = await vscode.workspace.openTextDocument(skillFile);
          await vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage(`Skill "${skillName}" created. Edit SKILL.md and save.`);
      });

      context.subscriptions.push(command);
  }
  ```

- [ ] **Step 2: Compile the extension**

  ```bash
  npm --prefix extension run compile
  ```
  Expected: 0 errors, `out/` directory created.

- [ ] **Step 3: Commit**

  ```bash
  git add extension/src/scaffolder.ts extension/out/
  git commit -m "feat: add skill scaffolding command and compile extension"
  ```

---

## Phase 5: Setup and Teardown

### Task 23: `setup.ps1`

**Files:**
- Create: `setup.ps1`

- [ ] **Step 1: Create setup.ps1**

  Create `setup.ps1`:
  ```powershell
  #Requires -Version 7.0
  <#
  .SYNOPSIS
      One-time setup for SP Superpowers harness.
  .DESCRIPTION
      Registers hooks, configures VS Code settings, installs extension.
  #>

  Set-StrictMode -Version Latest
  $ErrorActionPreference = "Stop"

  $CopilotRoot = Join-Path $env:USERPROFILE ".copilot"
  $RepoRoot = $PSScriptRoot
  $VSCodeSettingsPath = Join-Path $env:APPDATA "Code - Insiders\User\settings.json"

  function Write-Step($msg) { Write-Host "  → $msg" -ForegroundColor Cyan }
  function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
  function Write-Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

  Write-Host "SP Superpowers Setup" -ForegroundColor Yellow
  Write-Host "===================="

  # PowerShell 7+ required for ConvertFrom-Json -AsHashtable
  if ($PSVersionTable.PSVersion.Major -lt 7) {
      Write-Fail "Requires PowerShell 7+. Install with: winget install Microsoft.PowerShell"
  }

  # Step 1: Check Python
  Write-Step "Checking Python..."
  try {
      $pyVersion = & python --version 2>&1
      Write-Ok "Found: $pyVersion"
  } catch {
      Write-Fail "Python not found on PATH. Install Python 3.8+ and add to PATH."
  }

  # Step 2: Create memory structure
  Write-Step "Creating memory directory structure..."
  @("memory", "memory\user", "memory\feedback", "memory\project", "memory\reference") | ForEach-Object {
      $dir = Join-Path $CopilotRoot $_
      if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  }
  $memoryIndex = Join-Path $CopilotRoot "memory\MEMORY.md"
  if (-not (Test-Path $memoryIndex)) {
      Set-Content $memoryIndex "# Memory`n`nNo memories recorded yet."
  }
  Write-Ok "Memory structure ready"

  # Step 3: Update VS Code settings
  Write-Step "Updating VS Code Insider settings..."
  if (-not (Test-Path $VSCodeSettingsPath)) {
      Write-Fail "VS Code Insider settings not found at: $VSCodeSettingsPath"
  }
  $settings = Get-Content $VSCodeSettingsPath -Raw | ConvertFrom-Json -AsHashtable

  $settings["chat.agentSkillsLocations"] = @("$CopilotRoot\skills")
  $settings["chat.useAgentSkills"] = $true
  $settings["github.copilot.chat.codeGeneration.instructions"] = @(
      @{ file = "$CopilotRoot\instructions\sp-bootstrap.instructions.md" },
      @{ file = "$CopilotRoot\instructions\memory.instructions.md" }
  )
  $settings["chat.tools.edits.autoApprove"] = "$CopilotRoot\memory\**"

  $settings | ConvertTo-Json -Depth 10 | Set-Content $VSCodeSettingsPath -Encoding UTF8
  Write-Ok "VS Code settings updated"

  # Step 4: Register hooks
  # TODO: Fill in after completing Task 1 (Pilot Validation).
  # Determine from hook-api-findings.md: does VS Code Insider discover hooks via
  # a fixed path (~/.copilot/hooks/), a VS Code setting, or a workspace .github/ directory?
  # Add the correct registration mechanism here. Example possibilities:
  #   Copy-Item hooks\*.json (Join-Path $CopilotRoot "hooks\") -Force  # if fixed-path discovery
  #   $settings["chat.hooksLocations"] = @("$CopilotRoot\hooks")       # if settings-based
  Write-Step "Hook registration — complete after pilot validation (see Task 1)"
  Write-Host "  ! Review docs/superpowers/pilot/hook-api-findings.md and update this step." -ForegroundColor Yellow

  # Step 5: Build and install extension
  Write-Step "Building extension..."
  Push-Location (Join-Path $RepoRoot "extension")
  npm install --silent
  npm run compile
  if ($LASTEXITCODE -ne 0) { Write-Fail "Extension compile failed" }

  Write-Step "Installing extension as VSIX..."
  npx vsce package --out sp-superpowers.vsix --no-dependencies 2>$null
  code-insiders --install-extension sp-superpowers.vsix
  Pop-Location
  Write-Ok "Extension installed"

  Write-Host ""
  Write-Host "Setup complete! Restart VS Code Insider to activate." -ForegroundColor Green
  Write-Host "Then open Copilot Chat — SP skills are ready." -ForegroundColor Green
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add setup.ps1
  git commit -m "feat: add setup.ps1"
  ```

---

### Task 24: `teardown.ps1`

**Files:**
- Create: `teardown.ps1`

- [ ] **Step 1: Create teardown.ps1**

  Create `teardown.ps1`:
  ```powershell
  #Requires -Version 7.0
  <#
  .SYNOPSIS
      Remove SP Superpowers harness.
  .DESCRIPTION
      Reverses setup.ps1. Leaves memory intact.
  #>

  Set-StrictMode -Version Latest
  $ErrorActionPreference = "Stop"

  $CopilotRoot = Join-Path $env:USERPROFILE ".copilot"
  $VSCodeSettingsPath = Join-Path $env:APPDATA "Code - Insiders\User\settings.json"

  function Write-Step($msg) { Write-Host "  → $msg" -ForegroundColor Cyan }
  function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }

  Write-Host "SP Superpowers Teardown" -ForegroundColor Yellow
  Write-Host "======================="

  # Step 1: Remove VS Code settings
  Write-Step "Removing VS Code settings..."
  if (Test-Path $VSCodeSettingsPath) {
      $settings = Get-Content $VSCodeSettingsPath -Raw | ConvertFrom-Json -AsHashtable
      @("chat.agentSkillsLocations", "chat.useAgentSkills",
        "github.copilot.chat.codeGeneration.instructions",
        "chat.tools.edits.autoApprove") | ForEach-Object {
          $settings.Remove($_)
      }
      $settings | ConvertTo-Json -Depth 10 | Set-Content $VSCodeSettingsPath -Encoding UTF8
  }
  Write-Ok "VS Code settings restored"

  # Step 2: Uninstall extension
  Write-Step "Uninstalling extension..."
  code-insiders --uninstall-extension sp-superpowers 2>$null
  Write-Ok "Extension uninstalled"

  Write-Host ""
  Write-Host "Teardown complete. Memory preserved at: $CopilotRoot\memory\" -ForegroundColor Green
  Write-Host "Restart VS Code Insider to complete removal." -ForegroundColor Green
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add teardown.ps1
  git commit -m "feat: add teardown.ps1"
  ```

---

## Phase 6: End-to-End Test

### Task 25: Integration test

- [ ] **Step 1: Run Python unit tests**

  ```bash
  cd scripts
  python -m pytest tests/ -v
  ```
  Expected: all tests pass.

- [ ] **Step 2: Compile extension**

  ```bash
  cd extension && npm run compile
  ```
  Expected: 0 errors.

- [ ] **Step 3: Run setup.ps1 (dry run review)**

  Review `setup.ps1` — do not run yet. Confirm:
  - Python path check is correct
  - VS Code Insider settings path matches your machine
  - Extension install command is correct

- [ ] **Step 4: Run setup.ps1**

  ```powershell
  .\setup.ps1
  ```
  Expected: all steps show ✓

- [ ] **Step 5: Verify skills appear in VS Code**

  Restart VS Code Insider.
  Open Explorer panel — confirm "SP Skills" tree view shows 15 skills.

- [ ] **Step 6: Test auto-detection**

  Open Copilot Chat in agent mode.
  Type: "I want to design a new Bronze to Silver pipeline for customer data"
  Expected: `brainstorming` skill activates automatically.

- [ ] **Step 7: Test explicit invocation**

  Type: `@sp /debug`
  Expected: debugging skill instructions appear.

- [ ] **Step 8: Test memory injection**

  Start a new agent session.
  Check that memory context appears (if hooks are working).

- [ ] **Step 9: Test memory extraction**

  In a session, provide feedback that Copilot should remember.
  End the session. Check `~/.copilot/memory/` for new entries.

- [ ] **Step 10: Final commit**

  ```bash
  git add -A
  git commit -m "feat: complete SP superpowers harness v1.0"
  ```
