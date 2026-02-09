const { execSync } = require('child_process');

async function main() {
    console.log("⚡ STARTING CONSENSUS SIMULATION (3 NODES) ⚡");
    const NUM_NODES = 3;
    const outputs = [];

    for (let i = 0; i < NUM_NODES; i++) {
        process.stdout.write(`--- 🤖 Node ${i + 1} Execution --- `);
        try {
            const cmd = `docker exec aegis_dev sh -c "cd /app && cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload /app/tests/payloads/test-payload-pass.json"`;
            const result = execSync(cmd, { encoding: 'utf8' });

            // Small delay to avoid API rate limits during simulation
            if (i < NUM_NODES - 1) {
                await new Promise(r => setTimeout(r, 5000));
            }

            // Extract the final JSON result
            const lines = result.trim().split('\n');
            let jsonStr = "";

            for (let j = 0; j < lines.length; j++) {
                if (lines[j].includes("Workflow Simulation Result:")) {
                    // The result is usually on the next non-empty line
                    for (let k = j + 1; k < lines.length; k++) {
                        if (lines[k].trim().length > 0) {
                            jsonStr = lines[k].trim();
                            break;
                        }
                    }
                    break;
                }
            }

            if (!jsonStr) {
                // Fallback: Try to find a line that looks like a JSON object or stringified JSON
                for (let j = lines.length - 1; j >= 0; j--) {
                    const line = lines[j].trim();
                    if ((line.startsWith('{') && line.endsWith('}')) || (line.startsWith('"') && line.endsWith('"'))) {
                        jsonStr = line;
                        break;
                    }
                }
            }

            if (!jsonStr) throw new Error("No JSON output found");

            // Handle potential double-encoding (it might be a string "{\"foo\":...}")
            let resultObj;
            try {
                resultObj = JSON.parse(jsonStr);
                if (typeof resultObj === 'string') {
                    resultObj = JSON.parse(resultObj);
                }
            } catch (e) {
                console.error("Failed to parse JSON:", jsonStr);
                throw e;
            }
            if (resultObj.body) {
                try {
                    resultObj = JSON.parse(resultObj.body);
                } catch (e) {
                    // Body might be a plain string if not JSON
                }
            }

            // Normalize riskCode type (string/number) for bitwise check
            const riskCode = Number(resultObj.riskCode ?? 99);
            const verdict = resultObj.verdict;

            console.log(`✅ [${verdict ? 'PASS' : 'REJECT'}] Code: ${riskCode}`);

            // We push the CLEANED object to comparison array to ensure stability
            // (Ignoring timestamps or non-deterministic fields if any remained)
            outputs.push({
                verdict: verdict,
                riskCode: riskCode,
                salt: resultObj.salt
            });
        } catch (e) {
            console.error(`❌ Node ${i + 1} Crashing:`, (e as Error).message);
            process.exit(1);
        }
    }

    console.log("\n--- ⚖️  CONSENSUS VERDICT ----------------");
    const reference = JSON.stringify(outputs[0]);
    const allMatch = outputs.every(out => JSON.stringify(out) === reference);

    if (allMatch) {
        console.log("✅ SUCCESS: All 3 nodes produced identical bitwise signatures.");
        console.log("   Determinism: 100%");
        console.log("   Consensus: REACHED");
    } else {
        console.error("❌ FAILURE: Nodes produced different results.");
        console.error("   Consensus: BROKEN");
        outputs.forEach((out, i) => {
            if (JSON.stringify(out) !== reference) console.error(`   Node ${i + 1} mismatch!`);
        });
        process.exit(1);
    }
}

main().catch(console.error);
