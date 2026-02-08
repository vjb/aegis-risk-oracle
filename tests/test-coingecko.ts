#!/usr/bin/env bun
/**
 * CoinGecko API Test Script
 * Usage: bun run test-coingecko.ts [coin-id]
 * Example: bun run test-coingecko.ts ethereum
 */

const COIN_ID = process.argv[2] || "ethereum";

async function testCoinGecko(): Promise<void> {
    console.log(`\n🪙 Testing CoinGecko API`);
    console.log(`📝 Coin: ${COIN_ID}\n`);
    console.log("━".repeat(60));

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_ID}&vs_currencies=usd&include_24hr_change=true`;

    console.log(`\n🔗 URL: ${url}\n`);

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`❌ API Error (${response.status}): ${error}`);
        process.exit(1);
    }

    const data = await response.json() as any;

    console.log(`💰 Response:\n`);
    console.log(JSON.stringify(data, null, 2));

    if (data[COIN_ID]) {
        console.log("\n" + "━".repeat(60));
        console.log(`✅ ${COIN_ID.toUpperCase()} Price: $${data[COIN_ID].usd}`);
        console.log(`📈 24h Change: ${data[COIN_ID].usd_24h_change?.toFixed(2)}%`);
    }
}

testCoinGecko().catch(console.error);
