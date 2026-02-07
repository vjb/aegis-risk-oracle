#!/usr/bin/env bun
/**
 * Simple OpenAI Test Script
 * Usage: bun run test-openai.ts "Your question here"
 * Or interactive: bun run test-openai.ts
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Bun.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not found in environment");
    console.error("   Set it with: $env:OPENAI_API_KEY = 'sk-...'");
    process.exit(1);
}

const MODEL = "gpt-4o-mini"; // Same model used in Aegis workflow

async function askOpenAI(question: string): Promise<void> {
    console.log(`\n🤖 Model: ${MODEL}`);
    console.log(`📝 Question: ${question}\n`);
    console.log("━".repeat(60));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "user", content: question }
            ],
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`❌ API Error (${response.status}): ${error}`);
        process.exit(1);
    }

    const data = await response.json() as any;

    console.log(`\n💬 Response:\n`);
    console.log(data.choices[0].message.content);
    console.log("\n" + "━".repeat(60));
    console.log(`📊 Model used: ${data.model}`);
    console.log(`🔢 Tokens: ${data.usage?.prompt_tokens} input, ${data.usage?.completion_tokens} output`);
}

// Get question from command line args or use default
const question = process.argv.slice(2).join(" ") || "What model are you? Please state your exact model identifier.";

askOpenAI(question).catch(console.error);
