# Aegis Security: The Triple Lock Architecture

Aegis takes security seriously by implementing a multi-layered "Triple Lock" architecture to protect user capital throughout the lifecycle of a DeFi trade.

## 🔒 Lock 1: Sovereign Smart Escrow
Unlike traditional "check then swap" patterns, Aegis initiates the trade by **locking the user's assets directly in the Aegis Vault contract before any analysis begins**. 
- **Effect**: Assets are isolated from potentially malicious contracts.
- **Fail-Safe**: If the audit fails or the system hangs, funds can be trustlessly reclaimed.

## 🔒 Lock 2: Decentralized Oracle Network (DON) Consensus
Verdicts are not issued by a single server. They are reached via a **Chainlink Decentralized Oracle Network**.
- **Consensus**: Multiple nodes must agree on the risk bitmask.
- **Tamper-Resistance**: No single entity can bypass the vault's security check.

## 🔒 Lock 3: Forensic AI Telemetry
The DON nodes utilize advanced LLMs to perform deep behavioral analysis on asset metadata, deployer patterns, and market anomalies.
- **Deterministic Bitmasks**: AI reasoning is converted into a deterministic bitmask that the smart contract can understand and enforce.
- **Chainlink Automation**: Preemptive risk caching continuously monitors market signals and updates the vault's blacklist without requiring a user trigger.

---
**Protocol Integrity**: Aegis is built on the principle that *Code > Trust*.
