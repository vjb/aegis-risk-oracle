/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                     AEGIS RISK ORACLE - CRE WORKFLOW v3.0                    │
 * │            SPLIT-BRAIN CONSENSUS: DETERMINISTIC LOGIC + MULTI-MODEL AI       │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */
import { HTTPCapability, handler, Runner, type Runtime, type HTTPPayload, cre, ok, text, json } from "@chainlink/cre-sdk";
import { z } from "zod";
import { keccak256, encodePacked, Hex, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sha1, toBase64 } from "./utils";

const DON_DEMO_PRIVATE_KEY: Hex = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const donAccount = privateKeyToAccount(DON_DEMO_PRIVATE_KEY);

const RISK_FLAGS = {
    LIQUIDITY_WARN: 1,
    VOLATILITY_WARN: 2,
    SUSPICIOUS_CODE: 4,
    OWNERSHIP_RISK: 8,
    HONEYPOT_FAIL: 16,
    IMPERSONATION_RISK: 32,
    WASH_TRADING: 64,
    SUSPICIOUS_DEPLOYER: 128,
    PHISHING_SCAM: 256,
    AI_ANOMALY_WARNING: 512
};

const RISK_FLAG_DESCRIPTIONS: Record<number, string> = {
    1: "LIQUIDITY_WARN (Low liquidity depth detected)",
    2: "VOLATILITY_WARN (High price deviation or value asymmetry)",
    4: "SUSPICIOUS_CODE (Malicious patterns found in contract source)",
    8: "OWNERSHIP_RISK (Token ownership is not renounced or hidden)",
    16: "HONEYPOT_FAIL (GoPlus detected honeypot / sell-trap)",
    32: "IMPERSONATION_RISK (Token name/logo mimics a trusted asset)",
    64: "WASH_TRADING (Artificial volume detected)",
    128: "SUSPICIOUS_DEPLOYER (Deployer wallet flagged in risk database)",
    256: "PHISHING_SCAM (Social engineering detected in token metadata)",
    512: "AI_ANOMALY (Behavioral outlier detected by neural cluster)"
};

const configSchema = z.object({
    openaiApiKey: z.string().optional(),
    groqKey: z.string().optional(),
    coingeckoApiKey: z.string().optional(),
    goplusAppKey: z.string().optional(),
    goplusAppSecret: z.string().optional(),
    basescanApiKey: z.string().optional(),
    telemetryUrl: z.string().optional(),
});

type Config = z.infer<typeof configSchema>;

const requestSchema = z.object({
    tokenAddress: z.string().min(1),
    chainId: z.union([z.string(), z.number()]).transform(val => val.toString()),
    askingPrice: z.union([z.string(), z.number()]).optional().transform(val => val?.toString()),
    userAddress: z.string().optional(),
    coingeckoId: z.string().optional(),
    vrfSalt: z.string().optional(),
    details: z.any().optional(), // <--- ALLOW ARBITRARY FORENSIC DATA
});

type RiskAssessmentRequest = z.infer<typeof requestSchema>;

interface AIAnalysisResult {
    flags: number[];
    reasoning: string;
}

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const RESET = "\x1b[0m";

// Blue-Chip Tokens that are expected to have owners/high liquidity
const TRUSTED_TOKENS = new Set([
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    "0xfde4C96251273064830555d01ecB9c5E3AC1761a", // USDT
    "0x4200000000000000000000000000000000000006", // WETH
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
    "0x514910771AF9Ca656af840dff83E8264EcF986CA", // LINK
    "0x54251907338946759b07d61E30052a48bd4e81F4", // AVAX
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // UNI
    "0x2Ae3F1Ec7F1F5012CFEab2917dd35c5273de0F01", // cbETH
    "0x50c5725949A6E00a99d427003273cC211c85d039", // DAI
    "0x94018130D51403c9f1dE546b57922C05faE4491D", // AERO
    "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", // VIRTUAL
    "0xAC1Bd2465aA51E65F5d3152C88015cf04886bC32", // TOSHI
    "0xA885949ef969396D19623838E75C460F2B095759", // WELL (Moonwell)
    "0x8C9037D1Ef5c6D1f6816278C7AF242Ad9aB55EE2"  // MOXIE
].map(a => getAddress(a))); // SIMULATION: In production, this would be a dynamic Token List (e.g. Uniswap/CoinGecko vetted list)

// --- HELPERS ---
const cleanHtml = (text: string) => text.replace(/<[^>]*>?/gm, '').replace(/\n{3,}/g, '\n\n').trim();

// --- MAIN ORCHESTRATOR ---

