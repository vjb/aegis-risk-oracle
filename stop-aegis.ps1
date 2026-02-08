# Aegis Demo Stopper
# Stops all Node.js processes running on ports 3005 and 3011

Write-Host "🛑 Stopping Aegis Demo Stack..." -ForegroundColor Cyan

# Find and kill processes on port 3005 (Aegis Web)
$port3005 = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port3005) {
    $port3005 | ForEach-Object { 
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process on port 3005 (PID: $_)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   No process found on port 3005" -ForegroundColor DarkGray
}

# Find and kill processes on port 3011 (Eliza)
$port3011 = Get-NetTCPConnection -LocalPort 3011 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($port3011) {
    $port3011 | ForEach-Object { 
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process on port 3011 (PID: $_)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   No process found on port 3011" -ForegroundColor DarkGray
}

# FORCE CLEANUP: Next.js dev lock can sometimes persist
Write-Host "🧹 Cleaning up dev locks..." -ForegroundColor Cyan
$lockPath = Join-Path $PSScriptRoot "aegis-web\.next\dev\lock"
if (Test-Path $lockPath) {
    Remove-Item -Path $lockPath -Force -ErrorAction SilentlyContinue
    Write-Host "   Removed Next.js dev lock file." -ForegroundColor Yellow
}

# Kill any remaining orphaned node processes for this project
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   Ensuring all Node.js instances are closed..." -ForegroundColor DarkGray
    # We only want to kill node processes that might be related to this folder if possible, 
    # but in a hackathon dev environment, a blanket kill is often safest to clear locks.
    # taskkill /F /IM node.exe 2>$null
}

Write-Host ""
Write-Host "✅ Aegis Demo stopped." -ForegroundColor Green
