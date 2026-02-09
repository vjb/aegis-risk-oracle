#!/usr/bin/env bun
/**
 * Simple OpenAI Test Script
 * Usage: bun run test-openai.ts "Your question here"
 * Or interactive: bun run test-openai.ts
 */

export interface TestResult {
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP";
    detail: string;
    latency: number;
}

export async function checkOpenAI(
    apiKey: string | undefined,
    model: string,
    prompt: string,
    verbose: boolean = false
): Promise<TestResult> {
    const start = Date.now();

    if (verbose) {
        console.log(`\n🤖 Model: ${model}`);
        console.log(`📝 Question: ${prompt}\n`);
        console.log("━".repeat(60));
    }

    if (!apiKey) {
        if (verbose) console.error("❌ OPENAI_API_KEY not found");
        return { status: "⚠️ SKIP", detail: "API Key missing", latency: 0 };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: prompt }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const error = await response.text();
            if (verbose) console.error(`❌ API Error (${response.status}): ${error}`);
            return {
                status: "❌ FAIL",
                detail: `HTTP ${response.status}`,
                latency: Date.now() - start
            };
        }

        const data = await response.json() as any;

        if (verbose) {
            console.log(`\n💬 Response:\n`);
            console.log(data.choices[0].message.content);
            console.log("\n" + "━".repeat(60));
            console.log(`📊 Model used: ${data.model}`);
            console.log(`🔢 Tokens: ${data.usage?.prompt_tokens} input, ${data.usage?.completion_tokens} output`);
        }

        return {
            status: "✅ PASS",
            detail: `Model: ${data.model}`,
            latency: Date.now() - start
        };

    } catch (error: any) {
        if (verbose) console.error(error);
        return {
            status: "❌ FAIL",
            detail: error.message,
            latency: Date.now() - start
        };
    }
}

// Standalone execution
if (import.meta.main) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Bun.env.OPENAI_API_KEY;
    const MODEL = "gpt-4o-mini";
    const question = process.argv.slice(2).join(" ") || "What model are you? Please state your exact model identifier.";

    if (!OPENAI_API_KEY) {
        console.error("❌ OPENAI_API_KEY not found in environment");
        console.error("   Set it with: $env:OPENAI_API_KEY = 'sk-...'");
        process.exit(1);
    }

    checkOpenAI(OPENAI_API_KEY, MODEL, question, true).catch(console.error);
}
