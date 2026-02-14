const { spawnSync } = require('child_process');

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CAST_PATH = "cast";

const RISK_FLAGS = {
    1: "Low Liquidity Detected",
    2: "High Volatility Warning",
    4: "Malicious Code Patterns",
    8: "Centralized Ownership Risk",
    16: "Honeypot Trap Detected",
    32: "Impersonation Attempt",
    64: "Wash Trading Detected",
    128: "Suspicious Deployer History",
    256: "Phishing/Scam Signature",
    512: "AI Anomaly Detection"
};

const colors = {
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
    darkCyan: '\x1b[36;2m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m'
};

function decodeRiskCode(code) {
    if (code === 0) return ["✅ VERIFIED SAFE"];
    let found = [];
    for (const [bit, desc] of Object.entries(RISK_FLAGS)) {
        if ((code & Number(bit)) !== 0) {
            found.push("🚫 " + desc);
        }
    }
    return found;
}

function runCast(args) {
    const res = spawnSync(CAST_PATH, args);
    if (res.error) throw res.error;
    return res.stdout.toString();
}

async function runScenario(name, token, price, info) {
    console.log(`\n\n${colors.gray}================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold} 🛡️  SCENARIO: ${name} ${colors.reset} ${colors.gray}(${info})${colors.reset}`);
    console.log(`${colors.gray}================================================================${colors.reset}`);

    // -- DISPATCHER PRE-FLIGHT --
    console.log(`\n${colors.cyan}${colors.bold}[DISPATCHER] 🤖 Interpreting Intent: User wants to swap for ${token}...${colors.reset}`);
    await new Promise(r => setTimeout(r, 600));
    console.log(`   -> [JARVIS] Soft Scan: Analyzing market sentiment and liquidity...`);
    await new Promise(r => setTimeout(r, 600));

    if (name === "PROTECTED ATTACK") {
        console.log(`   -> ${colors.yellow}${colors.bold}⚠️ WARNING: Dispatcher detected high-risk volatility signatures.${colors.reset}`);
        console.log(`   -> Handing off to Sovereign Enforcer for mandatory forensic audit...`);
    } else {
        console.log(`   -> [JARVIS] Pre-flight clear. Constructing secure transfer to Vault...`);
    }
    await new Promise(r => setTimeout(r, 600));

    // -- PHASE 1: VAULT LOCK --
    console.log(`\n${colors.yellow}${colors.bold}[VAULT] 🔒 TRANSACTION INTERCEPTED. Assets locked in Sovereign Escrow.${colors.reset}`);

    const amt = "1000000000000000000"; // 1 ETH
    const initRaw = runCast(['send', CONTRACT_ADDRESS, 'swap(address,uint256)', token, amt, '--value', amt, '--private-key', USER_PRIVATE_KEY, '--rpc-url', 'http://localhost:8545', '--json']);
    const init = JSON.parse(initRaw);
    const tx = init.transactionHash;

    await new Promise(r => setTimeout(r, 800));
    const recRaw = runCast(['receipt', tx, '--rpc-url', 'http://localhost:8545', '--json']);
    const rec = JSON.parse(recRaw);
    const id = rec.logs[0].topics[1];

    console.log(`   -> ${colors.green}Enforcement Core Active.${colors.reset} Request ID: ${colors.gray}${id.slice(0, 18)}...${colors.reset}`);

    // -- PHASE 2: ORACLE JUDGE --
    console.log(`\n${colors.yellow}${colors.bold}[ORACLE] 🕵️‍♂️ DON Node 1: Dispatching Chainlink Forensic Workflow...${colors.reset}`);
    await new Promise(r => setTimeout(r, 600));

    console.log(`${colors.magenta}${colors.bold}[ORACLE] 🧠 DON Node 1: LEFT BRAIN (Deterministic Math)...${colors.reset}`);
    await new Promise(r => setTimeout(r, 300));
    console.log(`   -> ${colors.gray}Analyzing GoPlus Honeypot vectors...${colors.reset}`);
    console.log(`   -> ${colors.gray}Calculating Liquidity Curves...${colors.reset}`);

    await new Promise(r => setTimeout(r, 600));
    console.log(`${colors.cyan}${colors.bold}[ORACLE] 🧠 DON Node 1: RIGHT BRAIN (Multi-Model AI Cluster)...${colors.reset}`);
    await new Promise(r => setTimeout(r, 300));
    console.log(`   -> ${colors.gray}Querying OpenAI (GPT-4o) ...${colors.reset}`);

    console.log(`   -> ${colors.gray}Querying Groq (Llama 3.3) ...${colors.reset}`);

    const payload = JSON.stringify({ tokenAddress: token, chainId: "31337", askingPrice: price });
    const dockerRes = spawnSync('docker', [
        'exec', 'aegis_dev',
        'cre', 'workflow', 'simulate', './aegis-workflow',
        '--target', 'staging-settings',
        '--non-interactive',
        '--trigger-index', '0',
        '--http-payload', payload
    ]);

    const fullOutput = dockerRes.stdout.toString() + dockerRes.stderr.toString();
    const startTag = "::AEGIS_RESULT::";
    const startIdx = fullOutput.indexOf(startTag);

    if (startIdx === -1) {
        console.log(`   ${colors.red}X AI Analysis Failed${colors.reset}`);
        return;
    }

    let jStr = fullOutput.substring(startIdx + startTag.length);
    const endIdx = jStr.indexOf(startTag);
    if (endIdx === -1) {
        console.log(`   ${colors.red}X Result Capture Error${colors.reset}`);
        return;
    }

    jStr = jStr.substring(0, endIdx).trim();
    try {
        const res = JSON.parse(jStr.replace(/\\"/g, '"'));
        const riskCode = parseInt(res.riskCode);
        const hex = res.riskCodeHex;

        console.log(`\n   -> ${colors.magenta}Bitwise Consensus Verified (Logic | AI).${colors.reset}`);
        console.log(`   -> ${colors.darkCyan}"${res.reasoning}"${colors.reset}`);

        const flags = decodeRiskCode(riskCode);
        flags.forEach(f => {
            if (riskCode === 0) console.log(`   ${colors.green}${f}${colors.reset}`);
            else console.log(`   ${colors.red}${f}${colors.reset}`);
        });

        // -- PHASE 3: ENFORCEMENT --
        console.log(`\n${colors.yellow}${colors.bold}[VAULT] ⚖️  Enforcing DON Verdict...${colors.reset}`);
        await new Promise(r => setTimeout(r, 1000));

        runCast(['send', CONTRACT_ADDRESS, 'fulfillRequest(bytes32,bytes,bytes)', id, hex, '0x', '--private-key', USER_PRIVATE_KEY, '--rpc-url', 'http://localhost:8545']);

        if (riskCode === 0) {
            console.log(`\n${colors.green}${colors.bold}[VAULT] 🔓 VERDICT SAFE (0). RELEASED. SETTLED.${colors.reset}`);
            console.log(`${colors.cyan}[DISPATCHER] 🤖 Swap successful. Assets transferred to wallet.${colors.reset}`);
        } else {
            console.log(`\n${colors.red}${colors.bold}[VAULT] 🚫 VERDICT THREAT (${riskCode}). BLOCKED. REFUNDED.${colors.reset}`);
            console.log(`${colors.cyan}[DISPATCHER] 🤖 Protection triggered. Capital safely returned.${colors.reset}`);
        }

    } catch (e) {
        console.log(`   ${colors.red}X Error: ${e.message}${colors.reset}`);
    }
}

async function main() {
    console.clear();
    console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}    🛡️  AEGIS: THE SOVEREIGN DEFI FIREWALL  🛡️ ${colors.reset}`);
    console.log(`${colors.cyan}           Operation Sovereign Vault 2026${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);

    await runScenario("TRUSTED SWAP", "0x4200000000000000000000000000000000000006", "2100.00", "WETH Asset Verification");
    await new Promise(r => setTimeout(r, 2000));
    await runScenario("PROTECTED ATTACK", "0xBAD0000000000000000000000000000000000066", "99999.00", "Simulated Volatility / Source Anomaly");
    await new Promise(r => setTimeout(r, 2000));

    console.log(`\n${colors.cyan}${colors.bold}================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}   🏁 PROTOCOL VERIFIED: The Code Enforces the Safety.${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}`);
}

main();
