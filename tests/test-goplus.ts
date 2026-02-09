#!/usr/bin/env bun
/**
 * GoPlus Security API Test Script
 * Usage: bun run test-goplus.ts [token-address] [chain-id]
 * Example: bun run test-goplus.ts 0x4200000000000000000000000000000000000006 8453
 */

import { config } from "dotenv";
import { createHash } from "crypto";

config();

export interface TestResult {
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
    detail: string;
    latency: number;
}

async function getAccessToken(appKey: string, appSecret: string, verbose: boolean): Promise<string | null> {
    const time = Math.floor(Date.now() / 1000);
    const sign = createHash("sha1")
        .update(appKey + time + appSecret)
        .digest("hex");

    try {
        const response = await fetch("https://api.gopluslabs.io/api/v1/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                app_key: appKey,
                sign: sign,
                time: time
            })
        });

        if (!response.ok) {
            if (verbose) console.error(`❌ Auth Failed: ${response.status} ${await response.text()}`);
            return null;
        }

        const data = await response.json() as any;
        if (data.code === 0 && data.result?.access_token) {
            return data.result.access_token;
        } else {
            if (verbose) console.error(`❌ Auth Error: ${JSON.stringify(data)}`);
            return null;
        }
    } catch (e: any) {
        if (verbose) console.error(`❌ Auth Exception: ${e.message}`);
        return null;
    }
}

export async function checkGoPlus(
    tokenAddress: string,
    chainId: string,
    appKey: string | undefined,
    appSecret: string | undefined,
    verbose: boolean = false
): Promise<TestResult> {
    const start = Date.now();

    if (verbose) {
        console.log(`\n🔒 Testing GoPlus Security API`);
        console.log(`📝 Token: ${tokenAddress}`);
        console.log(`⛓️  Chain: ${chainId}\n`);
        console.log("━".repeat(60));
    }

    let accessToken: string | null = null;
    if (appKey && appSecret) {
        accessToken = await getAccessToken(appKey, appSecret, verbose);
        if (verbose) {
            if (accessToken) console.log("🔑 Authenticated with Access Token");
            else console.log("⚠️  Authentication failed");
        }
    } else {
        if (verbose) console.log("⚠️  GOPLUS_APP_KEY or GOPLUS_APP_SECRET not found in .env");
    }

    const headers: Record<string, string> = {
        "Accept": "application/json"
    };

    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`;

    if (verbose) console.log(`\n🔗 URL: ${url}\n`);

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
            console.log(`🛡️ Response:\n`);
        }

        const tokenData = data.result?.[tokenAddress.toLowerCase()];

        if (tokenData) {
            const honeypot = tokenData.is_honeypot === "1" ? "⚠️ Yes" : "No";

            if (verbose) {
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
            }

            return {
                status: "✅ PASS",
                detail: `Honeypot: ${honeypot}`,
                latency: Date.now() - start
            };
        } else {
            if (verbose) {
                console.log(`⚠️  No data found for token ${tokenAddress} on chain ${chainId}`);
                console.log(JSON.stringify(data, null, 2));
            }
            return { status: "⚠️ SKIP", detail: "No token data", latency: Date.now() - start };
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
    const TOKEN_ADDRESS = process.argv[2] || "0x4200000000000000000000000000000000000006"; // WETH on Base
    const CHAIN_ID = process.argv[3] || "8453"; // Base
    const APP_KEY = process.env.GOPLUS_APP_KEY;
    const APP_SECRET = process.env.GOPLUS_APP_SECRET;

    checkGoPlus(TOKEN_ADDRESS, CHAIN_ID, APP_KEY, APP_SECRET, true).catch(console.error);
}
