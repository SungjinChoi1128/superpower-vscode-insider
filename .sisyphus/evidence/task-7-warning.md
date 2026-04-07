# Task 7 Evidence: Warning Triggered for Code Keywords

## Summary
Successfully implemented UserPromptSubmit hook that warns when code keywords are detected in no-code modes (brainstorming, writing-plans).

## Files Created

### 1. hooks/user-prompt-submit.json
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "type": "command",
        "command": "powershell -Command \"python $env:USERPROFILE\\.copilot\\scripts\\user-prompt-submit.py\"",
        "timeout": 5
      }
    ]
  }
}
```

### 2. scripts/user-prompt-submit.py
- Reads stdin JSON with `prompt` and `hookEventName`
- Reads `~/.copilot/active-skill.json` to check current mode
- Detects code keywords using word boundary regex patterns
- Returns warning JSON when code keywords found in no-code modes

## Test Results: Code Keywords Trigger Warning

### Test Environment
- Mode: `brainstorming` (set in ~/.copilot/active-skill.json)
- Expected: All code keywords should trigger warning

### Code Keywords Tested (All Trigger Warnings)

| Test | Keyword | Prompt | Result |
|------|---------|--------|--------|
| 1 | function | "Write a function to calculate fibonacci" | ✅ Warning triggered |
| 2 | def | "def calculate_sum(a, b):" | ✅ Warning triggered |
| 3 | class | "Create a class called UserManager" | ✅ Warning triggered |
| 4 | import | "import pandas as pd" | ✅ Warning triggered |
| 5 | implement | "Implement a sorting algorithm" | ✅ Warning triggered |
| 6 | build | "Build me a web scraper" | ✅ Warning triggered |
| 7 | code | "Write some code for data processing" | ✅ Warning triggered |
| 8 | create_file | "Use create_file to make a module" | ✅ Warning triggered |
| 9 | write_file | "Call write_file to save the output" | ✅ Warning triggered |
| 10 | edit_file | "Use edit_file to modify config" | ✅ Warning triggered |
| 11 | replace_string_in_file | "replace_string_in_file for patching" | ✅ Warning triggered |

### Warning Output Format
```json
{
  "systemMessage": "Warning: You appear to be requesting code in planning mode. Complete the planning phase first to establish the design, then code generation can begin."
}
```

## Verification

All 11 code keywords correctly trigger the warning message when in brainstorming mode.

## Conclusion
✅ Task requirement met: Returns warning when code keywords detected in brainstorming/writing-plans modes.
