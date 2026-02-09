# 🤖 ElizaOS Aegis Agent

> **"The Right Brain of the Oracle."**

This is the AI Agent backend powered by **ElizaOS v0.1.9** (modified). It handles:
1.  **Intent Parsing**: Detects when a user asks for a risk assessment (e.g., "Check this token").
2.  **Contextual Reasoning**: Uses GPT-4o-mini to understand colloquial queries.
3.  **Workflow Triggering**: Initiates the Chainlink CRE process when a valid request is made.

---

## 🛠️ Architecture

- **Custom Character**: `characters/aegis.character.json`
- **Plugin System**: `integrations/elizaos/aegis-plugin.ts`
- **Backend API**: Exposes endpoints for the frontend to query history and trigger actions.

---

## ⚡ Quick Start

```bash
# Install dependencies
pnpm install

# Start the Agent Server
npm run dev:server
# API available at http://localhost:3011
```

---

## 🔗 Configuration

The agent requires the following environment variables in `.env`:

```bash
OPENAI_API_KEY=sk-...
CRE_WORKFLOW_ID=... # (Optional) If running against a deployed workflow
```
