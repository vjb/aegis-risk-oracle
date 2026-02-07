# 🛡️ Aegis Risk Oracle

**AI-Powered Risk Assessment Oracle for DeFi Agents using Chainlink CRE**

Aegis is a production-ready risk oracle that prevents AI agents from executing scam trades by analyzing token security, detecting price manipulation, and providing cryptographically-signed risk assessments.

**🔗 GitHub**: https://github.com/vjb/aegis-risk-oracle
[![Chainlink](https://img.shields.io/badge/Chainlink-CRE-375BD2?style=flat&logo=chainlink)](https://chain.link)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎬 Demo Video
[Link to 3-5 minute demo video] - _Recording in Progress_

---

## 🏆 Hackathon Status: Risk & Compliance

| Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **CRE Workflow** | ✅ | Fully validated & simulated using `@chainlink/cre-sdk`. |
| **Chainlink APIs** | ✅ | Parallel fetching of Market Data, Security Scores, and Entropy. |
| **LLM Integration** | ✅ | GPT-4o-mini synthesized Multi-Factor Risk Analysis. |
| **The Triple Lock** | ✅ | ECDSA signatures with **Identity**, **Value**, and **Time** locks. |
| **Sub-second Oracle** | ✅ | Real-time analysis with zero hardcoded "if-then" bottlenecks. |

---

## 🧪 Multi-Factor Test Matrix (Proof of Concept)

Aegis is designed to detect "amber" risks that aggregate into a "red" verdict—something static filters miss.

| Scenario | Asset | Verdict | Logic Trigger |
| :--- | :--- | :--- | :--- |
| **Pass** | WETH (Base) | ✅ `EXECUTE` | Low risk, fair price, trusted metadata. |
| **Honeypot** | Generic (BSC) | ❌ `REJECT` | **Critical Security**: `is_honeypot: true` detected externally. |
| **Manipulation** | WETH (Base) | ❌ `REJECT` | **Economic Attack**: Asking price >50% markup over market. |
| **Composite** | SUS-TOKEN | ❌ `REJECT` | **AI Synthesis**: High-Value ($250k) + Proxy/Mintable flags. |
| **Invalid** | N/A | ❌ `REJECT` | **Data Integrity**: Payload failed Zod schema validation. |

---

## 🎯 Problem Statement

AI agents are increasingly executing autonomous trades, yet they lack built-in safeguards against **Honeypots**, **Price Manipulation**, and **Contract Malice**. Traditional risk engines rely on brittle, hardcoded rules that scammers easily bypass. 

**Aegis provides the decentralized "Intelligent Guardrail" agents need for high-stakes DeFi operations.**

---

## 🧠 The "Secret Sauce": AI Synthesis Layer

Unlike traditional risk filters that use static "if-then" logic, Aegis leverages GPT-4o-mini as a **Contextual Synthesis Layer**.

### Static Code vs. Aegis AI Officer
| Feature | Static Logic (TradFi) | Aegis AI Risk Officer |
| :--- | :--- | :--- |
| **Data Noise** | Fails on unexpected data. | Contextually interprets "noisy" API responses. |
| **Risk Patterns** | Hardcoded checks. | Identifies complex, multi-factor scam patterns. |
| **Synthesis** | Binary: Pass or Fail. | Weighted reasoning: Evaluates the *totality* of risk. |
| **Transparency** | Returns a 403 status. | Returns signed, human-readable reasoning. |

### 🛠️ AI Evaluation Flow
```mermaid
flowchart TD
    subgraph Data_Inputs ["Step 1: Raw Signals"]
        direction LR
        A[Price Delta] ~~~ B[Security Flags] ~~~ C[Trade Value] ~~~ D[Contract Metadata]
    end

    subgraph LLM_Synthesis ["Step 2: AI Synthesis Layer"]
        S1{Contextual Evaluation}
        S2{Pattern Identification}
        S3{Multi-Factor Weighting}
        S1 --> S2 --> S3
    end

    subgraph Output ["Step 3: Verifiable Result"]
        V[Signed Verdict & Reasoning]
    end

    Data_Inputs --> LLM_Synthesis
    LLM_Synthesis --> Output
```

---

## 🏗️ Technical Architecture

### ⚡ Best Practice: Parallel Data Acquisition
Aegis utilizes the **Chainlink CRE** runtime to fetch Market Data, Security Scores, and Entropy in parallel, drastically reducing latency for real-time AI decision-making.

```mermaid
sequenceDiagram
    participant Agent as AI Agent (ElizaOS, LangChain, etc.)
    participant Oracle as Aegis Risk Oracle (CRE DON)
    participant APIs as External APIs (CoinGecko, GoPlus, QRNG, OpenAI)
    participant Vault as Vault (Smart Contract)

    Agent->>Oracle: POST /risk-assessment (token, chain, amount)
    
    rect rgb(240, 240, 240)
    note right of Oracle: Parallel Fetching
    par Fetch Market Data
        Oracle->>APIs: Get Price (CoinGecko)
    and Fetch Security Data
        Oracle->>APIs: Get Security (GoPlus)
    and Fetch Entropy
        Oracle->>APIs: Get Entropy (QRNG)
    end
    APIs-->>Oracle: Return Data
    end

    Oracle->>APIs: AI Risk Analysis (OpenAI GPT-4o-mini)
    APIs-->>Oracle: Return Analysis
    
    Oracle->>Oracle: Sign Result with "Triple Lock"
    Note right of Oracle: (Identity + Value + Time Locks)
    Oracle-->>Agent: Signed Result (Score, Verdict, Sig)
    
    Agent->>Vault: swapWithOracle(...)
    Vault->>Vault: Verify Triple Lock Signature -> Execute
```

---

## ⛓️ Chainlink CRE Integration

This project is built using the **Chainlink Runtime Environment (CRE)** to ensure decentralization and verifiability.

### Key Implementation Highlights
- **Workflow Entry**: [aegis-workflow/main.ts](aegis-workflow/main.ts)
- **Prompt Logic**: Implements "Strict Math" rules for risk threshold enforcement.
- **Capability Usage**: Uses `HTTPClient` for low-latency parallelized fetching.

```typescript
// Aegis utilizes the CRE SDK for orchestration
import { HTTPCapability, handler, cre } from "@chainlink/cre-sdk";

const http = new HTTPCapability();
const httpClient = new cre.capabilities.HTTPClient();

// Parallelized fetching pattern
const [price, entropy, security] = await Promise.all([ ... ]);
```

---

## 🚀 Quick Start (Simulation)

### Prerequisites
- Docker (recommended) OR Node.js 18+
- [Chainlink CRE CLI](https://docs.chain.link/chainlink-local/build/cre/installation)

### Run the Demo Suite (via Docker)
```bash
# Build & Run Development Container
docker build -t aegis-dev .
docker run -it --name aegis_dev aegis-dev bash

# Execute Phase 1: AI Risk Analysis
./test-aegis.ps1

# Execute Phase 2: Cryptographic Security Proofs
./test-crypto.ps1
```

---

## 📊 Integrations
| API | Purpose | Data |
|-----|---------|------|
| **CoinGecko** | Market data | ETH/USD Prices |
| **QRNG (ANU)** | Randomness | Quantum Salt |
| **GoPlus Labs** | Security | Honeypots/Taxes |
| **OpenAI** | Synthesis | Final Verdict |

---

## 🛣️ Roadmap
- [ ] **Mainnet Deployment**: Deploy `AegisVault.sol` to Base.
- [ ] **Threshold Signatures**: Transition from mock to real DON-wide signatures.
- [ ] **Agent Plugin**: Direct integration for ElizaOS / LangChain frameworks.

---

**⚠️ Disclaimer**: This is a hackathon demo. Not audited for production use.
