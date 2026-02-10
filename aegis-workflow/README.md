# 🧠 Aegis Dispatcher: The Digital Judge

> **"Consensus-Driven Forensics. Deterministic Execution."**

This directory contains the **Chainlink Runtime Environment (CRE)** logic. It acts as the "Impartial Judge" that bridges real-world security metadata and AI forensics into a single, verifiable bitmask.

---

## 👩‍⚖️ Judge's Guide: The Sovereign Oracle

The CRE logic is designed to be **Deterministic**. This means multiple nodes running slightly different AI prompts or external APIs must converge on the exact same integer result.

| Feature | Description | Line of Code |
| :--- | :--- | :--- |
| **Bitmask Logic** | The core function that calculates the risk integer. | [`calculateRisk()`](src/workflow.ts#L45) |
| **Split-Brain** | The AI vs. Logic separation. | [`analyzeToken()`](src/workflow.ts#L80) |
| **Consensus** | The logic that aggregates node results. | [`aggregate()`](src/workflow.ts#L12) |

---

## 🏛️ The "Split-Brain" Architecture

To run non-deterministic AI on a consensus network, Aegis uses a **Split-Brain Architecture**:

- **Right Brain (AI)**: Scans for fuzzy risks (Sentiment, Wash Trading, Developer History).
- **Left Brain (Logic)**: Normalizes outputs into a **Deterministic Bitmask (uint256)**.

### ⛓️ Keeping AI "On the Rails"
We enforce absolute determinism at the API and logic level:
- **Temperature 0**: Flattens the probability distribution.
- **Seed 42**: Ensures consistent sampling across different oracle nodes.
- **Zero-Dependency Core**: No IPFS, No Pinata. The source code is passed **inline** for atomic, verifiable execution.

---

## 🕸️ The Risk Bitmask Protocol

This is the standard the DON enforces:

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

## 🧪 Simulation

Verify the consensus logic locally:

```bash
docker exec -it aegis_dev sh
cre workflow simulate ./aegis-workflow
```

*Aegis: Forensic integrity signed by the DON ⚡*
