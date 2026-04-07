# Fix VS Code Copilot Hooks — Validated Work Plan

## TL;DR

> **Quick Summary**: Fix VS Code Copilot hooks so that memory injection/extraction works, brainstorming mode hard-blocks code writing, and multi-turn conversations preserve skill constraints.
> 
> **Deliverables**:
> - Fixed `inject-memory.py` with correct `hookSpecificOutput` + `additionalContext` schema
> - `stop.json` hook (renamed from `session-end.json`) with `Stop` event
> - `PreToolUse` hook that hard-denies file writes in brainstorming/writing-plans mode
> - `UserPromptSubmit` hook that warns when code keywords detected
> - Updated `participant.ts` with active-skill state file + multi-turn support
> - Updated `setup.ps1` with explicit `chat.hookFilesLocations` registration
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — Wave 1 (E1, E2, E7), Wave 2 (E6, E5a), Wave 3 (E4, E3, E5b)
> **Critical Path**: E1 → E6 → E5 → E4 → E3

---

## Context

### Original Problem
User invokes `@sp /brainstorming` but model immediately writes code instead of following brainstorming workflow. Root causes identified via diagnosis.

### Research Findings (from VS Code Official Docs)

**Valid Hook Events:**
- `SessionStart` ✅ — fires when new session begins
- `Stop` ✅ — fires when session ends (NOT `sessionEnd`)
- `UserPromptSubmit` ✅ — fires when user submits prompt
- `PreToolUse` ✅ — fires before tool invocation, can return `permissionDecision: "deny"`

**Hook Output Schema (CRITICAL):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked by policy",
    "additionalContext": "..."
  }
}
```

**Important Notes:**
- Field name is `additionalContext` NOT `additionalInstructions`
- Agent hooks are **Preview** feature — may change in future VS Code versions
- Minimum VS Code version: **1.95+**
- Exit code 2 = blocking error, 0 = success

### Metis Review Findings

**Critical Corrections:**
1. ⚠️ Field name MUST be `additionalContext` not `additionalInstructions`
2. ⚠️ Need to add VS Code engine requirement to package.json
3. ⚠️ Keep scope locked — don't add workspace-level hooks

**Guardrails Applied:**
- MUST: Use `additionalContext` field name
- MUST: Document minimum VS Code version (1.95+)
- MUST: Use `permissionDecision: "deny"` for writeFile/editFile in brainstorming mode
- MUST: PreToolUse scripts exit with code 2 for blocking errors
- MUST NOT: Add workspace-level hook support (`.github/hooks/`)
- MUST NOT: Use `updatedInput` for redirection (stick to blocking only)

---

## Work Objectives

### Core Objective
Fix the VS Code Copilot harness so that:
1. Memory is injected at session start (not silently ignored)
2. Memory is extracted at session end
3. Follow-up questions in brainstorming mode re-inject skill constraints
4. Code writing is hard-blocked during brainstorming mode (not just prompted)

### Concrete Deliverables
- [ ] `scripts/inject-memory.py` — corrected output schema
- [ ] `hooks/stop.json` — renamed from `session-end.json`, uses `Stop` event
- [ ] `hooks/session-start.json` — updated to invoke correct Python script
- [ ] `hooks/pre-tool-use.json` — hard-blocks file writes in no-code modes
- [ ] `hooks/user-prompt-submit.json` — warns when code keywords in no-code modes
- [ ] `extension/src/participant.ts` — writes active-skill state + multi-turn
- [ ] `setup.ps1` — registers `chat.hookFilesLocations` + VS Code version check
- [ ] `extension/package.json` — adds engine requirement

### Definition of Done
- [ ] `inject-memory.py` outputs valid `hookSpecificOutput` JSON
- [ ] `stop.json` hook fires when session ends
- [ ] `PreToolUse` returns `permissionDecision: "deny"` for writeFile in brainstorming
- [ ] Follow-up message in `@sp /brainstorm` re-injects skill context
- [ ] `setup.ps1` explicitly registers hook location in settings

### Must Have
- Memory injection works (observable in chat context)
- Hard block on file writes in brainstorming mode
- Multi-turn conversation preserves skill constraints
- Hooks registered and discovered by VS Code

### Must NOT Have
- Workspace-level hooks (`.github/hooks/`)
- UpdatedInput redirection (only blocking)
- Mixed field names (`additionalInstructions` vs `additionalContext`)
- Dependencies on non-Preview APIs

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (this is a harness, not a app with tests)
- **Automated tests**: NO (manual verification required)
- **Agent-Executed QA**: YES — Every task includes manual verification steps

### QA Policy
Every task includes agent-executed QA scenarios using:
- Manual VS Code interaction testing
- Output channel inspection
- File content verification

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — can run in parallel):
├── Task 1: Fix inject-memory.py output schema
├── Task 2: Rename session-end.json → stop.json
└── Task 3: Update session-start.json to invoke Python script

Wave 2 (Infrastructure):
├── Task 4: Update setup.ps1 with hook registration
└── Task 5: Add VS Code engine requirement to package.json

Wave 3 (Core features):
├── Task 6: Create PreToolUse hook (hard block)
├── Task 7: Create UserPromptSubmit hook (warning)
└── Task 8: Update participant.ts (state file + multi-turn)

Wave FINAL (Verification):
└── Task 9: Manual integration testing
```

