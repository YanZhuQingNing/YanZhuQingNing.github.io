$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $repo 'scripts\run-token-sync.ps1'
$taskName = 'PersonalWebsite-CCSwitchTokenSync'
$action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`""
$trigger = New-ScheduledTaskTrigger -Daily -At 11:55pm
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Sync CC Switch token usage to the personal website once per day.' -Force | Out-Null
Write-Output "Registered $taskName at 23:55 daily."
