
import { Action, IAgentRuntime, Memory, State, HandlerCallback, ActionExample } from "@elizaos/core";
import { createWalletClient, http, publicActions, parseEther, Hex, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const LOG_FILE = path.resolve(process.cwd(), "debug_trace.log");
const traceLog = (msg: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${msg}\n`);
    console.log(msg);
};

// Contract ABI for swap
// Token Map moved to REVERSE_TOKEN_MAP below for O(1) lookup
const VAULT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "swap",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

// Configuration
// FORCE priority to VITE_TENDERLY_RPC_URL because TENDERLY_RPC_URL might be stale in the shell env
const TENDERLY_RPC = process.env.VITE_TENDERLY_RPC_URL || process.env.TENDERLY_RPC_URL;

console.log(`[DEBUG] RPC ENV CHECK: TENDERLY_RPC_URL=${process.env.TENDERLY_RPC_URL}`);
console.log(`[DEBUG] RPC ENV CHECK: VITE_TENDERLY_RPC_URL=${process.env.VITE_TENDERLY_RPC_URL}`);
console.log(`[DEBUG] RPC SELECTED: ${TENDERLY_RPC}`);

if (!TENDERLY_RPC) {
    throw new Error("TENDERLY_RPC_URL not found in .env");
}
// Use a fixed demo key if not in env (Deployer Key)
const PRIVATE_KEY = (process.env.PRIVATE_KEY as Hex) || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const AEGIS_VAULT_ADDRESS = process.env.AEGIS_VAULT_ADDRESS as Hex;
if (!AEGIS_VAULT_ADDRESS) {
    throw new Error("AEGIS_VAULT_ADDRESS not found in .env");
}
// Token Mapping for Demo (Base Mainnet / Mock Addresses)
const REVERSE_TOKEN_MAP: Record<string, string> = {
    "usdc": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "usdt": "0xfde4C96251273064830555d01ecB9c5E3AC1761a",
    "pepe": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    "avax": "0x54251907338946759b07d61E30052a48bd4e81F4",
    "weth": "0x4200000000000000000000000000000000000006",
    "link": "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    "btc": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    "fake_usdc": "0x1234567890123456789012345678901234567890", // Mock for Impersonation
    "mock_honeypot": "0x5a31705664a6d1dc79287c4613cbe30d8920153f" // Mock for Honeypot
};

export const executeSwapAction: Action = {
    name: "EXECUTE_SWAP",
    similes: ["SWAP_TOKEN", "TRADE_ASSET", "BUY_TOKEN"],
    description: "Executes a swap transaction on the AegisVault contract via Tenderly.",
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const text = (message.content.text || "").toLowerCase();
        return text.includes("swap") || text.includes("buy");
    },
    handler: async (_runtime: IAgentRuntime, message: Memory, _state?: State, _options?: any, callback?: HandlerCallback) => {
        console.log("🚀 [AEGIS ACTION] Initiating Swap Sequence...");

        const text = (message.content.text || "").toLowerCase();

        /**
         * 🧠 SEMANTIC AI INTENT PARSING
         * Goal: Replace fragile regex with LLM-powered extraction.
         */
        const swapTemplate = `
        Extact the trade details from the user's message. 
        Supported tokens: USDC, USDT, PEPE, AVAX, WETH, WBTC, LINK, UNI, FAKE_USDC, MOCK_HONEYPOT.
        If the user says "native" or "eth", use WETH.
        If the user says "dollars", use USDC.

        User Message: "${message.content.text}"

        Return JSON only:
        {
            "amount": "string number",
            "sourceToken": "string symbol",
            "targetToken": "string symbol",
            "reasoning": "brief explanation"
        }
        `;

        let amountVal = "0.1";
        let sourceTokenLabel = "native";
        let targetTokenLabel = "WETH";
        let targetAddress = "0x4200000000000000000000000000000000000006";

        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            console.log(`🧠 [AEGIS AI] Consulting Semantic Parser for: "${message.content.text}"`);
            try {
                const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [{ role: "system", content: swapTemplate }],
                        response_format: { type: "json_object" },
                        temperature: 0
                    })
                });

                if (aiRes.ok) {
                    const data = await aiRes.json();
                    const extraction = JSON.parse(data.choices[0].message.content);
                    console.log("🧩 [AEGIS AI] Semantic Extraction Successful:", extraction);

                    amountVal = extraction.amount || amountVal;
                    sourceTokenLabel = extraction.sourceToken || sourceTokenLabel;
                    targetTokenLabel = extraction.targetToken || targetTokenLabel;
                } else {
                    console.warn("⚠️ AI Parser Failed, falling back to legacy regex.");
                    // Legacy Fallback for offline/error cases
                    const regexMatch = text.match(/swap\s+([\d\.]+)\s+(\w+)/i);
                    if (regexMatch) {
                        amountVal = regexMatch[1];
                        targetTokenLabel = regexMatch[2];
                    }
                }
            } catch (e) {
                console.error("AI Extraction Error:", e);
            }
        }

        const amountWei = parseEther(amountVal);

        // 🗺️ TOKEN LOOKUP & ALIASING
        const ALIASES: Record<string, string> = {
            "eth": "weth",
            "native": "weth",
            "dollars": "usdc",
            "usd": "usdc",
            "stable": "usdc",
            "btc": "wbtc",
            "bitcoin": "wbtc",
            "sol": "solana",
            "chainlink": "link",
            "uniswap": "uni"
        };

        const findAddress = (label: string) => {
            const cleanLabel = label.toLowerCase();
            const actualKey = ALIASES[cleanLabel] || cleanLabel;

            // O(1) Lookup from REVERSE_TOKEN_MAP
            if (REVERSE_TOKEN_MAP[actualKey]) {
                return getAddress(REVERSE_TOKEN_MAP[actualKey]);
            }
            return null;
        };

        // Resolve Target (Audit Subject)
        const resolvedTarget = findAddress(targetTokenLabel);
        if (resolvedTarget) {
            targetAddress = resolvedTarget;
            targetTokenLabel = targetTokenLabel.toUpperCase();
        }

        console.log(`🎯 Intent Decoded: Escrowing ${amountVal} core to audit ${targetTokenLabel} (${targetAddress})`);

        if (callback) {
            callback({
                text: `Aegis Vault intercepted request: Swapping ${amountVal} ${sourceTokenLabel} for ${targetTokenLabel}.\nInitiating pre-flight audit for ${targetTokenLabel}...`,
                action: "SWAP_INITIATED"
            });
        }

        try {
            const account = privateKeyToAccount(PRIVATE_KEY);
            const client = createWalletClient({
                account,
                chain: base,
                transport: http(TENDERLY_RPC)
            }).extend(publicActions);

            console.log(`🔌 Connected to Tenderly: ${TENDERLY_RPC}`);
            console.log(`👤 Wallet: ${account.address}`);
            console.log(`💸 Escrow Value: ${amountVal} native (${amountWei.toString()} wei)`);
            console.log(`🎯 Target Vault: ${AEGIS_VAULT_ADDRESS}`);

            // Execute Transaction
            // 4. MOCK SCENARIO TRAPDOORS (Pre-Transaction)
            // We check the *Address* to be robust against LLM label variations
            const MOCK_FAKE_USDC_ADDR = REVERSE_TOKEN_MAP["fake_usdc"];
            const MOCK_HONEYPOT_ADDR = REVERSE_TOKEN_MAP["mock_honeypot"];

            if (targetAddress === MOCK_FAKE_USDC_ADDR || targetAddress === MOCK_HONEYPOT_ADDR) {
                console.log("⚠️ Mock Token Verification: Generating Synthetic Report");

                const mockReqId = `0xMOCK_${Date.now()}`;
                const mockHash = `0xMOCK_HASH_${Date.now()}`;
                // If address matches FAKE_USDC, it's Impersonation. Else it's Honeypot.
                const isImpersonation = (targetAddress === MOCK_FAKE_USDC_ADDR);

                // Generate Synthetic Report (MATCHING BACKEND SCHEMA)

                const mockReport = {
                    requestId: mockReqId,
                    status: "completed",
                    riskCode: isImpersonation ? "32" : "16", // 32=Impersonation, 16=Honeypot
                    logicFlags: isImpersonation ? 0 : 16,
                    aiFlags: isImpersonation ? 32 : 0,
                    reasoning: isImpersonation ? "[GPT-4o: 32] IMPERSONATION DETECTED. Name 'USD Coin' heavily resembles trusted asset." : "[LOGIC] HONEYPOT DETECTED. Creation code verification failed.",
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    details: {
                        modelResults: [
                            {
                                name: "GPT-4o",
                                status: "Success",
                                flags: isImpersonation ? [32] : [],
                                reasoning: isImpersonation ? "Token name 'USD Coin' is suspicious for this address." : "No semantic anomalies."
                            },
                            {
                                name: "Grok",
                                status: "Success",
                                flags: isImpersonation ? [32] : [],
                                reasoning: isImpersonation ? "High confidence impersonation attack." : "Honeypot logic confirmed."
                            }
                        ]
                    }
                };

                // Write report to public/reports
                const reportDir = path.resolve(process.cwd(), "public", "reports");
                if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
                fs.writeFileSync(path.join(reportDir, `${mockReqId}.json`), JSON.stringify(mockReport, null, 2));

                if (callback) {
                    callback({
                        text: `⏳ [AEGIS_PENDING] Transaction Escrowed (${isImpersonation ? 'Impersonation Test' : 'Honeypot Test'}). Audit Active.\n\nRequest ID: ${mockReqId}\nHash: ${mockHash}`,
                        content: {
                            hash: mockHash,
                            requestId: mockReqId,
                            status: "PENDING_AUDIT",
                            amount: amountVal,
                            token: targetTokenLabel,
                            targetAddress: targetAddress
                        }
                    });
                }
                return true;
            }

            const hash = await client.writeContract({
                address: AEGIS_VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'swap',
                args: [targetAddress as Hex, amountWei],
                value: amountWei,
            });

            // Wait for receipt to get requestId from logs
            const receipt = await client.waitForTransactionReceipt({ hash });

            // Search all logs for the TradeInitiated event
            const tradeInitiatedTopic = "0xacec84cc11595bfa67fc1d00627111632e8e88bde4054a8c4be8fbfc3979424d";
            let requestId = "";
            traceLog(`🔍 DEBUG: Found ${receipt.logs.length} logs in receipt.`);

            for (const log of receipt.logs) {
                traceLog(`   - Log Topics: ${JSON.stringify(log.topics)}`);
                if (log.topics[0]?.toLowerCase() === tradeInitiatedTopic) {
                    requestId = log.topics[1] || "";
                    traceLog(`   ✅ MATCH: Found TradeInitiated event! RequestId: ${requestId}`);
                    break;
                }
            }

            if (!requestId) {
                traceLog("⚠️  WARNING: Could not find TradeInitiated event in receipt logs. Possible contract mismatch?");
            }

            traceLog(`✅ Transaction Mined! RequestId: ${requestId}`);

            if (callback) {
                callback({
                    text: `⏳ [AEGIS_PENDING] Transaction Escrowed. Audit Active.\n\nRequest ID: ${requestId}\nHash: ${hash}`,
                    content: {
                        hash: hash,
                        requestId: requestId,
                        status: "PENDING_AUDIT",
                        amount: amountVal,
                        token: targetTokenLabel,
                        targetAddress: targetAddress
                    }
                });
            }


        } catch (error: any) {
            console.error("❌ Transaction Failed:", error);

            let errorMessage = "Transaction failed due to an unknown error.";
            let isBlacklisted = false;

            // Robust error parsing for Viem/Wagmi errors
            // Use a replacer to handle BigInt, which JSON.stringify does not support by default
            const errorString = JSON.stringify(error, (_key, value) =>
                typeof value === 'bigint' ? value.toString() : value,
                2
            );

            if (errorString.includes("Aegis: Token blacklisted") || error.message?.includes("blacklisted") || error.shortMessage?.includes("blacklisted")) {
                errorMessage = "⚠️ PRE-EMPTIVE BLOCK: Token is flagged in Aegis Risk Cache.";
                isBlacklisted = true;
            } else if (errorString.includes("quota limit") || errorString.includes("403")) {
                errorMessage = "⚠️ TENDERLY QUOTA EXCEEDED: RPC limit reached for this account.";
            } else if (error.shortMessage) {
                errorMessage = error.shortMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            if (callback) {
                if (isBlacklisted) {
                    const riskCode = 999;
                    const reasoning = "Token exists in preemptive blacklist (Risk Cache).";
                    callback({
                        text: `❌ [AEGIS_REJECT] Pre-emptive security block. Verdict: THREAT_DETECTED.\n\n**FORENSIC AUDIT SUMMARY**\n- **Risk Code**: ${riskCode}\n- **Risk Score**: 100/100\n- **Forensic Reasoning**: ${reasoning}\n\nAssets have been safely refunded by the circuit breaker.`,
                        content: {
                            status: "REJECT",
                            riskCode: riskCode,
                            aegisVerdict: {
                                reasoning: reasoning
                            }
                        }
                    });
                }
                else {
                    callback({
                        text: `Transaction failed: ${errorMessage}`,
                        error: true
                    });
                }
            }
        }
    },
    examples: [
        [
            {
                name: "user",
                content: { text: "Swap 1 ETH for PEPE" }
            },
            {
                name: "Aegis",
                content: { text: "Initiating secure swap...", action: "EXECUTE_SWAP" }
            }
        ]
    ] as ActionExample[][]
};
