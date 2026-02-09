# Aegis Risk Oracle - Unified Demo Suite (Verbose Edition)
# This script is optimized for video demonstration, showing every detail.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Global variable to store the last JSON result
$GLOBAL:LastJsonResult = $null

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          [AEGIS] PROTOCOL: MISSION CONTROL (v2.0)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Showcasing: AI Synthesis, Multi-Lock Signing, and CRE v3.0" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan

# Function to run a single test scenario
function Run-Test($ScenarioName, $PayloadFile, $ExpectedNote, $Color = "Cyan") {
    Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor $Color
    Write-Host "│ [SCENARIO] $ScenarioName" -ForegroundColor $Color
    Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor $Color
    
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

            # 3. Handle Modern Tags [TAG]
            if ($message -match '^\[CRE\]\s+(.*)$') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "[CRE] " -NoNewline -ForegroundColor White
                Write-Host "$($Matches[1])" -ForegroundColor Cyan
                return
            }
            if ($message -match '^\[SIGNAL\]\s+(.*)$') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "[SIGNAL] " -NoNewline -ForegroundColor DarkGray
                $content = $Matches[1]
                
                # Check for LIVE/MOCKED status
                if ($content -match '\[LIVE\]') { 
                    Write-Host "[LIVE] " -NoNewline -ForegroundColor Green 
                    $rest = $content -replace '\[LIVE\]\s+', ''
                } elseif ($content -match '\[MOCKED\]') {
                    Write-Host "[MOCKED] " -NoNewline -ForegroundColor Yellow 
                    $rest = $content -replace '\[MOCKED\]\s+', ''
                } else {
                    $rest = $content
                }

                if ($rest -match 'DONE|OK|Success|SYNC') { Write-Host "$rest" -ForegroundColor Green }
                elseif ($rest -match 'ERR|FAIL|Interruption') { Write-Host "$rest" -ForegroundColor Red }
                elseif ($rest -match 'WARN|Fallback|Auth Denied') { Write-Host "$rest" -ForegroundColor Yellow }
                else { Write-Host "$rest" -ForegroundColor Gray }
                return
            }
            if ($message -match '^\[AI\]\s+(.*)$') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "[AI] " -NoNewline -ForegroundColor Yellow
                $content = $Matches[1]
                if ($content -match 'RESULT|VERDICT|REASONING') { Write-Host "$content" -ForegroundColor Yellow }
                elseif ($content -match 'DONE|Success') { Write-Host "$content" -ForegroundColor Green }
                elseif ($content -match 'ERR|FAIL') { Write-Host "$content" -ForegroundColor Red }
                else { Write-Host "$content" -ForegroundColor White }
                return
            }
            if ($message -match '^\[SIGNER\]\s+(.*)$') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "[SIGNER] " -NoNewline -ForegroundColor Magenta
                $content = $Matches[1]
                if ($content -match 'SIGNED|Generated') { Write-Host "$content" -ForegroundColor Green }
                else { Write-Host "$content" -ForegroundColor White }
                return
            }

            # 4. State Machine for AI Audit (Legacy support/fallback)
            if ($message -match "AI RISK ANALYSIS \(Logic & Reasoning\)") {
                $inAuditBody = $true
                $inAnalysisSection = $false
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Cyan
                return
            }
            
            if ($inAuditBody -and ($message -match "Verdict:")) {
                $inAuditBody = $false
                $inAnalysisSection = $false
            }

            if ($inAuditBody) {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                if ($message -match "\[ANALYSIS\]:") {
                     $inAnalysisSection = $true
                     Write-Host "$message" -ForegroundColor Yellow
                } elseif ($inAnalysisSection) {
                     Write-Host "$message" -ForegroundColor Yellow
                } else {
                     Write-Host "$message" -ForegroundColor White
                }
                return
            }

            # 5. Fallback Highlighting
            if ($message -match "Verdict:") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                if ($message -match "EXECUTE|APPROVED") { Write-Host "$message" -ForegroundColor Green }
                elseif ($message -match "REJECT|RISK_DETECTED") { Write-Host "$message" -ForegroundColor Red }
                else { Write-Host "$message" -ForegroundColor Cyan }
            }
            elseif ($message -match '━━━━━━|━━━') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Cyan
            }
            elseif ($message -match "Loading|Initializing|Starting") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Gray
            }
            else {
                if ($metadata) { Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray }
                if ($message -match '└─|├─') { Write-Host "$message" -ForegroundColor Gray }
                else { Write-Host "$message" }
            }
        }
}

# --- RUN WORKFLOW SCENARIOS ---
Run-Test "Pass Scenario (WETH on Base)" "/app/tests/payloads/test-payload-pass.json" "EXECUTE - Trusted Asset" "Green"
Run-Test "Safety Fail (Honeypot on BSC)" "/app/tests/payloads/test-payload-honeypot.json" "REJECT - Critical Threat" "Red"
Run-Test "Economic Fail (Price Manipulation)" "/app/tests/payloads/test-payload-manipulation.json" "REJECT - Market Risk" "Magenta"
Run-Test "Combo Fail (Amber Flags)" "/app/tests/payloads/test-payload-combo.json" "REJECT - Compounding Risks" "Yellow"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "   AUDIT SUITE EXECUTION COMPLETE" -ForegroundColor Cyan
Write-Host "   Mission Control Status: [OPERATIONAL]" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