### Dependency Matrix
- Task 1: - - 9
- Task 2: 1 - 9
- Task 3: 1 - 9
- Task 4: - - 9
- Task 5: 4 - 9
- Task 6: 4, 5, 8 - 9
- Task 7: 4, 5, 8 - 9
- Task 8: 4, 5 - 6, 7, 9
- Task 9: 1, 2, 3, 6, 7, 8 - -

---

## TODOs

- [x] 1. Fix `inject-memory.py` output schema

  **What to do**:
  - Modify `scripts/inject-memory.py` to output correct JSON schema
  - Change from `{"additionalInstructions": "..."}` to `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}`
  - Use `additionalContext` NOT `additionalInstructions` (critical fix from Metis)
  - Ensure JSON is valid and properly formatted
  - Test by running script and piping output to `jq` or similar

  **Must NOT do**:
  - Mix field names — use ONLY `additionalContext`
  - Use `additionalInstructions` anywhere — this is the root cause bug

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Simple Python script fix — single file, well-understood change

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 9 (Final integration test)
  - **Blocked By**: None

  **References**:
  - `scripts/inject-memory.py` — current broken implementation
  - VS Code docs: SessionStart output schema uses `hookSpecificOutput.additionalContext`

  **Acceptance Criteria**:
  - [ ] Script outputs valid JSON
  - [ ] Output contains `hookSpecificOutput` wrapper object
  - [ ] `hookSpecificOutput.hookEventName` = "SessionStart"
  - [ ] `hookSpecificOutput.additionalContext` contains memory content
  - [ ] No `additionalInstructions` field present

  **QA Scenarios**:
  ```
  Scenario: Correct JSON output format
    Tool: Bash
    Preconditions: Python 3 installed
    Steps:
      1. python ~/.copilot/scripts/inject-memory.py
      2. Pipe output to jq or python -m json.tool
    Expected Result: Valid JSON with hookSpecificOutput.additionalContext fields
    Failure Indicators: JSON parse error, missing hookSpecificOutput, wrong field name
    Evidence: .sisyphus/evidence/task-1-json-valid.md

  Scenario: Memory content is present
    Tool: Bash
    Preconditions: MEMORY.md exists with content
    Steps:
      1. python ~/.copilot/scripts/inject-memory.py
      2. Check output contains "## Memory" or similar
    Expected Result: Memory content appears in additionalContext
    Failure Indicators: Empty additionalContext, memory file not read
    Evidence: .sisyphus/evidence/task-1-memory-present.md
  ```

  **Evidence to Capture**:
  - [ ] JSON validation output
  - [ ] Memory content verification

  **Commit**: YES
  - Message: `fix(hooks): correct inject-memory output schema to hookSpecificOutput`
  - Files: `scripts/inject-memory.py`

---

