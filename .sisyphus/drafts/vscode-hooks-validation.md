# Draft: VS Code Hooks Fix Plan Validation

## VS Code Official Hook API Research

### Source: Official VS Code Documentation
URL: https://code.visualstudio.com/docs/copilot/customization/hooks

### Valid Hook Events (confirmed):
- `SessionStart` ✅ — fires when new session begins
- `UserPromptSubmit` ✅ — fires when user submits prompt
- `PreToolUse` ✅ — fires before tool invocation, can return `permissionDecision: "deny"`
- `PostToolUse` ✅ — fires after tool completes
- `Stop` ✅ — fires when session ends (NOT `sessionEnd`)
- `SubagentStart`, `SubagentStop`, `PreCompact`

### Hook File Locations:
- **User hooks:** `~/.copilot/hooks/*.json` (auto-discovered)
- **Explicit registration:** `chat.hookFilesLocations` setting in VS Code settings

### Hook Input (stdin JSON):
```json
{
  "timestamp": "2026-02-09T10:30:00.000Z",
  "cwd": "/path/to/workspace",
  "sessionId": "session-identifier",
  "hookEventName": "PreToolUse",
  "transcript_path": "/path/to/transcript.json"
}
```

### Hook Output Schema:
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

## Root Cause Analysis

### RC-1: `inject-memory.py` wrong output schema (Critical)
**Current:** `{"additionalInstructions": "..."}`
**Expected:** `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}`

**Effect:** Memory never injected. Every session starts cold.

### RC-2: Wrong event name for session-end hook
**Current:** `sessionEnd` in JSON config
**Expected:** `Stop` event name in hook config

**Effect:** Memory extraction never fires.

### RC-3: No `UserPromptSubmit` hook
When user submits follow-up question, no re-injection of skill constraints.

**Effect:** Model treats as plain Copilot request.

### RC-4: No `PreToolUse` guard
SKILL.md says "NEVER write code" but no hard block exists.

**Effect:** Model can write files despite skill constraints.

### RC-5: `participant.ts` single-turn
Follow-up messages don't re-inject skill prompt. `chatContext.history` ignored.

**Effect:** Context lost between turns.

### RC-6: Hooks not registered in settings (Additional Issue Found)
`setup.ps1` does NOT add `chat.hookFilesLocations` setting.
Hooks rely on auto-discovery at `~/.copilot/hooks/` but explicit registration is more reliable.

**Effect:** Hooks may not be discovered properly.

## File Analysis

### inject-memory.py (scripts/)
- WRONG output format
- Uses `additionalInstructions` instead of `hookSpecificOutput.additionalContext`
- Needs complete rewrite of output JSON building

### session-start.json (hooks/)
- Uses correct `SessionStart` event name ✅
- But hook command doesn't produce correct output format
- No Python script actually invoked (just a test PowerShell command)

### session-end.json (hooks/)
- Uses `sessionEnd` — WRONG, should be `Stop`
- References `extract-memory.py` which reads from stdin

### extract-memory.py (scripts/)
- Reads `transcript_path` from stdin correctly ✅
- Extracts MEMORY markers from transcript ✅
- Writing to `~/.copilot/memory/` ✅
- Will work once hook event name is fixed

### participant.ts (extension/src/)
- Single-turn: creates messages array, sends request, done
- No history tracking between turns
- Does NOT write active skill state
- Loads memory from filesystem each time ✅
- Loads skill from filesystem each time ✅

### setup.ps1
- Does NOT set `chat.hookFilesLocations`
- Only sets `chat.agentSkillsLocations`
- Hooks rely on auto-discovery (may be unreliable)

## Required Enhancements

### E1: Fix inject-memory.py output
Change output from:
```json
{"additionalInstructions": "..."}
```
To:
```json
{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
```

### E2: Rename session-end.json → stop.json
- File: `hooks/stop.json`
- Event name: `Stop` (not `sessionEnd`)
- Same extract-memory.py script works

### E3: New UserPromptSubmit hook
- New hook file: `hooks/user-prompt-submit.json`
- Check if prompt contains code keywords
- If in brainstorming mode (read from active-skill.json), warn user
- Output: `{"systemMessage": "Warning: ..."}`

### E4: New PreToolUse hook
- New hook file: `hooks/pre-tool-use.json`
- Event: `PreToolUse`
- Read active-skill.json to check current mode
- If in brainstorming/writing-plans mode and tool is file write:
  - Return `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "Code writing is disabled in brainstorming mode"}}`

### E5: Update participant.ts
- Write `~/.copilot/active-skill.json` when skill activated
- Track history for multi-turn conversations
- Re-inject skill context on follow-up messages

### E6: Update setup.ps1
- Add `chat.hookFilesLocations` setting
- Register `~/.copilot/hooks` directory

### E7: Verify session-start.json
- Update command to use inject-memory.py script
- Ensure correct Python path on Windows

## Implementation Order
E1 → E2 → E7 → E6 → E5 → E4 → E3

## Test Strategy
- Use `chat.hookFilesLocations` explicitly in settings
- Check "GitHub Copilot Chat Hooks" output channel
- Manual testing with `@sp /brainstorm` followed by file write attempt
