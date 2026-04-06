#Requires -Version 7.0
<#
.SYNOPSIS
    One-time setup for SP Superpowers harness.
.DESCRIPTION
    Registers hooks, configures VS Code settings, installs extension.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$CopilotRoot = Join-Path $env:USERPROFILE ".copilot"
$RepoRoot = $PSScriptRoot
$VSCodeSettingsPath = Join-Path $env:APPDATA "Code - Insiders\User\settings.json"

function Write-Step($msg) { Write-Host "  → $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host "SP Superpowers Setup" -ForegroundColor Yellow
Write-Host "===================="

# PowerShell 7+ required for ConvertFrom-Json -AsHashtable
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Fail "Requires PowerShell 7+. Install with: winget install Microsoft.PowerShell"
}

# Step 1: Check Python
Write-Step "Checking Python..."
try {
    $pyVersion = & python --version 2>&1
    Write-Ok "Found: $pyVersion"
} catch {
    Write-Fail "Python3 not found on PATH. Install Python 3.8+ and add to PATH."
}

# Step 2: Create memory structure
Write-Step "Creating memory directory structure..."
@("memory", "memory\user", "memory\feedback", "memory\project", "memory\reference") | ForEach-Object {
    $dir = Join-Path $CopilotRoot $_
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}
$memoryIndex = Join-Path $CopilotRoot "memory\MEMORY.md"
if (-not (Test-Path $memoryIndex)) {
    Set-Content $memoryIndex "# Memory`n`nNo memories recorded yet."
}
Write-Ok "Memory structure ready"

# Step 3: Copy skills, hooks, instructions to ~/.copilot
Write-Step "Copying harness files to ~/.copilot..."
$items = @("skills", "hooks", "instructions", "scripts")
foreach ($item in $items) {
    $src = Join-Path $RepoRoot $item
    $dst = Join-Path $CopilotRoot $item
    if (Test-Path $src) {
        # Remove existing destination to avoid nested copies
        if (Test-Path $dst) { Remove-Item -Path $dst -Recurse -Force }
        Copy-Item -Path $src -Destination $dst -Recurse -Force
    }
}
Write-Ok "Harness files copied"

# Step 4: Update VS Code settings
Write-Step "Updating VS Code Insider settings..."
if (-not (Test-Path $VSCodeSettingsPath)) {
    Write-Fail "VS Code Insider settings not found at: $VSCodeSettingsPath"
}
$settings = Get-Content $VSCodeSettingsPath -Raw | ConvertFrom-Json -AsHashtable

$settings["chat.agentSkillsLocations"] = @("$CopilotRoot\skills")
$settings["chat.useAgentSkills"] = $true
$settings["github.copilot.chat.codeGeneration.instructions"] = @(
    @{ file = "$CopilotRoot\instructions\sp-bootstrap.instructions.md" },
    @{ file = "$CopilotRoot\instructions\memory.instructions.md" }
)
$settings["chat.tools.edits.autoApprove"] = "$CopilotRoot\memory\**"

$settings | ConvertTo-Json -Depth 10 | Set-Content $VSCodeSettingsPath -Encoding UTF8
Write-Ok "VS Code settings updated"

# Step 5: Register hooks
# Hook registration mechanism requires VS Code Insider to discover hooks from ~/.copilot/hooks/
# As of v1.110, hooks are preview features. VS Code may auto-discover from ~/.copilot/hooks/
# If not, use: $settings["chat.hooksLocations"] = @("$CopilotRoot\hooks")
Write-Step "Hook files ready at: $CopilotRoot\hooks"
Write-Host "  ! Hook auto-discovery may require VS Code Insider restart." -ForegroundColor Yellow

# Step 6: Build and install extension
Write-Step "Building extension..."
Push-Location (Join-Path $RepoRoot "extension")
npm install --silent
npm run compile
if ($LASTEXITCODE -ne 0) { Write-Fail "Extension compile failed" }

Write-Step "Packaging extension..."
npx vsce package --out sp-superpowers.vsix --no-dependencies 2>$null
if ($LASTEXITCODE -ne 0) { Write-Fail "Extension packaging failed" }

Write-Step "Installing extension..."
code-insiders --install-extension sp-superpowers.vsix 2>$null
Pop-Location
Write-Ok "Extension installed"

Write-Host ""
Write-Host "Setup complete! Restart VS Code Insider to activate." -ForegroundColor Green
Write-Host "Then open Copilot Chat — SP skills are ready." -ForegroundColor Green
