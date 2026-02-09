#!/usr/bin/env bun
/**
 * CoinGecko API Test Script
 * Usage: bun run test-coingecko.ts [coin-id]
 * Example: bun run test-coingecko.ts ethereum
 */

import { config } from "dotenv";
config();

export interface TestResult {
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
    detail: string;
    latency: number;
}

export async function checkCoinGecko(
    coinId: string,
    apiKey: string | undefined,
    verbose: boolean = false
): Promise<TestResult> {
    const start = Date.now();

    if (verbose) {
        console.log(`\n🪙 Testing CoinGecko API`);
        console.log(`📝 Coin: ${coinId}\n`);
        console.log("━".repeat(60));
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;

    if (verbose) console.log(`\n🔗 URL: ${url}\n`);

    const headers: Record<string, string> = {
        "Accept": "application/json"
    };

    if (apiKey) {
        headers["x-cg-demo-api-key"] = apiKey;
        if (verbose) console.log("🔑 Using API Key auth");
    } else {
        if (verbose) console.log("⚠️  No API Key found in .env (COINGECKO_API_KEY)");
    }

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            const error = await response.text();
            if (verbose) console.error(`❌ API Error (${response.status}): ${error}`);
            return {
                status: "❌ FAIL",
                detail: `HTTP ${response.status}`,
                latency: Date.now() - start
            };
        }

        const data = await response.json() as any;

        if (verbose) {
            console.log(`💰 Response:\n`);
            console.log(JSON.stringify(data, null, 2));
        }

        if (data[coinId]) {
            if (verbose) {
                console.log("\n" + "━".repeat(60));
                console.log(`✅ ${coinId.toUpperCase()} Price: $${data[coinId].usd}`);
                console.log(`📈 24h Change: ${data[coinId].usd_24h_change?.toFixed(2)}%`);
            }
            return {
                status: "✅ PASS",
                detail: `ETH: $${data[coinId].usd}`,
                latency: Date.now() - start
            };
        } else {
            return { status: "⚠️ SKIP", detail: "Coin data not found", latency: Date.now() - start };
        }
    } catch (error: any) {
        if (verbose) console.error(error);
        return {
            status: "❌ FAIL",
            detail: error.message,
            latency: Date.now() - start
        };
    }
}

if (import.meta.main) {
    const COIN_ID = process.argv[2] || "ethereum";
    const API_KEY = process.env.COINGECKO_API_KEY;

    checkCoinGecko(COIN_ID, API_KEY, true).catch(console.error);
}
