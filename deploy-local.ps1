# Aegis Local Chain Deployment Script
# Deploys AegisVault.sol to a local Anvil chain for demo purposes

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔗 AEGIS LOCAL CHAIN DEPLOYMENT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan

# Check if Anvil is running
$anvilProcess = Get-Process -Name "anvil" -ErrorAction SilentlyContinue
if (-not $anvilProcess) {
    Write-Host "`n⚠️  Anvil is not running. Starting Anvil..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile", "-NoExit", "-Command", "& '$env:USERPROFILE\.foundry\bin\anvil.exe'"
    Write-Host "   Waiting for Anvil to start..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 3
}

Write-Host "`n✅ Anvil running at http://localhost:8545" -ForegroundColor Green

# DON Demo Private Key (same as in aegis-workflow/main.ts)
$DON_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$DON_PUBLIC_KEY = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"  # Derived from private key

Write-Host "`n📋 Deployment Parameters:" -ForegroundColor Cyan
Write-Host "   DON Public Key: $DON_PUBLIC_KEY" -ForegroundColor DarkGray
Write-Host "   RPC URL: http://localhost:8545" -ForegroundColor DarkGray

# Deploy AegisVault using forge
Write-Host "`n🚀 Deploying AegisVault.sol..." -ForegroundColor Yellow

$forgePath = "$env:USERPROFILE\.foundry\bin\forge.exe"
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"
& $forgePath create "contracts/AegisVault.sol:AegisVault" --broadcast --rpc-url http://localhost:8545 --private-key $DON_PRIVATE_KEY --constructor-args $DON_PUBLIC_KEY

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ AegisVault deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment failed. Check the output above." -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Deployment Complete" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
