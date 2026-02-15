import { serve } from "bun";
import { aegisPlugin } from "./aegisPlugin";
import { Hex } from "viem";
import character from "../character.json" assert { type: "json" };

/**
 * 🛡️ AEGIS MISSION CONTROL SERVER
 * 
 * Simple E2E bridge that takes a message from the Mission Control UI,
 * runs the Aegis Security Plugin, and returns the Oracle's verdict.
 */

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
    ICON_SHIELD: "[🛡]",
    ICON_LOCK: "[🔒]",
    ICON_AUDIT: "[🕵]",
    ICON_ROCKET: "[🚀]",
    ICON_TARGET: "[🎯]",
    ICON_CHECK: "[✔]"
};

function logSecOps(level: string, msg: string) {
    const time = new Date().toLocaleTimeString();
    let icon = "[i]";
    let color = C.CYAN;

    if (level === "INTERCEPT") { icon = "[L]"; color = C.YELLOW; }
    if (level === "AUDIT") { icon = "[A]"; color = C.MAGENTA; }
    if (level === "VERDICT") { icon = "[V]"; color = C.GREEN; }
    if (level === "ERROR") { icon = "[X]"; color = C.RED; }

    console.log(`${C.DIM}[${time}]${C.RESET} ${color}${C.BOLD}${level.padEnd(10)}${C.RESET} ${icon} ${msg}`);
}

console.log(`${C.CYAN}${C.BOLD}
╔══════════════════════════════════════════════════════════════╗
║        ${C.ICON_SHIELD}  AEGIS SOVEREIGN EXECUTOR - BACKEND NODE  ${C.ICON_SHIELD}      ║
╚══════════════════════════════════════════════════════════════╝${C.RESET}`);
console.log(`${C.DIM}>> Protocol Active for Agent: ${C.GREEN}${character.name}${C.RESET}`);
console.log(`${C.DIM}>> Security Level: ${C.RED}MAXIMUM${C.RESET}\n`);

