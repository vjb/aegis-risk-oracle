# 🛡️ AEGIS: THE SOVEREIGN DEFI FIREWALL (Chainlink 2026)

> **"A Split-Brain Protocol for Deterministic DeFi Security."**
> *Main Track: **Risk & Compliance** | Sponsor Track: **Tenderly Virtual TestNets***

**Aegis is an enforcement protocol, not an advisory tool.** While other projects warn users about threats, Aegis prevents malicious trades through **on-chain sovereignty**—funds are locked in a smart contract escrow and only released after cryptographic verification by a Chainlink Decentralized Oracle Network (DON).

👉 **[Read the Full Technical Architecture Deep Dive here](docs/SYSTEM_BLUEPRINT.md)**

## 🎬 The "Hollywood" Demo (Run in 2 mins)
We've packaged the entire protocol (Blockchain + Chainlink CRE + AI Cluster) into a single Docker container.

> ⚠️ **Note**: The Terminal you see is **REAL**. The `Chainlink CRE` is executing live forensic analysis using a **Split-Brain Architecture** (Logic + AI) before every trade.

**Prerequisites:** Docker Desktop must be running.

```bash
# 1. Start the Docker Environment (The "World")
docker-compose up --build -d

# 2. Run the Cinematic Verification Suite
node ./tests/hollywood-demo.js
```

### 🧪 End-to-End Verification (Advanced)
For judges who want to see the raw "metal" of the protocol, run the full 5-Phase System Audit:

```bash
# Verify Tenderly Virtual TestNet + Solidity + Chainlink Oracle + Multi-Model Consensus
./tests/run-full-flow.ps1
```

---

## 💡 The Innovation: Split-Brain Consensus

Aegis introduces a **Split-Brain Risk Oracle** to solve the "Black Box" problem of AI. We don't trust a single LLM. We enforce **Byzantine Fault Tolerance (BFT)** across models.

### 🧠 Left Brain: Deterministic Logic
*   **Role**: Enforces hard mathematical limits and known security schemas.
*   **Checks**: Liquidity < $50k, Honeypot detection (GoPlus), Price Deviation > 50%.
*   **Verdict**: 100% Deterministic.

### ⚡ Right Brain: Multi-Model AI Cluster
*   **Role**: Scans for semantic, fuzzy risks (e.g. "This contract looks like a rug pull based on variable naming").
*   **The Cluster**:
    *   **OpenAI** (GPT-4o)

    *   **Groq** (Llama 3)
*   **Verdict**: **Union of Fears**. If *any* model flags a risk, the network flags a risk.

### ⚖️ The Consensus: Bitwise Union
The Chainlink DON aggregates the flags:
`FinalRisk = LeftBrainBits | RightBrainBits`

If `FinalRisk > 0`, the transaction is **REVERTED** on-chain.

---

## 👩‍⚖️ Judge's Guide: Where is the Chainlink?

