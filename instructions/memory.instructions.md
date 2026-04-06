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

## How Memory Works

At the END of each session, memory markers are extracted from the conversation transcript and written to persistent memory files.

To RECALL memories: The @sp assistant automatically reads your memory files at the start of each session. When you invoke a skill with `@sp /skill-name`, your memories are included in the conversation context automatically.

Memory files are stored at:
- `~/.copilot/memory/MEMORY.md` — index of all memories
- `~/.copilot/memory/user/` — user profile and preferences
- `~/.copilot/memory/feedback/` — corrections and guidance
- `~/.copilot/memory/project/` — project context and goals
- `~/.copilot/memory/reference/` — external system locations
