# Aegis Local Chain Deployment Script
# Deploys AegisVault.sol to a local Anvil chain for demo purposes

$ErrorActionPreference = "Stop"
$forgePath = "$env:USERPROFILE\.foundry\bin\forge.exe"
if (-not (Test-Path $forgePath)) {
    Write-Error "Forge not found at $forgePath"
}

# ═══════════════════════════════════════════════════════════════════════════════
# 🏆 TENDERLY VIRTUAL TESTNETS INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════
if ($env:TENDERLY_RPC_URL) {
    $RPC_URL = $env:TENDERLY_RPC_URL
    Write-Host "🌐 Using Tenderly Virtual TestNet: $RPC_URL" -ForegroundColor Cyan
} else {
    $RPC_URL = "http://localhost:8545"
    Write-Host "⚠️  TENDERLY_RPC_URL not set. Falling back to local Anvil." -ForegroundColor Yellow
    Write-Host "   For Tenderly integration, set: `$env:TENDERLY_RPC_URL='https://virtual.base.rpc.tenderly.co/YOUR_ID'" -ForegroundColor DarkGray
}

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔗 AEGIS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan

# Hardcoded Keys to avoid variable expansion issues
# key: 0xac09...
# pub: 0xf39F...

Write-Host "`n📋 Deployment Parameters:" -ForegroundColor Cyan
Write-Host "   DON Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor DarkGray
Write-Host "   RPC URL: $RPC_URL" -ForegroundColor DarkGray


# Deploy Mock VRF Coordinator
Write-Host "`n🎲 Deploying MockVRFCoordinator..." -ForegroundColor Yellow
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"

# We must capture the output to find the address
$cmdMock = "& `"$forgePath`" create contracts/MockVRFCoordinator.sol:MockVRFCoordinator --broadcast --rpc-url $RPC_URL --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$mockVrfOutput = Invoke-Expression $cmdMock 2>&1

# Parse address
$mockVrfString = $mockVrfOutput -join "`n"
$mockVrfAddress = $null
if ($mockVrfString -match "Deployed to: (0x[a-fA-F0-9]{40})") {
    $mockVrfAddress = $matches[1]
    Write-Host "   ✅ MockVRF deployed to: $mockVrfAddress" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to deploy MockVRF" -ForegroundColor Red
    Write-Host "$mockVrfString"
    exit 1
}

# Deploy AegisVault using forge
Write-Host "`n🚀 Deploying AegisVault.sol..." -ForegroundColor Yellow

# Constructor Args: _router, _vrfCoordinator, _keyHash, _subId
# Router: 0xf39F... (Using DON public key as mock router)
# VRF: $mockVrfAddress
# KeyHash: 0x79d3...
# SubId: 1

$cmdVault = "& `"$forgePath`" create contracts/AegisVault.sol:AegisVault --broadcast --rpc-url $RPC_URL --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 $mockVrfAddress 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15 1"

$vaultOutput = Invoke-Expression $cmdVault 2>&1

$vaultString = $vaultOutput -join "`n"
if ($vaultString -match "Deployed to: (0x[a-fA-F0-9]{40})") {
    $vaultAddress = $matches[1]
    Write-Host "   ✅ AegisVault deployed to: $vaultAddress" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to deploy AegisVault" -ForegroundColor Red
    Write-Host "$vaultString"
    exit 1
}

Write-Host "`n════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Deployment Complete" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
