$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$lock = Join-Path $repo '.token-sync.lock'

# 后台运行时禁止 git 弹出凭据提示，失败直接报错
$env:GIT_TERMINAL_PROMPT = '0'

# 外部命令失败不会触发 $ErrorActionPreference，需要手动检查退出码
function Invoke-Checked {
  param([string]$Exe, [string[]]$Arguments)
  & $Exe @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Exe $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

if (Test-Path $lock) {
  $age = (Get-Date) - (Get-Item $lock).LastWriteTime
  if ($age.TotalHours -lt 2) { exit 0 }
  Remove-Item -LiteralPath $lock -Force
}

New-Item -ItemType File -Path $lock -Force | Out-Null
try {
  Set-Location $repo
  Invoke-Checked node @('scripts/sync-ccswitch-usage.mjs')
  $changed = git status --short -- data/token-usage.json
  if ($changed) {
    Invoke-Checked git @('add', 'data/token-usage.json')
    Invoke-Checked git @('commit', '-m', 'chore: update CC Switch token usage')
  }
  # 远端有 GitHub Actions 的提交，先 rebase 再推送；也会补推之前失败的 commit
  Invoke-Checked git @('pull', '--rebase', '--autostash', 'origin', 'master')
  Invoke-Checked git @('push', 'origin', 'master')
} finally {
  Remove-Item -LiteralPath $lock -Force -ErrorAction SilentlyContinue
}
