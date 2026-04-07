# Task 8: Active Skill State File Implementation

## Summary
Implemented state tracking for active skills by writing `~/.copilot/active-skill.json` when a skill is activated.

## Changes Made

### 1. New Functions Added (lines 112-167)

#### `getCopilotRoot(): string`
- Returns path to `~/.copilot` directory
- Uses `USERPROFILE` (Windows) or `HOME` environment variable

#### `convertHistoryToMessages()` (lines 117-141)
- Converts `chatContext.history` items to `LanguageModelChatMessage[]`
- Handles both `ChatRequestTurn` (user) and `ChatResponseTurn` (assistant)
- Flattens response parts to extract markdown content

#### `writeActiveSkillFile()` (lines 153-167)
- Creates `~/.copilot/` directory if it doesn't exist
- Writes JSON file with format:
  ```json
  {
    "skill": "brainstorming",
    "timestamp": "2026-04-07T10:30:00Z",
    "participantId": "sp.assistant"
  }
  ```

### 2. Modified Chat Participant Handler (lines 59-91)

Added at line 59-60:
```typescript
// Write active skill file for external tracking
writeActiveSkillFile(skillName, 'sp.assistant');
```

### 3. File Location
- **Source**: `extension/src/participant.ts`
- **Output**: `~/.copilot/active-skill.json`

## Verification

```powershell
cd extension
npm run compile
# Result: Compiled successfully (no errors)
```

## Key Points
- State file is written synchronously on every skill activation
- Timestamp uses ISO-8601 format via `new Date().toISOString()`
- Parent directory created recursively if missing
- Existing functionality (memory loading, worktree commands) preserved
