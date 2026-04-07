# Evidence: VS Code Engine Requirement Added

## Task
Add VS Code engine requirement to `extension/package.json`.

## Action Taken
Updated `engines.vscode` field in `extension/package.json`.

## Before
```json
"engines": { "vscode": "^1.108.0" }
```

## After
```json
"engines": { "vscode": "^1.95.0" }
```

## Verification
- [x] File modified: `extension/package.json`
- [x] `engines.vscode` field present
- [x] Version constraint is `^1.95.0` (minimum for hook APIs)
- [x] JSON is valid (verified with Node.js JSON parser)

## Evidence
- Line 8 in `extension/package.json`: `"engines": { "vscode": "^1.95.0" }`
- JSON validation passed

## Timestamp
2026-04-07
