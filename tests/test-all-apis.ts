#!/usr/bin/env bun
/**
 * Aegis API Health Check - Tests all external APIs
 * Usage: bun run test-all-apis.ts
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Bun.env.OPENAI_API_KEY;

// Test configuration
const CONFIG = {
    openai: {
        model: "gpt-4o-mini",
        prompt: "Reply with only: 'API OK'"
    },
    coingecko: {
        coin: "ethereum"
    },
    goplus: {
        token: "0x4200000000000000000000000000000000000006",
        chain: "8453"
    },
    qrng: {
        length: 16
    }
};

interface TestResult {
    name: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
    detail: string;
    latency: number;
}

const results: TestResult[] = [];

async function testOpenAI(): Promise<TestResult> {
    const start = Date.now();
    const name = "OpenAI GPT-4o-mini";

    if (!OPENAI_API_KEY) {
        return { name, status: "⚠️ SKIP", detail: "OPENAI_API_KEY not set", latency: 0 };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.openai.model,
                messages: [{ role: "user", content: CONFIG.openai.prompt }],
                max_tokens: 10
            })
        });

        if (!response.ok) {
            return { name, status: "❌ FAIL", detail: `HTTP ${response.status}`, latency: Date.now() - start };
        }

        const data = await response.json() as any;
        return {
            name,
            status: "✅ PASS",
            detail: `Model: ${data.model}`,
            latency: Date.now() - start
        };
    } catch (error: any) {
        return { name, status: "❌ FAIL", detail: error.message, latency: Date.now() - start };
    }
}

async function testCoinGecko(): Promise<TestResult> {
    const start = Date.now();
    const name = "CoinGecko Price";

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${CONFIG.coingecko.coin}&vs_currencies=usd`
        );

        if (!response.ok) {
            return { name, status: "❌ FAIL", detail: `HTTP ${response.status}`, latency: Date.now() - start };
        }

        const data = await response.json() as any;
        const price = data[CONFIG.coingecko.coin]?.usd;

        return {
            name,
            status: "✅ PASS",
            detail: `ETH: $${price?.toFixed(2)}`,
            latency: Date.now() - start
        };
    } catch (error: any) {
        return { name, status: "❌ FAIL", detail: error.message, latency: Date.now() - start };
    }
}

async function testGoPlus(): Promise<TestResult> {
    const start = Date.now();
    const name = "GoPlus Security";

    try {
        const response = await fetch(
            `https://api.gopluslabs.io/api/v1/token_security/${CONFIG.goplus.chain}?contract_addresses=${CONFIG.goplus.token}`
        );

        if (!response.ok) {
            return { name, status: "❌ FAIL", detail: `HTTP ${response.status}`, latency: Date.now() - start };
        }

        const data = await response.json() as any;
        const tokenData = data.result?.[CONFIG.goplus.token.toLowerCase()];

        if (tokenData) {
            const honeypot = tokenData.is_honeypot === "1" ? "⚠️ Yes" : "No";
            return {
                name,
                status: "✅ PASS",
                detail: `Honeypot: ${honeypot}`,
                latency: Date.now() - start
            };
        } else {
            return { name, status: "⚠️ SKIP", detail: "No token data", latency: Date.now() - start };
        }
    } catch (error: any) {
        return { name, status: "❌ FAIL", detail: error.message, latency: Date.now() - start };
    }
}

async function testQRNG(): Promise<TestResult> {
    const start = Date.now();
    const name = "ANU QRNG";

    try {
        const response = await fetch(
            `https://qrng.anu.edu.au/API/jsonI.php?length=${CONFIG.qrng.length}&type=hex16&size=1`
        );

        if (!response.ok) {
            return { name, status: "❌ FAIL", detail: `HTTP ${response.status}`, latency: Date.now() - start };
        }

        const data = await response.json() as any;

        if (data.success) {
            const hex = data.data?.[0]?.substring(0, 16) + "...";
            return {
                name,
                status: "✅ PASS",
                detail: `Hex: ${hex}`,
                latency: Date.now() - start
            };
        } else {
            return { name, status: "❌ FAIL", detail: "API returned false", latency: Date.now() - start };
        }
    } catch (error: any) {
        return { name, status: "⚠️ SKIP", detail: "Rate limited or unavailable", latency: Date.now() - start };
    }
}

async function runAllTests(): Promise<void> {
    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("    🛡️  AEGIS API HEALTH CHECK");
    console.log("════════════════════════════════════════════════════════════════\n");

    console.log("Testing all external APIs used by Aegis workflow...\n");

    // Run all tests in parallel
    const [openai, coingecko, goplus, qrng] = await Promise.all([
        testOpenAI(),
        testCoinGecko(),
        testGoPlus(),
        testQRNG()
    ]);

    results.push(openai, coingecko, goplus, qrng);

    // Display results
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  API                    Status      Detail              Latency");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for (const r of results) {
        const name = r.name.padEnd(20);
        const status = r.status.padEnd(12);
        const detail = r.detail.substring(0, 18).padEnd(18);
        const latency = `${r.latency}ms`;
        console.log(`  ${name} ${status} ${detail} ${latency}`);
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const passed = results.filter(r => r.status === "✅ PASS").length;
    const failed = results.filter(r => r.status === "❌ FAIL").length;
    const skipped = results.filter(r => r.status === "⚠️ SKIP").length;

    console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
}

runAllTests().catch(console.error);
