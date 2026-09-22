$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$lock = Join-Path $repo '.token-sync.lock'

if (Test-Path $lock) {
  $age = (Get-Date) - (Get-Item $lock).LastWriteTime
  if ($age.TotalHours -lt 2) { exit 0 }
  Remove-Item -LiteralPath $lock -Force
}

New-Item -ItemType File -Path $lock -Force | Out-Null
try {
  Set-Location $repo
  node scripts/sync-ccswitch-usage.mjs
  $changed = git status --short -- data/token-usage.json
  if ($changed) {
    git add data/token-usage.json
    git commit -m "chore: update CC Switch token usage"
    git push origin master
  }
} finally {
  Remove-Item -LiteralPath $lock -Force -ErrorAction SilentlyContinue
}
