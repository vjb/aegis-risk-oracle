# Aegis Risk Oracle - Unified Demo Suite (Verbose Edition)
# This script is optimized for video demonstration, showing every detail.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Global variable to store the last JSON result
$GLOBAL:LastJsonResult = $null

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          [AEGIS] PROTOCOL: MISSION CONTROL (v2.0)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Showcasing: AI Synthesis, IPFS Archiving, and Multi-Lock Signing" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan

# Function to run a single test scenario
function Run-Test($ScenarioName, $PayloadFile, $ExpectedNote, $Color = "Cyan") {
    Write-Host "`n--------------------------------------------------------------" -ForegroundColor $Color
    Write-Host "[SCENARIO] $ScenarioName" -ForegroundColor $Color
    Write-Host "--------------------------------------------------------------" -ForegroundColor $Color
    
    $cmd = "cd /app && cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload $PayloadFile"
    
    $inAuditBody = $false
    
    docker exec aegis_dev sh -c "$cmd" 2>&1 | ForEach-Object {
        $rawLine = $_.ToString()
        $line = $rawLine.Trim()
        
        # Skip SDK noise
        if ($line -match "Added experimental chain" -or 
            $line -match "Warning: using default private key" -or
            $line -match "Workflow compiled" -or
            $line -match "Created HTTP trigger" -or
            $line -match 'msg="context canceled"' -or
            $line -match "Skipping WorkflowEngineV2" -or
            $line -match "Workflow Simulation Result:" -or
            $line -match "Analysis Complete:" -or
            $line -match "Analysis results match" -or
            [string]::IsNullOrWhiteSpace($line)) {
            return
        }

        # Strip ANSI escape sequences and technical metadata for clean processing
        $cleanLine = ($rawLine -replace "\x1b\[[0-9;]*m", "").Trim()
        $cleanLine = $cleanLine -replace '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\s+\[USER LOG\]\s*', ''

        # 1. State Machine for Multiline AI Audit Text (The "Big Story")
        if ($cleanLine -match "BEGIN AI RISK AUDIT") {
            $inAuditBody = $true
            Write-Host "   $cleanLine" -ForegroundColor White
            return
        }
        
        if ($cleanLine -match "END AI RISK AUDIT") {
            $inAuditBody = $false
            Write-Host "   $cleanLine" -ForegroundColor White
            return
        }

        if ($inAuditBody) {
            Write-Host "      $cleanLine" -ForegroundColor Yellow
            return
        }

        # 2. General Highlighting
        if ($cleanLine -match "VERDICT:") {
            if ($cleanLine -match "EXECUTE") { Write-Host $rawLine -ForegroundColor Green }
            else { Write-Host $rawLine -ForegroundColor Red }
        }
        elseif ($line -match "INPUT RECEIVED|PROTECTION ACTIVE") { Write-Host $rawLine -ForegroundColor Cyan }
        elseif ($line -match "DATA ACQUISITION|AI SYNTHESIS|COMPLIANCE ARCHIVE|CRYPTOGRAPHIC TRIPLE-LOCK") { Write-Host $rawLine -ForegroundColor Cyan }
        elseif ($line -match "Fetch|Send|Ping") { Write-Host $rawLine -ForegroundColor Gray }
        elseif ($line -match "Resolved|Scan") { Write-Host $rawLine -ForegroundColor Green }
        elseif ($line -match "Success|Audit Pinned") { Write-Host $rawLine -ForegroundColor Green }
        elseif ($line -match "Fallback|Warning|Error") { Write-Host $rawLine -ForegroundColor Red }
        elseif ($line -match "Signing Payload|DON SIGNATURE|Hash|Salt|Price|User") { Write-Host $rawLine -ForegroundColor White }
        else { Write-Host $rawLine }
    }
}

# --- RUN WORKFLOW SCENARIOS ---
Run-Test "Pass Scenario (WETH on Base)" "/app/tests/payloads/test-payload-pass.json" "EXECUTE - Trusted Asset" "Green"
Run-Test "Safety Fail (Honeypot on BSC)" "/app/tests/payloads/test-payload-honeypot.json" "REJECT - Critical Threat" "Red"
Run-Test "Economic Fail (Price Manipulation)" "/app/tests/payloads/test-payload-manipulation.json" "REJECT - Market Risk" "Magenta"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "   ANALYSIS SUITE COMPLETE" -ForegroundColor Cyan
Write-Host "   Mission Control Status: VERIFIED" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
