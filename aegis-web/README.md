# 🖥️ Aegis Mission Control: SecOps Terminal

> **"Visualize the Firewall. Monitor the Vault."**

The **Aegis Mission Control** is a high-performance Next.js dashboard designed for the **Sovereign Vault** protocol. It stops looking like a simple chatbot and starts looking like a high-stakes **SecOps Terminal**, providing total visibility into the transaction intercepting process.

---

## 🎨 Layout: Split-Screen Forensics

The Mission Control follows a three-pane "Matrix" view:
- **Left Pane (The Dispatcher)**: The Agent interface where intents are parsed and JARVIS-style compliance advice is given.
- **Center Pane (The Vault Lock)**: A dominant visual indicator of the Vault's status—LOCKED (In Audit), VERIFIED (Released), or REJECTED (Blocked).
- **Right Pane (The Matrix Logs)**: A rolling terminal view of the Chainlink DON's backend telemetry, showing raw node consensus.

---

## 🚀 Key SecOps Features

### 1. The Vault Status Lock
The definitive visual arbiter. It color-codes the trade's safety state in real-time:
- 🟡 **LOCKED / AUDITING**: Funds are held in sovereign escrow.
- 🟢 **VERIFIED / RELEASED**: Forensic consensus reached. Trade settled.
- 🔴 **REJECTED / PROTECTED**: Threat detected. Assets autonomously returned.

### 2. "Share Intelligence" (Viral Forensic Reports)
Allows users to tweet a detailed forensic risk report directly from the interface. 
> *"My trade was protected by the Aegis Vault on Base Sepolia. 🛡️ Trust the code, not the agent."*

### 3. Integrated DON Telemetry
A low-latency terminal feed that shows the internal "brain" of the Chainlink DON as it fetches data from CoinGecko, GoPlus, and performs AI Synthesis.

---

## 🛠️ Build Strategy

- **Design Aesthetic**: Glassmorphism, terminal-style fonts (JetBrains Mono), and high-contrast alert states.
- **Framework**: Next.js 15 (App Router).
- **Real-time Flow**: Leverages ElizaOS WebSocket streams and Anvil event hooks.

## ⚡ Getting Started
```bash
npm install
npm run dev
```

*Aegis Mission Control: Command the firewall. 🛡️💻*
