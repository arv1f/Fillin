# Выгрузка Node API + Prisma на VPS и перезапуск pm2 (fillin-api).
# Перед первым запуском на сервере: создай /opt/fillin-api/.env (DATABASE_URL, ADMIN_TOKEN).
# Те же -Hostname / -KeyPath, что и у deploy-remote.ps1.
param(
  [string]$Hostname = "",
  [string]$User = "root",
  [string]$RemoteApiRoot = "/opt/fillin-api",
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
  throw "SSH key not found: '$KeyPath'. Set -KeyPath or FILLIN_DEPLOY_SSH_KEY."
}

if (-not $Hostname.Trim()) {
  if ($env:FILLIN_DEPLOY_HOST -and $env:FILLIN_DEPLOY_HOST.Trim()) {
    $Hostname = $env:FILLIN_DEPLOY_HOST.Trim()
  }
}

if (-not $Hostname.Trim()) {
  throw "Set -Hostname or FILLIN_DEPLOY_HOST."
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
    throw "$Step failed (exit $LASTEXITCODE)"
  }
}

Write-Host "==> ssh: mkdir $RemoteApiRoot + src/data + scripts"
ssh @SshOpts -i $KeyPath $Remote "mkdir -p '$RemoteApiRoot/src/data' '$RemoteApiRoot/scripts'"
Assert-Exit "ssh mkdir"

Write-Host '==> scp server, prisma: schema.prisma + seed.ts only (never copy dev.db)'
scp @SshOpts -i $KeyPath -r (Join-Path $ProjectRoot "server") "${Remote}:${RemoteApiRoot}/"
Assert-Exit "scp server"
ssh @SshOpts -i $KeyPath $Remote "mkdir -p '$RemoteApiRoot/prisma'"
Assert-Exit "ssh mkdir prisma"
# Нельзя `scp -r prisma`: локальный prisma/dev.db перезапишет SQLite на сервере и сотрёт правки из админки.
scp @SshOpts -i $KeyPath (Join-Path $ProjectRoot "prisma\schema.prisma") "${Remote}:${RemoteApiRoot}/prisma/schema.prisma"
Assert-Exit "scp schema.prisma"
scp @SshOpts -i $KeyPath (Join-Path $ProjectRoot "prisma\seed.ts") "${Remote}:${RemoteApiRoot}/prisma/seed.ts"
Assert-Exit "scp seed.ts"

foreach ($f in @("package.json", "package-lock.json", "ecosystem.config.cjs")) {
  $p = Join-Path $ProjectRoot $f
  scp @SshOpts -i $KeyPath $p "${Remote}:${RemoteApiRoot}/$f"
  Assert-Exit "scp $f"
}

Write-Host "==> scp src snippets for server/copyAllowlists"
scp @SshOpts -i $KeyPath (Join-Path $ProjectRoot "src\scenes.ts") "${Remote}:${RemoteApiRoot}/src/"
Assert-Exit "scp scenes"
scp @SshOpts -i $KeyPath (Join-Path $ProjectRoot "src\sceneZoneTypes.ts") "${Remote}:${RemoteApiRoot}/src/"
Assert-Exit "scp sceneZoneTypes"
scp @SshOpts -i $KeyPath (Join-Path $ProjectRoot "src\data\sceneCopyDefaults.ts") "${Remote}:${RemoteApiRoot}/src/data/"
Assert-Exit "scp sceneCopyDefaults"

$PatchEgjs = Join-Path $ProjectRoot "scripts\patch-egjs-tsconfig.mjs"
if (Test-Path -LiteralPath $PatchEgjs) {
  Write-Host "==> scp patch-egjs-tsconfig.mjs (postinstall)"
  scp @SshOpts -i $KeyPath $PatchEgjs "${Remote}:${RemoteApiRoot}/scripts/patch-egjs-tsconfig.mjs"
  Assert-Exit "scp patch-egjs"
}

Write-Host "==> scp + run remote-api-install.sh"
$InstallSh = Join-Path $ProjectRoot "scripts\remote-api-install.sh"
scp @SshOpts -i $KeyPath $InstallSh "${Remote}:${RemoteApiRoot}/remote-api-install.sh"
Assert-Exit "scp install script"
ssh @SshOpts -i $KeyPath $Remote "sed -i 's/\r$//' '$RemoteApiRoot/remote-api-install.sh' && chmod +x '$RemoteApiRoot/remote-api-install.sh' && bash '$RemoteApiRoot/remote-api-install.sh' '$RemoteApiRoot'"
Assert-Exit "ssh npm prisma pm2"

Write-Host "==> OK: API on ${Remote}:${RemoteApiRoot} (pm2: fillin-api, port 4000). Ensure nginx proxies /api -> 127.0.0.1:4000."
