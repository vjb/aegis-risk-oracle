#!/usr/bin/env bun
/**
 * ANU QRNG (Quantum Random Number Generator) API Test Script
 * Usage: bun run test-qrng.ts [length]
 * Example: bun run test-qrng.ts 32
 */

const LENGTH = parseInt(process.argv[2] || "32", 10);

async function testQRNG(): Promise<void> {
    console.log(`\n🎲 Testing ANU QRNG API`);
    console.log(`📝 Requesting ${LENGTH} random bytes\n`);
    console.log("━".repeat(60));

    const url = `https://qrng.anu.edu.au/API/jsonI.php?length=${LENGTH}&type=hex16&size=1`;

    console.log(`\n🔗 URL: ${url}\n`);

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error(`❌ API Error (${response.status}): ${error}`);
            console.log("\n⚠️  Note: QRNG API may have rate limits or require specific conditions");
            process.exit(1);
        }

        const data = await response.json() as any;

        console.log(`🔮 Response:\n`);
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log("\n" + "━".repeat(60));
            console.log(`✅ Success!`);
            console.log(`🎲 Quantum Random Hex: ${data.data?.[0] || "N/A"}`);
            console.log(`📊 Type: ${data.type}`);
            console.log(`📏 Length: ${data.length}`);
        } else {
            console.log(`\n⚠️  API returned success=false`);
        }
    } catch (error: any) {
        console.error(`❌ Request failed: ${error.message}`);
        console.log("\n⚠️  QRNG API may be unavailable or rate-limited");
        console.log("   The Aegis workflow uses a fallback when this happens");
    }
}

testQRNG().catch(console.error);
