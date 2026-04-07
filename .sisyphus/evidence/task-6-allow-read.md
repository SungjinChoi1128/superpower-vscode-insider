=== Test: readFile in brainstorming mode ===
Input: {"tool_name": "readFile", "tool_input": {"file_path": "/tmp/test.txt"}}
Exit code: 0
Output: {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}

=== Test: glob in brainstorming mode ===
Input: {"tool_name": "glob", "tool_input": {"pattern": "**/*.py"}}
Exit code: 0
Output: {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}

=== Test: bash in brainstorming mode ===
Input: {"tool_name": "bash", "tool_input": {"command": "ls -la"}}
Exit code: 0
Output: {"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow"}}
