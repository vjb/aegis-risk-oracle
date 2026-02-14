# Aegis Contract Integration Test
# Tests E2E flow: swap() -> fulfillRequest() (Simulated DON)
# Requires Anvil to be running (use deploy-local.ps1 first)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ═══════════════════════════════════════════════════════════════════════════════
# Load .env file if it exists
# ═══════════════════════════════════════════════════════════════════════════════
$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔗 AEGIS CONTRACT INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════════════════════
# 🏆 TENDERLY VIRTUAL TESTNETS INTEGRATION  
# ═══════════════════════════════════════════════════════════════════════════════
if ($env:TENDERLY_RPC_URL) {
    $RPC_URL = $env:TENDERLY_RPC_URL
} else {
    $RPC_URL = "http://localhost:8545"
}

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK: Is test network running?
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n📡 Checking network connectivity ($RPC_URL)..." -ForegroundColor Yellow

$castPath = "$env:USERPROFILE\.foundry\bin\cast.exe"
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"

# Check if cast exists
if (-not (Test-Path $castPath)) {
    Write-Host "`n⚠️  Foundry not installed. Skipping contract tests." -ForegroundColor Yellow
    exit 0
}

# Try to connect to Anvil
try {
    $chainId = & $castPath chain-id --rpc-url $RPC_URL 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Connection failed" }
    Write-Host "   ✅ Network running (Chain ID: $chainId)" -ForegroundColor Green
} catch {
    Write-Host "`n⚠️  Test network not running. Skipping contract tests." -ForegroundColor Yellow
    exit 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT ADDRESS (from deploy-local.ps1)
# ═══════════════════════════════════════════════════════════════════════════════
$CONTRACT_ADDRESS = "0x1F807a431614756A6866DAd9607ca62e2542ab01"
$DON_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
$USER_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

# Check if contract is deployed
$code = & $castPath code $CONTRACT_ADDRESS --rpc-url $RPC_URL 2>&1
if ($code -eq "0x" -or $code -eq "") {
    Write-Host "`n⚠️  AegisVault not deployed. Run .\deploy-local.ps1 first." -ForegroundColor Yellow
    exit 0
}
Write-Host "   ✅ AegisVault deployed at $CONTRACT_ADDRESS" -ForegroundColor Green

# Helper to capture Request ID from logs
function Get-RequestId($txHash) {
    if (-not $txHash) { return $null }
    
    $receipt = & $castPath receipt $txHash --rpc-url $RPC_URL --json | ConvertFrom-Json
    
    # Filter for logs emitted by AegisVault (TradeInitiated)
    # Case-insensitive comparison is safer for addresses
    foreach ($log in $receipt.logs) {
        if ($log.address -eq $CONTRACT_ADDRESS -or $log.address -eq $CONTRACT_ADDRESS.ToLower()) {
            # TradeInitiated(bytes32 indexed requestId, ...)
            return $log.topics[1]
        }
    }
    
    Write-Host "Warning: TradeInitiated event not found in logs." -ForegroundColor Yellow
    return $null
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 1: APPROVE VERDICT → Trade Executes
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🧪 TEST 1: APPROVE Verdict → Trade Should Execute" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

$tokenAddr = "0x4200000000000000000000000000000000000006" # WETH
$amount = "1000000000000000000" # 1 ETH

Write-Host "   1. Initiating Swap..." -ForegroundColor DarkGray
$txJson = & $castPath send $CONTRACT_ADDRESS "swap(address,uint256)" $tokenAddr $amount --value $amount --private-key $USER_PRIVATE_KEY --rpc-url $RPC_URL --json | ConvertFrom-Json
$reqId = Get-RequestId $txJson.transactionHash

if ($reqId) {
    Write-Host "   ✅ Request Created: $reqId" -ForegroundColor Green
    
    Write-Host "   2. Simulating DON Callback (Safe)..." -ForegroundColor DarkGray
    # RiskCode 0 = Safe
    # Encode 0 as uint256 bytes
    $response = "0x0000000000000000000000000000000000000000000000000000000000000000"
    $err = "0x"
    
    $res = & $castPath send $CONTRACT_ADDRESS "fulfillRequest(bytes32,bytes,bytes)" $reqId $response $err --private-key $DON_PRIVATE_KEY --rpc-url $RPC_URL 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PASS: Trade settled successfully!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL: Settlement reverted" -ForegroundColor Red
        Write-Host "   $res" -ForegroundColor DarkGray
    }

} else {
    Write-Host "   ❌ FAIL: Could not initiate swap" -ForegroundColor Red
    Write-Host "   $txJson"
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 2: REJECT VERDICT → Trade Blocked
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host "🧪 TEST 2: REJECT Verdict → Trade Should Be Blocked" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red

$scamToken = "0x0000000000000000000000000000000000000666" 

Write-Host "   1. Initiating Swap (Scam Token)..." -ForegroundColor DarkGray
$txJson2 = & $castPath send $CONTRACT_ADDRESS "swap(address,uint256)" $scamToken $amount --value $amount --private-key $USER_PRIVATE_KEY --rpc-url $RPC_URL --json | ConvertFrom-Json
$reqId2 = Get-RequestId $txJson2.transactionHash

if ($reqId2) {
    Write-Host "   ✅ Request Created: $reqId2" -ForegroundColor Green
    
    Write-Host "   2. Simulating DON Callback (Risk Code 16)..." -ForegroundColor DarkGray
    # RiskCode 16 = HoneyPot
    $response2 = "0x0000000000000000000000000000000000000000000000000000000000000010"
    
    $res2 = & $castPath send $CONTRACT_ADDRESS "fulfillRequest(bytes32,bytes,bytes)" $reqId2 $response2 $err --private-key $DON_PRIVATE_KEY --rpc-url $RPC_URL 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PASS: Trade blocked & refunded!" -ForegroundColor Green
        
        # Verify Cache Update
        $cache = & $castPath call $CONTRACT_ADDRESS "riskCache(address)(uint256)" $scamToken --rpc-url $RPC_URL
        if ($cache -match "16") {
            Write-Host "   ✅ Risk Cache Updated: Token blacklisted (Code 16)" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ FAIL: Blocking transaction reverted" -ForegroundColor Red
        Write-Host "   $res2" -ForegroundColor DarkGray
    }

} else {
    Write-Host "   ❌ FAIL: Could not initiate swap" -ForegroundColor Red
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST 3: SYSTEM ERROR → Fail-Safe Refund
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 TEST 3: SYSTEM ERROR → Fail-Safe Refund" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "   1. Initiating Swap (Error Case)..." -ForegroundColor DarkGray
$txJson3 = & $castPath send $CONTRACT_ADDRESS "swap(address,uint256)" $tokenAddr $amount --value $amount --private-key $USER_PRIVATE_KEY --rpc-url $RPC_URL --json | ConvertFrom-Json
$reqId3 = Get-RequestId $txJson3.transactionHash

if ($reqId3) {
    Write-Host "   ✅ Request Created: $reqId3" -ForegroundColor Green
    
    Write-Host "   2. Simulating DON Error..." -ForegroundColor DarkGray
    $errBytes = "0x415049204552524f52" # "API ERROR" in hex
    
    $res3 = & $castPath send $CONTRACT_ADDRESS "fulfillRequest(bytes32,bytes,bytes)" $reqId3 "0x" $errBytes --private-key $DON_PRIVATE_KEY --rpc-url $RPC_URL 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ PASS: Error handled & user refunded!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL: Error handling reverted" -ForegroundColor Red
        Write-Host "   $res3" -ForegroundColor DarkGray
    }
}

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   CONTRACT TESTS COMPLETE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
