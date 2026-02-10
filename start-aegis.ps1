# Aegis Demo Launcher
# Starts both the Eliza backend and Aegis Web frontend

Write-Host "🚀 Starting Aegis Demo Stack..." -ForegroundColor Cyan

# Start Eliza Backend (Port 3011) - uses dev:server for the API
Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; cd '$PSScriptRoot\eliza'; Write-Host '🤖 Eliza Backend (Port 3011)' -ForegroundColor Green; npm run dev:server"

# Start Aegis Web Frontend (Port 3005)
Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; cd '$PSScriptRoot\aegis-web'; Write-Host '🌐 Aegis Web (Port 3005)' -ForegroundColor Magenta; npm run dev -- -p 3005"

Write-Host ""
Write-Host "✅ Aegis Demo is starting!" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:3005" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3011" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop: Run .\stop-aegis.ps1 or close the terminal windows" -ForegroundColor DarkGray
