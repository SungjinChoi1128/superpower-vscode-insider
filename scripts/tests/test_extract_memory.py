import json
import sys
import tempfile
from pathlib import Path
import importlib.util

import pytest

# Load extract-memory module (hyphenated name requires importlib)
_spec = importlib.util.spec_from_file_location(
    "extract_memory",
    Path(__file__).parent.parent / "extract-memory.py"
)
extract_memory = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(extract_memory)


SAMPLE_TRANSCRIPT = """
User: don't use pandas for anything over 1GB
Assistant: Understood, I'll always use PySpark for large datasets.
<!-- MEMORY: {"type": "feedback", "content": "Don't use pandas for datasets over 1GB", "file": "preferences.md"} -->
User: our ADO board is at https://dev.azure.com/company/project
Assistant: Got it, I'll remember that.
<!-- MEMORY: {"type": "reference", "content": "ADO board: https://dev.azure.com/company/project", "file": "resources.md"} -->
"""


def test_extracts_single_memory_marker():
    transcript = "Some text\n<!-- MEMORY: {\"type\": \"feedback\", \"content\": \"test content\", \"file\": \"prefs.md\"} -->"
    markers = extract_memory.parse_markers(transcript)
    assert len(markers) == 1
    assert markers[0]["content"] == "test content"
    assert markers[0]["type"] == "feedback"


def test_extracts_multiple_markers():
    markers = extract_memory.parse_markers(SAMPLE_TRANSCRIPT)
    assert len(markers) == 2


def test_no_markers_returns_empty_list():
    markers = extract_memory.parse_markers("No markers here.")
    assert markers == []


def test_writes_memory_to_correct_file(tmp_path):
    memory_root = tmp_path / "memory"
    (memory_root / "feedback").mkdir(parents=True)
    (memory_root / "feedback" / "preferences.md").write_text("# Preferences\n")

    markers = [{"type": "feedback", "content": "Use PySpark for large data", "file": "preferences.md"}]
    extract_memory.write_memories(markers, str(memory_root))

    content = (memory_root / "feedback" / "preferences.md").read_text()
    assert "Use PySpark for large data" in content


def test_creates_new_memory_file_if_not_exists(tmp_path):
    memory_root = tmp_path / "memory"
    (memory_root / "reference").mkdir(parents=True)

    markers = [{"type": "reference", "content": "ADO URL", "file": "resources.md"}]
    extract_memory.write_memories(markers, str(memory_root))

    assert (memory_root / "reference" / "resources.md").exists()


def test_reads_transcript_path_from_stdin(tmp_path, monkeypatch, capsys):
    transcript_file = tmp_path / "transcript.txt"
    transcript_file.write_text("No markers.")
    memory_root = tmp_path / "memory"
    memory_root.mkdir()

    stdin_data = json.dumps({"transcript_path": str(transcript_file), "session_id": "test"})
    monkeypatch.setattr("sys.stdin", __import__("io").StringIO(stdin_data))

    extract_memory.main(str(memory_root))
    # No error = success when no markers found
