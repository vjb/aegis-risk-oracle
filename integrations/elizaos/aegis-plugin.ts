import { Action, Plugin, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

/**
 * AEGIS RISK ORACLE PLUGIN (Draft)
 * 
 * This plugin demonstrates how to integrate the Aegis Risk Oracle as a 
 * mandatory "Pre-Flight" security check for autonomous DeFi agents.
 */

const aegisAction: Action = {
    name: "CHECK_RISK",
    description: "Intercepts trade intents and performs a cryptographic risk assessment via Aegis Oracle",
    similes: ["VERIFY_TRADE", "SECURITY_CHECK", "AEGIS_SHIELD"],

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Only trigger for DeFi related messages (swaps, transfers, etc.)
        const content = typeof message.content === 'string' ? message.content : (message.content as any).text;
        return /swap|buy|sell|send|transfer/i.test(content);
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const AEGIS_ORACLE_URL = runtime.getSetting("AEGIS_ORACLE_URL") || "http://localhost:3000";

        // 1. Extract intent data (mocked for this draft)
        const tradeData = {
            tokenAddress: "0x4200000000000000000000000000000000000006", // WETH
            chainId: "8453",
            userAddress: runtime.getSetting("WALLET_ADDRESS"),
            askingPrice: "2150.00"
        };

        if (callback) {
            callback({ text: "🛡️ Aegis Shield Active: Performing real-time risk assessment..." });
        }

        try {
            // 2. Call the Chainlink CRE Oracle
            const response = await fetch(`${AEGIS_ORACLE_URL}/risk-assessment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tradeData)
            });

            const result = await response.json();

            // 3. Handle the Oracle's Verdict
            if (result.decision === "REJECT") {
                if (callback) {
                    callback({
                        text: `❌ TRADE BLOCKED: Aegis detected high risk (${result.riskScore}/10).\nReasoning: ${result.reasoning}`,
                        content: { error: "RISK_REJECTED", result }
                    });
                }
                return false;
            }

            if (callback) {
                callback({
                    text: `✅ AEGIS PASSED: Risk Score ${result.riskScore}/10. Proceeding with trade intent.`,
                    content: { status: "APPROVED", signature: result.signature }
                });
            }

            return true;

        } catch (error) {
            if (callback) {
                callback({ text: "⚠️ Aegis Oracle unreachable. Security safety-block triggered." });
            }
            return false;
        }
    },
    examples: [
        [
            { user: "{{user1}}", content: { text: "Swap 1 ETH for PEPE" } },
            { user: "{{user2}}", content: { text: "🛡️ Aegis Shield Active: Performing real-time risk assessment..." }, action: "CHECK_RISK" }
        ]
    ]
};

export const aegisPlugin: Plugin = {
    name: "aegis-risk-guard",
    description: "Zero-Trust Security Layer for Autonomous Agents",
    actions: [aegisAction],
    providers: [],
    evaluators: []
};
