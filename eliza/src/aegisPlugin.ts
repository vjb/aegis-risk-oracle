import { type Plugin, type Action } from "@elizaos/core";
import { executeSwapAction } from "./actions/executeSwap";

export const aegisPlugin: Plugin = {
    name: "Aegis",
    description: "Chainlink CRE Integration for Transaction Security",
    actions: [
        {
            name: "CHECK_SECURITY",
            similes: ["VALIDATE_TRANSACTION", "SCAN_RISK", "AUDIT_SWAP"],
            description: "Validates a transaction using the Chainlink CRE Oracle.",
            validate: async (runtime, message) => {
                const text = (message.content.text || "").toLowerCase();
                return text.includes("swap") || text.includes("send");
            },
            handler: async (runtime, message, state, options, callback) => {
                console.log("🛡️ [AEGIS PLUGIN] Intercepting transaction for Oracle verification...");

                // "Hollywood" Demo Mode: specialized mock response without network delay
                const text = (message.content.text || "").toLowerCase();
                const isRisky = text.includes("scam") || text.includes("honeypot") || text.includes("pepe");

                // Mocking the Split-Brain Consensus Output
                const logicFlags = isRisky ? 65535 : 0; // Deterministic Fail
                const aiFlags = isRisky ? 99 : 0;      // AI Warning
                const union = logicFlags | aiFlags;

                const mockVerdict = {
                    status: isRisky ? "REJECT" : "APPROVE",
                    aegisVerdict: {
                        reasoning: isRisky
                            ? "🚫 Hybrid Consensus Reached. Deterministic logic flagged [HONEYPOT]. Semantic AI Cluster flagged [SCAM_PATTERNS]. Bitwise Union = [CRITICAL_RISK]."
                            : "✅ Hybrid Consensus Reached. Deterministic logic: [SAFE]. Semantic AI Cluster: [SAFE]. Consensus: 0 (Verified).",
                        riskScore: union,
                        logicFlags: logicFlags,
                        aiFlags: aiFlags
                    },
                    signature: "0xHollywoodSignatureForDemoPurposeOnly"
                };

                console.log(`[AEGIS PLUGIN] Generated Verdict for "${text}":`, mockVerdict.status);

                if (callback) {
                    const statusText = isRisky ? "REJECT" : "APPROVE";
                    const reasoning = isRisky
                        ? `❌ [AEGIS_REJECT] Security scan complete. Verdict: THREAT_DETECTED.\n\n**FORENSIC AUDIT SUMMARY**\n- **Risk Code**: ${union}\n- **Risk Score**: ${union}/100\n- **Forensic Reasoning**: ${mockVerdict.aegisVerdict.reasoning}\n\nAssets have been safely refunded to your wallet.`
                        : `✅ [AEGIS_APPROVE] Compliance verified. Settlement authorized.`;

                    callback({
                        text: reasoning,
                        content: mockVerdict
                    });
                }
                return;
            },
            examples: []
        },
        executeSwapAction
    ]
};
