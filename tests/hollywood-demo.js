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
    darkCyan: '\x1b[36;2m'
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
    console.log(`${colors.cyan} 🎬 SCENARIO: ${name} ${colors.reset} ${colors.gray}(${info})${colors.reset}`);
    console.log(`${colors.gray}================================================================${colors.reset}`);

    // -- PHASE 1 --
    console.log(`\n${colors.yellow}[PHASE 1] 🔒 Inherent Security: Capital Escrow${colors.reset}`);
    console.log(`   -> User initiates swap for asset: ${colors.gray}${token}${colors.reset}`);

    const amt = "1000000000000000000"; // 1 ETH
    const initRaw = runCast(['send', CONTRACT_ADDRESS, 'swap(address,uint256)', token, amt, '--value', amt, '--private-key', USER_PRIVATE_KEY, '--rpc-url', 'http://localhost:8545', '--json']);
    const init = JSON.parse(initRaw);
    const tx = init.transactionHash;

    await new Promise(r => setTimeout(r, 1000));
    const recRaw = runCast(['receipt', tx, '--rpc-url', 'http://localhost:8545', '--json']);
    const rec = JSON.parse(recRaw);
    const id = rec.logs[0].topics[1];

    console.log(`   -> ${colors.green}AegisVault locked 1.0 ETH in sovereign escrow.${colors.reset}`);
    console.log(`   -> Request ID: ${colors.gray}${id.slice(0, 18)}...${colors.reset}`);

    // -- PHASE 2 --
    console.log(`\n${colors.yellow}[PHASE 2] 🧠 Autonomous Audit: Chainlink DON Logic${colors.reset}`);
    console.log(`   -> Triggering Forensic AI scan across Tri-Vector Matrix...`);

    const payload = JSON.stringify({ tokenAddress: token, chainId: "31337", askingPrice: price });
    // Use spawnSync for docker to handle payload string correctly
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
        // console.log(fullOutput); // Debugging
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

        console.log(`   -> ${colors.cyan}AI Synthesis Complete.${colors.reset}`);
        console.log(`   -> reasoning: ${colors.darkCyan}${res.reasoning}${colors.reset}`);

        const flags = decodeRiskCode(riskCode);
        flags.forEach(f => {
            if (riskCode === 0) console.log(`   ${colors.green}${f}${colors.reset}`);
            else console.log(`   ${colors.red}${f}${colors.reset}`);
        });

        // -- PHASE 3 --
        console.log(`\n${colors.yellow}[PHASE 3] 🛡️ Decisive Enforcement${colors.reset}`);
        console.log(`   -> Sovereign Executor evaluating DON verdict...`);
        await new Promise(r => setTimeout(r, 1000));

        runCast(['send', CONTRACT_ADDRESS, 'fulfillRequest(bytes32,bytes,bytes)', id, hex, '0x', '--private-key', USER_PRIVATE_KEY, '--rpc-url', 'http://localhost:8545']);

        if (riskCode === 0) {
            console.log(`   ${colors.green}🏆 SETTLED: Capital released. Integrity verified.${colors.reset}`);
        } else {
            console.log(`   ${colors.red}🏆 PROTECTED: Trade blocked. Capital autonomously returned.${colors.reset}`);
        }

    } catch (e) {
        console.log(`   ${colors.red}X Error processing AI verdict: ${e.message}${colors.reset}`);
    }
}

async function main() {
    console.clear();
    console.log(`${colors.cyan}================================================================${colors.reset}`);
    console.log(`${colors.cyan}    🛡️  AEGIS: THE SOVEREIGN DEFI EXECUTOR  🛡️ ${colors.reset}`);
    console.log(`${colors.cyan}           Chainlink Convergence Hackathon 2026${colors.reset}`);
    console.log(`${colors.cyan}================================================================${colors.reset}`);

    await runScenario("TRUSTED SWAP", "0x4200000000000000000000000000000000000006", "2100.00", "WETH on Base Network");
    await new Promise(r => setTimeout(r, 2000));
    await runScenario("PROTECTED ATTACK", "0xBAD0000000000000000000000000000000000066", "99999.00", "Volatility spike + Centralized Trace");

    console.log(`\n${colors.cyan}================================================================${colors.reset}`);
    console.log(`${colors.cyan}   🏁 DEMO COMPLETE: Aegis ensures trustless execution.${colors.reset}`);
    console.log(`${colors.cyan}================================================================${colors.reset}`);
}

main();
