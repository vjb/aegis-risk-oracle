# 🔌 ElizaOS Integration

**Draft plugin** for integrating Aegis Risk Oracle into ElizaOS agents.

## Purpose

This plugin allows any ElizaOS agent to use Aegis as a security guardrail before executing trades.

## Files
| File | Purpose |
| :--- | :--- |
| `aegis-plugin.ts` | Intercepts `SWAP`/`BUY` intents, calls Aegis Oracle |
| `aegis-provider.ts` | Verifies DON signatures locally |

## 🏆 Hackathon Qualification: Plugin Architecture

This plugin demonstrates the **Automated Risk Monitoring** integration path for any ElizaOS agent.

**Key Features for Judges:**
1.  **Universal Adapter:** Can be added to any ElizaOS character to give them "Aegis Protection".
2.  **Intent Parsing:** Automatically detects `SWAP` or `BUY` intents and pauses execution to request a CRE update.
3.  **Verifiable Bridge:** Passes the signed CRE verdict back to the agent context for decision making.

## Usage Example

```typescript
import { aegisPlugin } from './aegis-plugin';

// Register with ElizaOS
agent.registerPlugin(aegisPlugin);

// Now all swap intents are automatically validated
// Trades are blocked if riskScore >= 7 or decision === "REJECT"
```

## Integration Flow

```
Agent Intent → aegis-plugin → Aegis Oracle → Signed Verdict
                                                    ↓
                              APPROVE → Execute Transaction
                              REJECT  → Block & Log Reason
```

## The "Safe Agent" Standard

`aegis-provider.ts` implements local signature verification, allowing agents to trustlessly confirm that verdicts came from the authorized Chainlink DON.
