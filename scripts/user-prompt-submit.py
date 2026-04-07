"""
UserPromptSubmit hook script.
Warns when code keywords are detected in no-code modes (brainstorming, writing-plans).

Input: JSON from stdin with { "prompt": "...", "hookEventName": "UserPromptSubmit" }
Output: { "systemMessage": "Warning: ..." } if warning needed, or empty/no output if OK
"""
import json
import re
import sys
from pathlib import Path


# Code keywords that suggest the user is requesting code implementation
# Organized by category for clarity
CODE_KEYWORDS = [
    # Programming constructs
    r'\bfunction\b',
    r'\bdef\b',
    r'\bclass\b',
    r'\bimport\b',
    # File operations (from spec)
    r'\bcreate_file\b',
    r'\bwrite_file\b',
    r'\bedit_file\b',
    r'\breplace_string_in_file\b',
    # Implementation requests
    r'\bcode\b',
    r'\bimplement\b',
    r'\bbuild\b',
    r'\bwrite\b',
]

# Modes where code should NOT be generated
NO_CODE_MODES = {'brainstorming', 'writing-plans'}

WARNING_MESSAGE = (
    "Warning: You appear to be requesting code in planning mode. "
    "Complete the planning phase first to establish the design, "
    "then code generation can begin."
)


def contains_code_keywords(prompt: str) -> bool:
    """
    Check if the prompt contains any code-related keywords.
    Uses word boundaries to avoid false positives (e.g., 'functionality' won't match 'function').
    """
    prompt_lower = prompt.lower()
    for pattern in CODE_KEYWORDS:
        if re.search(pattern, prompt_lower):
            return True
    return False


def get_current_mode() -> str | None:
    """
    Read the active skill mode from ~/.copilot/active-skill.json.
    Returns the skill name or None if file doesn't exist or is invalid.
    """
    skill_file = Path.home() / '.copilot' / 'active-skill.json'
    if not skill_file.exists():
        return None
    
    try:
        with open(skill_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('skill')
    except (json.JSONDecodeError, IOError):
        return None


def main():
    # Read input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        # Invalid JSON input, let it pass through without warning
        return
    
    prompt = input_data.get('prompt', '')
    
    # Get current mode from active-skill.json
    current_mode = get_current_mode()
    
    # If not in a no-code mode, no warning needed
    if current_mode not in NO_CODE_MODES:
        return
    
    # Check if prompt contains code keywords
    if contains_code_keywords(prompt):
        # Return warning message
        output = {'systemMessage': WARNING_MESSAGE}
        print(json.dumps(output))
    
    # If no code keywords detected, return nothing (empty output = no warning)


if __name__ == '__main__':
    main()