- [x] 2. Rename `session-end.json` → `stop.json`

  **What to do**:
  - Create new file `hooks/stop.json` with `Stop` event (NOT `sessionEnd`)
  - Copy the same hook configuration but change event name from `sessionEnd` to `Stop`
  - Keep the same `extract-memory.py` script reference
  - Delete the old `session-end.json` file

  **Must NOT do**:
  - Keep `session-end.json` as a duplicate
  - Use `sessionEnd` as the event name (this was the bug)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Simple file rename + JSON edit

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1 (recommended for memory script fix first)

  **References**:
  - `hooks/session-end.json` — current file with wrong event name
  - VS Code docs: `Stop` event fires when session ends

  **Acceptance Criteria**:
  - [ ] `hooks/stop.json` exists with `Stop` event
  - [ ] `hooks/session-end.json` is deleted
  - [ ] Hook command points to `extract-memory.py`
  - [ ] File is valid JSON

  **QA Scenarios**:
  ```
  Scenario: stop.json has correct event name
    Tool: Bash
    Preconditions: None
    Steps:
      1. cat hooks/stop.json
      2. Verify "Stop" appears as key (not "sessionEnd")
    Expected Result: Event name is "Stop"
    Failure Indicators: "sessionEnd" still present, wrong key name
    Evidence: .sisyphus/evidence/task-2-stop-event.md

  Scenario: Old session-end.json is deleted
    Tool: Bash
    Preconditions: None
    Steps:
      1. Test-Path hooks/session-end.json
    Expected Result: False (file should not exist)
    Failure Indicators: File still exists
    Evidence: .sisyphus/evidence/task-2-old-deleted.md
  ```

  **Evidence to Capture**:
  - [ ] stop.json content
  - [ ] Confirmation old file deleted

  **Commit**: YES
  - Message: `fix(hooks): rename session-end to stop with correct event name`
  - Files: `hooks/stop.json` (new), `hooks/session-end.json` (deleted)

---

- [x] 3. Update `session-start.json` to invoke Python script

  **What to do**:
  - Update `hooks/session-start.json` to use `inject-memory.py` script
  - Use correct Python path on Windows
  - Ensure command produces proper output format (hook will capture stdout)
  - Add `timeout` setting (15 seconds recommended for memory file reading)

  **Must NOT do**:
  - Keep the test PowerShell command that just prints "TEST INJECTION WORKS"

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Simple JSON configuration update

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1)
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1 (so inject-memory.py is fixed first)

  **References**:
  - `hooks/session-start.json` — current test configuration
  - `scripts/inject-memory.py` — the script that should be invoked

  **Acceptance Criteria**:
  - [ ] `session-start.json` command invokes inject-memory.py
  - [ ] Python path is correct for Windows
  - [ ] `timeout` is set (15 seconds)

  **QA Scenarios**:
  ```
  Scenario: session-start.json invokes Python script
    Tool: Bash
    Preconditions: None
    Steps:
      1. cat hooks/session-start.json
      2. Verify command contains "inject-memory.py"
    Expected Result: Command references inject-memory.py
    Failure Indicators: Still has test PowerShell command
    Evidence: .sisyphus/evidence/task-3-script-invoked.md
  ```

  **Evidence to Capture**:
  - [ ] Updated session-start.json content

  **Commit**: YES
  - Message: `fix(hooks): session-start invokes inject-memory.py`
  - Files: `hooks/session-start.json`

---

- [x] 4. Update `setup.ps1` with hook registration

  **What to do**:
  - Add `chat.hookFilesLocations` setting to VS Code settings JSON
  - Register `~/.copilot/hooks` directory explicitly
  - Add VS Code version check (require 1.95+)
  - Add informative output about hook registration status

  **Must NOT do**:
  - Add workspace-level hook support (`/.github/hooks/`)
  - Break existing settings (keep agentSkillsLocations etc.)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: PowerShell script modification, straightforward

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: None (can start immediately)

  **References**:
  - `setup.ps1` — current setup script
  - VS Code docs: `chat.hookFilesLocations` setting format

  **Acceptance Criteria**:
  - [ ] `chat.hookFilesLocations` added to settings
  - [ ] Path includes `~/.copilot/hooks`
  - [ ] VS Code version check added
  - [ ] Existing settings not broken

  **QA Scenarios**:
  ```
  Scenario: setup.ps1 adds hookFilesLocations setting
    Tool: Bash
    Preconditions: None
    Steps:
      1. Select-String -Path setup.ps1 -Pattern "hookFilesLocations"
    Expected Result: Pattern found
    Failure Indicators: Setting not added
    Evidence: .sisyphus/evidence/task-4-setting-added.md
  ```

  **Evidence to Capture**:
  - [ ] Grep output showing setting added

  **Commit**: YES
  - Message: `fix(setup): register chat.hookFilesLocations in VS Code settings`
  - Files: `setup.ps1`

