# 🛡️ AEGIS: THE SOVEREIGN DEFI FIREWALL (Chainlink 2026)

> **"Stopping Scams at the Smart Contract Level."**  
> *Track: Risk & Compliance / Artificial Intelligence*

## 🎬 The "Hollywood" Demo (Run in 2 mins)
We've packaged the entire protocol (Blockchain + Chainlink CRE + AI) into a single Docker container for easy verification.

**Prerequisites:** Docker Desktop must be running.

```bash
# 1. Start the Aegis Protocol Stack (Anvil Chain + Docker Environment)
.\start-aegis.ps1

# 2. Run the Cinematic Verification Suite
node ./tests/hollywood-demo.js
```

### What you will see:
1. **Trusted Swap**: A safe trade cleansly passing the forensic audit.
2. **Protected Attack**: A malicious token being blocked and refunded autonomously.
3. **Preemptive Block**: **(NEW)** Automation detecting a threat and updating the cache *before* a user even trades.

---

## 👩‍⚖️ Judge's Guide: Where is the Chainlink?

Aegis uses the **Chainlink Runtime Environment (CRE)** to create a "Triple Lock" security architecture.

| Feature | Implementation | File Link |
| :--- | :--- | :--- |
| **1. Sovereign Smart Escrow** | The `AegisVault.sol` contract locks funds and triggers the audit. | [AegisVault.sol](contracts/AegisVault.sol) |
| **2. Deterministic AI (Functions)** | The CRE Workflow that runs GPT-4o but enforces deterministic bitmasks. | [workflow.ts](aegis-workflow/src/workflow.ts) |
| **3. Preemptive Automation** | The `riskCache` mapping and `updateRiskCache` function for zero-latency blocking. | [AegisVault.sol:L35](contracts/AegisVault.sol#L35) |

---

## 🛡️ The Triple Lock Architecture

Aegis is not just a chatbot. It is a **Smart Escrow Protocol** that enforces safety via code.

### Phase 1: The Lock (Smart Contract)
User calls `swap()`. The Vault **locks keys in escrow** and dispatches a job to the Chainlink DON. The user *cannot* lose funds to a scam because the funds never leave the vault until safety is proven.

### Phase 2: The Audit (Chainlink CRE)
The DON executes a **"Split-Brain" Workflow**:
- **Right Brain (AI)**: `GPT-4o` scans for fuzzy risks (Sentiment, Dev History).
- **Left Brain (Logic)**: Enforces a strict, deterministic schema.

### Phase 3: The Verdict (Consensus)
Nodes must reach consensus on the **Risk Bitmask**.
- **Risk 0**: `fulfillRequest` unlocks the funds.
- **Risk > 0**: `fulfillRequest` refunds the user autonomously.

---

## 🕸️ The Risk Bitmask Protocol (LLM on Rails)

We force the AI to output specific bit flags. This ensures **determinism** across oracle nodes.

<div style="display: flex; gap: 20px;">

| **Bit** | **Value** | **Category** | **Description** |
| :--- | :--- | :--- | :--- |
| 0 | `1` | Liquidity | Low Liquidity (<$50k) |
| 1 | `2` | Volatility | High Volatility Spill |
| 2 | `4` | Security | Malicious Code Patterns |
| 3 | `8` | Governance | Renounced Ownership |
| 4 | `16` | Scam | Honeypot Trap Detected |

| **Bit** | **Value** | **Category** | **Description** |
| :--- | :--- | :--- | :--- |
| 5 | `32` | Identity | Impersonation Attempt |
| 6 | `64` | Pattern | Wash Trading Detected |
| 7 | `128` | History | Suspicious Deployer |
| 8 | `256` | Metadata | Phishing Signature |
| 9 | `512` | Anomaly | AI Anomaly Detection |

</div>

---

## 🛠️ The Stack

- **Smart Contract**: Solidity, Foundry, Anvil
- **Oracle Network**: Chainlink CRE, Functions, Automation
- **AI Core**: OpenAI GPT-4o (via DON)
- **Frontend**: Next.js 15, Tailwind, ShadcnUI (SecOps Terminal)

---

*Aegis: Protecting the future of DeFi via Sovereign Execution.* 🛡️✨
