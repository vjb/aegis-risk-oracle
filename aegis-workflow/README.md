# 🤖 Aegis Risk Oracle - Workflow Implementation

This directory contains the main **Chainlink CRE Workflow** logic for the Aegis Risk Oracle. It serves as an intelligent middle-layer that protects DeFi agents from malicious trades.

## 🧠 AI Risk Officer: Beyond Static Logic

The "Risk Officer" implementation in `main.ts` doesn't just check boxes; it performs **Weighted Synthesis**. While we provide a "Law of the Land" (the evaluation criteria), the LLM interprets the **intersection** of these factors.

### The Synthesis Layer
```mermaid
graph TD
    In[Data Context] --> Eval[Intelligent Logic Synthesis]
    
    subgraph Logic_Synthesis ["Contextual Interpretation"]
        P1[Is this markup 'normal' for this liquidity?]
        P2[Does this proxy hide malicious functions?]
        P3[Is the exposure too high for this token trust level?]
    end
    
    Eval --> Logic_Synthesis
    Logic_Synthesis --> Res[Weighted Risk Score & Signed Reasoning]
```

**Key Advantage**: A static script might miss a "Composite Risk" where three amber flags (e.g., moderate tax, moderate markup, and unknown proxy) combine to create a critical threat. The Aegis LLM recognizes these patterns holistically.

## 🧪 Multi-Factor Test Suite

We have implemented a comprehensive test suite to demonstrate the synthesis of multiple risk signals.

| Scenario | Focus | Sample Input | Logic / Reasoning | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **PASS** | Fair Trade | WETH on Base | Price markup is 0%, token is trusted by GoPlus, no technical flags. | ✅ `EXECUTE` |
| **Honeypot** | Security | Known Honeypot | `is_honeypot: true` detected. Immediate rejection for absolute safety. | ❌ `REJECT` |
| **Manipulation** | Economy | WETH (Markup) | Asking price is >50% above market. Detected as direct price manipulation. | ❌ `REJECT` |
| **Composite** | Multi-Factor | `test-payload-suspicious.json` | **AI Synthesis**: Unknown Token + Moderate Price Deviation + Security Flags (Combo Fail). | ❌ `REJECT` |
| **Invalid** | Integrity | Null/Missing | Schema validation failed at Zod layer. Prevents ingestion of malformed data. | ❌ `REJECT` |

## 🚀 Technical Features

- **Parallelized Data Fetching**: Retrieves Price, Entropy, and Security signals simultaneously (CRE Best Practice).
- **Zod Schema Validation**: Strict input parsing to prevent injection or malformed data.
- **Robust API Fallbacks**: Detects CoinGecko 429 rate limits and uses demo fallbacks for stable simulations.
- **Verifiable Output**: Generates a cryptographically signed JSON result for on-chain verification in `AegisVault.sol`.

## 🏆 Hackathon Qualification: CRE Best Practices

This workflow implements the **Chainlink CRE Best Practices** for production-grade oracles.

**Key Features for Judges:**
1.  **Parallel Execution:** Uses `Promise.all()` for CoinGecko + GoPlus + QRNG (L70-L85).
2.  **Input Sanitization:** Uses `zod` schemas to validate all incoming HTTP payloads (L40).
3.  **Secret Management:** Uses `runtime.getSecret()` for API keys (L20).
4.  **Hardware-Based Randomness:** Uses ANU QRNG for the signature salt (L81).

## 🛠 Running Simulations

From the project root:

```bash
# 1. Run the full test suite
./test-aegis.ps1

# 2. Run a specific scenario manually
echo '/app/test-payload-suspicious.json' | cre workflow simulate ./aegis-workflow --target staging-settings
```