---

- [x] 5. Add VS Code engine requirement to `package.json`

  **What to do**:
  - Add `engines` field to `extension/package.json`
  - Require `"vscode": "^1.95.0"` (minimum for hook APIs)
  - Add comment noting agent hooks are Preview feature

  **Must NOT do**:
  - Use older VS Code version requirement
  - Remove existing engine specifications

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Simple JSON edit

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: None

  **References**:
  - `extension/package.json` — current package.json
  - VS Code docs: engine format `"vscode": "^1.95.0"`

  **Acceptance Criteria**:
  - [ ] `engines.vscode` field present
  - [ ] Version constraint is `^1.95.0` or higher

  **QA Scenarios**:
  ```
  Scenario: package.json has engine requirement
    Tool: Bash
    Preconditions: None
    Steps:
      1. Select-String -Path extension/package.json -Pattern '"vscode"'
    Expected Result: Pattern found with correct version
    Failure Indicators: Missing engines field
    Evidence: .sisyphus/evidence/task-5-engine-set.md
  ```

  **Evidence to Capture**:
  - [ ] Grep output showing engines field

  **Commit**: YES
  - Message: `feat(extension): require VS Code 1.95+ for hook APIs`
  - Files: `extension/package.json`

---

- [x] 6. Create `PreToolUse` hook for hard blocking

  **What to do**:
  - Create new file `hooks/pre-tool-use.json`
  - Hook event: `PreToolUse`
  - Script reads `~/.copilot/active-skill.json` to check current mode
  - If mode is `brainstorming` or `writing-plans` AND tool is writeFile or editFile:
    - Return `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "Code writing is disabled in brainstorming mode. Complete the brainstorming phase first."}}`
  - If mode is read-only or tool is read operation: return allow
  - Use exit code 2 for blocking errors

  **Script approach**: Create a small Python script that:
  1. Reads stdin JSON (tool_name, tool_input)
  2. Reads `~/.copilot/active-skill.json` if exists
  3. Determines if tool should be blocked
  4. Outputs appropriate JSON response

  **Must NOT do**:
  - Block all tools — only file write tools
  - Use `updatedInput` for redirection
  - Hard-code skill names (read from active-skill.json)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: New Python script + hook config, needs careful logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 4, 5, 8 (needs setup and state file first)

  **References**:
  - VS Code docs: PreToolUse input/output schema
  - `extension/src/participant.ts` — where active-skill.json will be written
  - HookCommandTypes.ts: `IPreToolUseHookSpecificCommandOutput` interface

  **Acceptance Criteria**:
  - [ ] `hooks/pre-tool-use.json` exists with PreToolUse event
  - [ ] New Python script created (e.g., `scripts/pre-tool-use.py`)
  - [ ] Returns `permissionDecision: "deny"` for writeFile/editFile in brainstorming
  - [ ] Returns `permissionDecision: "allow"` for read operations
  - [ ] Reads from `active-skill.json` for mode detection

  **QA Scenarios**:
  ```
  Scenario: Hard block on writeFile in brainstorming mode
    Tool: Bash (simulate PreToolUse input)
    Preconditions: active-skill.json exists with {"skill": "brainstorming"}
    Steps:
      1. echo '{"hookEventName":"PreToolUse","tool_name":"writeFile","tool_input":{}}' | python scripts/pre-tool-use.py
      2. Check output for "deny"
    Expected Result: permissionDecision is "deny"
    Failure Indicators: "allow" returned, wrong decision
    Evidence: .sisyphus/evidence/task-6-deny-write.md

  Scenario: Allow read operations
    Tool: Bash
    Preconditions: active-skill.json exists with {"skill": "brainstorming"}
    Steps:
      1. echo '{"hookEventName":"PreToolUse","tool_name":"readFile","tool_input":{}}' | python scripts/pre-tool-use.py
      2. Check output for "allow"
    Expected Result: permissionDecision is "allow"
    Failure Indicators: "deny" returned for read
    Evidence: .sisyphus/evidence/task-6-allow-read.md
  ```

  **Evidence to Capture**:
  - [ ] Deny decision for writeFile
  - [ ] Allow decision for readFile

  **Commit**: YES
  - Message: `feat(hooks): add PreToolUse hard block for file writes`
  - Files: `hooks/pre-tool-use.json`, `scripts/pre-tool-use.py`

