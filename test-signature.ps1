# Aegis Signature Verification Demo
# Demonstrates Triple Lock cryptographic security WITHOUT requiring Anvil
# Uses the existing verify-signature.ts script with bun

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   🔐 AEGIS TRIPLE LOCK SIGNATURE DEMO" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "   This demo shows cryptographic verification WITHOUT a blockchain." -ForegroundColor White
Write-Host "   It demonstrates how the DON signature ensures:" -ForegroundColor White
Write-Host "   • Identity Lock - Only the authorized DON can sign" -ForegroundColor DarkGray
Write-Host "   • Value Lock   - Price data cannot be tampered" -ForegroundColor DarkGray
Write-Host "   • Time Lock    - Signatures expire after 5 minutes" -ForegroundColor DarkGray
Write-Host ""

# Check if we're in Docker or local
$inDocker = Test-Path "/app/aegis-workflow/verify-signature.ts"

if ($inDocker) {
    Write-Host "📦 Running in Docker container..." -ForegroundColor Yellow
    Push-Location /app/aegis-workflow
    bun run verify-signature.ts
    Pop-Location
} else {
    # Check if bun is available
    $bunPath = Get-Command bun -ErrorAction SilentlyContinue
    if ($bunPath) {
        Write-Host "📦 Running with Bun..." -ForegroundColor Yellow
        Push-Location $PSScriptRoot\aegis-workflow
        bun run verify-signature.ts
        Pop-Location
    } else {
        # Try npx tsx as fallback
        Write-Host "📦 Running with npx tsx..." -ForegroundColor Yellow
        Push-Location $PSScriptRoot\aegis-workflow
        npx tsx verify-signature.ts
        Pop-Location
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "   SIGNATURE DEMO COMPLETE" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