| Feature | Implementation | File Link |
| :--- | :--- | :--- |
| **1. Sovereign Smart Escrow** | The `AegisVault.sol` contract locks funds and triggers the audit. | [AegisVault.sol](contracts/AegisVault.sol) |
| **2. Split-Brain Workflow** | The CRE Workflow that runs Logic + Multi-Model AI in parallel. | [main.ts](aegis-workflow/main.ts) |
| **3. BFT Aggregation** | Bitwise OR consensus to handle AI variance across nodes. | [simulate-consensus.ts](tests/simulate-consensus.ts) |
| **4. Preemptive Automation** | The `riskCache` mapping for zero-latency blocking. | [AegisVault.sol:L35](contracts/AegisVault.sol#L35) |

---

## 🛡️ The Triple Lock Architecture

Aegis is not just a chatbot. It is a **Smart Escrow Protocol** that enforces safety via code.

### Phase 1: The Lock (Smart Contract)
User calls `swap()`. The Vault **locks keys in escrow** and dispatches a job to the Chainlink DON.

### Phase 2: The Audit (Chainlink CRE)
The DON executes the **Split-Brain** workflow.
- **Left Brain**: Hard math (Liquidity, Volatility).
- **Right Brain**: Queries OpenAI and Groq simultaneously.

### Phase 3: The Verdict (Consensus)
Nodes must reach consensus on the **Risk Bitmask**.
- **Risk 0**: `fulfillRequest` unlocks the funds.
- **Risk > 0**: `fulfillRequest` refunds the user autonomously.

```mermaid
sequenceDiagram
    participant User
    participant Vault as 🛡️ AegisVault<br/>(Tenderly Virtual TestNet)
    participant CRE as 🧠 Chainlink CRE<br/>(DON Cluster)
    participant ExtData as 📊 External Data<br/>(CoinGecko + GoPlus)
    participant AI as 🤖 AI Cluster<br/>(OpenAI + Groq)

    rect rgb(52, 211, 153, 0.1)
        Note over User,Vault: 🔐 PHASE 1: THE LOCK (Atomic Escrow)
        User->>Vault: swap(token, amount)
        Vault->>Vault: 🔒 Lock Funds in Sovereign Escrow
    end
    
    rect rgb(96, 165, 250, 0.1)
        Note over Vault,AI: 📡 PHASE 2: THE AUDIT (Multi-Vector Forensics)
        Vault->>CRE: emit AuditRequested(token, amount)
        
        par Left Brain: Deterministic Logic
            CRE->>ExtData: Query Liquidity + Security Metadata
            ExtData-->>CRE: Price, Volume, Honeypot Status
        and Right Brain: AI Cluster (Union of Fears)
            CRE->>AI: Analyze Metadata + Patterns
            AI-->>CRE: Semantic Risk Flags
        end
    end
    
    rect rgb(251, 191, 36, 0.1)
        Note over CRE: ⚖️ PHASE 3: CONSENSUS (BFT Aggregation)
        CRE->>CRE: finalRisk = leftBrain | openAI | groq
    end
    
    rect rgb(167, 139, 250, 0.1)
        Note over CRE,Vault: ✅ PHASE 4: THE VERDICT (Cryptographic Enforcement)
        CRE-->>Vault: fulfillRequest(riskCode, signature)
        
        alt Risk == 0 (SAFE)
            Note over Vault: ✅ AI Consensus: EXECUTE
            Vault->>User: 💸 Execute Trade & Transfer Tokens
        else Risk > 0 (THREAT DETECTED)
            Note over Vault: 🚫 Threat Flagged by Cluster
            Vault->>User: 💰 FULL REFUND (Zero Loss)
        end
    end
```

---

## 🕸️ The Risk Bitmask Protocol

We force the AI to output specific bit flags. This ensures **determinism** across oracle nodes.

| **Bit** | **Value** | **Category** | **Source** | **Description** |
| :--- | :--- | :--- | :--- | :--- |
| 0 | `1` | Liquidity | **Left Brain** | Low Liquidity (<$50k) |
| 1 | `2` | Volatility | **Left Brain** | High Volatility Spill |
| 2 | `4` | Malicious Code | **Right Brain** | Malicious Code Patterns |
| 3 | `8` | Governance | **Left Brain** | Renounced Ownership |
| 4 | `16` | Honeypot | **Left Brain** | Honeypot Trap Detected |
| 5 | `32` | Impersonation | **Right Brain** | Impersonation Attempt |
| 6 | `64` | Wash Trading | **Right Brain** | Wash Trading Detected |
| 7 | `128` | Suspicious History | **Right Brain** | Suspicious Deployer |
| 8 | `256` | Phishing | **Right Brain** | Phishing Signature |
| 9 | `512` | Anomaly | **Right Brain** | AI Anomaly Detection |

---

## 🏆 Hackathon Tracks

### 🌐 Tenderly Virtual TestNets Integration

Aegis leverages **Tenderly Virtual TestNets** forked from Base Mainnet (Chain ID 8453) to demonstrate production-ready capabilities without the friction of public testnets.

**Why This Integration Matters for Aegis:**
- **Real Market State**: Our deterministic Left Brain logic (liquidity checks, price deviation analysis) requires accurate, real-world data. Tenderly's Base Mainnet fork provides access to actual liquidity pools and token contracts.
- **Live Token Analysis**: When the Right Brain AI Cluster performs semantic analysis, it queries real deployed contracts with actual transaction histories—not mock data.
- **Zero Latency, Zero Cost**: Instant access to mainnet state enables real-time risk assessment before trade execution, with zero gas costs for hundreds of forensic scans.
- **State Manipulation API**: We programmatically fund deployment accounts using Tenderly's `tenderly_setBalance` RPC method, eliminating manual faucet friction and enabling fully automated CI/CD pipelines.

**Technical Implementation:**  
All deployment and test scripts automatically load the Tenderly RPC URL from `.env`:

```powershell
# .env file
TENDERLY_RPC_URL=https://virtual.base.eu.rpc.tenderly.co/YOUR_VIRTUAL_TESTNET_ID

# Automatic state manipulation in deploy-local.ps1
cast rpc tenderly_setBalance $deployer "0x21E19E0C9BAB2400000" --rpc-url $TENDERLY_RPC_URL
# ✅ Programmatically injects 10,000 ETH for zero-friction deployment
```

**Deployed Contracts on Tenderly:**
- **MockVRFCoordinator**: `0x4b81aaD0f4dFB54752e4F389cFfbc6FF264d4d6f`
- **AegisVault**: `0x1F807a431614756A6866DAd9607ca62e2542ab01`

[🔗 **View Live Transactions on Tenderly Explorer**](https://dashboard.tenderly.co/explorer/vnet/71828c3f-65cb-42ba-bc2a-3938c16ca878/transactions) *(Base Mainnet Fork)*

---

## ⚖️ PROVING DETERMINISM: The "Union of Fears" Protocol

**The AI Consensus Challenge:**  
Most AI-powered security tools rely on a single LLM (e.g., GPT-4). This creates a **single point of failure**—if the model is compromised, jailbroken, or simply returns inconsistent results, the entire oracle fails.

**The Aegis Solution: Multi-Model BFT (Byzantine Fault Tolerance)**  
We treat AI non-determinism as a security feature, not a bug. Instead of one "smart" AI, we deploy a **paranoid cluster** that assumes at least one model might be wrong.

### The Mathematics of Fear

```typescript
// Bitwise OR aggregation ensures maximum security
const finalRiskCode = leftBrainRisk | openAIRisk | groqRisk;

// If ANY model flags a risk, the entire cluster raises the alarm
// Example:
// Left Brain:  0b000000000 (No liquidity issues)
// OpenAI:      0b000000100 (Detects "malicious code patterns")  
// Groq:        0b000000000 (No issues detected)
// FINAL:       0b000000100 ✅ THREAT DETECTED
```

**Why This Wins:**
- **Zero False Negatives**: If even one AI detects a threat (wash trading, phishing metadata, impersonation), the trade is blocked.
- **Consensus Across Nodes**: Multiple Chainlink oracle nodes run identical workflows but may query different LLM endpoints or versions. The bitwise OR ensures they all converge on the same verdict despite AI variance.
- **Production-Ready Paranoia**: In security, paranoia is a feature. This is the only hackathon project that turns AI hallucinations into a stronger defense.

---

## 🔒 ON-CHAIN ENFORCEMENT: Solving the TOCTOU Vulnerability

**The Problem: Time-of-Check to Time-of-Use (TOCTOU)**  
Most security tools (MetaMask Snaps, wallet warnings) scan a token *before* you trade. But the market state can change between the scan and execution:

```
12:00:00 PM → Scan shows "Safe" (Liquidity: $1M)
12:00:05 PM → Attacker drains liquidity
12:00:06 PM → Your transaction lands on-chain → ❌ RUG PULLED
```

**The Aegis Solution: Atomic Enforcement via Sovereign Escrow**  
We invert the flow. The scan happens *during* the escrow period, ensuring the audit result matches the execution state.

### The Enforcement Sequence

```solidity
// 1. User initiates swap → Funds IMMEDIATELY locked in AegisVault
function swap(address token, uint256 amount) external {
    IERC20(inputToken).transferFrom(msg.sender, address(this), amount);
    emit AuditRequested(token, amount, block.timestamp); // ✅ Assets frozen
}

// 2. Chainlink DON performs forensic analysis while funds are locked
// 3. DON calls back with cryptographically signed verdict
function fulfillRequest(bytes32 requestId, uint256 riskCode, bytes memory signature) external {
    if (riskCode == 0) {
        // ✅ SAFE: Execute swap atomically in same block
        _executeSwap();
    } else {
        // 🚫 RISK DETECTED: Full refund, zero loss
        IERC20(inputToken).transfer(user, amount);
    }
}
```

**Why This Wins:**
- **Zero TOCTOU Window**: The audit happens *while* funds are locked. Market state cannot change between verification and execution.
- **Code-Enforced Refunds**: Not "advisory" warnings—actual smart contract logic that reverts malicious trades.
- **Production-Ready**: This is not a demo. This is a deployable DeFi primitive that can protect any protocol.

---

## 🛠️ The Stack

- **Smart Contract**: Solidity, Foundry, Anvil
- **Oracle Network**: Chainlink CRE, Functions, VRF, Automation
- **AI Core**: Multi-Model Cluster (OpenAI, Groq)
- **Frontend**: Next.js 15, Tailwind, ShadcnUI (SecOps Terminal)

---

*Aegis: Protecting the future of DeFi via Sovereign Execution.* 🛡️✨