---

- [x] 7. Create `UserPromptSubmit` hook for warnings

  **What to do**:
  - Create new file `hooks/user-prompt-submit.json`
  - Hook event: `UserPromptSubmit`
  - Script reads `~/.copilot/active-skill.json` to check current mode
  - If mode is `brainstorming` or `writing-plans` AND prompt contains code keywords:
    - Return `{"systemMessage": "Warning: You appear to be requesting code in brainstorming mode. Complete the brainstorming phase first to establish the design, then code generation can begin."}`
  - Use common code keywords: `function`, `class`, `def`, `import`, `create_file`, `replace_string_in_file`, etc.

  **Must NOT do**:
  - Block the prompt — only warn
  - Use this for enforcement (that's PreToolUse)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: New Python script + hook config, keyword detection logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Parallel Group**: Wave 3 (with Tasks 6, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 4, 5, 8

  **References**:
  - VS Code docs: UserPromptSubmit input/output schema
  - `hooks/pre-tool-use.json` — similar pattern

  **Acceptance Criteria**:
  - [ ] `hooks/user-prompt-submit.json` exists with UserPromptSubmit event
  - [ ] New Python script created (e.g., `scripts/user-prompt-submit.py`)
  - [ ] Returns `systemMessage` warning when code keywords detected
  - [ ] Keyword detection works for common code patterns

  **QA Scenarios**:
  ```
  Scenario: Warning on code keywords in brainstorming
    Tool: Bash
    Preconditions: active-skill.json with {"skill": "brainstorming"}
    Steps:
      1. echo '{"hookEventName":"UserPromptSubmit","prompt":"write a function that does X"}' | python scripts/user-prompt-submit.py
      2. Check output for systemMessage warning
    Expected Result: systemMessage present with warning text
    Failure Indicators: No warning returned
    Evidence: .sisyphus/evidence/task-7-warning.md

  Scenario: No warning for normal brainstorming
    Tool: Bash
    Preconditions: active-skill.json with {"skill": "brainstorming"}
    Steps:
      1. echo '{"hookEventName":"UserPromptSubmit","prompt":"what should we build next?"}' | python scripts/user-prompt-submit.py
      2. Check output has no systemMessage
    Expected Result: No warning (or empty output)
    Failure Indicators: False positive warning
    Evidence: .sisyphus/evidence/task-7-no-false-positive.md
  ```

  **Evidence to Capture**:
  - [ ] Warning output for code keywords
  - [ ] No warning for normal prompts

  **Commit**: YES
  - Message: `feat(hooks): add UserPromptSubmit warning hook`
  - Files: `hooks/user-prompt-submit.json`, `scripts/user-prompt-submit.py`

---

- [x] 8. Update `participant.ts` for state file + multi-turn

  **What to do**:
  - Modify `extension/src/participant.ts`
  - When skill is activated, write `~/.copilot/active-skill.json` with:
    ```json
    {"skill": "brainstorming", "timestamp": "ISO-8601", "participantId": "sp.assistant"}
    ```
  - Implement multi-turn: maintain `chatContext.history` or equivalent
  - On follow-up requests, check if same participant and re-inject skill context
  - Load and include memory content on each turn (already done, keep it)

  **Implementation approach**:
  - Use `fs.writeFileSync` to write active-skill.json
  - Track conversation turns using a closure or class instance
  - Re-inject skill prompt for every message in the same participant thread

  **Must NOT do**:
  - Lose existing memory loading (keep `loadMemory()` function)
  - Break worktree commands (those are separate)
  - Add workspace-level hook support

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: TypeScript code changes, state management logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3)
  - **Parallel Group**: Wave 3 (with Tasks 6, 7)
  - **Blocks**: Tasks 6, 7 (they depend on active-skill.json existing)
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `extension/src/participant.ts` — current implementation
  - VS Code Chat API docs: chatContext.history for multi-turn

  **Acceptance Criteria**:
  - [ ] `active-skill.json` written when skill activated
  - [ ] Follow-up messages re-inject skill context
  - [ ] Memory content included on each turn
  - [ ] Existing functionality preserved (worktree commands, etc.)

  **QA Scenarios**:
  ```
  Scenario: active-skill.json written on skill activation
    Tool: Manual VS Code testing
    Preconditions: Extension installed
    Steps:
      1. Open Copilot Chat
      2. Type "@sp /brainstorm"
      3. Check file ~/.copilot/active-skill.json exists
    Expected Result: File exists with skill name
    Failure Indicators: File not created
    Evidence: .sisyphus/evidence/task-8-state-file.md

  Scenario: Follow-up re-injects context
    Tool: Manual VS Code testing
    Preconditions: Task 8 implemented
    Steps:
      1. Type "@sp /brainstorm"
      2. Ask "what are the trade-offs?"
      3. Ask "can you elaborate?"
      4. Verify model still knows it's in brainstorming mode
    Expected Result: Constraints preserved across turns
    Failure Indicators: Model forgets context
    Evidence: .sisyphus/evidence/task-8-multi-turn.md
  ```

  **Evidence to Capture**:
  - [ ] active-skill.json content after activation
  - [ ] Multi-turn conversation still has constraints

  **Commit**: YES
  - Message: `feat(participant): write active-skill state for multi-turn support`
  - Files: `extension/src/participant.ts`

