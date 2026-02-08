import { serve } from "bun";
import { aegisPlugin } from "./aegisPlugin";
import character from "../character.json" assert { type: "json" };

/**
 * AEGIS MISSION CONTROL SERVER
 * 
 * Simple E2E bridge that takes a message from the Mission Control UI,
 * runs the Aegis Security Plugin, and returns the Oracle's verdict.
 */

console.log(`🛡️ [AEGIS SERVER] Protocol active for character: ${character.name}`);

const server = serve({
    port: 3011,
    async fetch(req) {
        const url = new URL(req.url);

        // CORS Headers
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

                console.log(`[AEGIS SERVER] Received intent: ${text}`);

                // 1. Mock Agent Logic (Intercepting as a plugin)
                // In a real Eliza app, this would be a runtime.processMessage call
                // Here we simulate the plugin's effect for the E2E demo

                const mockRuntime = {
                    getSetting: (key: string) => process.env[key]
                };

                let agentResponseText = "";
                let oracleVerdict: any = null;

                // 2. Hybrid Logic Router
                if (text.toLowerCase().match(/swap|buy|sell|transfer|send/)) {
                    console.log(`🛡️ [AEGIS SERVER] Protocol challenge initiated for ${character.name}`);

                    // Execute Aegis Plugin Logic manually for this demo
                    const action = aegisPlugin.actions[0];
                    await action.handler(mockRuntime as any, { content: { text } } as any, {}, {}, (response) => {
                        oracleVerdict = (response as any).content;
                    }, []);

                    agentResponseText = oracleVerdict
                        ? (oracleVerdict.status === "REJECT"
                            ? `❌ [AEGIS_REJECT] ${oracleVerdict.aegisVerdict.reasoning}`
                            : `✅ [AEGIS_APPROVE] Compliance verified. Settlement authorized.`)
                        : `${character.name} STATUS: ONLINE. Protocols active. Message received.`;

                } else {
                    // General Chat via OpenAI
                    console.log(`💬 [AEGIS SERVER] Routing to OpenAI for general conversation...`);

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
                                model: "gpt-4-turbo", // or gpt-3.5-turbo if preferred
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
                        }
                    }
                }

                return new Response(JSON.stringify({
                    text: agentResponseText,
                    content: oracleVerdict
                }), { headers });

            } catch (err: any) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Aegis Backend active at http://localhost:${server.port}`);
