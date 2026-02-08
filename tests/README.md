# 🧪 Aegis Test Suite

This directory contains individual component tests to verify the specific APIs and logic blocks used in the Aegis workflow.

## 📂 Test Scripts

| Script | Purpose |
| :--- | :--- |
| `test-coingecko.ts` | Verifies connection to CoinGecko API and price fetching logic. Checks for rate limits. |
| `test-goplus.ts` | Tests the integration with GoPlus Security API. Verifies parsing of `is_honeypot` and other flags. |
| `test-qrng.ts` | Verifies the Quantum Random Number Generator (ANU) connection. Ensures entropy is returned in the correct hex format. |
| `test-openai.ts` | Tests the OpenAI GPT-4o-mini integration. Sends a mock context and checks if the JSON response format is valid. |
| `test-all-apis.ts` | Runs all API tests in sequence to ensure full connectivity. |
| `test-crypto.ps1` | A PowerShell script to demonstrate the off-chain signing and verification mechanics. |

## 🏃 Running Tests

You can run these tests directly inside the Docker container:

```bash
# Enter the container
docker exec -it aegis_dev sh

# Run a specific test
bun run tests/test-coingecko.ts

# Run all API tests
bun run tests/test-all-apis.ts
```

These tests ensure that every component of the "Parallel Data Fetching" architecture is functional before running the full CRE workflow simulation.
