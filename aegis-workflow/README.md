# 🧠 Aegis Workflow (The Brain)

This directory contains the **Chainlink Runtime Environment (CRE)** workflow that powers the Aegis Oracle. It is designed to be **Deterministic**, **Fail-Closed**, and **Consensus-Ready**.

## 🔑 Core Logic (`main.ts`)

### 1. The "Fail-Closed" Principle
If *any* critical data source (CoinGecko, GoPlus, OpenAI) fails or times out, the system defaults to a **Risk Code 200 (API FAIL)**. It generally returns `false` (Reject) unless it can provably certify safety.

### 2. AI Determinism
How do we make LLMs deterministic?
1.  **Temperature 0**: Forces the model to select the most probable token always.
2.  **Seed 42**: Uses OpenAI's reproducibility seed features.
3.  **Strict JSON Schema**: The prompt enforces a rigid JSON structure.
4.  **Bitmask Normalization**: The "Reasoning" text is ignored for consensus. Only the calculated `flags` (integers) are signed.

### 3. The Risk Bitmask
We use a binary flag system to represent complex risks as a single `uint256`:
- `1` (000001): **Low Liquidity** (<$50k)
- `2` (000010): **High Volatility** (>10% Deviation)
- `4` (000100): **Suspicious Code** (Blacklist/Pause functions)
- `16` (010000): **Honeypot** (GoPlus confirmed)
- `32` (100000): **Impersonation** (Brand spoofing)
- `64` (1000000): **Wash Trading** (Vol > 5x Liq)
- `128` (10000000): **Suspicious Deployer** (Vanity/Owner check)
- `256` (100000000): **Phishing Scam** (Metadata scan)
- `512` (1000000000): **AI Anomaly** (Ambiguity/Gray Zone)

## 🧪 Testing
We use the `simulate-consensus.ts` script to spawn 3 local Docker containers representing Chainlink Nodes. They all execute this workflow in parallel. We compare their outputs bit-by-bit to ensure 100% agreement.

```bash
# Run the consensus simulation
bun run ../tests/simulate-consensus.ts
```