const server = serve({
    port: 3011,
    async fetch(req) {
        const url = new URL(req.url);

        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json"
        };

        if (req.method === "OPTIONS") return new Response(null, { headers });

        if (url.pathname === "/message" && req.method === "POST") {
            try {
                const body = await req.json();
                const userMsg = body.text;

                logSecOps("INTERCEPT", `${C.ICON_LOCK} Incoming Transmission: "${C.BOLD}${userMsg}${C.RESET}"`);

                const mockRuntime = {
                    getSetting: (key: string) => process.env[key]
                };

                let agentResponseText = "";
                let oracleVerdict: any = null;

                // 2. Hybrid Logic Router
                const intentMatch = userMsg.toLowerCase().match(/swap|buy|sell|transfer|send|check|scan|audit/);
                if (intentMatch) {
                    logSecOps("AUDIT", `${C.ICON_AUDIT} Identifying Intent... Threat Analysis Started.`);

                    // Dynamically find the matching action
                    const actions = aegisPlugin.actions || [];
                    const action = actions.find(a => a.name === "EXECUTE_SWAP") || actions[0];
                    const intent = intentMatch[0].toUpperCase(); // Derive intent from match

                    if (intent === "EXECUTE_SWAP") {
                        logSecOps("SYSTEM", `ℹ️ Routing to Action: ${C.BOLD}EXECUTE_SWAP${C.RESET}`);
                        console.log(`${C.ICON_ROCKET} ${C.BG_CYAN} [AEGIS ACTION] Initiating Swap Sequence... ${C.RESET}`);

                        const emptyState: any = { values: {}, data: {}, text: "" };
                        await action.handler(mockRuntime as any, { content: { text: userMsg } } as any, emptyState, {}, async (response) => { // Used 'userMsg'
                            oracleVerdict = (response as any).content;
                            agentResponseText = (response as any).text;
                            return [];
                        }, []);
                    } else {
                        logSecOps("SYSTEM", `ℹ️ Routing to Action: ${C.BOLD}${action.name}${C.RESET}`);
                        const emptyState: any = { values: {}, data: {}, text: "" };
                        await action.handler(mockRuntime as any, { content: { text: userMsg } } as any, emptyState, {}, async (response) => {
                            oracleVerdict = (response as any).content;
                            agentResponseText = (response as any).text;
                            return [];
                        }, []);
                    }

                    if (oracleVerdict) {
                        if (oracleVerdict.status === "REJECT") {
                            logSecOps("VERDICT", `${C.RED}THREAT DETECTED${C.RESET} -> Blocking Transaction.`);
                            agentResponseText = `❌ [AEGIS_REJECT] ${oracleVerdict.aegisVerdict?.reasoning || "Security Violation"}`;
                        } else if (oracleVerdict.status === "PENDING_AUDIT") {
                            logSecOps("SYSTEM", `${C.MAGENTA}AUDIT TRIGGERED${C.RESET} -> Notifying Chainlink CRE Network.`);
                            agentResponseText = `⏳ [AEGIS_PENDING] Transaction escrowed. Chainlink CRE Node (DON) is executing forensic audit...`;
                        } else {
                            logSecOps("VERDICT", `${C.GREEN}COMPLIANCE VERIFIED${C.RESET} -> Authorizing Settlement.`);
                            agentResponseText = `✅ [AEGIS_APPROVE] Compliance verified. Settlement authorized.`;
                        }
                    } else {
                        agentResponseText = `${character.name} STATUS: ONLINE. Protocols active. Message received.`;
                    }

                } else {
                    // General Chat
                    logSecOps("INFO", `Routing to LLM Core (OpenAI)...`);

                    if (!process.env.OPENAI_API_KEY) {
                        agentResponseText = "⚠️ SYSTEM ALERT: OpenAI API Key missing. Cannot process general query.";
                    } else {
                        const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                            },
                            body: JSON.stringify({
                                model: "gpt-4-turbo",
                                messages: [
                                    {
                                        role: "system",
                                        content: `${character.system}\n\nBIO:\n${character.bio.join("\n")}\n\nSTYLE:\n${character.style.all.join("\n")}`
                                    },
                                    { role: "user", content: userMsg }
                                ],
                                temperature: 0.7
                            })
                        });

                        const data = await openAIResponse.json();
                        if (data.error) {
                            console.error("OpenAI Error:", data.error);
                            agentResponseText = `⚠️ OPENAI ERROR: ${data.error.message}`;
                        } else {
                            agentResponseText = data.choices?.[0]?.message?.content || "SYSTEM ERROR: No response from AI core.";
                            logSecOps("INFO", `AI Response Generated (${agentResponseText.length} chars)`);
                        }
                    }
                }

                return new Response(JSON.stringify({
                    text: agentResponseText,
                    content: oracleVerdict
                }), { headers });

            } catch (err: any) {
                logSecOps("ERROR", err.message);
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        if (url.pathname === "/telemetry" && req.method === "POST") {
            try {
                const report = await req.json();
                const requestId = report.requestId;
                if (!requestId) return new Response(JSON.stringify({ error: "Missing requestId" }), { status: 400, headers });

                logSecOps("AUDIT", `${C.ICON_AUDIT} Side-Channel Telemetry Received for ${C.BOLD}${requestId}${C.RESET}`);

                // Save report to public/reports
                const reportDir = "public/reports";
                const reportPath = `${reportDir}/${requestId}.json`;

                // Ensure directory exists (Bun.write handles path creation if using some APIs, 
                // but let's be safe or use Bun.write directly if it handles it)
                await Bun.write(reportPath, JSON.stringify(report, null, 2));

                logSecOps("INFO", `${C.ICON_CHECK} Forensic Report Archived: ${C.DIM}${reportPath}${C.RESET}`);

                return new Response(JSON.stringify({ success: true }), { headers });
            } catch (err: any) {
                logSecOps("ERROR", `Telemetry ingest failed: ${err.message}`);
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        if (url.pathname === "/audit-status" && req.method === "POST") {
            try {
                const { requestId } = await req.json();
                if (!requestId) return new Response(JSON.stringify({ error: "No requestId" }), { status: 400, headers });

                const { createPublicClient, http } = await import("viem");
                const { base } = await import("viem/chains");
                const AEGIS_VAULT_ADDRESS = process.env.AEGIS_VAULT_ADDRESS as Hex;
                const RPC_URL = process.env.TENDERLY_RPC_URL || process.env.VITE_TENDERLY_RPC_URL;

                if (!AEGIS_VAULT_ADDRESS) throw new Error("AEGIS_VAULT_ADDRESS missing in .env");
                if (!RPC_URL) throw new Error("TENDERLY_RPC_URL missing in .env");

                const publicClient = createPublicClient({
                    chain: base,
                    transport: http(RPC_URL)
                });

                // Check for TradeSettled or TradeRefunded events for this requestId
                const [settledLogs, refundedLogs] = await Promise.all([
                    publicClient.getLogs({
                        address: AEGIS_VAULT_ADDRESS,
                        event: {
                            type: 'event',
                            name: 'TradeSettled',
                            inputs: [
                                { type: 'bytes32', name: 'requestId', indexed: true },
                                { type: 'address', name: 'user', indexed: true },
                                { type: 'address', name: 'token' },
                                { type: 'uint256', name: 'amount' },
                                { type: 'uint256', name: 'riskCode' }
                            ]
                        },
                        args: { requestId },
                        fromBlock: 0n
                    }),
                    publicClient.getLogs({
                        address: AEGIS_VAULT_ADDRESS,
                        event: {
                            type: 'event',
                            name: 'TradeRefunded',
                            inputs: [
                                { type: 'bytes32', name: 'requestId', indexed: true },
                                { type: 'address', name: 'user', indexed: true },
                                { type: 'address', name: 'token' },
                                { type: 'uint256', name: 'amount' },
                                { type: 'uint256', name: 'riskCode' }
                            ]
                        },
                        args: { requestId },
                        fromBlock: 0n
                    })
                ]);

                // Helper to read report file
                const readReport = (reqId: string) => {
                    try {
                        const reportPath = `public/reports/${reqId}.json`;
                        const file = Bun.file(reportPath);
                        if (file.size > 0) {
                            return file.json();
                        }
                    } catch (e) {
                        console.error(`Failed to read report for ${reqId}:`, e);
                    }
                    return null;
                };

                if (requestId.startsWith("0xMOCK")) {
                    console.log(`[MOCK] Serving Mock Report for ${requestId}`);
                    const report = await readReport(requestId);
                    if (report) {
                        return new Response(JSON.stringify({
                            status: "REJECTED", // Mock is always rejected in this demo flow for now
                            riskCode: Number(report.riskCode),
                            report
                        }), { headers });
                    }
                }

                if (settledLogs.length > 0) {
                    const report = await readReport(requestId);
                    return new Response(JSON.stringify({ status: "COMPLIANT", riskCode: 0, report }), { headers });
                }
                if (refundedLogs.length > 0) {
                    const riskCode = (refundedLogs[0].args as any).riskCode;
                    const report = await readReport(requestId);
                    return new Response(JSON.stringify({ status: "REJECTED", riskCode: Number(riskCode), report }), { headers });
                }

                return new Response(JSON.stringify({ status: "PENDING" }), { headers });

            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

logSecOps("SYSTEM", `Secure Channel Open: http://localhost:${server.port}`);
