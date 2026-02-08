#!/usr/bin/env bun
/**
 * GoPlus Security API Test Script
 * Usage: bun run test-goplus.ts [token-address] [chain-id]
 * Example: bun run test-goplus.ts 0x4200000000000000000000000000000000000006 8453
 */

const TOKEN_ADDRESS = process.argv[2] || "0x4200000000000000000000000000000000000006"; // WETH on Base
const CHAIN_ID = process.argv[3] || "8453"; // Base

async function testGoPlus(): Promise<void> {
    console.log(`\n🔒 Testing GoPlus Security API`);
    console.log(`📝 Token: ${TOKEN_ADDRESS}`);
    console.log(`⛓️  Chain: ${CHAIN_ID}\n`);
    console.log("━".repeat(60));

    const url = `https://api.gopluslabs.io/api/v1/token_security/${CHAIN_ID}?contract_addresses=${TOKEN_ADDRESS}`;

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

    console.log(`🛡️ Response:\n`);

    const tokenData = data.result?.[TOKEN_ADDRESS.toLowerCase()];

    if (tokenData) {
        console.log("━".repeat(60));
        console.log(`✅ Token Found`);
        console.log(`🍯 Honeypot:     ${tokenData.is_honeypot === "1" ? "⚠️  YES" : "✓ No"}`);
        console.log(`📊 Buy Tax:      ${tokenData.buy_tax || "0"}%`);
        console.log(`📊 Sell Tax:     ${tokenData.sell_tax || "0"}%`);
        console.log(`🔄 Proxy:        ${tokenData.is_proxy === "1" ? "Yes" : "No"}`);
        console.log(`🪙 Mintable:     ${tokenData.is_mintable === "1" ? "Yes" : "No"}`);
        console.log(`👤 Owner Change: ${tokenData.can_take_back_ownership === "1" ? "⚠️  Yes" : "No"}`);
        console.log(`🔐 Open Source:  ${tokenData.is_open_source === "1" ? "Yes" : "No"}`);
        console.log("━".repeat(60));
        console.log(`\n📋 Full Response:\n`);
        console.log(JSON.stringify(tokenData, null, 2));
    } else {
        console.log(`⚠️  No data found for token ${TOKEN_ADDRESS} on chain ${CHAIN_ID}`);
        console.log(JSON.stringify(data, null, 2));
    }
}

testGoPlus().catch(console.error);
