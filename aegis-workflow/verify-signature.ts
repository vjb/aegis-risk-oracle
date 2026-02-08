#!/usr/bin/env bun
/**
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │                 AEGIS SIGNATURE VERIFICATION DEMO                               │
 * │                                                                                 │
 * │  This script demonstrates how a smart contract would verify DON signatures.    │
 * │  It shows:                                                                      │
 * │    1. ✅ Valid signature verification                                          │
 * │    2. 🔁 Replay attack prevention (salt already used)                          │
 * │    3. 🚫 Spoof detection (signature from wrong key)                            │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 */

import { keccak256, encodePacked, Hex, recoverMessageAddress, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

// The known DON address (what the smart contract would store)
const DON_DEMO_PRIVATE_KEY: Hex = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const donAccount = privateKeyToAccount(DON_DEMO_PRIVATE_KEY);
const EXPECTED_DON_ADDRESS = getAddress(donAccount.address);

// An attacker's private key (different from DON)
const ATTACKER_PRIVATE_KEY: Hex = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const attackerAccount = privateKeyToAccount(ATTACKER_PRIVATE_KEY);

// Simulated "on-chain" storage for used salts (replay protection)
const usedSalts = new Set<string>();

/**
 * Simulates the smart contract's signature verification logic
 */
async function verifyDONSignature(
    signedResult: {
        userAddress: string;
        tokenAddress: string;
        chainId: string;
        askingPrice: string;
        timestamp: string;
        decision: string;
        riskScore: number;
        salt: Hex;
        reasoningHash: Hex; // 🔐 NEW: The Fourth Lock
        messageHash: Hex;
        signature: Hex;
        signer: string;
    }
): Promise<{ valid: boolean; reason: string; recoveredAddress?: string }> {
    // 1. Reconstruct the message hash (same as what DON signed)
    // schema: userAddress, tokenAddress, chainId, askingPrice, timestamp, decision, riskScore, salt, reasoningHash
    const reconstructedHash = keccak256(
        encodePacked(
            ['address', 'address', 'uint256', 'uint256', 'uint256', 'string', 'uint8', 'bytes32', 'bytes32'],
            [
                getAddress(signedResult.userAddress),
                getAddress(signedResult.tokenAddress),
                BigInt(signedResult.chainId),
                BigInt(Math.round(Number(signedResult.askingPrice || "0") * 1e8)),
                BigInt(signedResult.timestamp),
                signedResult.decision,
                signedResult.riskScore,
                signedResult.salt,
                signedResult.reasoningHash // 🔐 The Fourth Lock
            ]
        )
    );

    // 2. Verify message hash matches
    if (reconstructedHash !== signedResult.messageHash) {
        return { valid: false, reason: "Message hash mismatch - data was tampered with" };
    }

    // 3. Recover signer from signature
    const recoveredAddress = await recoverMessageAddress({
        message: { raw: signedResult.messageHash },
        signature: signedResult.signature
    });

    // 4. Check if signer is the expected DON address
    if (getAddress(recoveredAddress) !== getAddress(EXPECTED_DON_ADDRESS)) {
        return {
            valid: false,
            reason: `Invalid signer: expected ${EXPECTED_DON_ADDRESS}, got ${getAddress(recoveredAddress)}`,
            recoveredAddress: getAddress(recoveredAddress)
        };
    }

    // 5. Check for replay attack (salt already used)
    if (usedSalts.has(signedResult.salt)) {
        return { valid: false, reason: "Salt already used - replay attack detected", recoveredAddress };
    }

    // 6. Check for expiration (5 minute window)
    const now = Math.floor(Date.now() / 1000);
    const signedAt = Number(signedResult.timestamp);
    if (now - signedAt > 300) {
        return { valid: false, reason: "Signature expired - transaction is no longer valid", recoveredAddress };
    }

    // 7. Mark salt as used
    usedSalts.add(signedResult.salt);

    return { valid: true, reason: "Signature verified successfully", recoveredAddress };
}

/**
 * Creates a forged signature with the attacker's key
 */
async function createForgedSignature(originalResult: any): Promise<any> {
    // Attacker creates a fake approval
    const forgedResult = { ...originalResult, decision: "EXECUTE", riskScore: 0 };

    // Recalculate message hash for the forged data
    forgedResult.messageHash = keccak256(
        encodePacked(
            ['address', 'address', 'uint256', 'uint256', 'uint256', 'string', 'uint8', 'bytes32', 'bytes32'],
            [
                forgedResult.userAddress as `0x${string}`,
                forgedResult.tokenAddress as `0x${string}`,
                BigInt(forgedResult.chainId),
                BigInt(Math.round(Number(forgedResult.askingPrice || "0") * 1e8)),
                BigInt(forgedResult.timestamp),
                forgedResult.decision,
                forgedResult.riskScore,
                forgedResult.salt as Hex,
                forgedResult.reasoningHash as Hex // 🔐 The Fourth Lock
            ]
        )
    );

    // Sign with attacker's key
    forgedResult.signature = await attackerAccount.signMessage({
        message: { raw: forgedResult.messageHash as Hex }
    });
    forgedResult.signer = attackerAccount.address;

    return forgedResult;
}

async function main() {
    // Check if a JSON string was passed via command line
    const jsonArg = process.argv[2];
    if (jsonArg) {
        try {
            const data = JSON.parse(jsonArg);
            console.log("\n" + "=".repeat(60));
            console.log("🛡️  VERIFYING SIGNED RESULT...");
            console.log("=".repeat(60));
            console.log(`Token:     ${data.tokenAddress.substring(0, 10)}...`);
            console.log(`Amount:    $${data.askingPrice}`);
            console.log(`Decision:  ${data.decision}`);
            console.log(`Aegis Proof: ${data.reasoningHash.substring(0, 18)}...`);

            const result = await verifyDONSignature(data);
            if (result.valid) {
                console.log(`\n${GREEN}✅ VALID: ${result.reason}${RESET}`);
            } else {
                console.log(`\n${RED}❌ INVALID: ${result.reason}${RESET}`);
                console.log(`   Warning: Data has been tampered with or is spoofed.`);
            }
            console.log("=".repeat(60) + "\n");
            process.exit(0);
        } catch (e) {
            // If not JSON, continue to normal demo
        }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("    🔐 AEGIS COMPLIANCE VERIFICATION DEMO v2.0");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`\n${CYAN}Expected DON Address: ${EXPECTED_DON_ADDRESS}${RESET}\n`);

    // ═══════════════════════════════════════════════════════════════════════════
    //  Read the signed result from a workflow run
    //  In production, this would come from the CRE workflow
    // ═══════════════════════════════════════════════════════════════════════════

    // Create a sample signed result (simulating what the workflow outputs)
    const sampleSalt = "0x" + "a1b2c3d4e5f6".padStart(64, '0') as Hex;
    const sampleReasoningHash = keccak256(encodePacked(['string'], ["Token security verified. No honeypot detected."]));
    const sampleAskingPrice = "2100.00";
    const sampleUser = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`;
    const sampleTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const sampleHash = keccak256(
        encodePacked(
            ['address', 'address', 'uint256', 'uint256', 'uint256', 'string', 'uint8', 'bytes32', 'bytes32'],
            [
                sampleUser,
                "0x4200000000000000000000000000000000000006" as `0x${string}`,
                BigInt("8453"),
                BigInt(Math.round(Number(sampleAskingPrice) * 1e8)),
                sampleTimestamp,
                "EXECUTE",
                0,
                sampleSalt,
                sampleReasoningHash
            ]
        )
    );
    const sampleSignature = await donAccount.signMessage({ message: { raw: sampleHash } });

    const validSignedResult = {
        userAddress: sampleUser,
        tokenAddress: "0x4200000000000000000000000000000000000006",
        chainId: "8453",
        askingPrice: sampleAskingPrice,
        timestamp: sampleTimestamp.toString(),
        decision: "EXECUTE",
        riskScore: 0,
        salt: sampleSalt,
        reasoningHash: sampleReasoningHash,
        messageHash: sampleHash,
        signature: sampleSignature,
        signer: donAccount.address
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  TEST 1: Valid Signature Verification
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n${BOLD}━━━ TEST 1: Valid Signature Verification ━━━${RESET}`);
    console.log(`Token:     ${validSignedResult.tokenAddress.substring(0, 10)}...`);
    console.log(`Amount:    $${validSignedResult.askingPrice}`);
    console.log(`Decision:  ${GREEN}${validSignedResult.decision}${RESET}`);
    console.log(`Aegis Proof: ${validSignedResult.reasoningHash.substring(0, 18)}...`);
    console.log(`Signature: ${validSignedResult.signature.substring(0, 22)}...`);

    const test1 = await verifyDONSignature(validSignedResult);
    if (test1.valid) {
        console.log(`\n${GREEN}✅ VALID: ${test1.reason}${RESET}`);
        console.log(`   Recovered: ${CYAN}${test1.recoveredAddress}${RESET}`);
    } else {
        console.log(`\n${RED}❌ INVALID: ${test1.reason}${RESET}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  TEST 2: Replay Attack Prevention (Salt)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n${BOLD}━━━ TEST 2: Replay Attack Prevention ━━━${RESET}`);
    console.log(`Attempting to replay the same signed result...`);
    console.log(`Salt:      ${validSignedResult.salt.substring(0, 18)}... (SAME)`);

    const test2 = await verifyDONSignature(validSignedResult);
    if (test2.valid) {
        console.log(`\n${RED}⚠️  VULNERABLE: Replay attack succeeded!${RESET}`);
    } else {
        console.log(`\n${GREEN}✅ BLOCKED: ${test2.reason}${RESET}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  TEST 3: Identity Hijack Detection (Wrong userAddress)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n${BOLD}━━━ TEST 3: Identity Hijack Detection ━━━${RESET}`);
    console.log(`Original Approved User: ${validSignedResult.userAddress}`);

    // Attacker tries to use the signature for their own wallet
    const hijackedResult = {
        ...validSignedResult,
        userAddress: "0x3C44CdDdB2a900a37541703080e1234567890abc",
        salt: ("0x" + "deadbeef".padStart(64, '0')) as Hex
    };

    console.log(`Malicious User:        ${hijackedResult.userAddress}`);

    const test3 = await verifyDONSignature(hijackedResult);
    if (test3.valid) {
        console.log(`\n${RED}⚠️  VULNERABLE: Hijacked signature accepted!${RESET}`);
    } else {
        console.log(`\n${GREEN}✅ BLOCKED: ${test3.reason}${RESET}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  TEST 4: Spoof Attack Detection
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n${BOLD}━━━ TEST 4: Spoof Attack Detection ━━━${RESET}`);
    console.log(`${YELLOW}Attacker Key: ${attackerAccount.address}${RESET}`);
    console.log(`Attempting to forge an EXECUTE decision...`);

    // Create a forged signature with new salt to bypass replay check
    const forgedResult = await createForgedSignature({
        ...validSignedResult,
        decision: "REJECT",
        riskScore: 10,
        salt: ("0x" + "deadbeef".padStart(64, '0')) as Hex
    });

    console.log(`Forged Decision: ${GREEN}EXECUTE${RESET} (changed from REJECT)`);
    console.log(`Forged Signature: ${forgedResult.signature.substring(0, 22)}...`);

    const test4 = await verifyDONSignature(forgedResult);
    if (test4.valid) {
        console.log(`\n${RED}⚠️  VULNERABLE: Forged signature accepted!${RESET}`);
    } else {
        console.log(`\n${GREEN}✅ BLOCKED: ${test4.reason}${RESET}`);
        console.log(`   Attacker: ${RED}${test4.recoveredAddress}${RESET}`);
        console.log(`   Expected: ${CYAN}${EXPECTED_DON_ADDRESS}${RESET}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  TEST 5: Tamper Attack Detection (Changing Reasoning Hash)
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n${BOLD}━━━ TEST 5: Tamper Attack Detection ━━━${RESET}`);
    console.log(`Original Aegis Proof: ${validSignedResult.reasoningHash.substring(0, 18)}... → ${GREEN}VALID${RESET}`);

    // Attacker tries to change the reasoning hash to hide something
    const tamperedResult = {
        ...validSignedResult,
        reasoningHash: ("0x" + "bad1dea".padStart(64, '0')) as Hex,
        salt: ("0x" + "fee1dead".padStart(64, '0')) as Hex // New salt to avoid replay block
    };

    console.log(`Tampered Proof: ${tamperedResult.reasoningHash.substring(0, 18)}... (Modified after signing)`);

    const test5 = await verifyDONSignature(tamperedResult);
    if (test5.valid) {
        console.log(`\n${RED}⚠️  VULNERABLE: Tampered reasoning hash accepted!${RESET}`);
    } else {
        console.log(`\n${GREEN}✅ BLOCKED: ${test5.reason}${RESET}`);
        console.log(`   Crypto check failed because hash changed while signature remained static.`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  TEST 6: Time Lock / Expiration
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n${BOLD}━━━ TEST 6: Time Lock (Expiration) ━━━${RESET}`);

    // Create an old result (10 minutes ago)
    const oldTimestamp = BigInt(Math.floor(Date.now() / 1000) - 600);
    const oldHash = keccak256(
        encodePacked(
            ['address', 'address', 'uint256', 'uint256', 'uint256', 'string', 'uint8', 'bytes32', 'bytes32'],
            [
                sampleUser,
                validSignedResult.tokenAddress as `0x${string}`,
                BigInt(validSignedResult.chainId),
                BigInt(Math.round(Number(validSignedResult.askingPrice) * 1e8)),
                oldTimestamp,
                validSignedResult.decision,
                validSignedResult.riskScore,
                validSignedResult.salt,
                validSignedResult.reasoningHash
            ]
        )
    );
    const oldSignature = await donAccount.signMessage({ message: { raw: oldHash } });

    const expiredResult = {
        ...validSignedResult,
        timestamp: oldTimestamp.toString(),
        messageHash: oldHash,
        signature: oldSignature,
        salt: ("0x" + "deadf00d".padStart(64, '0')) as Hex
    };

    console.log(`Signed At: ${new Date(Number(oldTimestamp) * 1000).toLocaleTimeString()}`);
    console.log(`Now:       ${new Date().toLocaleTimeString()} (Window: 5min)`);

    const test6 = await verifyDONSignature(expiredResult);
    if (test6.valid) {
        console.log(`\n${RED}⚠️  VULNERABLE: Expired signature accepted!${RESET}`);
    } else {
        console.log(`\n${GREEN}✅ BLOCKED: ${test6.reason}${RESET}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SUMMARY
    // ═══════════════════════════════════════════════════════════════════════════
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${BOLD}    📊 AEGIS V2.0 SECURITY VERIFICATION SUMMARY${RESET}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`    Test 1 (Protocol Compliance): ${test1.valid ? GREEN + "PASSED ✓" : RED + "FAILED ✗"}${RESET}`);
    console.log(`    Test 2 (Replay Attack):       ${!test2.valid ? GREEN + "BLOCKED ✓" : RED + "VULNERABLE ✗"}${RESET}`);
    console.log(`    Test 3 (Identity Hijack):     ${!test3.valid ? GREEN + "BLOCKED ✓" : RED + "VULNERABLE ✗"}${RESET}`);
    console.log(`    Test 4 (Spoof Attack):        ${!test4.valid ? GREEN + "BLOCKED ✓" : RED + "VULNERABLE ✗"}${RESET}`);
    console.log(`    Test 5 (Tamper Attack):       ${!test5.valid ? GREEN + "BLOCKED ✓" : RED + "VULNERABLE ✗"}${RESET}`);
    console.log(`    Test 6 (Time Lock):           ${!test6.valid ? GREEN + "BLOCKED ✓" : RED + "VULNERABLE ✗"}${RESET}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(console.error);
