# Task 4 Evidence: chat.hookFilesLocations Setting Added

**Date:** 2026-04-07  
**Task:** Add `chat.hookFilesLocations` setting and VS Code version check to setup.ps1

## Changes Made

### 1. VS Code Version Check Added (Lines 37-42)
```powershell
# Step 2: Check VS Code version
Write-Step "Checking VS Code version..."
$vsCodeVersion = & code-insiders --version 2>&1 | Select-Object -First 1
if ($vsCodeVersion -notmatch "1\.(9[5-9]|[0-9]{2,})\.") {
    Write-Warning "VS Code 1.95+ recommended for agent hooks (Preview feature)"
}
```

### 2. chat.hookFilesLocations Setting Added (Lines 84-86)
```powershell
$settings["chat.hookFilesLocations"] = @{
    "$CopilotRoot\hooks" = $true
}
```

## Verification

- [x] File modified: `setup.ps1`
- [x] `chat.hookFilesLocations` setting added
- [x] Path includes `~/.copilot/hooks` via `$CopilotRoot\hooks`
- [x] VS Code version check added (requires 1.95+)
- [x] Existing settings preserved (agentSkillsLocations, useAgentSkills, etc.)
- [x] PowerShell syntax validated

## Final Script Structure

1. Check PowerShell 7+
2. Step 1: Check Python
3. Step 2: Check VS Code version (NEW)
4. Step 3: Create memory structure
5. Step 4: Copy harness files
6. Step 5: Update VS Code settings (includes hookFilesLocations - NEW)
7. Step 6: Register hooks
8. Step 7: Build and install extension
