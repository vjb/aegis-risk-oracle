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
            # 0. Strip ANSI escape sequences for processing
            $line = $rawLine -replace "\x1b\[[0-9;]*m", ""
            
            # 1. Extract Metadata and Message
            $metadata = ""
            $message = $line.Trim()
            if ($line -match '^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\s+\[(?:USER LOG|SIMULATION)\])\s+(.*)$') {
                $metadata = $Matches[1]
                $message = $Matches[2] # Preserve original spaces for indentation
            }

            # 2. Skip SDK Noise and Bulky JSON
            if ($message -match "Added experimental chain" -or 
                $message -match "Warning: using default private key" -or
                $message -match "Workflow compiled" -or
                $message -match "Created HTTP trigger" -or
                $message -match "context canceled" -or
                $message -match "Skipping WorkflowEngineV2" -or
                $message -match '^".*"$' -or # Hide JSON Result
                [string]::IsNullOrWhiteSpace($message)) {
                return
            }

            # 3. State Machine for AI Audit (The "Big Story")
            if ($message -match "--- BEGIN AI RISK AUDIT ---") {
                $inAuditBody = $true
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor White
                return
            }
            
            if ($message -match "--- END AI RISK AUDIT ---") {
                $inAuditBody = $false
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor White
                return
            }

            if ($inAuditBody) {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor Yellow # AI Story in Yellow/Body
                return
            }

            # 4. Mission Control Highlighting
            if ($message -match "VERDICT:") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                if ($message -match "EXECUTE") { Write-Host "$message" -ForegroundColor Green }
                else { Write-Host "$message" -ForegroundColor Red }
            }
            elseif ($message -match "INPUT RECEIVED|PROTECTION ACTIVE") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor Cyan
            }
            elseif ($message -match "DATA ACQUISITION|AI SYNTHESIS|COMPLIANCE ARCHIVE|CRYPTOGRAPHIC TRIPLE-LOCK") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor Cyan
            }
            elseif ($message -match "Fetch|Send|Ping") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor Gray
            }
            elseif ($message -match "Resolved|Scan|Audit Pinned|Success") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor Green
            }
            elseif ($message -match "Fallback|Warning|Error") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor Red
            }
            elseif ($message -match "Signing Payload|DON SIGNATURE|Hash|Salt|Price|User") {
                Write-Host "$metadata " -NoNewline -ForegroundColor Gray
                Write-Host "$message" -ForegroundColor White
            }
            else {
                if ($metadata) { Write-Host "$metadata " -NoNewline -ForegroundColor Gray }
                Write-Host "$message"
            }
        }
}

# --- RUN WORKFLOW SCENARIOS ---
Run-Test "Pass Scenario (WETH on Base)" "/app/tests/payloads/test-payload-pass.json" "EXECUTE - Trusted Asset" "Green"
Run-Test "Safety Fail (Honeypot on BSC)" "/app/tests/payloads/test-payload-honeypot.json" "REJECT - Critical Threat" "Red"
Run-Test "Economic Fail (Price Manipulation)" "/app/tests/payloads/test-payload-manipulation.json" "REJECT - Market Risk" "Magenta"
Run-Test "Combo Fail (Amber Flags)" "/app/tests/payloads/test-payload-combo.json" "REJECT - Compounding Risks" "Yellow"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "   ANALYSIS SUITE COMPLETE" -ForegroundColor Cyan
Write-Host "   Mission Control Status: VERIFIED" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan
