# 🧪 Aegis Test Suite

This directory contains the comprehensive verification suite for the Aegis Risk Oracle. It includes unit tests, integration tests, and full end-to-end simulations.

---

## 🚀 The Master Script

### [`test-everything.ps1`](test-everything.ps1)
**The "Uber Tester".** Run this singly script to verify the entire project state.
- **Phase 1: Prerequisites**: Checks Docker and Anvil status.
- **Phase 2: Connectivity**: Tests all external APIs (CoinGecko, GoPlus, OpenAI, QRNG).
- **Phase 3: Cryptography**: Verifies off-chain signature generation and `secp256k1` recovery.
- **Phase 4: Smart Contract**: Deploys `AegisVault` and tests basic interaction.
- **Phase 5: Full E2E Flow**: Runs `run-full-flow.ps1`.

---

## 📜 End-to-End Simulations

### [`run-full-flow.ps1`](run-full-flow.ps1)
**The "Holy Grail" Demo.** Demonstrates the complete lifecycle:
1.  **AI Analysis**: Runs the CRE workflow (`aegis-workflow`) to analyze a token.
2.  **Consensus**: Simulates the DON signing the risk verdict.
3.  **On-Chain Execution**: Submits the signature to the `AegisVault` smart contract on a local Anvil chain.
4.  **Replay Protection**: Attempts to resubmit the same signature to prove it gets blocked.

### [`test-aegis.ps1`](test-aegis.ps1)
**The "Hollywood" Scenario Runner.**
Visualizes the AI's decision-making process for different risk scenarios:
- **Pass Case**: Safe WETH trade (low volatility, high liquidity).
- **Honeypot Case**: Known malicious contract (Risk Code 16).
- **Economic Fail**: Price Manipulation attempt (Risk Code 2).
- **Combo Fail**: Multiple amber flags (Wash Trading + Volatility).

### [`simulate-consensus.ts`](simulate-consensus.ts)
**Determinism Validator.**
- Spawns **5 independent Docker containers** running the same workflow.
- Injects slight timing variations to simulate network latency.
- **Pass Condition**: All 5 nodes must produce the **exact same 32-byte hash** and signature.

---

## 🧩 Component Tests

### [`test-all-apis.ts`](test-all-apis.ts)
Verifies connectivity and response formats for all external data sources:
- **OpenAI**: Checks GPT-4o availability.
- **CoinGecko**: Fetches real-time price data.
- **GoPlus**: Queries security intelligence for a token.
- **QRNG**: Fetches quantum random numbers (ANU API).

### [`test-contract.ps1`](test-contract.ps1)
Focuses solely on the Solidity smart contract.
- Deploys `AegisVault`.
- Tests `swapWithPermit` and `swapWithOracle`.
- Verifies event emission and state changes.

### [`test-crypto.ps1`](test-crypto.ps1) / [`test-signature.ps1`](test-signature.ps1)
Validates the cryptographic primitives used by the DON.
- Generates `secp256k1` signatures off-chain.
- Recovers the signer address from the signature.
- Ensures compatibility with Solidity's `ecrecover`.

---

## 📂 Payload Data (`payloads/`)
JSON input files simulating different trade requests:
- `test-payload-pass.json`: A safe WETH transaction.
- `test-payload-honeypot.json`: A transaction involving a known scam token.
- `test-payload-manipulation.json`: A token with artificially inflated price.
- `test-payload-combo.json`: A token with mixed risk signals.
