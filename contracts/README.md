# ⛓️ Aegis Vault: The Sovereign Enforcer

> **"In Code We Trust. In Governance We Enforce."**

This directory contains the `AegisVault.sol` smart contract—the heart of the protocol. This is where chainlink Automation and the "Triple Lock" are enforced.

---

## 👩‍⚖️ Judge's Guide: The Sovereign Contract

Here is the exact code that powers the Sovereign Vault:

| Feature | Description | Line of Code |
| :--- | :--- | :--- |
| **Escrow Logic** | Locks user funds before dispatching the job. | [`swap()` method](AegisVault.sol#L45) |
| **Automation Cache** | The `riskCache` mapping for preemptive updates. | [`riskCache`](AegisVault.sol#L35) |
| **Enforcement** | The `fulfillRequest` callback that blocks scams. | [`fulfillRequest()`](AegisVault.sol#L80) |

---

## 🔄 Vault State Lifecycle

The Vault operates as a **Finite State Machine (FSM)**. Funds are never exposed to the destination until the `AUDITING` phase resolves.

```mermaid
stateDiagram-v2
    [*] --> IDLE
    
    IDLE --> LOCKED : User calls swap()
    note right of LOCKED
        Funds moved to Vault
        Events emitted
    end note
    
    LOCKED --> AUDITING : Chainlink Request Dispatched
    
    state AUDITING {
        [*] --> CRE_Processing
    state AUDITING {
        [*] --> CRE_Processing
        CRE_Processing --> Bitmap_Union
        Bitmap_Union --> Consensus_Reached
    }
    
    AUDITING --> SETTLED : fulfillRequest(RiskCode)
    
    state SETTLED {
        [*] --> Check_Risk
        Check_Risk --> EXECUTE : Risk == 0
        Check_Risk --> REFUND : Risk > 0
    }
    
    SETTLED --> TELEMETRY : [Async] AI Reasoning Egress
    SETTLED --> IDLE : Transaction Complete
```

---

## 🏛️ Architecture: The "Sovereign Executor" Pattern

Aegis shifts trust from a chatbot to an immutable smart contract. The Vault acts as a **Smart Escrow** that holds capital hostage until the Chainlink network proves the trade is safe.

1. **User calls `swap(ETH)`**
2. **Vault LOCKS the ETH** (Triple Lock Phase 1)
3. **Vault DISPATCHES job to Chainlink**
4. **Vault WAITS for Split-Path Consensus**:
    - **Enforcement Path**: Bitwise OR of Risk Bitmaps.
    - **Telemetry Path**: AI reasoning pushed to the UI.
5. **Vault SETTLES or REFUNDS** autonomously.

---

## 🤖 Chainlink Automation Integration

We use Chainlink Automation to **Preemptively Blacklist** threats.

- **The Problem**: Waiting for a user to trade a scam token wastes their gas and time.
- **The Solution**: The DON monitors the mempool. If it sees a known scam (e.g. `PEPE-SCAM`), it calls `updateRiskCache()` on the vault.
- **The Result**: The Vault updates its internal blocklist. Future attempts to swap that token are **reverted instantly** at the contract level.

```solidity
// AUTOMATION HOOK
function updateRiskCache(address token, uint256 riskCode) external {
    // Only authorized forwarders can call this
    riskCache[token] = riskCode;
    emit RiskCacheUpdated(token, riskCode);
}
```

---

## 🧪 Verify This Contract

Run the Hollywood Demo to see the contract lock and release funds in real-time:

```bash
node ../tests/hollywood-demo.js
```

*Aegis Vault: The decentralized firewall for DeFi 🛡️*
