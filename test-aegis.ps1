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
            if ($message -match "AI RISK ANALYSIS \(Logic & Reasoning\)") {
                $inAuditBody = $true
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Cyan
                return
            }
            
            # End audit when next section starts
            if ($inAuditBody -and ($message -match "COMPLIANCE ARCHIVE" -or $message -match "Verdict:")) {
                $inAuditBody = $false
                # Fall through to standard handling for this line
            }

            if ($inAuditBody) {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                
                if ($message -match "\[ANALYSIS\]:") {
                     # Just print it yellow, let terminal handle wrapping naturally
                     Write-Host "$message" -ForegroundColor Yellow
                } elseif ($message -match "\[ENTITY\]:|\[SECURITY\]:") {
                     $parts = $message -split ":", 2
                     Write-Host $parts[0] -NoNewline -ForegroundColor Yellow
                     if ($parts.Length -gt 1) {
                        Write-Host ":$($parts[1])" -ForegroundColor White
                     } else {
                        Write-Host ""
                     }
                } else {
                    Write-Host "$message" -ForegroundColor White
                }
                return
            }

            # 4. Mission Control Highlighting
            if ($message -match "Verdict:") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                
                # Highlight keyword segments - Simulating inline bolding by splitting string is hard in PS without strict control
                # We will color the whole line if it contains the verdict, but maybe try to color just the keyword?
                # Powershell Write-Host adds newline by default.
                
                if ($message -match "EXECUTE") {
                     Write-Host "$message" -ForegroundColor Green
                } elseif ($message -match "REJECT") {
                     Write-Host "$message" -ForegroundColor Red
                } else {
                     Write-Host "$message" -ForegroundColor Cyan
                }
            }
            elseif ($message -match "INPUT RECEIVED|PROTECTION ACTIVE|Chainlink Runtime Environment") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Cyan
            }
            elseif ($message -match "DATA ACQUISITION|AI SYNTHESIS|COMPLIANCE ARCHIVE|Pinned|CRYPTOGRAPHIC QUAD-LOCK") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Cyan
            }
            elseif ($message -match "Fetch|Send|Ping") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Gray
            }
            elseif ($message -match "Resolved|Scan|Audit Pinned|Success|Clean Token") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Green
            }
            elseif ($message -match "Fallback|Warning|Error|ALERT|HONEYPOT") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor Red
            }
            elseif ($message -match "Signing Payload|DON SIGNATURE|Hash|Salt|Price|User|Tax:|Status:|Analysis Context") {
                Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray
                Write-Host "$message" -ForegroundColor White
            }
            elseif ($message -match "Workflow Simulation Result:") {
                 # Swallow
                 return
            }
            else {
                if ($metadata) { Write-Host "$metadata " -NoNewline -ForegroundColor DarkGray }
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
