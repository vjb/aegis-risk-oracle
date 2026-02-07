import { HTTPCapability, handler, Runner, type Runtime, type HTTPPayload, cre, type NodeRuntime, ok, text, json } from "@chainlink/cre-sdk";
import { z } from "zod";

const configSchema = z.object({
    openaiApiKey: z.string().optional(),
});

type Config = z.infer<typeof configSchema>;

// Request payload schema for risk assessment (with Zod validation)
// 🚀 CRE BEST PRACTICE: Using Zod for strict input sanitization
const requestSchema = z.object({
    tokenAddress: z.string().min(1, "Token address is required"),
    chainId: z.string().min(1, "Chain ID is required"),
    askingPrice: z.string().optional(),
    amount: z.string().optional(),
    userAddress: z.string().optional(),
});

type RiskAssessmentRequest = z.infer<typeof requestSchema>;

interface AIAnalysisResult {
    risk_score: number;
    decision: string;
    reasoning: string;
    entropy: string;
    price: string;
}

const brainHandler = async (runtime: Runtime<Config>, payload: HTTPPayload): Promise<string> => {
    runtime.log("🧠 [AEGIS] Starting Intelligent Analysis...");

    // Parse and validate request payload with error handling
    let requestData: RiskAssessmentRequest;

    if (!payload.input || payload.input.length === 0) {
        // Default to USDC on Base for testing
        runtime.log("📝 No payload provided, using defaults");
        requestData = {
            tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            chainId: "8453"
        };
    } else {
        try {
            // Parse JSON
            const parsed = JSON.parse(payload.input.toString());

            // Validate with Zod schema
            requestData = requestSchema.parse(parsed);
            runtime.log("✓ Payload validated successfully");
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            runtime.log(`❌ Invalid payload: ${errorMsg}`);
            return JSON.stringify({
                error: "Invalid request payload",
                details: errorMsg,
                risk_score: 10,
                decision: "REJECT"
            });
        }
    }

    const tokenAddress = requestData.tokenAddress;
    const chainId = requestData.chainId;

    runtime.log(`📋 Request: Token ${tokenAddress} on Chain ${chainId}`);

    // 🚀 CRE CAPABILITY: Using HTTPClient for decentralized data fetching
    const httpClient = new cre.capabilities.HTTPClient();

    // 1-3. Fetch data parallelized (Price, Entropy, Security)
    runtime.log("📊 Initiating parallel data fetching...");

    const [priceResult, entropyResult, securityResult] = await Promise.all([
        // 1. Fetch ETH price from CoinGecko
        httpClient.sendRequest(runtime, {
            url: "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
            method: "GET"
        }).result(),

        // 2. Fetch quantum entropy from QRNG
        httpClient.sendRequest(runtime, {
            url: "https://qrng.anu.edu.au/API/jsonI.php?length=1&type=hex16&size=32",
            method: "GET"
        }).result(),

        // 3. Fetch security data from GoPlus Labs
        httpClient.sendRequest(runtime, {
            url: `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`,
            method: "GET"
        }).result()
    ]);

    // Process Price Results
    const priceData = ok(priceResult) ? json(priceResult) : null;
    const ethPrice = String(priceData?.ethereum?.usd || "0");
    runtime.log(`✓ Price Check: $${ethPrice}`);

    // Process Entropy Results
    const entropyData = ok(entropyResult) ? json(entropyResult) : null;
    const entropyFromAPI = entropyData?.data?.[0];
    let entropy: string;
    if (entropyFromAPI) {
        entropy = entropyFromAPI;
        runtime.log(`✓ Quantum Entropy: ${entropy.substring(0, 16)}...`);
    } else {
        entropy = "0x00000000000000000000000000000000";
        runtime.log(`⚠️ QRNG API fallback used`);
    }

    // Process Security Results
    const securityData = ok(securityResult) ? json(securityResult) : null;
    const tokenData = securityData?.result?.[tokenAddress.toLowerCase()] || {};
    const isHoneypot = String(tokenData.is_honeypot) === "1";
    const trustList = String(tokenData.trust_list) === "1";
    runtime.log(`✓ Security Check - Honeypot: ${isHoneypot}, Trust: ${trustList}`);

    // 4. Call OpenAI for AI risk analysis
    runtime.log("🤖 Calling OpenAI for risk analysis...");
    // Build context for AI analysis
    const context = {
        current_price: ethPrice,
        asking_price: requestData.askingPrice || null,
        amount: requestData.amount || null,
        security_metadata: {
            is_honeypot: isHoneypot,
            trust_list: trustList,
            token_address: tokenAddress,
            chain_id: chainId
        },
        entropy: entropy
    };

    // 🚀 CRE BEST PRACTICE: Using Runner Config for simulation & Secure Secrets for production
    // This allows the workflow to be tested locally with a config file and 
    // run securely on the DON using encrypted secrets.
    const openaiKey = runtime.config.openaiApiKey || await runtime.getSecret("OPENAI_API_KEY");

    const openaiRequestBody = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are an autonomous Risk Officer for a DeFi protocol. Analyze security and price data.

Evaluation Criteria:
1. Honeypot Check: If is_honeypot is true, decision MUST be REJECT
2. Price Manipulation: If asking_price deviates >50% from current_price, decision MUST be REJECT
3. High Risk: If risk_score >= 7, decision MUST be REJECT
4. High Value: If (amount * asking_price) > 50,000 USD, increase risk score by 1-2 points
5. Trust: If trust_list is true, lower risk score by 2-3 points
6. Price Analysis: If asking_price is provided, compare to current_price. Flag deviations >10%
7. Risk Score Range: MUST be between 0 and 10 (where 0=lowest risk, 10=highest risk)

Decision Rules:
- REJECT: Honeypot OR price deviation >50% OR risk_score >= 7
- EXECUTE: Otherwise

Output Format (MUST be valid JSON):
{ "risk_score": number, "decision": "EXECUTE" | "REJECT", "reasoning": "string" }

IMPORTANT: risk_score must be an integer from 0 to 10 only.`
            },
            { role: "user", content: `Context: ${JSON.stringify(context)}` }
        ],
        response_format: { type: "json_object" }
    });

    // Convert body to base64 as required by CRE HTTPClient
    const bodyBase64 = Buffer.from(openaiRequestBody).toString('base64');

    const aiResponse = httpClient.sendRequest(runtime, {
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json"
        },
        body: bodyBase64
    }).result();

    let aiResult: AIAnalysisResult;

    if (ok(aiResponse)) {
        const aiData: any = json(aiResponse);
        const aiDecision = JSON.parse(aiData?.choices?.[0]?.message?.content || "{}");

        aiResult = {
            risk_score: Number(aiDecision.risk_score || 5),
            decision: String(aiDecision.decision || "EXECUTE"),
            reasoning: String(aiDecision.reasoning || "AI analysis completed"),
            entropy: entropy,
            price: ethPrice
        };
        runtime.log("✓ AI Analysis Complete");
    } else {
        runtime.log("⚠️ AI API failed, using fallback analysis");
        aiResult = {
            risk_score: isHoneypot ? 10 : 5,
            decision: isHoneypot ? "REJECT" : "EXECUTE",
            reasoning: "Fallback analysis - AI API unavailable",
            entropy: entropy,
            price: ethPrice
        };
    }

    runtime.log(`🔍 [AEGIS] Analysis Result: ${JSON.stringify(aiResult)}`);

    // Verifiable AI Logging
    runtime.log(`💰 [PRICE] ETH: $${aiResult.price || 'N/A'}`);
    if (aiResult.entropy) {
        runtime.log(`⚛️ [ENTROPY] Quantum Salt: ${aiResult.entropy.substring(0, 10)}...`);
    } else {
        runtime.log("⚛️ [ENTROPY] Quantum Salt: N/A");
    }
    runtime.log(`🔍 RISK SCORE: ${aiResult.risk_score}/10`);
    runtime.log(`🤖 AI REASONING: ${aiResult.reasoning}`);
    runtime.log(`⚖️ FINAL VERDICT: ${aiResult.decision || 'REJECT'}`);

    // Create structured result payload (what would be signed by DON in production)
    const resultPayload = {
        tokenAddress,
        chainId,
        riskScore: aiResult.risk_score,
        decision: aiResult.decision || 'REJECT',
        reasoning: aiResult.reasoning,
        price: ethPrice,
        entropy: entropy,
        timestamp: Date.now(),
    };

    // Mock DON signature for demo (in production, this would be signed by DON's private key)
    // Using entropy as a realistic-looking signature
    const mockSignature = `0x${entropy}`;

    // Mock DON public key (in production, this would be the actual DON's public key)
    const mockDONPublicKey = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

    const signedResult = {
        result: resultPayload,
        signature: mockSignature,
        donPublicKey: mockDONPublicKey,
        _note: "In production: signature would be created by DON consensus, verified on-chain by Aegis smart contract"
    };

    runtime.log(`📝 [SIGNED RESULT] ${JSON.stringify(signedResult, null, 2)}`);

    return `Analysis Complete: ${aiResult.decision || 'REJECT'}`;
};

const initWorkflow = (config: Config) => {
    const http = new HTTPCapability();
    return [handler(http.trigger({}), brainHandler)];
};

export async function main() {
    const runner = await Runner.newRunner<Config>({ configSchema });
    await runner.run(initWorkflow);
}