---

## Final Verification Wave

- [ ] F1. **Hook Discovery Test** — `unspecified-high`
  Open VS Code Insider. Open "GitHub Copilot Chat Hooks" output channel. Verify hooks are discovered and loaded.
  Output: `Hook Files [N discovered] | VERDICT`

- [ ] F2. **Memory Injection Test** — `unspecified-high`
  Start new Copilot Chat session. Verify memory content appears in system context.
  Output: `Memory Injected [YES/NO] | VERDICT`

- [ ] F3. **Hard Block Test** — `unspecified-high`
  Invoke `@sp /brainstorm`. Try to create a file. Verify operation is denied.
  Output: `Block Working [YES/NO] | VERDICT`

- [ ] F4. **Multi-Turn Test** — `unspecified-high`
  Invoke `@sp /brainstorm`. Ask a follow-up question. Verify constraints still apply.
  Output: `Constraints Preserved [YES/NO] | VERDICT`

---

## Commit Strategy

- **1**: `fix(hooks): correct inject-memory output schema to hookSpecificOutput`
- **2**: `fix(hooks): rename session-end to stop with correct event name`
- **3**: `fix(setup): register chat.hookFilesLocations in VS Code settings`
- **4**: `feat(participant): write active-skill state for multi-turn support`
- **5**: `feat(hooks): add PreToolUse hard block for file writes`
- **6**: `feat(hooks): add UserPromptSubmit warning hook`

---

## Success Criteria

### Verification Commands
```powershell
# Check hook files exist
Test-Path ~/.copilot/hooks/stop.json
Test-Path ~/.copilot/hooks/pre-tool-use.json

# Check VS Code settings
Get-Content "$env:APPDATA\Code - Insiders\User\settings.json" | ConvertFrom-Json | Select-Object -ExpandProperty chat.hookFilesLocations
```

### Final Checklist
- [ ] All hooks use `additionalContext` (not `additionalInstructions`)
- [ ] All hooks use `hookSpecificOutput` wrapper
- [ ] `session-end.json` renamed to `stop.json`
- [ ] `PreToolUse` returns `permissionDecision: "deny"` for writeFile/editFile
- [ ] `participant.ts` writes `active-skill.json`
- [ ] `setup.ps1` registers `chat.hookFilesLocations`
- [ ] `package.json` has engine requirement
