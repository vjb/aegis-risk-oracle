# 🛡️ Aegis Risk Oracle

<div align="center">

![Aegis Logo](https://via.placeholder.com/150/000000/FFFFFF/?text=AEGIS)

**The Intelligent Guardrail for the Agent Economy**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Chainlink](https://img.shields.io/badge/Chainlink-CRE-375BD2)](https://chain.link/)
[![Track](https://img.shields.io/badge/Hackathon-Risk_&_Compliance-FF4B4B)](./hackathon-track.txt)

*Preventing AI agents from rugging themselves — one signed transaction at a time.*

[**Demo Video**](https://youtu.be/placeholder) | [**Live Deployment**](https://aegis-oracle.vercel.app/) | [**View Contracts**](./contracts/)

</div>

---

## 🏆 Hackathon Track: Risk & Compliance

Aegis is built specifically for the **Risk & Compliance** track, delivering an automated, verifiable safeguard layer for on-chain systems. We have adhered to every requirement:

| Track Requirement | Aegis Implementation |
| :--- | :--- |
| **"Automated risk monitoring"** | 24/7 autonomous scanning of token contracts using [Chainlink CRE](./aegis-workflow/main.ts) triggers. |
| **"Real-time reserve health checks"** | Live query of liquidity & market cap via [CoinGecko API](./aegis-workflow/main.ts#L71). |
| **"Protocol safeguard triggers"** | [AegisVault.sol](./contracts/AegisVault.sol) *reverts* transactions if the risk signature is invalid or high-risk. |
| **"Chainlink Usage"** | Uses [Chainlink Functions / CRE](./aegis-workflow/main.ts) as the decentralized orchestration layer. |

---

## 🎯 The Problem

AI agents (like ElizaOS) are entering the DeFi economy, executing autonomous trades. However, they are vulnerable to:
1.  **Honeypots:** Tokens that can be bought but not sold.
2.  **Price Manipulation:** Buying assets at 500% markup due to low liquidity.
3.  **Black Box Logic:** No audit trail of *why* an agent made a trade.

**Aegis Solution:** A decentralized **Orchestration Layer** that synthesizes multiple risk signals and provides cryptographically-signed verdicts. It acts as a middleware **Safeguard**, blocking malicious transactions *before* they hit the blockchain.

> **Note:** We do not "take back" transactions. The `AegisVault` smart contract simply **reverts** the transaction if the signature is invalid or carries a REJECT verdict, preventing the trade from ever happening.

---

## 🏗️ Architecture

Aegis uses a **"Verify, then Trust"** architecture. No trade can execute without a valid **Quad-Lock Signature** from the Aegis Oracle.

```mermaid
sequenceDiagram
    participant Agent as 🤖 AI Agent (ElizaOS)
    participant CRE as 🛡️ Aegis (Chainlink CRE)
    participant APIs as 📡 External APIs
    participant IPFS as 💾 Pinata (Compliance)
    participant Vault as ⛓️ AegisVault.sol

    Agent->>CRE: 1. Request Risk Assessment (Token, Price, Chain)
    
    par Parallel Data Fetching
        CRE->>APIs: CoinGecko (Market Health)
        CRE->>APIs: GoPlus (Security Scans)
        CRE->>APIs: ANU QRNG (Quantum Entropy)
    end
    
    CRE->>APIs: 2. AI Synthesis (GPT-4o Risk Analysis)
    CRE->>IPFS: 3. Pin Audit Log (Immutability)
    CRE->>CRE: 4. Quad-Lock Signing (PrivKey)
    CRE-->>Agent: 5. Return Signature + CID
    
    Agent->>Vault: 6. Execute Trade with Signature
    Vault->>Vault: 7. Verify Signer & Data Integrity -> SWAP
```

---

## 🧠 The Agentic Workflow (Code Deep Dive)

The core brain of Aegis lives in [`aegis-workflow/main.ts`](./aegis-workflow/main.ts). This TypeScript workflow runs inside the secure Chainlink Runtime Environment (CRE).

### 1. Multi-Factor Data Acquisition
We don't rely on a single source of truth. Aegis aggregates data from:

| API Provider | Purpose | Code Reference |
| :--- | :--- | :--- |
| **[CoinGecko](https://www.coingecko.com/)** | **Economic Health:** Price, Volume, Market Cap. Detects price manipulation (Ask > Market). | [`main.ts:L77`](./aegis-workflow/main.ts#L77) |
| **[GoPlus Labs](https://gopluslabs.io/)** | **Security Scanning:** Detects Honeypots, High Tax, Mintable functions. | [`main.ts:L85`](./aegis-workflow/main.ts#L85) |
| **[ANU QRNG](https://qrng.anu.edu.au/)** | **Liveness & Nonce:** Uses Quantum Random Numbers to generate a unique salt for the signature (Security). | [`main.ts:L81`](./aegis-workflow/main.ts#L81) |
| **[OpenAI](https://openai.com/)** | **Synthesis Engine:** GPT-4o-mini analyzes the raw data to spot "Combo Fails" (moderate risks that stack up). | [`main.ts:L134`](./aegis-workflow/main.ts#L134) |

> **Clarification:** The **Quantum Entropy** (QRNG) is used explicitly for **Signing Mechanics** (generating a non-deterministic salt) to prevent signature collisions. It is *not* used for the risk evaluation itself.

### 2. Verifiable Audit Trail (Pinata / IPFS)

**Why this matters:** Automated agents need accountability. If an agent loses money, we need to know *why* it thought the trade was safe.

*   **Layer 1:** Aegis uses **[Pinata](https://www.pinata.cloud/)** to pin the full JSON Audit Log to IPFS *before* signing.
*   **Layer 2:** The cryptographic hash of that reasoning is embedded in the signature ([`main.ts:L225`](./aegis-workflow/main.ts#L225)).
*   **Result:** `sha256(IPFS_Content) === On_Chain_Hash`. This proves the "Big Story" (the human readable audit) matches the on-chain decision.

### 3. CRE Best Practices (Prize Qualification)

We strictly adhered to the `CRE Best Practices` guide to ensure a production-grade implementation:

*   ✅ **Parallel Execution:** We use `Promise.all()` to fetch CoinGecko, GoPlus, and QRNG simultaneously, minimizing runtime costs and latency.
*   ✅ **Input Sanitization:** All inputs are validated using **Zod** schemas to prevent injection attacks.
*   ✅ **Secret Management:** API keys are never hardcoded; they are retrieved securely using `runtime.getSecret()`.
*   ✅ **Handler Pattern:** We use the standard `handler(trigger, callback)` pattern for maximum compatibility.

---

## 🤖 ElizaOS Integration (Prize Qualification)

Aegis leverages the **ElizaOS** multi-agent framework to provide a conversational interface for risk assessment.

*   **Character:** The "Aegis" character (`characters/aegis.json`) is designed to be a "Zero-Trust Security Officer".
*   **Plugin:** The custom plugin (`integrations/elizaos/`) bridges the gap between natural language user intents ("Is this token safe?") and the structured CRE risk engine.

[**➡️ View ElizaOS Integration**](./eliza/README.md)

---

## 🧪 Scenario Matrix

We tested Aegis against real-world threats to ensure robustness.

| Scenario | Focus | Verdict | Reason |
| :--- | :--- | :--- | :--- |
| **WETH (Base)** | Fair Trade | ✅ **EXECUTE** | Trusted Asset, Low Deviation (<1%). |
| **Honeypot** | Security | ❌ **REJECT** | `is_honeypot: true` flag detected from GoPlus. |
| **Manipulation** | Economy | ❌ **REJECT** | Asking Price > 50% above Market Price. |
| **Combo Fail** | Multi-Factor | ❌ **REJECT** | Unknown Token + Moderate Price Deviation (Risk Stacking). |
| **Unauthorized Mint** | Governance | ❌ **REJECT** | `is_mintable: true` without ownership renounced. |

---

## 🚀 Getting Started

Quickly spin up the entire stack using Docker Compose.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/)
*   [Node.js 18+](https://nodejs.org/)
*   **OpenAI API Key** & **Pinata JWT**

### Installation

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/vjb/aegis-risk-oracle
    cd aegis-risk-oracle
    ```

2.  **Configure Secrets**
    ```bash
    cp .env.example .env
    # Edit .env: OPENAI_API_KEY, PINATA_JWT
    ```

3.  **Launch the Stack**
    ```bash
    docker-compose up -d --build
    ```
    This starts the `aegis_dev` container with the CRE environment pre-configured.

### 🎮 Judge's Guide: Running the Demo

We have provided comprehensive scripts to verify the workflow.

**Option 1: The "Mission Control" View (Recommended)**
This PowerShell script provides a beautiful, color-coded log of the CRE simulation steps.
```powershell
.\test-aegis.ps1
```
*   **Look for:** **<span style="color:green">EXECUTE</span>** or **<span style="color:red">REJECT</span>** verdicts and the **Yellow** AI reasoning.

**Option 2: Verify Cryptography**
Prove that the signatures generated by the TS workflow are valid.
```bash
docker exec aegis_dev bun run aegis-workflow/verify-signature.ts
```

---

## 🔮 Future Roadmap: The "Aegis Hub"

Aegis is designed to be a **Universal Risk Oracle**. Because the risk assessment happens off-chain in the secure Chainlink Runtime Environment (CRE), the **same** cryptographic signature can secure AI agents across any EVM chain.

**Strategic Advantages:**
1.  **Unified Security Policy:** One risk engine protects billions in liquidity across all chains.
2.  **Zero Bridging Latency:** The signature is generated off-chain and submitted directly to the destination chain.
3.  **Historical Audits (The Graph):** We will index `VerdictExecuted` events to create a permanent, queryable history of all AI agent decisions for compliance reporting.

---

**⚠️ Disclaimer:** This project was built for the Chainlink Hackathon. While it uses production-grade cryptographic patterns, the `AegisVault` contract has not been audited. Use at your own risk.

---

*Built with ❤️ by the Aegis Team for the Agent Economy.*
