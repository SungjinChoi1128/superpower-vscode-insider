#Requires -Version 7.0
<#
.SYNOPSIS
    Remove SP Superpowers harness.
.DESCRIPTION
    Reverses setup.ps1. Leaves memory intact.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$CopilotRoot = Join-Path $env:USERPROFILE ".copilot"
$VSCodeSettingsPath = Join-Path $env:APPDATA "Code - Insiders\User\settings.json"

function Write-Step($msg) { Write-Host "  → $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }

Write-Host "SP Superpowers Teardown" -ForegroundColor Yellow
Write-Host "======================="

# Step 1: Remove VS Code settings
Write-Step "Removing VS Code settings..."
if (Test-Path $VSCodeSettingsPath) {
    $settings = Get-Content $VSCodeSettingsPath -Raw | ConvertFrom-Json -AsHashtable
    @("chat.agentSkillsLocations", "chat.useAgentSkills",
      "github.copilot.chat.codeGeneration.instructions",
      "chat.tools.edits.autoApprove") | ForEach-Object {
          $settings.Remove($_)
    }
    $settings | ConvertTo-Json -Depth 10 | Set-Content $VSCodeSettingsPath -Encoding UTF8
}
Write-Ok "VS Code settings restored"

# Step 2: Uninstall extension
Write-Step "Uninstalling extension..."
code-insiders --uninstall-extension sp.superpowers 2>$null
Write-Ok "Extension uninstalled"

Write-Host ""
Write-Host "Teardown complete. Memory preserved at: $CopilotRoot\memory\" -ForegroundColor Green
Write-Host "Restart VS Code Insider to complete removal." -ForegroundColor Green
