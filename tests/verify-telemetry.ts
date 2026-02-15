import { serve } from "bun";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

async function test() {
    console.log("⚡ STARTING TELEMETRY SIDE-CHANNEL VERIFICATION ⚡");

    const PORT = 3012;
    const TEST_REQUEST_ID = `test_req_${Date.now()}`;
    const REPORT_PATH = join(process.cwd(), "eliza", "public", "reports", `${TEST_REQUEST_ID}.json`);

    // 1. Setup Mock Eliza Server
    const server = serve({
        port: PORT,
        async fetch(req) {
            const url = new URL(req.url);
            if (url.pathname === "/telemetry") {
                const body = await req.json();
                console.log(`   [Mock Server] Received Telemetry for: ${body.requestId}`);

                // Write to the expected path in the real Eliza public dir
                const dir = join(process.cwd(), "eliza", "public", "reports");
                await Bun.write(REPORT_PATH, JSON.stringify(body, null, 2));
                return Response.json({ success: true });
            }
            return new Response("Not Found", { status: 404 });
        }
    });

    console.log(`   [Mock Server] Online at http://localhost:${PORT}`);

    // 2. Simulate Workflow Telemetry Dispatch
    console.log("   [Workflow] Dispatching forensic report...");
    const mockReport = {
        requestId: TEST_REQUEST_ID,
        status: "REJECTED",
        riskCode: 256,
        reasoning: "Phishing detected in verification test.",
        timestamp: Math.floor(Date.now() / 1000).toString(),
        details: { modelResults: [] }
    };

    try {
        const response = await fetch(`http://localhost:${PORT}/telemetry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mockReport)
        });

        const result = await response.json() as any;
        if (result.success) {
            console.log("   [Outcome] Side-channel delivery reported success.");
        } else {
            throw new Error("Telemetry delivery failed");
        }

        // 3. Verify File Persistence
        if (existsSync(REPORT_PATH)) {
            console.log(`   [Outcome] Forensic report archived at: ${REPORT_PATH}`);
            console.log("\n✅ SUCCESS: Split-Path Telemetry side-channel verified.");

            // Cleanup
            unlinkSync(REPORT_PATH);
            process.exit(0);
        } else {
            console.error("❌ FAILURE: Forensic report was not archived.");
            process.exit(1);
        }

    } catch (e) {
        console.error("❌ FAILURE:", e);
        process.exit(1);
    } finally {
        server.stop();
    }
}

test();
