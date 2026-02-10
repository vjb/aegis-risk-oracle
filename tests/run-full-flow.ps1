# Aegis End-To-End "Hollywood" Demo Script
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$castPath = "cast"
$CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
$USER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" 

$RISK_FLAGS = @{
    1   = "Low Liquidity Detected"
    2   = "High Volatility Warning"
    4   = "Malicious Code Patterns"
    8   = "Centralized Ownership Risk"
    16  = "Honeypot Trap Detected"
    32  = "Impersonation Attempt"
    64  = "Wash Trading Detected"
    128 = "Suspicious Deployer History"
    256 = "Phishing/Scam Signature"
    512 = "AI Anomaly Detection"
}

function Decode-RiskCode([int]$code) {
    if ($code -eq 0) { return @("✅ VERIFIED SAFE") }
    $found = @()
    foreach ($bit in $RISK_FLAGS.Keys | Sort-Object) {
        if (($code -band $bit) -eq $bit) {
            $found += ("🚫 " + $RISK_FLAGS[$bit])
        }
    }
    return $found
}

function Run-AegisScenario([string]$Name, [string]$Token, [string]$Price, [string]$Info) {
    Write-Host "`n"
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host " 🎬 SCENARIO: $Name" -ForegroundColor Cyan -NoNewline
    Write-Host " ($Info)" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Gray

    # -- PHASE 1 --
    Write-Host "`n[PHASE 1] 🔒 Inherent Security: Capital Escrow" -ForegroundColor Yellow
    Write-Host "   -> User initiates swap for asset: $Token" -ForegroundColor Gray
    
    $AMT = "1000000000000000000"
    $init = & $castPath send $CONTRACT_ADDRESS "swap(address,uint256)" $Token $AMT --value $AMT --private-key $USER_PRIVATE_KEY --rpc-url http://localhost:8545 --json | ConvertFrom-Json
    $txHash = $init.transactionHash
    
    Start-Sleep -Seconds 1
    $rec = & $castPath receipt $txHash --rpc-url http://localhost:8545 --json | ConvertFrom-Json
    $id = $rec.logs[0].topics[1]
    
    Write-Host "   -> AegisVault locked 1.0 ETH in sovereign escrow." -ForegroundColor Green
    Write-Host "   -> Request ID: $($id.Substring(0,18))..." -ForegroundColor Gray

    # -- PHASE 2 --
    Write-Host "`n[PHASE 2] 🧠 Autonomous Audit: Chainlink DON Logic" -ForegroundColor Yellow
    Write-Host "   -> Triggering Forensic AI scan across Tri-Vector Matrix..." -ForegroundColor Gray
    
    $payloadText = @"
{"tokenAddress":"$Token","chainId":"31337","askingPrice":"$Price"}
"@
    
    $full = docker exec aegis_dev cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload $payloadText 2>&1
    $raw = ($full | Out-String)

    $startTag = "::AEGIS_RESULT::"
    $startIdx = $raw.IndexOf($startTag)
    if ($startIdx -ge 0) {
        $jStr = $raw.Substring($startIdx + $startTag.Length)
        $endIdx = $jStr.IndexOf($startTag)
        if ($endIdx -ge 0) {
            $jStr = $jStr.Substring(0, $endIdx).Trim()
            $jStr = $jStr.Replace('\"', '"')
            $res = $jStr | ConvertFrom-Json
            $hex = $res.riskCodeHex
            $code = [int]$res.riskCode
        } else {
            Write-Host "   X Result Capture Error" -ForegroundColor Red
            return
        }
    } else {
        Write-Host "   X AI Analysis Failed" -ForegroundColor Red
        return
    }

    Write-Host "   -> AI Synthesis Complete." -ForegroundColor Cyan
    Write-Host "   -> AI Reasoning: $($res.reasoning)" -ForegroundColor DarkCyan
    
    $flags = Decode-RiskCode $code
    foreach ($f in $flags) {
        if ($code -eq 0) { Write-Host "   $f" -ForegroundColor Green }
        else { Write-Host "   $f" -ForegroundColor Red }
    }

    # -- PHASE 3 --
    Write-Host "`n[PHASE 3] 🛡️ Decisive Enforcement" -ForegroundColor Yellow
    Write-Host "   -> Sovereign Executor evaluating DON verdict..." -ForegroundColor Gray
    Start-Sleep -Seconds 1

    $fTx = & $castPath send $CONTRACT_ADDRESS "fulfillRequest(bytes32,bytes,bytes)" $id $hex "0x" --private-key $USER_PRIVATE_KEY --rpc-url http://localhost:8545 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        if ($code -eq 0) { Write-Host "   🏆 SETTLED: Capital released. Integrity verified." -ForegroundColor Green }
        else { Write-Host "   🏆 PROTECTED: Trade blocked. Capital autonomously returned." -ForegroundColor Red }
    } else {
        Write-Host "   X Enforcement Failed." -ForegroundColor Red
    }
}

# --- MAIN ---
Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "    🛡️  AEGIS: THE SOVEREIGN DEFI EXECUTOR  🛡️ " -ForegroundColor Cyan
Write-Host "           Chainlink Convergence Hackathon 2026" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

Run-AegisScenario "TRUSTED SWAP" "0x4200000000000000000000000000000000000006" "2100.00" "WETH on Base Network"
Start-Sleep -Seconds 1
Run-AegisScenario "PROTECTED ATTACK" "0xBAD0000000000000000000000000000000000066" "99999.00" "Volatility spike + Centralized Trace"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "   🏁 DEMO COMPLETE: Aegis ensures trustless execution." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
