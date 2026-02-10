# Aegis Local Chain Deployment Script
# Deploys AegisVault.sol to a local Anvil chain for demo purposes

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔗 AEGIS LOCAL CHAIN DEPLOYMENT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan

# Check if Anvil is running
$anvilProcess = Get-Process -Name "anvil" -ErrorAction SilentlyContinue
if (-not $anvilProcess) {
    Write-Host "`n⚠️  Anvil is not running. Starting Anvil..." -ForegroundColor Yellow
    Start-Process "$env:USERPROFILE\.foundry\bin\anvil.exe"
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

# Mock VRF Parameters for Local Demo
$VRF_COORDINATOR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" # Using DON key as mock coordinator
$KEY_HASH = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15"
$SUB_ID = "1"

# Deploy Mock VRF Coordinator
Write-Host "`n🎲 Deploying MockVRFCoordinator..." -ForegroundColor Yellow
$forgePath = "$env:USERPROFILE\.foundry\bin\forge.exe"
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"

# We must capture the output to find the address
$mockVrfOutput = & $forgePath create "contracts/MockVRFCoordinator.sol:MockVRFCoordinator" --broadcast --rpc-url http://localhost:8545 --private-key $DON_PRIVATE_KEY 2>&1

# Regex match the address
$mockVrfAddress = $null
if ($mockVrfOutput -match "Deployed to: (0x[a-fA-F0-9]{40})") {
    $mockVrfAddress = $matches[1]
    Write-Host "   ✅ MockVRF deployed to: $mockVrfAddress" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to deploy MockVRF" -ForegroundColor Red
    Write-Host "$mockVrfOutput"
    exit 1
}

# Deploy AegisVault using forge
Write-Host "`n🚀 Deploying AegisVault.sol (with VRF config)..." -ForegroundColor Yellow

# Constructor Args: _router, _vrfCoordinator, _keyHash, _subId
& $forgePath create "contracts/AegisVault.sol:AegisVault" --broadcast --rpc-url http://localhost:8545 --private-key $DON_PRIVATE_KEY --constructor-args $DON_PUBLIC_KEY $mockVrfAddress $KEY_HASH $SUB_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ AegisVault deployed successfully!" -ForegroundColor Green
    Write-Host "   Mock VRF: $mockVrfAddress" -ForegroundColor DarkGray
} else {
    Write-Host "`n❌ Deployment failed. Check the output above." -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Deployment Complete" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
