=== Test: writeFile in brainstorming mode ===
Input: {"tool_name": "writeFile", "tool_input": {"file_path": "/tmp/test.txt", "content": "hello"}}
Exit code: 2
Output: {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "Code writing is disabled in brainstorming mode. Complete the brainstorming phase first."}}

=== Test: editFile in brainstorming mode ===
Input: {"tool_name": "editFile", "tool_input": {"file_path": "/tmp/test.txt", "oldString": "old", "newString": "new"}}
Exit code: 2
Output: {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "Code writing is disabled in brainstorming mode. Complete the brainstorming phase first."}}

