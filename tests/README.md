# 🧪 Aegis Forensic Verification Suite

> **"Evidence-Based Security. Protocol-Driven Truth."**

This directory contains the forensic verification and simulation suite for the Aegis Protocol. We move beyond "testing" and into **Protocol Verification**—proving that the Vault correctly intercepts threats and enforces safety.

---

## 🗺️ The Protocol Verification Roadmap

1. **Phase 1: Inbound Intent**: Verify the Dispatcher (Agent) correctly parses user swap intent.
2. **Phase 2: The Lock**: Prove the `AegisVault.sol` successfully locks capital in sovereign escrow.
3. **Phase 3: Forensic Audit**: Verify the Chainlink DON reaches deterministic consensus on the risk bitmask.
4. **Phase 4: Enforcement**: Prove the Vault settlements/refunds occur exactly as dictated by the DON verdict.

---

## 🚀 The Flagship Demo (Judges' Choice)

### [`node ./tests/hollywood-demo.js`](hollywood-demo.js)
**The "Sovereign Protocol" Demo.** This is the primary verification tool for the hackathon. It visualizes the entire "Contract-Initiated" flow with cinematic terminal output:
- **`[VAULT] 🔒 ASSETS LOCKED`**: Proving the sovereign enforcer is active.
- **`[ORACLE] 🧠 GPT-4o Risk Assessment`**: Proving the judge is calculating consensus.
- **`[VAULT] 🔓 VERDICT RECEIVED`**: Proving the code enforces the final outcome.

---

## 📜 Supporting Tools

| Script | Purpose |
| :--- | :--- |
| `test-everything.ps1` | The full 5-phase automated system audit. |
| `test-all-apis.ts` | Validates connectivity to the "Tri-Vector" data sources. |
| `test-contract.ps1` | Solidity unit tests for the Sovereign Vault logic. |

## 📂 Payloads (`payloads/`)
Contains the adversarial JSON payloads used to stress-test the AI's risk detection capabilities, ensuring the DON cannot be "tricked" by malicious metadata.

*Aegis Forensics: Proving the protocol protects the user. 🛡️🔍*
