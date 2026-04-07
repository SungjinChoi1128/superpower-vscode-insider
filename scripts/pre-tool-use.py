"""
PreToolUse hook script.
Blocks file write operations (writeFile, editFile) during brainstorming/writing-plans mode.

Input: JSON via stdin with tool_name, tool_input, etc.
Output: JSON with permissionDecision
Exit codes: 0 = allow, 2 = deny (blocking error)
"""
import json
import sys
from pathlib import Path


# Tools that modify files - these are blocked during brainstorming/writing-plans
BLOCKED_TOOLS = {"writeFile", "editFile"}

# Modes where file writes are prohibited
PROTECTED_MODES = {"brainstorming", "writing-plans"}

# Path to active-skill.json
ACTIVE_SKILL_PATH = Path.home() / ".copilot" / "active-skill.json"


def get_current_mode() -> str | None:
    """Read the current skill/mode from active-skill.json."""
    if not ACTIVE_SKILL_PATH.exists():
        return None
    
    try:
        # Use utf-8-sig to handle BOM (Byte Order Mark) if present
        with open(ACTIVE_SKILL_PATH, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
            return data.get("skill")
    except (json.JSONDecodeError, IOError):
        return None


def should_block_tool(tool_name: str, mode: str | None) -> bool:
    """Determine if the tool should be blocked based on current mode."""
    if mode is None:
        return False
    
    if mode not in PROTECTED_MODES:
        return False
    
    return tool_name in BLOCKED_TOOLS


def create_deny_response(reason: str) -> dict:
    """Create the deny response JSON structure."""
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason
        }
    }


def create_allow_response() -> dict:
    """Create the allow response JSON structure."""
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow"
        }
    }


def main():
    """Main entry point for the PreToolUse hook."""
    # Read input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print(json.dumps(create_allow_response()))
        sys.exit(0)
    
    tool_name = input_data.get("tool_name", "")
    
    # Get current mode from active-skill.json
    current_mode = get_current_mode()
    
    # Check if we should block this tool
    if should_block_tool(tool_name, current_mode):
        deny_response = create_deny_response(
            "Code writing is disabled in brainstorming mode. Complete the brainstorming phase first."
        )
        print(json.dumps(deny_response))
        sys.exit(2)  # Exit code 2 = blocking error
    
    # Allow the tool to proceed
    allow_response = create_allow_response()
    print(json.dumps(allow_response))
    sys.exit(0)


if __name__ == "__main__":
    main()
