# 🌐 Aegis Mission Control (Web)

> **"The Face of the Protocol."**

This is the Next.js frontend for the **Aegis Risk Oracle**. It provides a real-time "Mission Control" interface where users can interact with the AI Agent, view live market data, and execute trades secured by the Chainlink DON.

---

## 🚀 Key Features

### 1. 🤖 Live Agent Chat
- Interacts with the **ElizaOS Agent** backend.
- Displays rich formatting for AI responses (Markdown support).
- **Tri-Vector Forensic View**: Shows real-time analysis steps.
  - **Market Integrity**: CoinGecko/GoPlus API calls.
  - **Security Audit**: Smart contract vulnerability checks.
  - **AI Reasoning**: GPT-4o logic trace.

### 2. 🛡️ Visual Verdicts & "Viral Loop"
- **Approve**: Green, holographic "Secure" badge.
- **Reject/Deny**: Red/Crimson "Threat Detected" warning.
- **Viral Sharing**: "Warn Others" button generates a pre-filled tweet when a scam is detected.

### 3. 📝 Interactive Scan Reports
- **Dynamic Risk Cards**: Visualizes risk scores (0-100) and specific flags.
- **Bitmask Decoder**: Translates the raw `uint256` risk code into human-readable alerts (e.g., `HONEYPOT_DETECTED`, `WASH_TRADING`).

---

## 🛠️ Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + Framer Motion (Animations)
- **Icons**: Lucide React
- **State**: React Query + Zustand

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# The app will be available at http://localhost:3005
```

---

## 🔗 Environment Variables

Create a `.env.local` file with the following:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3011  # Eliza Agent Backend
```