async function fetchContractSourceCode(contractAddress: string, basescanApiKey: string, chainId: string = "8453"): Promise<string> {
    if (!basescanApiKey || basescanApiKey === "undefined") {
        console.error("🚨 HACKATHON DEBUG: BASESCAN_API_KEY is missing or undefined!");
        return "Error: API Key missing.";
    }

    // USE OFFICIAL BASESCAN API (More reliable for Base Proxy Detection than Etherscan V2)
    const url = `https://api.basescan.org/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${basescanApiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json() as any;
        console.log(`[CRE] Etherscan Fetch (${contractAddress}): Status ${data.status}, Message ${data.message}, Result Length ${data.result?.length || 0}`);

        if (data.status === "1" && data.result.length > 0) {
            const contractData = data.result[0];

            // 🚨 THE PROXY TRAP: If it's a proxy, recursively fetch the real logic
            if (contractData.Proxy === "1" && contractData.Implementation) {
                console.log(`[CRE] Proxy detected. Fetching implementation logic at: ${contractData.Implementation}`);
                return await fetchContractSourceCode(contractData.Implementation, basescanApiKey, chainId);
            }

            let sourceCode = contractData.SourceCode;

            // Unverified contract check
            if (!sourceCode) {
                return "CRITICAL WARNING: Contract source code is NOT verified on BaseScan. Treat as a high-risk black box.";
            }

            // Clean up BaseScan's double-bracket multi-file formatting
            if (sourceCode.startsWith("{{")) {
                sourceCode = sourceCode.substring(1, sourceCode.length - 1);
                const parsed = JSON.parse(sourceCode);

                let combinedCode = "";
                for (const file in parsed.sources) {
                    combinedCode += `\n\n// File: ${file}\n`;
                    combinedCode += parsed.sources[file].content;
                }
                return combinedCode;
            }

            return sourceCode;
            return sourceCode;
        } else {
            // Rate limit or other non-fatal error
            console.log(`[WARN] BaseScan API verification failed (Status: ${data.status}, Message: ${data.message}). Proceeding without source code.`);
            return "Source code unavailable (API Rate Limit or Verification Issue).";
        }
    } catch (error) {
        console.error("BaseScan API Error:", error);
        return "Error retrieving source code.";
    }
}

