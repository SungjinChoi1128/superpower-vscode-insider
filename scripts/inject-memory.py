"""
sessionStart hook script.
Reads ~/.copilot/memory/MEMORY.md and outputs JSON for VS Code hook runner.
Output: {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
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
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": f"## Memory from previous sessions\n\n{content}"
        }
    }
    return json.dumps(payload)


if __name__ == "__main__":
    memory_path = Path.home() / ".copilot" / "memory" / "MEMORY.md"
    print(build_payload(str(memory_path)))
