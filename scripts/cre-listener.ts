
import { createPublicClient, createWalletClient, http, parseAbiItem, webSocket, Hex, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { analyzeRisk } from "../aegis-workflow/main"; // Import existing logic
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

const LOG_FILE = path.resolve(process.cwd(), "debug_trace.log");
const traceLog = (msg: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] [LISTENER] ${msg}\n`);
    console.log(msg);
};

// ANSI Colors for "Hacker" Aesthetic
const C = {
    RESET: "\x1b[0m",
    CYAN: "\x1b[36m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    RED: "\x1b[31m",
    MAGENTA: "\x1b[35m",
    DIM: "\x1b[90m",
    BOLD: "\x1b[1m",
    BG_CYAN: "\x1b[46m\x1b[30m",
    // Safe Icons for conhost compatibility
    ICON_CHAIN: "🔗",
    ICON_SHIELD: "🛡",
    ICON_ALERT: "🚨",
    ICON_BRAIN: "🧠",
    ICON_CHECK: "✔",
    ICON_CROSS: "✖",
    ICON_BOLT: "⚡",
    ICON_SCALE: "⚖"
};

import * as path from "path";

// Robust dotenv loading from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log(`${C.DIM}🔍 ENV DEBUG: GROQ_API_KEY=${process.env.GROQ_API_KEY ? "EXISTS" : "MISSING"}${C.RESET}`);
console.log(`${C.DIM}🔍 ENV DEBUG: OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? "EXISTS" : "MISSING"}${C.RESET}`);

// FORCE priority to VITE_TENDERLY_RPC_URL because TENDERLY_RPC_URL might be stale in the shell env
const TENDERLY_RPC = process.env.VITE_TENDERLY_RPC_URL || process.env.TENDERLY_RPC_URL;

console.log(`${C.DIM}🔍 ENV DEBUG: TENDERLY_RPC_URL=${process.env.TENDERLY_RPC_URL}${C.RESET}`);
console.log(`${C.DIM}🔍 ENV DEBUG: VITE_TENDERLY_RPC_URL=${process.env.VITE_TENDERLY_RPC_URL}${C.RESET}`);
console.log(`${C.DIM}🔍 RPC SELECTED: ${TENDERLY_RPC}${C.RESET}`);

if (!TENDERLY_RPC) {
    throw new Error("TENDERLY_RPC_URL not found in .env");
}

// Contract & Event Config
const AEGIS_VAULT_ADDRESS = process.env.AEGIS_VAULT_ADDRESS as Hex;
if (!AEGIS_VAULT_ADDRESS) {
    throw new Error("AEGIS_VAULT_ADDRESS not found in .env");
}
const TRADE_INITIATED_EVENT = parseAbiItem(
    "event TradeInitiated(bytes32 indexed requestId, address indexed user, address token, uint256 amount)"
);

const TOKEN_MAP: Record<string, { label: string, cgId: string }> = {
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": { label: "USDC", cgId: "usd-coin" },
    "0xfde4C96251273064830555d01ecB9c5E3AC1761a": { label: "USDT", cgId: "tether" },
    "0x6982508145454Ce325dDbE47a25d4ec3d2311933": { label: "PEPE", cgId: "pepe" },
    "0x54251907338946759b07d61E30052a48bd4E81F4": { label: "AVAX", cgId: "avalanche-2" },
    "0x4200000000000000000000000000000000000006": { label: "WETH", cgId: "ethereum" },
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": { label: "WBTC", cgId: "wrapped-bitcoin" },
    "0x514910771AF9Ca656af840dff83E8264EcF986CA": { label: "LINK", cgId: "chainlink" },
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": { label: "UNI", cgId: "uniswap" },
    "0x5a31705664a6d1dc79287c4613cbe30d8920153f": { label: "Honeypot Lure (MOCK)", cgId: "ethereum" },
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": { label: "Fake USDC (MOCK)", cgId: "usd-coin" }
};
// DON Private Key (Mock for Hackathon)
const DON_KEY = (process.env.DON_PRIVATE_KEY as Hex) || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const account = privateKeyToAccount(DON_KEY);

const publicClient = createPublicClient({
    chain: base,
    transport: http(TENDERLY_RPC)
});

const client = createWalletClient({
    account,
    chain: base,
    transport: http(TENDERLY_RPC)
});

// Normalize TOKEN_MAP keys for robust lookup
const NORMALIZED_TOKEN_MAP: Record<string, { label: string, cgId: string }> = {};
for (const [addr, meta] of Object.entries(TOKEN_MAP)) {
    NORMALIZED_TOKEN_MAP[getAddress(addr)] = meta;
}

console.log(`
${C.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${C.ICON_CHAIN}  ${C.BOLD}CHAINLINK CRE NODE STARTING...${C.RESET}
   Role: Specialized Security Decentralized Oracle Network (DON)
   Watching Vault: ${C.CYAN}${AEGIS_VAULT_ADDRESS}${C.RESET}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Polling for events (simpler than WebSocket for http RPCs)
const runListener = async () => {
    console.log(`${C.ICON_BOLT} ${C.BOLD}DON Listener starting polling loop...${C.RESET}`);
    console.log(`[i] Target Vault: ${AEGIS_VAULT_ADDRESS}`);

    // Heartbeat to prove we are alive
    setInterval(async () => {
        try {
            const blockNumber = await publicClient.getBlockNumber();
            console.log(`${C.DIM}[Heartbeat] DON Listener Active. Latest Block: ${blockNumber} | Watching: ${AEGIS_VAULT_ADDRESS}${C.RESET}`);
        } catch (e) {
            console.log(`${C.RED}⚠️ [Heartbeat] RPC Connection Error!${C.RESET}`);
        }
    }, 10000);

    // Watch for Contract Events
    publicClient.watchEvent({
        address: AEGIS_VAULT_ADDRESS,
        event: TRADE_INITIATED_EVENT,
        onLogs: async (logs) => {
            traceLog(`👀 Detected ${logs.length} RAW LOGS via watchEvent`);
            for (const log of logs) {
                const { requestId, user, token, amount } = (log as any).args;
                traceLog(`   - Processing requestId: ${requestId}`);
                const normalizedToken = token ? getAddress(token) : "";
                const tokenMeta = NORMALIZED_TOKEN_MAP[normalizedToken] || { label: token, cgId: "ethereum" };
                const tokenLabel = tokenMeta.label;
                console.log(`
${C.ICON_ALERT} ${C.RED}${C.BOLD}CHAINLINK EVENT: TradeInitiated Detected${C.RESET}
   ├─ User:           ${C.CYAN}${user}${C.RESET}
   ├─ Target Token:   ${C.YELLOW}${tokenLabel}${C.RESET}
   ├─ Amount:         ${C.DIM}${amount.toString()}${C.RESET}
   └─ RequestID:      ${C.MAGENTA}${requestId}${C.RESET}
`);

                try {
                    traceLog(`${C.ICON_BRAIN} ${C.BOLD}Triggering Chainlink CRE Workflow (aegis-workflow)...${C.RESET}`);
                    traceLog(`${C.ICON_SHIELD}  ${C.YELLOW}${C.BOLD}AEGIS ORACLE AI: Initiating Forensic Audit...${C.RESET}`);

                    // 1. Fetch current market price dynamically for the "Trade Claim"
                    let targetPrice = 1.0;
                    let nativePrice = 35.0; // Default for AVAX for demo safety

                    try {
                        const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenMeta.cgId},avalanche-2,ethereum&vs_currencies=usd`;
                        const priceRes = await fetch(cgUrl);
                        const priceData = await priceRes.json() as any;

                        targetPrice = priceData[tokenMeta.cgId]?.usd || targetPrice;
                        nativePrice = priceData["ethereum"]?.usd || priceData["avalanche-2"]?.usd || nativePrice;

                        traceLog(`   [!] Market Prices -> Target (${tokenLabel}): $${targetPrice} | Native: $${nativePrice}`);
                    } catch (e) {
                        traceLog(`   [!] Could not fetch dynamic price, falling back to defaults`);
                    }

                    const escrowAmount = Number(amount) / 1e18;
                    const totalEscrowValue = escrowAmount * nativePrice;

                    // If this is a demo "Phishing Trap", the user is getting a fixed low amount.
                    // For the demo to work as specified, we need to detect the value gap.
                    // We'll pass the unit-relative-asking price: 
                    // How much Target is the user actually getting per unit of Native?
                    // BUT for the current "Deviation" logic in main.ts, it expects:
                    // (Asking Price of Target) vs (Market Price of Target).

                    // To trigger Scenario 2 (100 AVAX for $10):
                    // Value Gap is huge. Let's pass the "Value Reality Ratio" to the AI.

                    const assessment = await analyzeRisk({
                        tokenAddress: normalizedToken,
                        coingeckoId: tokenMeta.cgId,
                        chainId: "8453", // Base
                        userAddress: user!,
                        askingPrice: targetPrice.toString(), // The price they WANT for the target
                        // We'll extend payload to include the value gap
                        details: {
                            escrowAmount,
                            nativePrice,
                            totalEscrowValue,
                            targetUnitPrice: targetPrice
                        }
                    } as any);

                    // --- NEW: WRITE FORENSIC REPORT FOR UI ---
                    const reportDir = path.resolve(process.cwd(), "eliza", "public", "reports");
                    if (!fs.existsSync(reportDir)) { fs.mkdirSync(reportDir, { recursive: true }); }

                    const reportPath = path.join(reportDir, `${requestId}.json`);
                    const reportData = {
                        requestId,
                        token: normalizedToken,
                        status: assessment.riskScore > 0 ? "UNSAFE" : "SAFE",
                        verdict: assessment.riskScore > 0 ? "REJECTED" : "AUTHORIZED",
                        riskScore: assessment.riskScore,
                        details: assessment.details, // Full context (Market, Trade, Security)
                        reason: assessment.reasoning,
                        logicFlags: assessment.logicFlags,
                        aiFlags: assessment.aiFlags,
                        timestamp: Date.now(),
                        txHash: "" // Placeholder, updated after submit
                    };

                    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
                    traceLog(`${C.ICON_SHIELD} Forensic Report saved to: ${reportPath}`);
                    // ----------------------------------------

                    const { logicFlags, aiFlags, riskScore } = assessment;

                    // Submit Verdict
                    const abi = [
                        {
                            "inputs": [
                                { "internalType": "bytes32", "name": "requestId", "type": "bytes32" },
                                { "internalType": "bytes", "name": "response", "type": "bytes" },
                                { "internalType": "bytes", "name": "err", "type": "bytes" }
                            ],
                            "name": "fulfillRequest",
                            "outputs": [],
                            "stateMutability": "nonpayable",
                            "type": "function"
                        }
                    ] as const;

                    // ⚖️ CHAINLINK CRE VERDICT BRANDING
                    console.log(`
${C.CYAN}╔════════════════════════════════════════════════════════╗
║             ⚡  AEGIS PROTOCOL CONSENSUS  ⚡             ║
╚════════════════════════════════════════════════════════╝${C.RESET}`);

                    console.log(` ${C.BOLD}► LOGIC GATE (Deterministic):${C.RESET}`);
                    console.log(`   ├─ Honeypot Check: ${assessment.logicFlags & 16 ? C.RED + "FAILED" : C.GREEN + "PASSED"}${C.RESET}`);
                    console.log(`   └─ Volatility:     ${assessment.logicFlags & 2 ? C.YELLOW + "WARNING" : C.GREEN + "STABLE"}${C.RESET}`);

                    console.log(` ${C.BOLD}► NEURAL CLUSTER (Semantic):${C.RESET}`);
                    assessment.details.modelResults?.forEach((m: any) => {
                        const isRisk = m.flags && m.flags.length > 0;
                        console.log(`   ├─ ${m.name.padEnd(12)}: ${isRisk ? C.RED + "RISK " + JSON.stringify(m.flags) : C.GREEN + "SECURE"}${C.RESET}`);
                    });

                    console.log(`
${C.BOLD}► FINAL VERDICT:${C.RESET}
   ├─ Logic Flags: ${C.MAGENTA}${logicFlags}${C.RESET}
   ├─ AI Flags:    ${C.CYAN}${aiFlags}${C.RESET}
   └─ Risk Score:  ${riskScore > 0 ? C.BG_CYAN + " " + riskScore + " " : C.GREEN + " " + riskScore + " "}${C.RESET}
`);

                    console.log(`[>>] ${C.BOLD}Submitting fulfillRequest on-chain...${C.RESET}`);
                    const isThreat = riskScore > 0;
                    console.log(`${C.ICON_ALERT} ${C.BOLD}CHAINLINK CRE VERDICT: ${isThreat ? C.RED + "THREAT DETECTED" : C.GREEN + "CLEARED"}${C.RESET}`);
                    console.log(`   └─ Action: ${isThreat ? "Assets will be refunded to user." : "Settlement authorized."}`);

                    const { encodeAbiParameters } = await import("viem");
                    const encodedResponse = encodeAbiParameters(
                        [{ type: 'uint256' }],
                        [BigInt(assessment.riskScore)]
                    );

                    const hash = await client.writeContract({
                        address: AEGIS_VAULT_ADDRESS,
                        abi: abi,
                        functionName: 'fulfillRequest',
                        args: [requestId!, encodedResponse, '0x']
                    });

                    console.log(`✅ VERDICT SUBMITTED! Tx: ${hash}`);

                    // UPDATE REPORT WITH TX HASH
                    reportData.txHash = hash;
                    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
                    traceLog(`${C.ICON_SHIELD} Forensic Report UPDATED with Tx: ${hash}`);

                } catch (e) {
                    console.error("❌ Analysis Failed:", e);
                }
            }
        }
    });
};

runListener();
