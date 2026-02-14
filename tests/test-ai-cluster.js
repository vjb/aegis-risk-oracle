require('dotenv').config();

const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    reset: "\x1b[0m",
    gray: "\x1b[90m"
};

// fetch is available globally in Node 18+

async function checkOpenAI() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { name: "OpenAI", status: "SKIP", msg: "No Key" };

    const start = Date.now();
    const model = "gpt-4o-mini";

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            })
        });
        const data = await res.json();
        if (data.choices?.[0]) return { name: "OpenAI", status: "PASS", lat: Date.now() - start, model: model };
        const errMsg = data.error?.message || "Unknown Error";
        return { name: "OpenAI", status: "FAIL", msg: errMsg, lat: Date.now() - start };
    } catch (e) {
        return { name: "OpenAI", status: "FAIL", msg: e.message, lat: Date.now() - start };
    }
}



async function checkGroq() {
    const key = process.env.GROQ_KEY;
    if (!key) return { name: "Groq", status: "SKIP", msg: "No Key" };

    const start = Date.now();
    // 🚀 Meta's top-tier rapid model available on Groq's free tier
    const model = "llama-3.3-70b-versatile";

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            })
        });
        const data = await res.json();
        if (data.choices?.[0]) return { name: "Groq  ", status: "PASS", lat: Date.now() - start, model: model };
        const errMsg = data.error?.message || "Unknown Error";
        return { name: "Groq  ", status: "FAIL", msg: errMsg, lat: Date.now() - start };
    } catch (e) {
        return { name: "Groq  ", status: "FAIL", msg: e.message, lat: Date.now() - start };
    }
}

async function main() {
    console.log(`\n${colors.cyan}====================================================${colors.reset}`);
    console.log(`${colors.cyan}    🧠 AEGIS MULTI-MODEL CLUSTER DIAGNOSTICS ${colors.reset}`);
    console.log(`${colors.cyan}====================================================${colors.reset}\n`);

    const results = await Promise.all([checkOpenAI(), checkGroq()]);

    console.log(`${colors.gray}Provider   Status    Latency   Model/Error${colors.reset}`);
    console.log(`${colors.gray}--------   ------    -------   -----------${colors.reset}`);

    results.forEach(r => {
        let statusColor = r.status === "PASS" ? colors.green : (r.status === "SKIP" ? colors.yellow : colors.red);
        let latStr = r.lat ? `${r.lat}ms`.padEnd(9) : "N/A      ";
        let detail = r.status === "PASS" ? r.model : r.msg;

        console.log(`${r.name.padEnd(10)} ${statusColor}${r.status.padEnd(9)}${colors.reset} ${latStr} ${detail}`);
    });

    console.log(`\n${colors.cyan}====================================================${colors.reset}`);
    const passed = results.filter(r => r.status === "PASS").length;

    if (passed === 2) console.log(`${colors.green}✅ ALL SYSTEMS OPERATIONAL${colors.reset}`);
    else if (passed > 0) console.log(`${colors.yellow}⚠️  PARTIAL CLUSTER HEALTH (Byzantine Fault Tolerant)${colors.reset}`);
    else console.log(`${colors.red}❌ SYSTEM FAILURE${colors.reset}`);
}

main();
