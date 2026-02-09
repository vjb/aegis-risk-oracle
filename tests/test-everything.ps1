# ════════════════════════════════════════════════════════════════════════════════
# 🛡️  AEGIS UBER TESTER: THE MASTER VERIFICATION SUITE
# ════════════════════════════════════════════════════════════════════════════════
# One command to verify the entire project state:
#   1. 📋 Environment & Deps
#   2. 📡 Backend API Connectivity
#   3. 🔐 Off-Chain Cryptography
#   4. ⛓️  Smart Contract Integration
#   5. 🚀 Full End-to-End Flow
# ════════════════════════════════════════════════════════════════════════════════

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSScriptRoot = Get-Location
$Global:TestsFailed = 0

function Write-Header($text) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   $text" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Run-TestStep($Name, $ScriptPath, $Arguments = "") {
    Write-Host "🏃 Running: $Name..." -ForegroundColor Yellow
    $fullPath = Join-Path $PSScriptRoot $ScriptPath
    
    if ($ScriptPath.EndsWith(".ps1")) {
        & $fullPath $Arguments
    } elseif ($ScriptPath.EndsWith(".ts") -or $ScriptPath.EndsWith(".js")) {
        npx tsx $fullPath
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ $Name FAILED!" -ForegroundColor Red
        $Global:TestsFailed++
        return $false
    } else {
        Write-Host "   ✅ $Name PASSED!" -ForegroundColor Green
        return $true
    }
}

Write-Header "🚀 STARTING AEGIS UBER TESTER"

# ════════════════════════════════════════════════════════════════════════════════
# PHASE 1: PREREQUISITES
# ════════════════════════════════════════════════════════════════════════════════
Write-Host "📋 Phase 1: Checking Environment..." -ForegroundColor White

# Check Docker
$dockerCheck = docker ps --filter "name=aegis_dev" --format "{{.Names}}" 2>$null
if ($dockerCheck -ne "aegis_dev") {
    Write-Host "   ❌ Docker container 'aegis_dev' is not running!" -ForegroundColor Red
    Write-Host "      Run: docker-compose up -d" -ForegroundColor DarkGray
    $Global:TestsFailed++
} else {
    Write-Host "   ✅ Docker: Running" -ForegroundColor Green
}

# Check Anvil
$castPath = "$env:USERPROFILE\.foundry\bin\cast.exe"
$env:FOUNDRY_DISABLE_NIGHTLY_WARNING = "1"
$anvilCheck = & $castPath chain-id --rpc-url http://localhost:8545 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠️  Anvil: Not running (Blockchain tests will be skipped)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Anvil: Running (Chain ID: $anvilCheck)" -ForegroundColor Green
}

# ════════════════════════════════════════════════════════════════════════════════
# PHASE 2: CONNECTIVITY (APIs)
# ════════════════════════════════════════════════════════════════════════════════
Write-Header "📡 Phase 2: Connectivity Suite"
Run-TestStep "API Connectivity (CoinGecko/GoPlus/QRNG)" "test-all-apis.ts"
Run-TestStep "AI Risk Logic (CRE Simulation)" "test-aegis.ps1"

# ════════════════════════════════════════════════════════════════════════════════
# PHASE 3: CRYPTOGRAPHY
# ════════════════════════════════════════════════════════════════════════════════
Write-Header "🔐 Phase 3: Cryptography Suite"
Run-TestStep "Off-Chain Signature Verification" "test-signature.ps1"

# ════════════════════════════════════════════════════════════════════════════════
# PHASE 4: SMART CONTRACT & E2E (If Anvil is up)
# ════════════════════════════════════════════════════════════════════════════════
if ($anvilCheck) {
    Write-Header "⛓️  Phase 4: Smart Contract Integration"
    Run-TestStep "AegisVault integration tests" "test-contract.ps1"
    
    Write-Header "🚀 Phase 5: Full E2E Demo Flow"
    Run-TestStep "Full AI-to-Blockchain flow" "run-full-flow.ps1"
} else {
    Write-Host ""
    Write-Host "⏩ Skipping Phases 4 & 5 (Anvil not running)" -ForegroundColor DarkGray
}

# ════════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
if ($Global:TestsFailed -eq 0) {
    Write-Host "   🏆 ALL SYSTEMS NOMINAL: PROJECT IS READY FOR SUBMISSION!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  VERIFICATION INCOMPLETE: $Global:TestsFailed test(s) failed or were skipped." -ForegroundColor Yellow
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

exit $Global:TestsFailed
