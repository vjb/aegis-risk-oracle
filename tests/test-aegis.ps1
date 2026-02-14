# Aegis Risk Oracle - Unified Demo Suite (Verbose Edition)
# This script is optimized for video demonstration, showing every detail.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Global variable to store the last JSON result
$GLOBAL:LastJsonResult = $null

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          [AEGIS] PROTOCOL: MISSION CONTROL (v2.0)" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Showcasing: Split-Brain Consensus (Logic + Multi-Model AI)" -ForegroundColor White
Write-Host "================================================================" -ForegroundColor Cyan

# Function to run a single test scenario
function Run-Test($ScenarioName, $PayloadFile, $ExpectedNote, $Color = "Cyan") {
    Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor $Color
    Write-Host "│ [SCENARIO] $ScenarioName" -ForegroundColor $Color
    Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor $Color
    
    # Use sh -c for robust Docker execution
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
                $message = $Matches[2] 
            }

            # 2. Skip SDK Noise
            if ($message -match "Added experimental chain" -or 
                $message -match "Warning: using default private key" -or
                $message -match "Workflow compiled" -or
                $message -match "Created HTTP trigger" -or
                $message -match "Skipping WorkflowEngineV2" -or
                $message -match '^".*"$' -or 
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
            
            # [LOGIC] Parsing (LEFT BRAIN)
            if ($message -match '^\[LOGIC\]\s+(.*)$') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "[LOGIC] " -NoNewline -ForegroundColor Magenta
                $content = $Matches[1]
                if ($content -match 'LEFT BRAIN') { Write-Host "$content" -ForegroundColor Magenta }
                elseif ($content -match 'FLAG:') { Write-Host "$content" -ForegroundColor Red }
                elseif ($content -match 'Risk Score') { Write-Host "$content" -ForegroundColor Yellow }
                else { Write-Host "$content" -ForegroundColor Gray }
                return
            }

            # [AI] Parsing (RIGHT BRAIN)
            if ($message -match '^\[AI\]\s+(.*)$') {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "[AI] " -NoNewline -ForegroundColor Yellow
                $content = $Matches[1]
                if ($content -match 'RIGHT BRAIN|CLUSTER') { Write-Host "$content" -ForegroundColor Cyan }
                elseif ($content -match 'OpenAI|Gemini|Groq') { 
                    if ($content -match 'Success') { Write-Host "$content" -ForegroundColor Green }
                    else { Write-Host "$content" -ForegroundColor Red }
                }
                elseif ($content -match 'FINAL_VERDICT') { Write-Host "$content" -ForegroundColor Yellow }
                else { Write-Host "$content" -ForegroundColor White }
                return
            }
            
            # Fallback
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
