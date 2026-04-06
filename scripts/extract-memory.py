"""
sessionEnd hook script.
Reads session transcript via stdin JSON, extracts MEMORY markers,
writes to ~/.copilot/memory/ files.

stdin: {"timestamp": "...", "session_id": "...", "transcript_path": "..."}
"""
import json
import re
import sys
from pathlib import Path
from datetime import datetime


MEMORY_PATTERN = re.compile(
    r'<!--\s*MEMORY:\s*(\{.*?\})\s*-->',
    re.DOTALL
)


def parse_markers(text: str) -> list[dict]:
    """Extract all MEMORY markers from transcript text."""
    markers = []
    for match in MEMORY_PATTERN.finditer(text):
        try:
            marker = json.loads(match.group(1))
            if all(k in marker for k in ("type", "content", "file")):
                markers.append(marker)
        except json.JSONDecodeError:
            pass
    return markers


def write_memories(markers: list[dict], memory_root: str) -> None:
    """Write extracted markers to memory files and update MEMORY.md index."""
    root = Path(memory_root)
    for marker in markers:
        type_dir = root / marker["type"]
        type_dir.mkdir(parents=True, exist_ok=True)
        file_path = type_dir / marker["file"]

        timestamp = datetime.now().strftime("%Y-%m-%d")
        entry = f"\n- [{timestamp}] {marker['content']}\n"

        if file_path.exists():
            file_path.write_text(file_path.read_text(encoding="utf-8") + entry, encoding="utf-8")
        else:
            file_path.write_text(f"# {marker['file'].replace('.md', '').title()}\n{entry}", encoding="utf-8")

    if markers:
        _update_index(root, markers)


def _update_index(root: Path, markers: list[dict]) -> None:
    """Update MEMORY.md index with new entries."""
    index_path = root / "MEMORY.md"
    lines = index_path.read_text(encoding="utf-8") if index_path.exists() else "# Memory\n"

    for marker in markers:
        ref = f"- [{marker['type']}] {marker['content'][:80]} → `{marker['type']}/{marker['file']}`"
        if ref not in lines:
            lines += f"\n{ref}"

    index_path.write_text(lines, encoding="utf-8")


def main(memory_root: str = None) -> None:
    if memory_root is None:
        memory_root = str(Path.home() / ".copilot" / "memory")

    try:
        data = json.loads(sys.stdin.read())
    except json.JSONDecodeError:
        print("Warning: invalid stdin JSON", file=sys.stderr)
        return

    transcript_path = data.get("transcript_path")
    if not transcript_path or not Path(transcript_path).exists():
        return  # No transcript — silent no-op

    transcript = Path(transcript_path).read_text(encoding="utf-8")
    markers = parse_markers(transcript)

    if markers:
        write_memories(markers, memory_root)
        print(f"Extracted {len(markers)} memory marker(s).", file=sys.stderr)


if __name__ == "__main__":
    main()
