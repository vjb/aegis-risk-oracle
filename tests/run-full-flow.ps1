# Aegis End-To-End "Hollywood" Demo Script
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

# ═══════════════════════════════════════════════════════════════════════════════
# 🏆 TENDERLY VIRTUAL TESTNETS INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════
if ($env:TENDERLY_RPC_URL) {
    $RPC_URL = $env:TENDERLY_RPC_URL
} else {
    $RPC_URL = "http://localhost:8545"
}

$castPath = "cast"
$CONTRACT_ADDRESS = "0x1F807a431614756A6866DAd9607ca62e2542ab01"
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
    if ($code -eq 0) { return @("VERIFIED SAFE") }
    $found = @()
    foreach ($bit in $RISK_FLAGS.Keys | Sort-Object) {
        if (($code -band $bit) -eq $bit) {
            $found += ("BLOCKED: " + $RISK_FLAGS[$bit])
        }
    }
    return $found
}

function Run-AegisScenario([string]$Name, [string]$Token, [string]$Price, [string]$Info) {
    Write-Host "`n"
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host " SCENARIO: $Name" -ForegroundColor Cyan -NoNewline
    Write-Host " ($Info)" -ForegroundColor Gray
    Write-Host "================================================================" -ForegroundColor Gray

    # -- PHASE 1 --
    Write-Host "`n[PHASE 1] Inherent Security: Capital Escrow" -ForegroundColor Yellow
    Write-Host "   -> User initiates swap for asset: $Token" -ForegroundColor Gray
    
    $AMT = "1000000000000000000"
    $init = & $castPath send $CONTRACT_ADDRESS "swap(address,uint256)" $Token $AMT --value $AMT --private-key $USER_PRIVATE_KEY --rpc-url $RPC_URL --json | ConvertFrom-Json
    $txHash = $init.transactionHash
    
    Start-Sleep -Seconds 1
    $rec = & $castPath receipt $txHash --rpc-url $RPC_URL --json | ConvertFrom-Json
    
    # Filter logs to find AegisVault event (ignoring MockVRF events)
    $id = $null
    if ($rec.logs) {
        foreach ($log in $rec.logs) {
            if ($log.address -eq $CONTRACT_ADDRESS -or $log.address -eq $CONTRACT_ADDRESS.ToLower()) {
                $id = $log.topics[1]
                break
            }
        }
    }

    if (-not $id) {
        Write-Host "   X Failed to capture Request ID" -ForegroundColor Red
        return
    }
    
    Write-Host "   -> AegisVault locked 1.0 ETH in sovereign escrow." -ForegroundColor Green
    Write-Host "   -> Request ID: $($id.Substring(0,18))..." -ForegroundColor Gray

    # -- PHASE 2 --
    Write-Host "`n[PHASE 2] Autonomous Audit: Chainlink DON Logic" -ForegroundColor Yellow
    Write-Host "   -> Triggering Forensic AI scan via Docker..." -ForegroundColor Gray
    
    # Strategy: Host Payload + Container Shell Execution (like test-aegis.ps1)
    $payloadObj = @{
        tokenAddress = $Token
        chainId = "31337"
        askingPrice = $Price
    }
    # Write to host file (mapped to /app/payload.json)
    $payloadObj | ConvertTo-Json -Compress | Set-Content -Path "payload.json" -Encoding UTF8

    # Command to run inside container shell
    $innerCmd = "cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload /app/payload.json"
    
    # Execute via sh -c
    $full = docker exec aegis_dev sh -c "$innerCmd" 2>&1
    
    $raw = ($full | Out-String)
    
    # Cleanup temp file
    Remove-Item "payload.json" -ErrorAction SilentlyContinue

    $startTag = "::AEGIS_RESULT::"
    $startIdx = $raw.IndexOf($startTag)
    $res = $null
    $code = 0
    $hex = "0x0000000000000000000000000000000000000000000000000000000000000000" 

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
        # Fallback if ::AEGIS_RESULT:: not found (try parsing raw JSON result if cre prints it)
        if ($raw -match "Workflow Simulation Result:\s*`"(.*)`"") {
             $jStr = $Matches[1].Replace('\"', '"')
             try {
                $res = $jStr | ConvertFrom-Json
                if ($res.riskCodeHex) {
                    $hex = $res.riskCodeHex
                    $code = [int]$res.riskCode
                }
             } catch {}
        }
        
        if (-not $res) {
             Write-Host "   X AI Analysis Failed or Timed Out" -ForegroundColor Red
             return
        }
    }

    Write-Host "   -> AI Synthesis Complete." -ForegroundColor Cyan
    if ($res.reasoning) {
        Write-Host "   -> AI Reasoning: $($res.reasoning)" -ForegroundColor DarkCyan
    }
    
    $flags = Decode-RiskCode $code
    foreach ($f in $flags) {
        if ($code -eq 0) { Write-Host "   $f" -ForegroundColor Green }
        else { Write-Host "   $f" -ForegroundColor Red }
    }

    # -- PHASE 3 --
    Write-Host "`n[PHASE 3] Decisive Enforcement" -ForegroundColor Yellow
    Write-Host "   -> Sovereign Executor evaluating DON verdict..." -ForegroundColor Gray
    Start-Sleep -Seconds 1

    $fTx = & $castPath send $CONTRACT_ADDRESS "fulfillRequest(bytes32,bytes,bytes)" $id $hex "0x" --private-key $USER_PRIVATE_KEY --rpc-url $RPC_URL 2>&1
    
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
Write-Host "    AEGIS: THE SOVEREIGN DEFI EXECUTOR" -ForegroundColor Cyan
Write-Host "    Chainlink Convergence Hackathon 2026" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Trusted Swap Scenario
Run-AegisScenario "TRUSTED SWAP" "0x4200000000000000000000000000000000000006" "2100.00" "WETH on Base Network"
Start-Sleep -Seconds 1

# Malicious Scenario
Run-AegisScenario "PROTECTED ATTACK" "0xBAD0000000000000000000000000000000000066" "99999.00" "Exploit Vector Detected"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "   DEMO COMPLETE: Aegis ensures trustless execution." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
