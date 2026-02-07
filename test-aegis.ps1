# Aegis Risk Oracle - Test Suite (Video Ready)
# This script runs all test scenarios and filters out SDK noise for a clean demo video.

# Force UTF-8 for proper emoji rendering in PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🛡️  AEGIS RISK ORACLE - TEST SUITE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Function to run a single test scenario
# It executes the CRE simulation inside the Docker container and filters/colors the output in real-time
function Run-Test($ScenarioName, $PayloadFile, $ExpectedNote, $Color = "Cyan") {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
    Write-Host "📊 $ScenarioName" -ForegroundColor $Color
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
    
    $cmd = "cd /app && cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload $PayloadFile"
    
    # Execute and stream output in real-time
    docker exec aegis_dev sh -c "$cmd" 2>&1 | ForEach-Object {
        $rawLine = $_.ToString()
        $line = $rawLine.Trim()
        
        # Skip noise
        if ($line -match "Added experimental chain" -or 
            $line -match "Warning: using default private key" -or
            $line -match "Workflow compiled" -or
            $line -match "Created HTTP trigger" -or
            $line -match 'msg="context canceled"' -or
            $line -match "Skipping WorkflowEngineV2" -or
            $line -match "Workflow Simulation Result:" -or
            $line -match "Analysis Complete:" -or
            $line -match '^\s*"\{.*tokenAddress.*\}"' -or
            [string]::IsNullOrWhiteSpace($line)) {
            return
        }

        # Format and Colorize logic - High Priority Words First
        if ($line -match "REJECT") {
            Write-Host $rawLine -ForegroundColor Red -NoNewline; Write-Host ""
        } elseif ($line -match "EXECUTE") {
            Write-Host $rawLine -ForegroundColor Green -NoNewline; Write-Host ""
        } elseif ($line -match "\[AEGIS\]" -or $line -match "\[PRICE\]" -or $line -match "\[ENTROPY\]") {
            Write-Host $rawLine -ForegroundColor Cyan -NoNewline; Write-Host ""
        } elseif ($line -match "✓" -or $line -match "✅") {
            Write-Host $rawLine -ForegroundColor Green -NoNewline; Write-Host ""
        } elseif ($line -match "⚠️" -or $line -match "🤖") {
            Write-Host $rawLine -ForegroundColor Yellow -NoNewline; Write-Host ""
        } elseif ($line -match "📝" -or $rawLine.StartsWith("   ")) {
            Write-Host $rawLine -ForegroundColor White -NoNewline; Write-Host ""
        } else {
            Write-Host $rawLine -NoNewline; Write-Host ""
        }
    }

    Write-Host "`n✅ Expected: $ExpectedNote" -ForegroundColor Yellow
}

# Run All Scenarios
Run-Test "TEST 1: PASS Scenario (WETH on Base, fair price)" "/app/test-payload-pass.json" "EXECUTE with risk_score < 7" "Green"
Run-Test "TEST 2: FAIL Scenario (Critical Honeypot on BSC)" "/app/test-payload-honeypot.json" "REJECT - critical safety failure" "Red"
Run-Test "TEST 3: FAIL Scenario (WETH Price Manipulation)" "/app/test-payload-manipulation.json" "REJECT - high price deviation" "Magenta"
Run-Test "TEST 4: FAIL Scenario (SUS-TOKEN Composite Risk)" "/app/test-payload-suspicious.json" "REJECT - multiple risk factors" "Yellow"
Run-Test "TEST 5: FAIL Scenario (Invalid Payload)" "/app/test-payload-invalid.json" "Validation error & REJECT" "Gray"

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ ALL TESTS COMPLETE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan


