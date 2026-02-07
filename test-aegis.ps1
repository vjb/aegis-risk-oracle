# Aegis Risk Oracle - Test Suite (Video Ready)
# This script runs all test scenarios and filters out SDK noise for a clean demo video.

# Force UTF-8 for proper emoji rendering in PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🛡️  AEGIS RISK ORACLE - TEST SUITE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Global variable to store the last JSON result
$GLOBAL:LastJsonResult = $null

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
            [string]::IsNullOrWhiteSpace($line)) {
            return
        }

        # Capture JSON result (it looks like a JSON string with tokenAddress)
        if ($line -match '^\s*"\{.*tokenAddress.*\}"') {
            # Extract the raw JSON string (remove surrounding quotes and escape characters)
            $jsonStr = $line.Trim('"')
            $GLOBAL:LastJsonResult = $jsonStr
            return # Don't print the raw JSON
        }

        # Format and Colorize logic - High Priority Words First
        if ($line -match "REJECT") {
            Write-Host $rawLine -ForegroundColor Red -NoNewline; Write-Host ""
        } elseif ($line -match "EXECUTE") {
            Write-Host $rawLine -ForegroundColor Green -NoNewline; Write-Host ""
        } elseif ($line -match "VERIFIED: Signer matches DON") {
            Write-Host $rawLine -ForegroundColor Green -NoNewline; Write-Host ""
        } elseif ($line -match "VERIFIED: SIGNATURE INVALID") {
            Write-Host $rawLine -ForegroundColor Red -NoNewline; Write-Host ""
        } elseif ($line -match "\[AEGIS\]" -or $line -match "\[PRICE\]" -or $line -match "\[ENTROPY\]") {
            Write-Host $rawLine -ForegroundColor Cyan -NoNewline; Write-Host ""
        } elseif ($line -match "✓") {
            Write-Host $rawLine -ForegroundColor Cyan -NoNewline; Write-Host ""
        } elseif ($line -match "⚠️" -or $line -match "🤖" -or $line -match "❌") {
            Write-Host $rawLine -ForegroundColor Yellow -NoNewline; Write-Host ""
        } elseif ($line -match "📝" -or $rawLine.StartsWith("   ")) {
            Write-Host $rawLine -ForegroundColor White -NoNewline; Write-Host ""
        } else {
            Write-Host $rawLine -NoNewline; Write-Host ""
        }
    }

    Write-Host "`n✅ Expected: $ExpectedNote" -ForegroundColor Gray
}

# Run All Scenarios
Run-Test "TEST 1: PASS Scenario (WETH on Base, fair price)" "/app/test-payload-pass.json" "EXECUTE with risk_score < 7" "Green"
$validPayload = $GLOBAL:LastJsonResult

Run-Test "TEST 2: FAIL Scenario (Critical Honeypot on BSC)" "/app/test-payload-honeypot.json" "REJECT - critical safety failure" "Red"
Run-Test "TEST 3: FAIL Scenario (WETH Price Manipulation)" "/app/test-payload-manipulation.json" "REJECT - high price deviation" "Magenta"
Run-Test "TEST 4: FAIL Scenario (SUS-TOKEN Composite Risk)" "/app/test-payload-suspicious.json" "REJECT - multiple risk factors" "Yellow"
Run-Test "TEST 5: FAIL Scenario (Invalid Payload)" "/app/test-payload-invalid.json" "Validation error & REJECT" "Gray"

# ════════════════════════════════════════════════════════════════
# 🛡️ CRYPTO PROTECTION DEMO (Tamper Detection)
# ════════════════════════════════════════════════════════════════
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🛡️  TAMPER DETECTION DEMO (Cryptographic Protection)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Goal: Show that modifying signed data (e.g. Price) breaks the signature."

if ($validPayload) {
    # 1. Verify the original valid payload
    Write-Host "`n[1/2] Verifying original approval from Test 1..." -ForegroundColor Gray
    bun aegis-workflow/verify-signature.ts "'$validPayload'"

    # 2. Tamper with the price in the payload
    # Note: We use a regex replace to catch whatever the actual price was
    $tamperedPayload = $validPayload -replace '"askingPrice":"[0-9.]+"', '"askingPrice":"9999.00"'
    
    Write-Host "[2/2] Attempting to increase price to `$9999.00 after signing..." -ForegroundColor Yellow
    Write-Host "      (Changing payload data while keeping original signature)" -ForegroundColor Gray
    
    bun aegis-workflow/verify-signature.ts "'$tamperedPayload'"
} else {
    Write-Host "❌ Could not capture valid payload for demo." -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ ALL TESTS COMPLETE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
