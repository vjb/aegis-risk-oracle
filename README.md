# 🛡️ AEGIS RISK ORACLE (Chainlink Hackathon 2026)

> **"The Deterministic Shield for DeFi."**  
> *Track: Risk & Compliance / Artificial Intelligence*

Aegis is a **DeFi Safety Agent** powered by a **Decentralized Oracle Network (DON)**. It analyzes token safety using AI Forensics and Consensus Validation before allowing users to interact with high-risk contracts.

---

## 🚀 Key Features

### 1. 🧠 Deterministic "Split-Brain" Oracle
Aegis uses a novel **Split-Brain Architecture** to ensure non-deterministic LLMs can run on a consensus network:
- **The "Right Brain" (AI)**: Analyzes fuzzy data (Sentiment, Wash Trading patterns, Metadata).
- **The "Left Brain" (Logic)**: Normalizes outputs into a **Deterministic Bitmask**.
- **Consensus**: Nodes must agree on the exact Bitmask and Verdict to sign the transaction.

### 2. 👁️ "Tri-Vector" Forensic Scan
Before any trade is approved, Aegis runs three parallel checks:
1.  **Market Integrity**: Real-time price/liquidity analysis (via CoinGecko).
2.  **Security Audit**: Contract vulnerability scanning (via GoPlus).
3.  **AI Forensics**: GPT-4o powered semantic analysis of metadata and trade context.

### 3. 🛡️ Synthetic Signal Injection (v3.0)
To ensure **Mission Critical Continuity**, Aegis v3.0 features a robust fallback layer:
- **Resilient Data**: Automatically injects `[MOCKED]` telemetry if external APIs are rate-limited.
- **Fail-Open Demo**: Ensures judges can see the logic flow even during network congestion.
- **Traceability**: All signals are explicitly labeled as `[LIVE]` or `[MOCKED]` in the logs.

### 4. ✍️ Verifiable DON Signatures
Every decision is locked with a cryptographic proof:
- **Signer Identity**: Verified against the DON account (e.g., `0xf39...`).
- **VRF Salt**: Prevents replay attacks and ensures auditability.
- **Audit Logs**: "Hollywood" style terminal output with category-based highlighting.

---

## 🔗 Chainlink Integrations

This project leverages the full Chainlink stack to ensure trust-minimized execution:

| Component | Usage in Aegis |
| :--- | :--- |
| **[Chainlink Runtime Environment (CRE)](aegis-workflow/main.ts)** | The core execution layer where the specific workflow logic (`aegis-workflow`) runs. |
| **[Chainlink Functions](aegis-workflow/main.ts)** | Fetches external data from CoinGecko and GoPlus APIs securely. |
| **[Decentralized Oracle Network (DON)](tests/simulate-consensus.ts)** | Validates the AI's analysis and signs the final verdict using `secp256k1` signatures. |
| **[Chainlink VRF](aegis-workflow/utils.ts)** | (Simulated) Provides randomness for salt generation to prevent replay attacks. |

---

## 🛠️ Architecture

```mermaid
sequenceDiagram
    participant Agent as 🤖 AI Agent (ElizaOS)
    participant CRE as 🛡️ Aegis (Chainlink CRE)
    participant APIs as 📡 External APIs
    participant Vault as ⛓️ AegisVault.sol

    Agent->>CRE: 1. Request Risk Assessment (Token, Price, Chain)
    
    par Parallel Data Fetching
        CRE->>APIs: CoinGecko (Market Health)
        CRE->>APIs: GoPlus (Security Scans)
    end
    
    CRE->>APIs: 2. AI Synthesis (GPT-4o Risk Analysis)
    CRE->>CRE: 3. Deterministic Signing (PrivKey)
    CRE-->>Agent: 4. Return Signature (Verdict + RiskCode)
    
    Agent->>Vault: 5. Execute Trade with Signature
    Vault->>Vault: 6. Verify Signer & Data Integrity -> SWAP
```

---

## 📦 Repository Structure

- **`aegis-workflow/`**: The Chainlink CRE code. Contains the **Deterministic AI Logic**.
- **`contracts/`**: Solidity Smart Contracts (`AegisVault.sol`) with signature verification.
- **`aegis-web/`**: The "Mission Control" Dashboard (Next.js) featuring the **Tri-Vector UI**.
- **`tests/`**: Comprehensive Test Suite (`simulate-consensus.ts`, `test-aegis.ps1`).
- **`docs/`**: Project documentation, whitepapers, and hackathon resources.

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** v20+
- **Docker** (Required for Local CRE Runtime & Consensus Simulation)

### 1. Installation
Run the following commands to install dependencies for all components:
```bash
npm install
cd aegis-workflow && npm install
cd ../aegis-web && npm install
cd ../eliza && npm install
```

### 2. Start the Docker Environment
Ensure Docker is running to support the local CRE simulation:
```bash
docker-compose up -d
```

### 3. Launch the Mission Control Center
Start the full stack (Frontend + Backend + AI Agent) with one command:
```powershell
.\start-aegis.ps1
```
- **Frontend**: http://localhost:3005
- **Backend API**: http://localhost:3011

### 4. Run the "Hollywood" Demo (Judges' Choice)
Experience the full capabilities of Aegis with our scripted demo suite:
```powershell
.\tests\test-aegis.ps1
```

### 5. Verify the System
Run the comprehensive verification suite to test all APIs, cryptography, and logic:
```powershell
.\tests\test-everything.ps1
```

---

## 💡 Developer Guide: WASM Constraints

The Aegis Risk Oracle runs inside the **Chainlink Runtime Environment (CRE)**, which uses a WASM-based execution engine (**Javy**). This environment has strict limitations:

> [!WARNING]
> New developers must adhere to these rules to avoid **WASM Panic** (unreachable instruction) or decoding errors.

1.  **NO Node.js Native Modules**: You cannot use `node:crypto`, `node:fs`, `node:path`, etc.
2.  **NO Global `Buffer`**: The `Buffer` object is not supported. Use `Uint8Array` or the provided helpers in `utils.ts`.
3.  **Use `utils.ts` for Cryptography**: We provide pure JavaScript implementations of `sha1` and `toBase64` in `aegis-workflow/utils.ts`.
4.  **HTTP Body Encoding**: All payloads must be **Base64 encoded**. Use `toBase64(new TextEncoder().encode(JSON.stringify(obj)))`.

---

*Built with ❤️ by the Aegis Team for the Chainlink Constellation Hackathon.*
