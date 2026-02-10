# 🧠 Aegis Dispatcher: The Digital Judge

> **"Consensus-Driven Forensics. Deterministic Execution."**

This directory contains the **Chainlink Runtime Environment (CRE)** logic. It acts as the "Impartial Judge" that bridges real-world security metadata and AI forensics into a single, verifiable bitmask for the Aegis Vault.

---

## 🏛️ The Role of the DON

In the Aegis protocol, the Decentralized Oracle Network (DON) is the **Judge**. It doesn't just "report" data; it **performs forensic synthesis**.
1. **Contract-Initiated**: Triggered automatically by the `AegisVault.sol` user trade request.
2. **Autonomous Re-scanning**: Also triggered periodically via **Chainlink Automation** to monitor known market signals.
3. **Atomic Execution**: All logic runs in a single, trust-minimized workflow.
4. **Deterministic Consensus**: Multiple nodes must agree on the exact **Risk Bitmask** to settle the trade or update the on-chain cache.

---

## 🧠 Deterministic Forensics (The Split-Brain)

To run non-deterministic AI on a consensus network, Aegis uses a **Split-Brain Architecture**:
- **Right Brain (AI)**: Analyzes fuzzy data (Sentiment, Wash Trading, Developer History).
- **Left Brain (Logic)**: Normalizes outputs into a **Deterministic Bitmask (uint256)**.

### ⛓️ Keeping AI "On the Rails"
We enforce absolute determinism at the API and logic level:
- **Temperature 0**: Flattens the probability distribution.
- **Seed 42**: Ensures consistent sampling across different oracle nodes.
- **Zero-Dependency Core**: No IPFS, No Pinata. The source code is passed **inline** for atomic, verifiable execution.

---

## 🕸️ The Risk Bitmask Protocol

| Bit | Value | Flag | Forensic Indicator |
| :--- | :--- | :--- | :--- |
| 0 | 1 | `LIQUIDITY` | Insufficient pool depth for safe trade |
| 1 | 2 | `VOLATILITY` | Abnormal price deviation detected |
| 2 | 4 | `SECURITY` | Malicious code patterns found in contract |
| 3 | 8 | `OWNERSHIP` | Centralized control or non-renounced risks |
| 4 | 16 | `SCAM` | GoPlus confirmation of honeypot behavior |
| 5-9 | ... | ... | ... |

---

## 💡 Engineering Requirements

- **No Remote Dependencies**: The workflow is self-contained. 
- **Inline Logic**: To prevent man-in-the-middle attacks, the Vault passes the logic hash directly.
- **WASM Performance**: optimized for the CRE (Chainlink Runtime Environment).

## 🧪 Simulation
Verify the consensus logic locally:
```bash
node ./tests/hollywood-demo.js
```

*Aegis: Forensic integrity signed by the DON ⚡*
