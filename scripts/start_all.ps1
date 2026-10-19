$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$RepoRoot = Split-Path -Parent $PSScriptRoot
$DifyDir = Join-Path $RepoRoot "dify"
$StartDemoScript = Join-Path $PSScriptRoot "start_dify_rag_local.ps1"
$SnapshotPy = Join-Path $PSScriptRoot "record_runtime_snapshot.py"
$PythonExe = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$DemoPort = 8088

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lab-Safe-Assistant 一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ===== Step 1: Docker Desktop =====
Write-Host "[1/4] Docker Desktop ..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
} catch {}

if (-not $dockerRunning) {
    Write-Host "      启动 Docker Desktop（等待引擎就绪，最长 60s）..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        try {
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { $dockerRunning = $true; break }
        } catch {}
    }
}
if ($dockerRunning) { Write-Host "      [OK] Docker Engine 就绪" -ForegroundColor Green }
else { throw "Docker Desktop 启动超时或失败" }

# ===== Step 2: Dify 容器 =====
Write-Host "[2/4] Dify 容器 ..." -ForegroundColor Yellow
Push-Location $DifyDir
$upOutput = docker compose up -d 2>&1
$upExit = $LASTEXITCODE
Pop-Location
if ($upExit -ne 0) {
    Write-Host "      docker compose up -d 返回非零，检查是否需要 docker compose 而不是 docker-compose..."
    Push-Location $DifyDir
    docker-compose up -d 2>&1
    Pop-Location
}
# Wait for healthy
Write-Host "      等待容器健康检查..."
Start-Sleep -Seconds 5
$healthy = 0
$total = 0
try {
    $containers = docker ps --format "{{.Names}} {{.Status}}" 2>$null
    foreach ($line in $containers) {
        if ($line -match "^dify-") {
            $total++
            if ($line -match "healthy" -or $line -match "Up") { $healthy++ }
        }
    }
} catch {}
Write-Host "      [OK] Dify 容器: $healthy/$total 个健康" -ForegroundColor Green

# ===== Step 3: Web Demo =====
Write-Host "[3/4] Web Demo ..." -ForegroundColor Yellow
# Check if port already occupied (maybe already running)
$existing = Get-NetTCPConnection -State Listen -LocalPort $DemoPort -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
    Write-Host "      [OK] 端口 $DemoPort 已占用，复用现有服务" -ForegroundColor Green
} else {
    & $StartDemoScript
}

# ===== Step 4: 运行快照 =====
Write-Host "[4/4] 运行快照 ..." -ForegroundColor Yellow
& $PythonExe $SnapshotPy --base-url "http://127.0.0.1:$DemoPort"
Write-Host "      [OK] 快照已记录" -ForegroundColor Green

# ===== Done =====
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  全部启动完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  问答页面 : http://localhost:$DemoPort" -ForegroundColor White
Write-Host "  Dify 控制台: http://localhost:8081" -ForegroundColor White
Write-Host "  健康检查 : http://localhost:$DemoPort/health" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
