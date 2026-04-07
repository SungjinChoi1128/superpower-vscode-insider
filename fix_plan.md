
## Diagnosis: Why Brainstorming Immediately Codes

There are **5 root causes**, stacked on top of each other:

### RC-1: `sessionStart` hook output schema is wrong (Critical)
[inject-memory.py](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/scripts/inject-memory.py:0:0-0:0) outputs `{"additionalInstructions": "..."}` but the actual VS Code Insider API expects:
```json
{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
```
**Effect:** Memory is *never* injected. Every session starts cold — the model has no skill mode constraints loaded.

### RC-2: Wrong event name for session-end hook
The spec used `sessionEnd` but the real event is **`Stop`**. Memory extraction is also silently failing.

### RC-3: No `UserPromptSubmit` hook (Critical)
When you ask a follow-up question after `@sp /brainstorming`, there's no hook to re-inject "you are in brainstorming mode, no code allowed." The model treats it as a plain Copilot request.

### RC-4: No `PreToolUse` guard (Critical)
The SKILL.md says "NEVER write code" — but that's just a prompt suggestion. There is **no mechanism blocking the model from calling `create_file` or `replace_string_in_file`**. VS Code Insider's `PreToolUse` hook *can* return `permissionDecision: "deny"` to hard-block this.

### RC-5: [participant.ts](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/extension/src/participant.ts:0:0-0:0) is single-turn, not multi-turn
Follow-up messages in the `@sp` thread don't re-inject the skill prompt — the `chatContext.history` exists but is ignored.

---

## The Plan (6 Enhancements)

| # | What | Why |
|---|---|---|
| **E1** | Fix [inject-memory.py](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/scripts/inject-memory.py:0:0-0:0) output + [session-start.json](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/hooks/session-start.json:0:0-0:0) key | Memory actually gets injected |
| **E2** | Rename [session-end.json](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/hooks/session-end.json:0:0-0:0) → `stop.json` with `Stop` event | Memory actually gets extracted |
| **E3** | New `UserPromptSubmit` hook → warns when code keywords detected in no-code mode | User facing diagnostic |
| **E4** | New `PreToolUse` hook → **hard denies** file writes during brainstorming/writing-plans | Actual enforcement |
| **E5** | [participant.ts](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/extension/src/participant.ts:0:0-0:0): write `active-skill.json` state file + fix multi-turn messages | Enables E3 & E4; fixes follow-up context loss |
| **E6** | Update [setup.ps1](cci:7://file:///c:/DockerVolumes/superpower-vscode-insider/setup.ps1:0:0-0:0) to register `chat.hookFilesLocations` properly | Hooks are actually discovered |

The plan includes complete Python/TypeScript code specs for every new file. Implementation order is E1→E2→E5a→E4→E3→E5b→E6.