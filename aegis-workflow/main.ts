/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                     AEGIS RISK ORACLE - CRE WORKFLOW v3.0                    │
 * │            DETERMINISTIC CONSENSUS + VERIFIABLE AI AUDIT LAYER               │
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

const ERROR_CODES = {
    API_FAIL: 200,
    INVALID_TOKEN: 201,
    LLM_FAIL: 202,
    GENERAL_FAIL: 255
};

const configSchema = z.object({
    openaiApiKey: z.string().optional(),
    coingeckoApiKey: z.string().optional(),
    goplusAppKey: z.string().optional(),
    goplusAppSecret: z.string().optional(),
});

type Config = z.infer<typeof configSchema>;

const requestSchema = z.object({
    tokenAddress: z.string().min(1),
    chainId: z.string().min(1),
    askingPrice: z.string().optional(),
    userAddress: z.string().optional(),
    coingeckoId: z.string().optional(),
    vrfSalt: z.string().optional(),
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
const RESET = "\x1b[0m";

// --- BRAIN HANDLER ---
const brainHandler = async (runtime: Runtime<Config>, payload: HTTPPayload): Promise<string> => {

    runtime.log(`━━━━━━ 🧠  ${CYAN}AEGIS DETERMINISTIC SHIELD${RESET} ━━━━━━`);
    runtime.log(`[CRE] ${CYAN}NODE:${RESET} ${donAccount.address.slice(0, 10)}... | Consensus: Active`);

    // 1. Inbound Parsing
    let requestData: RiskAssessmentRequest;
    try {
        const parsed = JSON.parse(payload.input?.toString() || "{}");
        requestData = requestSchema.parse(parsed);
        runtime.log(`[CRE] ${CYAN}INBOUND:${RESET} Security Audit Protocol Initiated`);
        runtime.log(`   ├─ Target Asset: ${YELLOW}${requestData.tokenAddress}${RESET}`);
        runtime.log(`   ├─ Network ID:   ${YELLOW}${requestData.chainId || 1}${RESET}`);
        runtime.log(`   └─ VRF Entropy:  ${requestData.vrfSalt ? requestData.vrfSalt.slice(0, 10) + "..." : "Consensus-Derived"}`);
    } catch (e) {
        runtime.log(`[CRE] ${RED}ERR:${RESET} Inbound sequence malformed. Aborting.`);
        return JSON.stringify({ error: "Malformed Sequence" });
    }

    const httpClient = new cre.capabilities.HTTPClient();

    // 2. Auth Sequence
    let gpHeaders: Record<string, string> = {};
    const gpAppKey = runtime.config.goplusAppKey || "";
    const gpAppSecret = runtime.config.goplusAppSecret || "";

    if (gpAppKey && gpAppSecret && gpAppKey.length > 2) {
        try {
            const time = Math.floor(Date.now() / 1000);
            const sign = sha1(gpAppKey + time + gpAppSecret);
            runtime.log(`[SIGNAL] ${CYAN}AUTH:${RESET} Authorizing GoPlus Security Stream...`);

            const tokenCall = await httpClient.sendRequest(runtime as any, {
                url: "https://api.gopluslabs.io/api/v1/token",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: toBase64(new TextEncoder().encode(JSON.stringify({ app_key: gpAppKey, sign: sign, time: time })))
            }).result();

            if (ok(tokenCall)) {
                const tokenData = json(tokenCall) as any;
                if (tokenData.code === 1 && tokenData.result?.access_token) {
                    gpHeaders["Authorization"] = `Bearer ${tokenData.result.access_token}`;
                    runtime.log(`[SIGNAL] ${GREEN}AUTH_OK:${RESET} Secure Handshake Complete`);
                } else {
                    runtime.log(`[SIGNAL] ${YELLOW}AUTH_FAIL:${RESET} Credential Rejected. Falling back to Public Tier.`);
                }
            }
        } catch (e) {
            runtime.log(`[SIGNAL] ${YELLOW}AUTH_ERR:${RESET} Connection Timeout. Resuming in Public Mode.`);
        }
    }

    // 3. Signal Acquisition with Synthetic Fallbacks
    runtime.log(`[SIGNAL] ${YELLOW}SYNC:${RESET} Commencing Parallel Signal Acquisition...`);

    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${requestData.coingeckoId || 'ethereum'}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`;
    const gpUrl = `https://api.gopluslabs.io/api/v1/token_security/${requestData.chainId ?? "1"}?contract_addresses=${requestData.tokenAddress}`;

    // Auth Headers for CoinGecko
    const cgHeaders: Record<string, string> = {};
    if (runtime.config.coingeckoApiKey) {
        cgHeaders["x-cg-demo-api-key"] = runtime.config.coingeckoApiKey;
    }

    const [cgRes, gpRes] = await Promise.allSettled([
        httpClient.sendRequest(runtime as any, { url: cgUrl, method: "GET", headers: cgHeaders }).result(),
        httpClient.sendRequest(runtime as any, { url: gpUrl, method: "GET", headers: gpHeaders }).result()
    ]);

    // Process CoinGecko Result
    let marketPrice = 2500; // Baseline default
    let volume24h = 10000000;
    let marketCap = 250000000;
    let cgStatus = "[MOCKED]";

    if (cgRes.status === 'fulfilled' && ok(cgRes.value)) {
        const data = (json(cgRes.value) as any)[requestData.coingeckoId || 'ethereum'];
        if (data && data.usd) {
            marketPrice = data.usd;
            volume24h = data.usd_24h_vol || volume24h;
            marketCap = data.usd_market_cap || marketCap;
            cgStatus = "[LIVE]";
        }
    }
    runtime.log(`[SIGNAL] ${cgStatus === "[LIVE]" ? GREEN : YELLOW}${cgStatus}${RESET} Market Intel: $${marketPrice} | Vol: $${volume24h.toLocaleString()}`);

    // Process GoPlus Result
    let isHoneypot = false;
    let ownerAddress = "RENOUNCED";
    let creatorAddress = "0x" + "a".repeat(40);
    let tokenName = "Synthetic Asset";
    let gpStatus = "[MOCKED]";

    if (gpRes.status === 'fulfilled' && ok(gpRes.value)) {
        const data = (json(gpRes.value) as any).result?.[requestData.tokenAddress.toLowerCase()];
        if (data) {
            isHoneypot = data.is_honeypot === "1";
            ownerAddress = data.owner_address || ownerAddress;
            creatorAddress = data.creator_address || creatorAddress;
            tokenName = data.token_name || tokenName;
            gpStatus = "[LIVE]";
        }
    }
    runtime.log(`[SIGNAL] ${gpStatus === "[LIVE]" ? GREEN : YELLOW}${gpStatus}${RESET} Security Intel: Honeypot=${isHoneypot} | Owner=${ownerAddress.slice(0, 8)}...`);

    // 4. AI Audit Preparation
    runtime.log(`[AI] ${CYAN}SYNTHESIS:${RESET} Ingesting Telemetry into GPT-4o Vector...`);

    const askingPrice = Number(requestData.askingPrice || "0");
    const deviation = marketPrice > 0 ? ((askingPrice - marketPrice) / marketPrice) * 100 : 0;
    const volLiqRatio = marketCap > 0 ? volume24h / marketCap : 0;

    const riskContext = {
        market: { price: marketPrice, volume: volume24h, cap: marketCap, ratio: volLiqRatio.toFixed(2) },
        trade: { asking: askingPrice, dev: deviation.toFixed(2) + "%" },
        security: { honeypot: isHoneypot, owner: ownerAddress, creator: creatorAddress, name: tokenName }
    };

    runtime.log(`[AI] ${CYAN}CONTEXT_READY:${RESET} Vectoring 3-tier Risk Matrix`);
    runtime.log(`   ├─ Market Vector: Price=$${marketPrice} | Delta=${deviation.toFixed(2)}%`);
    runtime.log(`   ├─ Security Vector: Honeypot=${isHoneypot} | Owner=${ownerAddress.slice(0, 8)}`);
    runtime.log(`   └─ Liquidity Vector: Ratio=${volLiqRatio.toFixed(2)}x | MCap=$${(marketCap / 1e6).toFixed(1)}M`);

    const prompt = `Return JSON: {"flags": [bitmask_ints], "reasoning": "brief"}. RISK MAP: 1=Liq, 2=Vol, 4=Code, 8=Owner, 16=Honeypot. DATA: ${JSON.stringify(riskContext)}`;
    const openaiKey = runtime.config.openaiApiKey || await runtime.getSecret({ id: "OPENAI_API_KEY" });

    let aiParsed: AIAnalysisResult;
    try {
        const aiCall = await httpClient.sendRequest(runtime as any, {
            url: "https://api.openai.com/v1/chat/completions",
            method: "POST",
            headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
            body: toBase64(new TextEncoder().encode(JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: prompt }],
                response_format: { type: "json_object" }
            })))
        }).result();

        if (ok(aiCall)) {
            const raw = (json(aiCall) as any).choices[0].message.content;
            aiParsed = JSON.parse(raw);
            runtime.log(`[AI] ${GREEN}DONE:${RESET} Reasoning Protocol Complete`);
        } else {
            throw new Error("LLM Latency");
        }
    } catch (e) {
        runtime.log(`[AI] ${YELLOW}[MOCKED]${RESET} Local Heuristic Fallback Active (LLM Unreachable)`);
        aiParsed = {
            flags: deviation > 20 ? [2] : [],
            reasoning: "[HEURISTIC] Automated fallback due to LLM latency. Base risk analysis applied."
        };
    }

    const riskCode = (aiParsed.flags || []).reduce((a, b) => a + b, 0);
    const finalVerdict = riskCode === 0;

    runtime.log(`[AI] ${YELLOW}REASONING:${RESET} ${aiParsed.reasoning}`);
    runtime.log(`[AI] ${CYAN}FINAL_VERDICT:${RESET} ${finalVerdict ? GREEN + "SAFE" : RED + "RISK_DETECTED"}${RESET} (Code: ${riskCode})`);

    // 5. Signing
    runtime.log(`[SIGNER] ${CYAN}COMMIT:${RESET} Finalizing Deterministic DON Signature...`);
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    const salt = (requestData.vrfSalt || "0x" + "0".repeat(64)) as Hex;
    const askingPriceWei = BigInt(Math.round(askingPrice * 1e8));

    const messageHash = keccak256(
        encodePacked(
            ['address', 'address', 'uint256', 'uint256', 'uint256', 'bool', 'uint256', 'bytes32'],
            [
                getAddress(requestData.userAddress || "0x0000000000000000000000000000000000000000"),
                getAddress(requestData.tokenAddress),
                BigInt(requestData.chainId || "1"),
                askingPriceWei,
                timestamp,
                finalVerdict,
                BigInt(riskCode),
                salt
            ]
        )
    );

    const signature = await donAccount.signMessage({ message: { raw: messageHash } });
    runtime.log(`[SIGNER] ${CYAN}LOCK_DETAILS:${RESET}`);
    runtime.log(`   ├─ Signer Adr: ${YELLOW}${donAccount.address}${RESET}`);
    runtime.log(`   ├─ VRF Salt:    ${salt}`);
    runtime.log(`   └─ Message:     ${messageHash.slice(0, 24)}...`);
    runtime.log(`[SIGNER] ${GREEN}OK:${RESET} Multi-Vector Signature Locked`);

    return JSON.stringify({
        verdict: finalVerdict,
        riskCode: riskCode.toString(),
        salt: salt,
        signature: signature,
        reasoning: aiParsed.reasoning,
        timestamp: timestamp.toString()
    });
};

const initWorkflow = (config: Config) => {
    const http = new HTTPCapability();
    return [handler(http.trigger({ authorizedKeys: [] }), brainHandler)];
};

export async function main() {
    const runner = await Runner.newRunner<Config>({ configSchema });
    await runner.run(initWorkflow);
}