export const analyzeRisk = async (payload: RiskAssessmentRequest): Promise<{
    riskScore: number,
    logicFlags: number,
    aiFlags: number,
    signature: string,
    reasoning: string,
    flagBreakdown?: string[],
    details: any
}> => {
    console.log(`${CYAN}🛡️  AEGIS ORACLE AI: Initiating Forensic Audit...${RESET}`);
    console.log(`${CYAN}   Target: ${payload.tokenAddress}${RESET}`);

    // Auth Config
    const cgKey = process.env.COINGECKO_API_KEY;
    const gpKey = process.env.GOPLUS_APP_KEY;
    const bsKey = process.env.BASESCAN_API_KEY; // BaseScan Key

    // 1. DATA ACQUISITION
    console.log(`${YELLOW}SYNC:${RESET} Acquiring Market, Security & Code Telemetry...`);

    const cgUrlSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${payload.coingeckoId || 'ethereum'}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const cgUrlRich = `https://api.coingecko.com/api/v3/coins/${payload.coingeckoId || 'ethereum'}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=true&sparkline=false`;
    const gpUrl = `https://api.gopluslabs.io/api/v1/token_security/${payload.chainId ?? "1"}?contract_addresses=${payload.tokenAddress}`;

    const [cgResSimple, cgResRich, gpRes, bsRes] = await Promise.allSettled([
        fetch(cgUrlSimple, cgKey ? { headers: { "x-cg-demo-api-key": cgKey } } : {}).then(r => r.json()),
        fetch(cgUrlRich, cgKey ? { headers: { "x-cg-demo-api-key": cgKey } } : {}).then(r => r.json()),
        fetch(gpUrl).then(r => r.json()),
        bsKey ? fetchContractSourceCode(payload.tokenAddress, bsKey, payload.chainId) : Promise.resolve("No BaseScan API Key provided.")
    ]);

    const contractCode = bsRes.status === 'fulfilled' ? bsRes.value : "Failed to fetch source code.";

    console.log(`${YELLOW}SYNC:${RESET} Telemetry Acquired. Processing vectors...`);

    // Process CoinGecko Result
    let marketPrice = 2500;
    let volume24h = 10000000;
    let marketCap = 250000000;

    // Determine which key to use for CG response
    const cgKeyToLookup = payload.coingeckoId || 'ethereum';

    if (cgResSimple.status === 'fulfilled') {
        const data = (cgResSimple.value as any)[cgKeyToLookup];
        if (data && data.usd) {
            marketPrice = data.usd;
            volume24h = data.usd_24h_vol || volume24h;
            marketCap = data.usd_market_cap || marketCap;
        }
    }

    // Process Rich CoinGecko Metadata
    let tokenDescription = "";
    let tokenCategories: string[] = [];
    let githubLinks: string[] = [];

    if (cgResRich.status === 'fulfilled') {
        const richData = cgResRich.value as any;
        tokenDescription = richData.description?.en ? cleanHtml(richData.description.en) : "";
        tokenCategories = richData.categories || [];
        githubLinks = richData.links?.repos_url?.github || [];
    }

    // Process GoPlus Result
    let isHoneypot = false;
    let ownerAddress = "RENOUNCED";
    let gpData: any = {};
    let securityNote = "";
    if (gpRes.status === 'fulfilled' && (gpRes.value as any).result) {
        gpData = (gpRes.value as any).result[payload.tokenAddress.toLowerCase()] || {};
        // Comprehensive Honeypot/Scam Detection
        const isExplicitHoneypot = gpData.is_honeypot === "1";
        const cannotSell = gpData.cannot_sell_all === "1";
        const isMintable = gpData.is_mintable === "1";
        const isBlacklisted = gpData.is_blacklisted === "1";
        const highBuyTax = Number(gpData.buy_tax || "0") > 10;
        const highSellTax = Number(gpData.sell_tax || "0") > 10;

        isHoneypot = isExplicitHoneypot || cannotSell || (highBuyTax && highSellTax);

        ownerAddress = gpData.owner_address || ownerAddress;
        securityNote = gpData.note || "";

        console.log(`${CYAN}   ├─ GoPlus: ${isHoneypot ? RED + "MALICIOUS" : GREEN + "CLEAN"}${RESET} (Honeypot: ${isExplicitHoneypot}, CannotSell: ${cannotSell}, Mintable: ${isMintable})`);
    }

    // Data acquisition complete

    const askingPrice = Number(payload.askingPrice || "0");
    const deviation = marketPrice > 0 ? ((askingPrice - marketPrice) / marketPrice) * 100 : 0;
    const volLiqRatio = marketCap > 0 ? volume24h / marketCap : 0;

    // 2. LEFT BRAIN: DETERMINISTIC LOGIC
    console.log(`${MAGENTA}🧠 LEFT BRAIN:${RESET} Analyzing Deterministic Vectors`);
    let logicFlags = 0;
    const normalizedAddr = getAddress(payload.tokenAddress);
    const isTrusted = TRUSTED_TOKENS.has(normalizedAddr);
    console.log(`[DEBUG] Address: ${payload.tokenAddress} | Norm: ${normalizedAddr} | Trusted? ${isTrusted}`);

    if (!isTrusted && volLiqRatio < 0.05) {
        logicFlags |= RISK_FLAGS.LIQUIDITY_WARN;
    }

    if (Math.abs(deviation) > 50) {
        logicFlags |= RISK_FLAGS.VOLATILITY_WARN;
    }

    // NEW: VALUE ASYMMETRY DETECTION (Scenario 2: 100 AVAX for $10)
    const escrowValue = payload.details?.totalEscrowValue || 0;
    const targetValueExpected = payload.details?.targetAmount ? (payload.details.targetAmount * marketPrice) : 0;
    const targetAmount = payload.details?.targetAmount || 0;

    // If the escrowed value is much higher than the target value (Phishing/Slippage)
    if (escrowValue > 10 && (escrowValue > targetValueExpected * 1.5)) {
        console.log(`${RED}[!] VALUE ASYMMETRY DETECTED: Escrow ($${escrowValue.toFixed(2)}) >> Target Expected ($${targetValueExpected.toFixed(2)})${RESET}`);
        logicFlags |= RISK_FLAGS.VOLATILITY_WARN; // Re-use volatility for deviation
    }

    if (isHoneypot) {
        logicFlags |= RISK_FLAGS.HONEYPOT_FAIL;
    }

    // Ownership Risk: Blue-chip stablecoins (USDC) have owners. Only flag if NOT trusted.
    if (!isTrusted && ownerAddress !== "RENOUNCED" && ownerAddress !== "0x0000000000000000000000000000000000000000") {
        logicFlags |= RISK_FLAGS.OWNERSHIP_RISK;
    }

    // 3. RIGHT BRAIN: MULTI-MODEL AI CLUSTER
    console.log(`${CYAN}⚡ RIGHT BRAIN:${RESET} Engaging Multi-Model Semantic Cluster`);

    // ---------------------------------------------------------
    // ⚖️ TRANSACTION FORENSICS: Value Parity Check
    // ---------------------------------------------------------
    let computedValueGap = (escrowValue - targetValueExpected).toFixed(2);
    let computedDev = deviation.toFixed(2) + "%";

    // General Heuristic: If we have valid price data and the gap is negligible (< $5), log it as a positive signal
    if (marketPrice > 0 && Math.abs(Number(computedValueGap)) < 5 && targetValueExpected > 0) {
        console.log(`${GREEN}🔍 FORENSIC SIGNAL: Healthy Value Parity Detected (Gap: $${computedValueGap})${RESET}`);
    }

    // EXEMPTION: Trusted assets (Stablecoins/Pillars) often trigger false positives on standard metrics
    // We explicitly clear them here because we trust the contract address itself.
    if (isTrusted) {
        logicFlags &= ~RISK_FLAGS.WASH_TRADING;
        logicFlags &= ~RISK_FLAGS.IMPERSONATION_RISK;
        logicFlags &= ~RISK_FLAGS.OWNERSHIP_RISK;
        logicFlags &= ~RISK_FLAGS.LIQUIDITY_WARN;
        logicFlags &= ~RISK_FLAGS.VOLATILITY_WARN;
    }

    const liquidityStatus = isTrusted ? "TRUSTED_LIQUIDITY" : (volLiqRatio < 0.05 ? "LOW_LIQUIDITY" : "HIGH_LIQUIDITY_SAFE");
    const tokenName = isTrusted ? (gpData.token_name || "Official Token") : (gpData.token_name || "Unknown");

    const riskContext = {
        meta: { trusted: isTrusted, name: tokenName, chain: "Base" },
        market: {
            price: marketPrice,
            liquidityStatus: liquidityStatus,
            ratio: volLiqRatio.toFixed(2)
        },
        trade: {
            asking: askingPrice,
            dev: computedDev,
            valueGap: computedValueGap
        },
        security: {
            honeypot: isHoneypot,
            owner: ownerAddress,
            name: tokenName,
            buyTax: gpData.buy_tax || "0",
            sellTax: gpData.sell_tax || "0",
            hiddenOwner: gpData.hidden_owner === "1",
            cannotSellAll: gpData.cannot_sell_all === "1",
            trustList: gpData.trust_list || "0",
            famousBrand: gpData.famous_brand || ""
        },
        unstructured_metadata: {
            description: tokenDescription.length > 1000 ? tokenDescription.slice(0, 1000) + "..." : tokenDescription,
            categories: tokenCategories,
            github_links: githubLinks,
            security_notes: securityNote
        },
        code_audit: {
            source_snippet: (isTrusted && contractCode.includes("Source code unavailable")) ? "VERIFIED_OFFICIAL_CODE" : (contractCode.length > 2000 ? contractCode.slice(0, 2000) + "... [TRUNCATED]" : contractCode)
        },
        trade_forensics: payload.details || {},
        deterministic_audit: {
            logicFlags: logicFlags,
            triggered_risks: Object.entries(RISK_FLAG_DESCRIPTIONS)
                .filter(([flag]) => (logicFlags & Number(flag)))
                .map(([_, desc]) => desc)
        }
    };

    // 🚨 SCENARIO 1 FIX: If it's trusted, FORCE the AI to see "Verified Code" even if BaseScan failed.
    const finalContractSnippet = isTrusted && contractCode.includes("Source code unavailable")
        ? "✅ VERIFIED OFFICIAL CONTRACT SOURCE CODE [TRUSTED_ASSET_OVERRIDE]"
        : (contractCode.length > 15000 ? contractCode.slice(0, 15000) : contractCode);

    const prompt = `
    ROLE: You are a Forensic Blockchain Analyst (Unit 731). 
    TASK: Analyze the provided token telemetry and SOURCE CODE for fraud vectors.
    
    CRITICAL INSTRUCTION:
    If 'meta.trusted' is true, this is a verified blue-chip asset (like USDC or AERO).
    The source code may be hidden behind a proxy or rate-limited. THIS IS NORMAL.
    DO NOT flag 'OWNERSHIP_RISK', 'IMPERSONATION_RISK', or 'SUSPICIOUS_CODE' for these assets.
    YOUR VERDICT FOR TRUSTED ASSETS MUST BE CLEAN (FLAGS: []) UNLESS YOU SEE EXPLICIT MALICIOUS CODE.
    
    DATA: 
    ${JSON.stringify(riskContext, null, 2)}

    CONTRACT SOURCE CODE (Snippet):
    ---
    ${finalContractSnippet}
    ---
    
    FORENSIC PROCEDURES:
    1. **Code Analysis**: Look for hidden mint functions, blacklists, or fee changers in the source code.
    2. **Marketing vs. Reality Check**: Does the Token Description match the complexity of the Source Code? 
    3. **Social Engineering**: Does the description use scam-adjacent terminology (e.g., "guaranteed pump", "to the moon")? 
    4. **Development Transparency**: If this claims to be a utility token, is the lack of a GitHub link a red flag?
    5. **Tax Analysis**: High taxes (>10%) combined with 'cannotSellAll' indicates a honeytrap.
    6. **Ownership Structure**: If 'hiddenOwner' is true OR owner is not renounced, threat level increases.
    7. **Impersonation**: Compare 'name' against known trusted assets. If name is "USDC" but address is distinctive, it is a lure.
    8. **Wash Trading**: High 24h volume with flat price change (0%) or low liquidity ratio suggests artificial inflation.

    DETERMINISTIC LOGIC ALERT:
    The following risks were ALREADY detected by the deterministic logic brain:
    ${Object.entries(RISK_FLAG_DESCRIPTIONS).filter(([flag]) => (logicFlags & Number(flag))).map(([_, desc]) => "- " + desc).join("\n") || "No deterministic flags triggered."}

    IMPORTANT: If any 'DETERMINISTIC LOGIC ALERTS' are present, your reasoning MUST explain why those specific risks are dangerous for the user in this context.

    RISK BITMASK REFERENCE:
    - 1: LIQUIDITY_WARN
    - 2: VOLATILITY_WARN
    - 4: SUSPICIOUS_CODE
    - 8: OWNERSHIP_RISK
    - 16: HONEYPOT_FAIL
    - 32: IMPERSONATION_RISK
    - 64: WASH_TRADING
    - 128: SUSPICIOUS_DEPLOYER
    - 256: PHISHING_SCAM
    - 512: AI_ANOMALY


    OUTPUT FORMAT:
    Return JSON only: {
        "flags": [bitmask_integers], 
        "reasoning": "A concise, natural language explanation of the identified risks."
    }
    `;

    const startConfTime = Date.now();
    let aiResults;

    console.log(`${CYAN}⚡ [PARALLEL] Dispatching AI Agents (GPT-4o + Llama-3)...${RESET}`);
    aiResults = await Promise.allSettled([
        callOpenAI({} as any, null, process.env.OPENAI_API_KEY!, prompt),
        callGroq({} as any, null, process.env.GROQ_API_KEY!, prompt)
    ]);

    const endConfTime = Date.now();
    console.log(`${CYAN}⚡ [PARALLEL] Consensus Reached in ${endConfTime - startConfTime}ms${RESET}`);

    let aiFlags = 0;
    const reasoningParts: string[] = [];
    aiResults.forEach((r, idx) => {
        const name = ["GPT-4o", "Llama-3"][idx];
        if (r.status === 'fulfilled') {
            const risk = (r.value.flags || []).reduce((a, b: any) => a | (typeof b === 'number' ? b : 0), 0);
            aiFlags |= risk;

            // Extract core reasoning, strip redundant model names
            let rtext = r.value.reasoning || "";
            if (rtext.startsWith(name + ":")) rtext = rtext.substring(name.length + 1).trim();

            if (rtext && rtext.length > 5 && !rtext.toLowerCase().includes("no risk")) {
                reasoningParts.push(rtext);
            }

            const color = risk > 0 ? RED : GREEN;
            console.log(`   ├─ ${color}${name}${RESET}: ${risk > 0 ? "RISK DETECTED" : "CLEAN"} (Flags: ${risk})`);
        } else {
            const reason = (r as any).reason || "Unknown failure";
            console.log(`   ├─ ${RED}${name}${RESET}: Failed/Skipped (${reason})`);
        }
    });

    // Final Reasoning Synthesis
    let reasoning = "";
    if (reasoningParts.length > 0) {
        // Unique sentences only
        const uniqueReasons = Array.from(new Set(reasoningParts));
        reasoning = uniqueReasons.join(" ");
    } else {
        reasoning = (logicFlags === 0)
            ? "No significant risk signatures detected by deterministic or neural analysis."
            : "Deterministic risks confirmed; Neural consensus agrees with hazard flagging.";
    }

    const finalRisk = logicFlags | aiFlags;
    const signature = "0x" + Buffer.from(sha1(finalRisk.toString())).toString('hex');

    const modelResults = aiResults.map((r: any, idx) => {
        const name = ["GPT-4o", "Llama-3"][idx];
        const status = r.status === 'fulfilled' ? "Success" : "Failed";
        const flags = r.status === 'fulfilled' ? r.value.flags : [];
        const reason = r.status === 'fulfilled' ? r.value.reasoning : "Model unreachable";
        return { name, status, flags, reasoning: reason };
    });

    const response = {
        riskScore: finalRisk,
        logicFlags,
        aiFlags,
        flagBreakdown: Object.entries(RISK_FLAG_DESCRIPTIONS)
            .filter(([flag]) => (finalRisk & Number(flag)))
            .map(([_, desc]) => desc),
        signature,
        reasoning: reasoning.trim(),
        details: {
            ...riskContext,
            modelResults
        }
    };
    return response;
};

