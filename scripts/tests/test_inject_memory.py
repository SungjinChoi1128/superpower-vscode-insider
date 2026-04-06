import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch
import importlib.util

import pytest

# Load inject-memory module (hyphenated name requires importlib)
_spec = importlib.util.spec_from_file_location(
    "inject_memory",
    Path(__file__).parent.parent / "inject-memory.py"
)
inject_memory = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(inject_memory)


def test_outputs_valid_json_with_memory_content(tmp_path):
    memory_file = tmp_path / "MEMORY.md"
    memory_file.write_text("# Memory\n\nUser is a data engineer.")

    result = inject_memory.build_payload(str(memory_file))
    parsed = json.loads(result)

    assert "additionalInstructions" in parsed
    assert "data engineer" in parsed["additionalInstructions"]


def test_exits_nonzero_when_memory_file_missing(tmp_path):
    missing_path = str(tmp_path / "nonexistent.md")

    with pytest.raises(SystemExit) as exc:
        inject_memory.build_payload(missing_path)

    assert exc.value.code != 0


def test_memory_content_prefixed_with_header(tmp_path):
    memory_file = tmp_path / "MEMORY.md"
    memory_file.write_text("Some memory content")

    result = inject_memory.build_payload(str(memory_file))
    parsed = json.loads(result)

    assert parsed["additionalInstructions"].startswith("## Memory from previous sessions")
