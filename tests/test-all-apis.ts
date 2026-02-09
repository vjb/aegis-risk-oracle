import { checkOpenAI } from "./test-openai";
import { checkCoinGecko } from "./test-coingecko";
import { checkGoPlus } from "./test-goplus";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const GOPLUS_APP_KEY = process.env.GOPLUS_APP_KEY;
const GOPLUS_APP_SECRET = process.env.GOPLUS_APP_SECRET;

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
    }
};

// Unified result type compatible with all
interface TestResult {
    name: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
    detail: string;
    latency: number;
}

async function runAllTests(): Promise<void> {
    console.log("\n════════════════════════════════════════════════════════════════");
    console.log("    🛡️  AEGIS API HEALTH CHECK");
    console.log("════════════════════════════════════════════════════════════════\n");

    console.log("Testing all external APIs used by Aegis workflow...\n");
    console.log("(Detailed logs hidden, use standalone scripts for verbose output)\n");

    // Run all tests in parallel
    const [openaiRes, coingeckoRes, goplusRes] = await Promise.all([
        checkOpenAI(OPENAI_API_KEY, CONFIG.openai.model, CONFIG.openai.prompt, false),
        checkCoinGecko(CONFIG.coingecko.coin, COINGECKO_API_KEY, false),
        checkGoPlus(CONFIG.goplus.token, CONFIG.goplus.chain, GOPLUS_APP_KEY, GOPLUS_APP_SECRET, false)
    ]);

    const results: TestResult[] = [
        { name: "OpenAI GPT-4o-mini", ...openaiRes },
        { name: "CoinGecko Price", ...coingeckoRes },
        { name: "GoPlus Security", ...goplusRes }
    ];

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
