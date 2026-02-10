import { serve } from "bun";
import { aegisPlugin } from "./aegisPlugin";
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
    BG_CYAN: "\x1b[46m\x1b[30m"
};

function logSecOps(level: string, msg: string) {
    const time = new Date().toLocaleTimeString();
    let icon = "ℹ️";
    let color = C.CYAN;

    if (level === "INTERCEPT") { icon = "🔒"; color = C.YELLOW; }
    if (level === "AUDIT") { icon = "🕵️"; color = C.MAGENTA; }
    if (level === "VERDICT") { icon = "⚖️"; color = C.GREEN; }
    if (level === "ERROR") { icon = "❌"; color = C.RED; }

    console.log(`${C.DIM}[${time}]${C.RESET} ${color}${C.BOLD}${level.padEnd(10)}${C.RESET} ${icon} ${msg}`);
}

console.log(`${C.CYAN}${C.BOLD}
╔══════════════════════════════════════════════════════════════╗
║        🛡️  AEGIS SOVEREIGN EXECUTOR - BACKEND NODE  🛡️      ║
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
                const { text } = body;

                logSecOps("INTERCEPT", `Incoming Transmission: "${C.BOLD}${text}${C.RESET}"`);

                const mockRuntime = {
                    getSetting: (key: string) => process.env[key]
                };

                let agentResponseText = "";
                let oracleVerdict: any = null;

                // 2. Hybrid Logic Router
                if (text.toLowerCase().match(/swap|buy|sell|transfer|send|check|scan|audit/)) {
                    logSecOps("AUDIT", `Identifying Intent... Threat Analysis Started.`);

                    // Execute Aegis Plugin Logic
                    const action = aegisPlugin.actions[0];
                    await action.handler(mockRuntime as any, { content: { text } } as any, {}, {}, (response) => {
                        oracleVerdict = (response as any).content;
                    }, []);

                    if (oracleVerdict) {
                        if (oracleVerdict.status === "REJECT") {
                            logSecOps("VERDICT", `${C.RED}THREAT DETECTED${C.RESET} -> Blocking Transaction.`);
                            agentResponseText = `❌ [AEGIS_REJECT] ${oracleVerdict.aegisVerdict?.reasoning || "Security Violation"}`;
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
                                    { role: "user", content: text }
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

        return new Response("Not Found", { status: 404 });
    },
});

logSecOps("SYSTEM", `Secure Channel Open: http://localhost:${server.port}`);
