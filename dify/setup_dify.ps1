# Dify 服务部署脚本（需要以管理员身份运行）
# 用法：右键此文件 → "使用 PowerShell 运行"，或在管理员 PowerShell 中执行：
#   powershell -ExecutionPolicy Bypass -File .\setup_dify.ps1

$ErrorActionPreference = "Stop"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  实验室安全小助手 - Dify 服务一键部署" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ========== 步骤 1: 安装 WSL2 ==========
Write-Host "[1/5] 检查 WSL2..." -ForegroundColor Yellow
$wslInstalled = $false
try {
    $wslVersion = wsl --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  WSL2 已安装: $($wslVersion[0])" -ForegroundColor Green
        $wslInstalled = $true
    }
} catch {}

if (-not $wslInstalled) {
    Write-Host "  正在安装 WSL2（可能需要几分钟，安装完成后需要重启电脑）..." -ForegroundColor Yellow
    wsl --install --no-distribution
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  WSL2 安装成功！请重启电脑后重新运行本脚本。" -ForegroundColor Green
        Read-Host "按 Enter 退出"
        exit 0
    } else {
        Write-Host "  WSL2 安装失败，请手动运行: wsl --install" -ForegroundColor Red
    }
}

# ========== 步骤 2: 检查/安装 Docker Desktop ==========
Write-Host "[2/5] 检查 Docker Desktop..." -ForegroundColor Yellow
$dockerInstalled = $false
try {
    docker --version 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Docker Desktop 已安装" -ForegroundColor Green
        $dockerInstalled = $true
    }
} catch {}

if (-not $dockerInstalled) {
    Write-Host "  正在通过 winget 安装 Docker Desktop..." -ForegroundColor Yellow
    Write-Host "  （如果弹出用户账户控制窗口，请点击"是"）" -ForegroundColor Yellow

    winget install Docker.DockerDesktop --accept-source-agreements --accept-package-agreements --silent

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Docker Desktop 安装成功！" -ForegroundColor Green
        Write-Host "  请手动启动 Docker Desktop 后重新运行本脚本。" -ForegroundColor Yellow
        Read-Host "按 Enter 退出"
        exit 0
    } else {
        Write-Host "  自动安装失败，请手动下载安装：" -ForegroundColor Red
        Write-Host "  https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
        Write-Host "  安装完成后重新运行本脚本。" -ForegroundColor Yellow
        Read-Host "按 Enter 退出"
        exit 0
    }
}

# ========== 步骤 3: 启动 Docker Desktop ==========
Write-Host "[3/5] 确保 Docker Desktop 正在运行..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITODE -ne 0) {
        Write-Host "  正在启动 Docker Desktop..." -ForegroundColor Yellow
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Write-Host "  等待 Docker 引擎启动（最多 60 秒）..." -ForegroundColor Yellow
        $timeout = 60
        for ($i = 0; $i -lt $timeout; $i++) {
            try {
                docker info 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) { break }
            } catch {}
            Start-Sleep -Seconds 1
            Write-Host "  ." -NoNewline
        }
        Write-Host ""
    }
    Write-Host "  Docker 引擎已就绪" -ForegroundColor Green
} catch {
    Write-Host "  Docker Desktop 启动失败，请手动启动后重试" -ForegroundColor Red
    exit 1
}

# ========== 步骤 4: 启动 Dify 服务 ==========
Write-Host "[4/5] 启动 Dify 服务..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "  拉取 Docker 镜像（首次可能需要几分钟）..." -ForegroundColor Yellow
docker compose pull 2>&1

Write-Host "  启动容器..." -ForegroundColor Yellow
docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Dify 启动失败，请检查 docker-compose.yml 配置" -ForegroundColor Red
    exit 1
}

Write-Host "  Dify 容器已启动" -ForegroundColor Green

# ========== 步骤 5: 等待服务就绪 ==========
Write-Host "[5/5] 等待 Dify 服务就绪..." -ForegroundColor Yellow
Write-Host "  等待数据库初始化（约 30 秒）..." -ForegroundColor Yellow
for ($i = 0; $i -lt 30; $i++) {
    Write-Host "  ." -NoNewline
    Start-Sleep -Seconds 1
}
Write-Host ""

# 检查服务状态
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Dify 服务部署完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  管理控制台:  http://localhost:8081" -ForegroundColor Yellow
Write-Host "    - 邮箱:    请按控制台提示设置（首次访问需初始化）" -ForegroundColor Yellow
Write-Host "    - 密码:    admin123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Service API: http://localhost:8080/v1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  查看日志:    docker compose logs -f" -ForegroundColor Cyan
Write-Host "  停止服务:    docker compose down" -ForegroundColor Cyan
Write-Host "  重启服务:    docker compose restart" -ForegroundColor Cyan
Write-Host ""

# 显示容器状态
docker compose ps
