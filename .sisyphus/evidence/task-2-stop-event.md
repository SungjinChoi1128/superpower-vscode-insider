# Task 2: Rename session-end.json to stop.json - VERIFIED ✓

## Summary
Renamed `hooks/session-end.json` to `hooks/stop.json` with correct `Stop` event name.

## Changes Made

### Before
- File: `hooks/session-end.json`
- Event name: `sessionEnd` (incorrect)

### After
- File: `hooks/stop.json`
- Event name: `Stop` (correct VS Code API)

## Verification Results

| Check | Status |
|-------|--------|
| File created: `hooks/stop.json` | ✓ PASS |
| File deleted: `hooks/session-end.json` | ✓ PASS |
| Event name is "Stop" | ✓ PASS |
| Hook command points to extract-memory.py | ✓ PASS |
| Valid JSON | ✓ PASS |

## Evidence

### New file content (`hooks/stop.json`):
```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "powershell -Command \"python $env:USERPROFILE\\.copilot\\scripts\\extract-memory.py\"",
        "timeout": 15
      }
    ]
  }
}
```

### Verification commands:
- `Test-Path hooks/stop.json` → `True`
- `Test-Path hooks/session-end.json` → `False`

## Notes
- The VS Code API expects `Stop` event (not `sessionEnd`)
- Script reference to `extract-memory.py` was preserved
- JSON structure remains identical
