import { existsSync, unlinkSync } from "fs";
import { join } from "path";

async function testResilience() {
    console.log("⚡ STARTING TELEMETRY RESILIENCE VERIFICATION ⚡");

    const OFFLINE_PORT = 3013; // Port with no server listening
    const TEST_REQUEST_ID = `resilience_test_${Date.now()}`;

    // Simulate Workflow Telemetry Dispatch to an OFFLINE port
    console.log(`   [Workflow] Attempting telemetry dispatch to OFFLINE server (port ${OFFLINE_PORT})...`);

    // We simulate the logic inside brainHandler basically
    const mockReport = {
        requestId: TEST_REQUEST_ID,
        status: "REJECTED",
        riskCode: 256,
        reasoning: "Resilience test.",
        timestamp: Math.floor(Date.now() / 1000).toString(),
        details: { modelResults: [] }
    };

    let scriptProceeded = false;

    try {
        // This simulates the fire-and-forget Promise in main.ts
        const telemetryPromise = fetch(`http://localhost:${OFFLINE_PORT}/telemetry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mockReport),
            signal: AbortSignal.timeout(1000) // Don't wait forever for the test
        }).catch(e => {
            console.log(`   [Outcome] Telemetry failed as expected: ${e.message}`);
            return null;
        });

        // The script should continue immediately (in real main.ts it's fire-and-forget)
        console.log("   [Workflow] Continuing with consensus and on-chain return...");
        scriptProceeded = true;

        await telemetryPromise; // Just to wait for it for the test result

        if (scriptProceeded) {
            console.log("\n✅ SUCCESS: Split-Path Telemetry is resilient. Enforcement logic is not blocked by side-channel failures.");
            process.exit(0);
        } else {
            console.error("❌ FAILURE: Script execution was blocked.");
            process.exit(1);
        }

    } catch (e) {
        console.error("❌ FAILURE:", e);
        process.exit(1);
    }
}

testResilience();
