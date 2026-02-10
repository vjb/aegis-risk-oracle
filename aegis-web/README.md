# 🖥️ Aegis Mission Control: SecOps Terminal

> **"Visualize the Firewall. Monitor the Vault."**

This is the **SecOps Command Center** for the Aegis Protocol. It visualizes the "Triple Lock" in real-time, moving beyond a simple chat interface to a professional forensic dashboard.

---

## 👩‍⚖️ Judge's Guide: The High-Stakes UX

The UI is designed to prove that **money is safe**.

| Feature | Description | Component |
| :--- | :--- | :--- |
| **Dispatcher** | The Agent interface that parses user intent. | [`Chat.tsx`](src/components/Chat.tsx) |
| **Vault Lock** | Visualizes the on-chain Escrow state (`LOCKED`, `SETTLED`). | [`VaultStatus`](src/components/VaultStatus.tsx) |
| **System Logs** | Real-time telemetry from the Chainlink DON. | [`TerminalLogs`](src/components/TerminalLogs.tsx) |

---

## 🎨 Layout: Split-Screen Forensics

The Mission Control follows a three-pane "SecOps" view:

1. **Left Pane (The Dispatcher)**: "Soft" intent parsing. JARVIS provides pre-flight warnings but has no custody.
2. **Center Pane (The Vault Lock)**: The **Sovereign Executor**. It shows the movement of funds from `LOCKING` -> `AUDITING` -> `SETTLED`.
3. **Right Pane (The Matrix Logs)**: A rolling terminal view of the Chainlink DON's backend telemetry, showing raw node consensus.

### 🔒 Visualizing the "Triple Lock"
The loading states mirror the protocol's security phases:
1. `🔒 LOCKING ASSETS IN ESCROW...` (Smart Contract Phase)
2. `📡 DISPATCHING ORACLE REQUEST...` (Chainlink Phase)
3. `🧠 AWAITING CONSENSUS VERDICT...` (Forensics Phase)
4. `✅ VAULT: RELEASING ASSETS. SETTLED.` (Enforcement Phase)

---

## ⚡ Getting Started

```bash
npm install
npm run dev
```

*Aegis Mission Control: Command the firewall. 🛡️💻*