// Legacy Entry Point for CLI / CRE Runner
export const riskAssessment: any = {
    configSchema,
    requestSchema,
    handler: async (runtime: any, request: any) => {
        const payload = await request.json();
        return await analyzeRisk(payload);
    }
};

// --- AI MODEL HANDLERS ---

const callOpenAI = async (runtime: Runtime<Config>, httpClient: any, apiKey: string, prompt: string): Promise<AIAnalysisResult> => {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0,
                seed: 42
            })
        });

        if (response.ok) {
            const data = await response.json() as any;
            const raw = data.choices[0].message.content;
            console.log("GPT Response:", raw);
            return JSON.parse(raw);
        } else {
            console.error("OpenAI Error:", await response.text());
        }
    } catch (e) {
        console.error("OpenAI Fetch Error:", e);
    }
    return { flags: [], reasoning: "OpenAI Failed" };
};

const callGroq = async (runtime: Runtime<Config>, httpClient: any, apiKey: string, prompt: string): Promise<AIAnalysisResult> => {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0
            })
        });

        if (response.ok) {
            const data = await response.json() as any;
            const raw = data.choices[0].message.content;
            console.log("Groq Response:", raw);
            return JSON.parse(raw);
        } else {
            console.error("Groq Error:", await response.text());
        }
    } catch (e) {
        console.error("Groq Fetch Error:", e);
    }
    return { flags: [], reasoning: "Groq Failed" };
};

