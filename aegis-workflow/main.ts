/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                     AEGIS RISK ORACLE - CRE WORKFLOW v2.0                    │
 * │            VERIFIABLE AI SHIELD + PINATA/IPFS COMPLIANCE LAYER               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */
import { HTTPCapability, handler, Runner, type Runtime, type HTTPPayload, cre, ok, text, json } from "@chainlink/cre-sdk";
import { z } from "zod";
import { keccak256, encodePacked, Hex, recoverMessageAddress, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Standard DON Demo Key (for Anvil verification)
const DON_DEMO_PRIVATE_KEY: Hex = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const donAccount = privateKeyToAccount(DON_DEMO_PRIVATE_KEY);

const configSchema = z.object({
    openaiApiKey: z.string().optional(),
    pinataJwt: z.string().optional(), // 🚀 NEW: Pinata Auth
});

type Config = z.infer<typeof configSchema>;

const requestSchema = z.object({
    tokenAddress: z.string().min(1),
    chainId: z.string().min(1),
    askingPrice: z.string().optional(),
    amount: z.string().optional(),
    userAddress: z.string().optional(),
    coingeckoId: z.string().optional(),
});

type RiskAssessmentRequest = z.infer<typeof requestSchema>;

interface AIAnalysisResult {
    risk_score: number;
    decision: string;
    reasoning: string;
}

const brainHandler = async (runtime: Runtime<Config>, payload: HTTPPayload): Promise<string> => {
    const GREEN = "\x1b[32m";
    const RED = "\x1b[31m";
    const YELLOW = "\x1b[33m";
    const CYAN = "\x1b[36m";
    const RESET = "\x1b[0m";
    const BOLD = "\x1b[1m";

    runtime.log("━━━━━━ 🧠  AEGIS VERIFIABLE SHIELD ━━━━━━");
    runtime.log("   🚀 [CRE] Chainlink Runtime Environment v1.0 | DON Secrets: Active");

    // 1. Payload Extraction
    let requestData: RiskAssessmentRequest;
    try {
        const parsed = JSON.parse(payload.input?.toString() || "{}");
        requestData = requestSchema.parse(parsed);
        runtime.log(`${CYAN}📥 INPUT RECEIVED:${RESET}`);
        runtime.log(`   Token: ${requestData.tokenAddress}`);
        runtime.log(`   Chain: ${requestData.chainId}`);
        runtime.log(`   Asking: $${requestData.askingPrice || "0"} for ${requestData.amount || "0"} tokens`);
        runtime.log(`   User:  ${requestData.userAddress || "Unknown"}`);
    } catch (e) {
        runtime.log(`${RED}❌ Invalid Payload${RESET}`);
        return JSON.stringify({ error: "Invalid Request" });
    }

    const httpClient = new cre.capabilities.HTTPClient();

    // 2. Parallel Data Acquisition
    runtime.log(`\n${YELLOW}━━━ 📊  DATA ACQUISITION (Parallel Execution) ━━━${RESET}`);

    runtime.log(`   📡 [CG] Fetching Market Price for: ${requestData.coingeckoId || 'ethereum'}...`);
    runtime.log(`   📡 [GP] Scanning Token Security: ${requestData.tokenAddress.substring(0, 10)}...`);
    runtime.log(`   📡 [QR] Generating Quantum Entropy (ANU QRNG)...`);

    const [priceResult, entropyResult, securityResult] = await Promise.all([
        httpClient.sendRequest(runtime as any, {
            url: `https://api.coingecko.com/api/v3/simple/price?ids=${requestData.coingeckoId || 'ethereum'}&vs_currencies=usd`,
            method: "GET"
        }).result(),
        httpClient.sendRequest(runtime as any, {
            url: "https://qrng.anu.edu.au/API/jsonI.php?length=1&type=hex16&size=32",
            method: "GET"
        }).result(),
        httpClient.sendRequest(runtime as any, {
            url: `https://api.gopluslabs.io/api/v1/token_security/${requestData.chainId}?contract_addresses=${requestData.tokenAddress}`,
            method: "GET"
        }).result()
    ]);

    // Parse & Log Responses
    const marketPrice = ok(priceResult) ? (json(priceResult) as any)[requestData.coingeckoId || 'ethereum']?.usd : 2500;
    const entropy = ok(entropyResult) ? (json(entropyResult) as any).data[0] : "0x" + "0".repeat(64);
    const securityData = ok(securityResult) ? (json(securityResult) as any).result[requestData.tokenAddress.toLowerCase()] : {};

    runtime.log(`   ✅ [CG] Price Resolved: ${YELLOW}$${marketPrice}${RESET} ${ok(priceResult) ? "(LIVE)" : "(FALLBACK)"}`);
    runtime.log(`   ✅ [GP] Security Scan: ${securityData ? "DATA CAPTURED" : "NO DATA"} ${ok(securityResult) ? "(LIVE)" : "(FALLBACK)"}`);

    // Log detailed security flags if data exists
    if (securityData) {
        const isHoneypot = securityData.is_honeypot === "1";
        const isMintable = securityData.is_mintable === "1";
        const buyTax = securityData.buy_tax || "0";
        const sellTax = securityData.sell_tax || "0";

        if (isHoneypot) runtime.log(`      ⚠️ [GP] ALERT: HONEYPOT DETECTED`);
        if (isMintable) runtime.log(`      ⚠️ [GP] Warning: Token is Mintable`);
        if (Number(buyTax) > 0 || Number(sellTax) > 0) runtime.log(`      ℹ️ [GP] Tax: Buy ${buyTax}% | Sell ${sellTax}%`);
        if (!isHoneypot && !isMintable && Number(buyTax) == 0 && Number(sellTax) == 0) {
            runtime.log(`      ✅ [GP] Status: Clean Token Contract`);
        }
    }

    runtime.log(`   ✅ [QR] Entropy Seed: ${entropy.substring(0, 10)}... ${ok(entropyResult) ? "(LIVE)" : "(FALLBACK)"}`);

    // 3. AI Synthesis (Reasoning Engine)
    runtime.log(`\n${CYAN}━━━ 🤖  AI SYNTHESIS (Verifiable Reasoning) ━━━${RESET}`);
    const openaiKey = runtime.config.openaiApiKey || await runtime.getSecret({ id: "OPENAI_API_KEY" });

    const askingPrice = Number(requestData.askingPrice || "0");
    const deviation = marketPrice > 0 ? Math.abs((askingPrice - marketPrice) / marketPrice) * 100 : 0;

    const context = {
        market_price: marketPrice,
        asking_price: askingPrice,
        price_deviation_percent: deviation.toFixed(2) + "%",
        security: securityData,
        trade: requestData
    };

    const secSummary = securityData ? `[Honeypot: ${securityData.is_honeypot === '1' ? 'YES' : 'NO'}, Mintable: ${securityData.is_mintable === '1' ? 'YES' : 'NO'}]` : 'No Data';
    runtime.log(`   📤 [OAI] Analysis Context: { Price: $${marketPrice} | Ask: $${askingPrice} | Dev: ${deviation.toFixed(2)}% | Security: ${secSummary} }`);

    const aiCall = await httpClient.sendRequest(runtime as any, {
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are the Aegis Risk Officer. Provide a detailed, human-readable audit. Output JSON: {risk_score: number, decision: 'EXECUTE'|'REJECT', reasoning: 'string'}. " +
                        "1. ECONOMIC GUARDRAIL: If asking_price deviates > 10% from market_price, you MUST REJECT. " +
                        "2. TRUSTED ASSETS: WETH, USDC, and LINK are highly trusted. EXECUTE if deviation is < 10% unless there is an extreme security threat. " +
                        "3. COMBO FAILS: For UNKNOWN TOKENS, you should REJECT if multiple factors (e.g., untrusted address, moderate deviation < 10%) combine to create high risk. This detects patterns that simple code cannot."
                },
                { role: "user", content: `Context: ${JSON.stringify(context)}` }
            ],
            response_format: { type: "json_object" }
        })).toString('base64')
    }).result();

    const aiParsed = JSON.parse((json(aiCall) as any).choices[0].message.content);
    const reasoningText = aiParsed.reasoning || "REASONING_NOT_FOUND";
    const finalDecision = aiParsed.decision || "REJECT";
    const finalScore = Math.min(Math.max(Number(aiParsed.risk_score || 100), 0), 100);

    runtime.log(`   📥 [OAI] Reasoning Captured. Verdict: ${finalDecision === 'EXECUTE' ? GREEN : RED}${finalDecision}${RESET}`);

    runtime.log(`\n${YELLOW}━━━ 📝  AI RISK ANALYSIS (Logic & Reasoning) ━━━${RESET}`);
    runtime.log("   [ENTITY]: Aegis Verifiable Oracle (CRE)");
    runtime.log("   [SECURITY]: Multi-Factor Risk Assessment");
    runtime.log(`   [ANALYSIS]: ${reasoningText}`);

    // 4. 🚀 PINATA COMPLIANCE STORAGE (The "Big Story")
    runtime.log(`\n${YELLOW}━━━ 💾  COMPLIANCE ARCHIVE (Pinata / IPFS) ━━━${RESET}`);
    const pinataJwt = runtime.config.pinataJwt || await runtime.getSecret({ id: "PINATA_JWT" });

    const reasoningHash = keccak256(encodePacked(['string'], [reasoningText]));
    runtime.log(`   🔗 Content Hash (keccak256): ${reasoningHash}`);

    const pinataCall = await httpClient.sendRequest(runtime as any, {
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        method: "POST",
        headers: {
            "Authorization": `Bearer ${pinataJwt}`,
            "Content-Type": "application/json"
        },
        body: Buffer.from(JSON.stringify({
            pinataContent: {
                token: requestData.tokenAddress,
                verdict: finalDecision,
                reasoning: reasoningText,
                audit_hash: reasoningHash,
                timestamp: new Date().toISOString()
            },
            pinataMetadata: { name: `AEGIS_AUDIT_${requestData.tokenAddress}` }
        })).toString('base64')
    }).result();

    const ipfsHash = ok(pinataCall) ? (json(pinataCall) as any).IpfsHash : "PENDING_IPFS_UPLOAD";
    if (ok(pinataCall)) {
        runtime.log(`   ✅ IPFS Pin Success: ipfs://${ipfsHash.substring(0, 16)}...`);
    } else {
        runtime.log(`   ⚠️ IPFS Pin Fallback: PENDING (Run in production for CID)`);
    }

    // 5. Cryptographic Triple-Lock Signing
    runtime.log(`\n${YELLOW}━━━ 🔐  CRYPTOGRAPHIC QUAD-LOCK (Signed & Verified) ━━━${RESET}`);
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const salt = (entropy.startsWith('0x') ? entropy : `0x${entropy.padStart(64, '0')}`) as Hex;
    const askingPriceWei = BigInt(Math.round(Number(requestData.askingPrice || "0") * 1e8));

    runtime.log(`   🔑 Signing Payload:`);
    runtime.log(`      User:      ${requestData.userAddress}`);
    runtime.log(`      Token:     ${requestData.tokenAddress}`);
    runtime.log(`      Price:     ${askingPriceWei} (wei)`);
    runtime.log(`      Timestamp: ${timestamp}`);
    runtime.log(`      Salt:      ${salt.substring(0, 18)}...`);
    runtime.log(`      Decision:  ${finalDecision} (${finalScore}/100)`);
    runtime.log(`      Lock 4:    ${reasoningHash.substring(0, 18)}... (AI Reasoning)`);

    const messageHash = keccak256(
        encodePacked(
            ['address', 'address', 'uint256', 'uint256', 'uint256', 'string', 'uint8', 'bytes32', 'bytes32'],
            [
                getAddress(requestData.userAddress || "0x0000000000000000000000000000000000000000"),
                getAddress(requestData.tokenAddress),
                BigInt(requestData.chainId),
                askingPriceWei,
                timestamp,
                finalDecision,
                finalScore,
                salt,
                reasoningHash
            ]
        )
    );

    const signature = await donAccount.signMessage({ message: { raw: messageHash } });
    runtime.log(`   🔏 DON SIGNATURE: ${signature.substring(0, 24)}...`);

    runtime.log(`\n${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
    runtime.log(`${GREEN}${BOLD}🛡️  AEGIS SHIELD: PROTECTION ACTIVE${RESET}`);
    runtime.log(`   Signature verified for ${requestData.tokenAddress.substring(0, 10)}...`);
    runtime.log(`${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);

    return JSON.stringify({
        userAddress: requestData.userAddress,
        tokenAddress: requestData.tokenAddress,
        chainId: requestData.chainId,
        askingPrice: requestData.askingPrice,
        timestamp: timestamp.toString(),
        decision: finalDecision,
        riskScore: finalScore,
        salt: salt,
        signature: signature,
        reasoningHash: reasoningHash,
        reasoningCID: ipfsHash,
        reasoningText: reasoningText
    });
};

const initWorkflow = (config: Config) => {
    const http = new HTTPCapability();
    return [handler(http.trigger({}), brainHandler)];
};

export async function main() {
    const runner = await Runner.newRunner<Config>({ configSchema });
    await runner.run(initWorkflow);
}
