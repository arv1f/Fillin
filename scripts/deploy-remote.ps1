# Сборка Vite и выгрузка dist + public на VPS (статика тура).
# Ключ: -KeyPath или FILLIN_DEPLOY_SSH_KEY / SIWE_DEPLOY_SSH_KEY.
# Хост: -Hostname или FILLIN_DEPLOY_HOST.
param(
  [string]$Hostname = "",
  [string]$User = "root",
  [string]$RemoteRoot = "/var/www/fillin",
  [string]$KeyPath = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not $KeyPath.Trim()) {
  if ($env:FILLIN_DEPLOY_SSH_KEY -and $env:FILLIN_DEPLOY_SSH_KEY.Trim()) {
    $KeyPath = $env:FILLIN_DEPLOY_SSH_KEY.Trim()
  }
  elseif ($env:SIWE_DEPLOY_SSH_KEY -and $env:SIWE_DEPLOY_SSH_KEY.Trim()) {
    $KeyPath = $env:SIWE_DEPLOY_SSH_KEY.Trim()
  }
}

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "SSH key not found: '$KeyPath'. Set -KeyPath or FILLIN_DEPLOY_SSH_KEY in .vscode/settings.json."
}

if (-not $Hostname.Trim()) {
  if ($env:FILLIN_DEPLOY_HOST -and $env:FILLIN_DEPLOY_HOST.Trim()) {
    $Hostname = $env:FILLIN_DEPLOY_HOST.Trim()
  }
}

if (-not $Hostname.Trim()) {
  throw "Set -Hostname or FILLIN_DEPLOY_HOST in .vscode/settings.json."
}

$Remote = "$User@$Hostname"
$SshOpts = @(
  "-o", "ServerAliveInterval=30",
  "-o", "ServerAliveCountMax=120",
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "BatchMode=yes"
)

function Assert-Exit {
  param([string]$Step)
  if ($LASTEXITCODE -ne 0) {
    $msg = @"
$Step failed (exit $LASTEXITCODE).

Permission denied? The server must have the PUBLIC key matching this PRIVATE key:
  $KeyPath

On your PC run:  Get-Content `$env:USERPROFILE\.ssh\id_ed25519.pub
Paste that one line into /root/.ssh/authorized_keys on the server (or use Timeweb panel SSH keys).

Or log in with password:  ssh root@$Hostname
"@
    throw $msg
  }
}

Write-Host "==> npm run build"
Push-Location $ProjectRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
} finally {
  Pop-Location
}

Write-Host "==> ssh: mkdir $RemoteRoot"
ssh @SshOpts -i $KeyPath $Remote "mkdir -p '$RemoteRoot'"
Assert-Exit "ssh mkdir"

Write-Host "==> scp dist -> $RemoteRoot"
scp @SshOpts -i $KeyPath -r (Join-Path $ProjectRoot "dist\.") "${Remote}:${RemoteRoot}/"
Assert-Exit "scp dist"

Write-Host "==> scp public -> $RemoteRoot"
scp @SshOpts -i $KeyPath -r (Join-Path $ProjectRoot "public\.") "${Remote}:${RemoteRoot}/"
Assert-Exit "scp public"

$NginxExample = Join-Path $ProjectRoot "scripts\nginx-fillin.conf.example"
if (Test-Path -LiteralPath $NginxExample) {
  Write-Host "==> scp nginx example -> $RemoteRoot"
  scp @SshOpts -i $KeyPath $NginxExample "${Remote}:${RemoteRoot}/nginx-fillin.conf.example"
  Assert-Exit "scp nginx example"
}

Write-Host "==> ssh: chmod (Caddy читает как user caddy — нужен обход каталогов и чтение файлов)"
ssh @SshOpts -i $KeyPath $Remote "chmod 755 '$RemoteRoot' && chmod -R a+rX '$RemoteRoot'"
Assert-Exit "ssh chmod web root"

Write-Host "==> OK: uploaded to ${Remote}:${RemoteRoot}"
Write-Host "    API: proxy /api -> 127.0.0.1:4000 (Caddy или nginx)."