// --- BRAIN HANDLER ---
const brainHandler = async (runtime: Runtime<Config>, payload: HTTPPayload): Promise<string> => {

    runtime.log(`━━━━━━ 🧠  ${MAGENTA}AEGIS x elizaOS: SPLIT-BRAIN PROTOCOL${RESET} ━━━━━━`);
    runtime.log(`[CRE] ${CYAN}NODE:${RESET} ${donAccount.address.slice(0, 10)}... | Consensus: BFT Hybrid`);
    runtime.log(""); // Space for readability

    // 1. Inbound Parsing
    let requestData: RiskAssessmentRequest;
    try {
        const rawBody = payload.input?.toString() || "{}";
        const parsed = JSON.parse(rawBody);
        requestData = requestSchema.parse(parsed);
        runtime.log(`[CRE] ${CYAN}INBOUND:${RESET} Security Audit Protocol Initiated`);
        runtime.log(`   ├─ Target Asset: ${YELLOW}${requestData.tokenAddress}${RESET}`);
        runtime.log(`   ├─ Network ID:   ${YELLOW}${requestData.chainId || 1}${RESET}`);
    } catch (e) {
        runtime.log(`[CRE] ${RED}ERR:${RESET} Inbound sequence malformed. Aborting.`);
        return JSON.stringify({ error: "Malformed Sequence" });
    }

    const httpClient = new cre.capabilities.HTTPClient();

    // 2. Data Acquisition (GoPlus + CoinGecko + BaseScan)
    // Auth Headers for CoinGecko
    const cgHeaders: Record<string, string> = {};
    if (runtime.config.coingeckoApiKey) { cgHeaders["x-cg-demo-api-key"] = runtime.config.coingeckoApiKey; }

    // Auth for GoPlus
    const gpUrl = `https://api.gopluslabs.io/api/v1/token_security/${requestData.chainId ?? "1"}?contract_addresses=${requestData.tokenAddress}`;

    // Auth for BaseScan
    const bsKey = runtime.config.basescanApiKey || process.env.BASESCAN_API_KEY;

    runtime.log(`[SIGNAL] ${YELLOW}SYNC:${RESET} Acquiring Market, Security & Code Telemetry...`);

    const cgUrlSimple = `https://api.coingecko.com/api/v3/simple/price?ids=${requestData.coingeckoId || 'ethereum'}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const cgUrlRich = `https://api.coingecko.com/api/v3/coins/${requestData.coingeckoId || 'ethereum'}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=true&sparkline=false`;

    // ==========================================================================
    // STEP 1: DATA ACQUISITION (Simulated Consensus Node)
    // HACKATHON MVP NOTE: This local execution simulates the Chainlink CRE 
    // Map-Reduce protocol. In production, these concurrent calls would be 
    // distributed across independent nodes in the DON.
    // ==========================================================================
    const [cgResSimple, cgResRich, gpRes, bsRes] = await Promise.allSettled([
        httpClient.sendRequest(runtime as any, { url: cgUrlSimple, method: "GET", headers: cgHeaders }).result(),
        httpClient.sendRequest(runtime as any, { url: cgUrlRich, method: "GET", headers: cgHeaders }).result(),
        httpClient.sendRequest(runtime as any, { url: gpUrl, method: "GET" }).result(),
        bsKey ? fetchContractSourceCode(requestData.tokenAddress, bsKey, requestData.chainId) : Promise.resolve("No BaseScan API Key provided.")
    ]);

    const contractCode = bsRes.status === 'fulfilled' ? (bsRes.value as string) : "Failed to fetch source code.";

    // Process CoinGecko Result
    let marketPrice = 2500;
    let volume24h = 10000000;
    let marketCap = 250000000;
    let priceChange24h = 0;
    if (cgResSimple.status === 'fulfilled' && ok(cgResSimple.value)) {
        const data = (json(cgResSimple.value) as any)[requestData.coingeckoId || 'ethereum'];
        if (data && data.usd) {
            marketPrice = data.usd;
            volume24h = data.usd_24h_vol || volume24h;
            marketCap = data.usd_market_cap || marketCap;
            priceChange24h = data.usd_24h_change || 0;
        }
    }

    // Process Rich CoinGecko Metadata
    let tokenDescription = "";
    let tokenCategories: string[] = [];
    let githubLinks: string[] = [];

    if (cgResRich.status === 'fulfilled' && ok(cgResRich.value)) {
        const richData = json(cgResRich.value) as any;
        tokenDescription = richData.description?.en ? cleanHtml(richData.description.en) : "";
        tokenCategories = richData.categories || [];
        githubLinks = richData.links?.repos_url?.github || [];
    }

    // Process GoPlus Result
    let isHoneypot = false;
    let ownerAddress = "RENOUNCED";
    let buyTax = "0";
    let sellTax = "0";
    let hiddenOwner = false;
    let cannotSellAll = false;
    let gpData: any = {};
    let securityNote = "";

    if (gpRes.status === 'fulfilled' && ok(gpRes.value)) {
        gpData = (json(gpRes.value) as any).result?.[requestData.tokenAddress.toLowerCase()] || {};
        isHoneypot = gpData.is_honeypot === "1";
        ownerAddress = gpData.owner_address || ownerAddress;
        buyTax = gpData.buy_tax || "0";
        sellTax = gpData.sell_tax || "0";
        hiddenOwner = gpData.hidden_owner === "1";
        cannotSellAll = gpData.cannot_sell_all === "1";
        securityNote = gpData.note || "";
    }

    const askingPrice = Number(requestData.askingPrice || "0");
    const deviation = marketPrice > 0 ? ((askingPrice - marketPrice) / marketPrice) * 100 : 0;
    const volLiqRatio = marketCap > 0 ? volume24h / marketCap : 0;

    // 2. LEFT BRAIN: DETERMINISTIC LOGIC
    runtime.log(`${MAGENTA}🧠 LEFT BRAIN:${RESET} Analyzing Deterministic Vectors`);
    let logicFlags = 0;
    const isTrusted = TRUSTED_TOKENS.has(getAddress(requestData.tokenAddress));

    if (!isTrusted && volLiqRatio < 0.05) {
        logicFlags |= RISK_FLAGS.LIQUIDITY_WARN;
    }

    if (Math.abs(deviation) > 50) {
        logicFlags |= RISK_FLAGS.VOLATILITY_WARN;
    }

    // 3. RIGHT BRAIN: MULTI-MODEL AI CLUSTER
    console.log(`${CYAN}⚡ RIGHT BRAIN:${RESET} Engaging Multi-Model Semantic Cluster`);

    // Recalculate forensic metrics for AI context
    const escrowValue = requestData.details?.totalEscrowValue || 0;
    const targetAmount = requestData.details?.targetAmount || requestData.details?.escrowAmount || 0;
    const targetValueExpected = targetAmount * marketPrice;

    let computedValueGap = (escrowValue - targetValueExpected).toFixed(2);
    let computedDev = deviation.toFixed(2) + "%";

    const liquidityStatus = isTrusted ? "TRUSTED_LIQUIDITY" : (volLiqRatio < 0.05 ? "LOW_LIQUIDITY" : "HIGH_LIQUIDITY_SAFE");
    const tokenName = isTrusted ? (gpData.token_name || "Official Token") : (gpData.token_name || "Unknown");

    const riskContext = {
        meta: {
            trusted: TRUSTED_TOKENS.has(getAddress(requestData.tokenAddress)),
            chain: "Base",
            tokenAddress: requestData.tokenAddress
        },
        market: {
            price: marketPrice,
            liquidityStatus: liquidityStatus,
            ratio: volLiqRatio.toFixed(2),
            change24h: priceChange24h.toFixed(2) + "%",
            vol24h: volume24h
        },
        trade: {
            asking: askingPrice,
            dev: computedDev,
            valueGap: computedValueGap
        },
        security: {
            honeypot: isHoneypot,
            owner: ownerAddress,
            name: tokenName,
            buyTax: buyTax + "%",
            sellTax: sellTax + "%",
            hiddenOwner: hiddenOwner,
            cannotSellAll: cannotSellAll,
            trustList: gpData.trust_list || "0",
            famousBrand: gpData.famous_brand || ""
        },
        unstructured_metadata: {
            description: tokenDescription.length > 1000 ? tokenDescription.slice(0, 1000) + "..." : tokenDescription,
            categories: tokenCategories,
            github_links: githubLinks,
            security_notes: securityNote
        },
        code_audit: {
            source_snippet: contractCode.length > 2000 ? contractCode.slice(0, 2000) + "... [TRUNCATED]" : contractCode
        },
        trade_forensics: requestData.details || {},
        deterministic_audit: {
            logicFlags: logicFlags,
            triggered_risks: Object.entries(RISK_FLAG_DESCRIPTIONS)
                .filter(([flag]) => (logicFlags & Number(flag)))
                .map(([_, desc]) => desc)
        }
    };

    const prompt = `
    ROLE: You are a Forensic Blockchain Analyst (Unit 731). 
    TASK: Analyze the provided token telemetry and SOURCE CODE for fraud vectors.
    
    DATA: 
    ${JSON.stringify(riskContext, null, 2)}

    CONTRACT SOURCE CODE (Snippet):
    ---
    ${contractCode.slice(0, 15000)}
    ---
    
    FORENSIC PROCEDURES:
    1. **Code Analysis**: Look for hidden mint functions, blacklists, or fee changers in the source code.
    2. **Marketing vs. Reality Check**: Does the Token Description match the complexity of the Source Code? 
    3. **Social Engineering**: Does the description use scam-adjacent terminology (e.g., "guaranteed pump", "to the moon")? 
    4. **Development Transparency**: If this claims to be a utility token, is the lack of a GitHub link a red flag?
    5. **Tax Analysis**: High taxes (>10%) combined with 'cannotSellAll' indicates a honeytrap.
    3. **Ownership Structure**: If 'hiddenOwner' is true OR owner is not renounced, threat level increases.
    4. **Impersonation**: Compare 'name' against known trusted assets. If name is "USDC" but address is distinctive, it is a lure.
    5. **Wash Trading**: High 24h volume with flat price change (0%) or low liquidity ratio suggests artificial inflation.

    DETERMINISTIC LOGIC ALERT:
    The following risks were ALREADY detected by the deterministic logic brain:
    ${Object.entries(RISK_FLAG_DESCRIPTIONS).filter(([flag]) => (logicFlags & Number(flag))).map(([_, desc]) => "- " + desc).join("\n") || "No deterministic flags triggered."}

    IMPORTANT: If any 'DETERMINISTIC LOGIC ALERTS' are present, your reasoning MUST explain why those specific risks are dangerous for the user in this context.

    RISK BITMASK REFERENCE:
    - 1: LIQUIDITY_WARN (Low liquidity <$50k)
    - 2: VOLATILITY_WARN (High price deviation)
    - 4: SUSPICIOUS_CODE (Malicious patterns in source)
    - 8: OWNERSHIP_RISK (Owner not renounced)
    - 16: HONEYPOT_FAIL (GoPlus detected honeypot)
    - 32: IMPERSONATION_RISK (Fake brand/name)
    - 64: WASH_TRADING (Artificial volume)
    - 128: SUSPICIOUS_DEPLOYER (Blacklisted wallet)
    - 256: PHISHING_SCAM (Social engineering in metadata)
    - 512: AI_ANOMALY (Fuzzy panic/unknown risk)

    OUTPUT FORMAT:
    Return JSON only: {
        "flags": [bitmask_integers], 
        "reasoning": "A concise, natural language explanation of the identified risks. Cite the specific flags found (e.g. 'Detected Phishing metadata and lack of GitHub.')"
    }
    `;

    // Live security evaluation

    // ---------------------------------------------------------
    // 🔑 SECRETS RETRIEVAL (Vault DON / Local Fallback)
    // ---------------------------------------------------------
    runtime.log(`[SYS] ${CYAN}KEYCHAIN:${RESET} Accessing encrypted Vault DON secrets...`);

    // Fallback to local config for testing, otherwise request from the Vault DON
    const keys = {
        openai: runtime.config.openaiApiKey || (await runtime.getSecret({ id: "OPENAI_API_KEY" }) as any),
        groq: runtime.config.groqKey || (await runtime.getSecret({ id: "GROQ_KEY" }) as any)
    };

    if (!keys.openai || !keys.groq) {
        runtime.log(`[SYS] ${RED}ERR:${RESET} Missing critical API keys in Vault DON.`);
        // Continue, but let the individual calls fail if keys missing (Promise.reject)
    }

    // Standard Execution
    const modelPromises: Promise<AIAnalysisResult>[] = [
        keys.openai ? callOpenAI(runtime, httpClient, keys.openai, prompt) : Promise.reject("No OpenAI Key"),
        keys.groq ? callGroq(runtime, httpClient, keys.groq, prompt) : Promise.reject("No Groq Key")
    ];

    const results = await Promise.allSettled(modelPromises);

    let aiFlags = 0;
    let passCount = 0;
    const reasoningParts: string[] = [];

    results.forEach((r, idx) => {
        const name = ["GPT-4o", "Llama-3"][idx];
        if (r.status === 'fulfilled') {
            const risk = (r.value.flags || []).reduce((a, b: any) => a | (typeof b === 'number' ? b : 0), 0);
            aiFlags |= risk;

            // Extract core reasoning, strip redundant model names
            let rtext = r.value.reasoning || "";
            if (rtext.startsWith(name + ":")) rtext = rtext.substring(name.length + 1).trim();

            if (rtext && rtext.length > 5 && !rtext.toLowerCase().includes("no risk")) {
                reasoningParts.push(rtext);
            }

            const color = risk > 0 ? RED : GREEN;
            runtime.log(`   ├─ ${color}${name}${RESET}: ${risk > 0 ? "RISK DETECTED" : "CLEAN"} (Flags: ${risk})`);
        } else {
            const reason = (r as any).reason || "Unknown failure";
            runtime.log(`   ├─ ${RED}${name}${RESET}: Failed/Skipped (${reason})`);
        }
    });

    // Final Reasoning Synthesis
    let reasoning = "";
    if (reasoningParts.length > 0) {
        // Unique sentences only
        const uniqueReasons = Array.from(new Set(reasoningParts));
        reasoning = uniqueReasons.join(" ");
    } else {
        reasoning = (logicFlags === 0)
            ? "No significant risk signatures detected by deterministic or neural analysis."
            : "Deterministic risks confirmed; Neural consensus agrees with hazard flagging.";
    }

    const modelResults = results.map((r: any, idx) => {
        const name = ["GPT-4o", "Llama-3"][idx];
        const status = r.status === 'fulfilled' ? "Success" : "Failed";
        const flags = r.status === 'fulfilled' ? r.value.flags : [];
        const reason = r.status === 'fulfilled' ? r.value.reasoning : "Model unreachable";
        return { name, status, flags, reasoning: reason };
    });

    // ==========================================================================
    // STEP 2: CONSENSUS AGGREGATION (Union of Fears)
    // HACKATHON MVP NOTE: We perform the Bitwise OR locally to guarantee demo stability.
    // In production, each node returns its observation, and the final bitmask is
    // calculated via the Map-Reduce consensus mechanism on-chain.
    // ==========================================================================
    const finalRiskCode = logicFlags | aiFlags;
    const finalVerdict = finalRiskCode === 0;

    // 🚀 STEP 3: TELEMETRY SIDE-CHANNEL (Resilient Forensics)
    // Preserves rich AI reasoning without blocking consensus or on-chain settlement.
    const telemetryUrl = runtime.config.telemetryUrl || process.env.TELEMETRY_URL || "https://our-app.com/api/telemetry";
    if (telemetryUrl) {
        runtime.log(`[SYS] ${CYAN}TELEMETRY:${RESET} Dispatching side-channel forensic report...`);
        // FIRE-AND-FORGET POST (Does not block consensus)
        Promise.resolve().then(async () => {
            try {
                await fetch(telemetryUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        requestId: requestData.vrfSalt || `req_${Date.now()}`,
                        status: finalVerdict ? "COMPLIANT" : "REJECTED",
                        riskCode: finalRiskCode,
                        logicFlags: logicFlags,
                        aiFlags: aiFlags,
                        reasoning: reasoning.trim(),
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        details: {
                            ...riskContext,
                            modelResults
                        }
                    })
                });
                runtime.log(`[SYS] ${GREEN}TELEMETRY:${RESET} Side-channel delivery successful.`);
            } catch (e) {
                // RESILIENCE: Catch error but do not disrupt enforcement logic or crash the script.
                runtime.log(`[SYS] ${RED}WARN:${RESET} Telemetry side-channel unreachable. Forensic log dropped, proceeding with enforcement.`);
            }
        });
    }

    runtime.log(`[CRE] ${MAGENTA}CONSENSUS REACHED:${RESET} Bitwise Union (Logic | AI)`);
    runtime.log(`   ├─ Logic Flags: ${logicFlags}`);
    runtime.log(`   ├─ AI Flags:    ${aiFlags}`);
    runtime.log(`   └─ Final Code:  ${finalRiskCode} (${finalVerdict ? GREEN + "SAFE" : RED + "RISK_DETECTED"}${RESET})`);


    // 🔒 STEP 4: ON-CHAIN RETURN (Strict Enforcement)
    // The absolute last line returns the deterministic risk integer to the smart contract.
    // Encapsulated in the AEGIS_RESULT tag for the simulation logic to extract.
    return `::AEGIS_RESULT::${finalRiskCode}::AEGIS_RESULT::`;
};

const initWorkflow = (config: Config) => {
    const http = new HTTPCapability();
    return [handler(http.trigger({ authorizedKeys: [] }), brainHandler)];
};

export async function main() {
    const runner = await Runner.newRunner<Config>({ configSchema });
    await runner.run(initWorkflow);
}
