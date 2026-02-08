# 🤖 Eliza

**ElizaOS Agent** powering the Aegis Risk Oracle demo.

## Character: Aegis

The agent is defined in `character.json` with the persona of a **robotic, authoritative compliance architect**.

### Personality
- **Tone**: Technical, direct, no emojis
- **Role**: Lead Compliance Architect for the Aegis Protocol
- **Knowledge**: Chainlink CRE, Triple Lock Security, GoPlus signals

### Example Interaction
```
User: "Swap 1 ETH for PEPE"
Aegis: "REQUEST RECEIVED. INITIATING SWAP PARAMETER VALIDATION via Chainlink CRE. STANDBY FOR COMPLIANCE CHECK."
```

## 🧩 ElizaOS Integration

This project implements the **ElizaOS** multi-agent framework to power the "Aegis" character.

**Key Features for Judges:**
1.  **Custom Character:** The `characters/aegis.json` defines a strict, security-focused personality that refuses to hallucinate safety.
2.  **Plugin Architecture:** Uses the standard ElizaOS plugin structure (see `src/aegisPlugin.ts`), manually invoked by the demo server for deterministic testing.
3.  **Conversational Risk:** Bridges the gap between raw data (JSON) and human understanding by explaining *why* a token is unsafe in plain English.

## Quick Start
```bash
npm install
npm run dev:server  # Starts on port 3011
```

## Files
| File | Purpose |
| :--- | :--- |
| `character.json` | Aegis persona definition |
| `src/server.ts` | Backend API server |

## API Endpoint
```
POST http://localhost:3011/message
Body: { "text": "swap 100 AVAX" }
```
