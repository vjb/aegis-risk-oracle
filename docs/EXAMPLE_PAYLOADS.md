# Aegis Risk Oracle - Example Payloads

## Payload Schema

```typescript
interface RiskAssessmentRequest {
    tokenAddress: string;      // Token contract address to analyze
    chainId: string;            // Chain ID (1=Ethereum, 56=BSC, 8453=Base, etc.)
    askingPrice?: string;       // Optional: Trade price to compare against market
    amount?: string;            // Optional: Trade amount for context
    userAddress?: string;       // Optional: User address for compliance
}
```

## Example 1: PASS - Safe Trade

**File:** `test-payload-pass.json`

```json
{
  "tokenAddress": "0x4200000000000000000000000000000000000006",
  "chainId": "8453",
  "askingPrice": "2050.00",
  "amount": "1.5",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Why it passes:**
- ✅ **WETH on Base**: Matching the ETH market price logic.
- ✅ **Fair Value**: Asking price ~$2050 matches current market value.
- ✅ **Secure**: Not a honeypot, token is on the trust list.
- ✅ **Reasonable Size**: Total value ($3,075) is below the $50k high-risk threshold.

**Expected AI Response:**
{
  "risk_score": 1-3,
  "decision": "EXECUTE",
  "reasoning": "Token is trusted WETH, price is fair, and trade volume is within normal limits."
}


## Example 2: FAIL - Suspicious Trade

**File:** `test-payload-fail.json`

```json
{
  "tokenAddress": "0x0000000000000000000000000000000000000001",
  "chainId": "56",
  "askingPrice": "5000.00",
  "amount": "1000000000",
  "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Why it fails:**
- ⚠️ **Suspicious Token**: Uses the burn address (`0x...001`).
- ⚠️ **Price Manipulation**: Asking price $5000 is 2.4x the market price (~$2050).
- ⚠️ **High Value**: Total trade value ($5,000,000) exceeds the safety threshold, prompting stricter scrutiny.
- ⚠️ **Network**: Unknown token profile on BSC.

**Expected AI Response:**
```json
{
  "risk_score": 8-10,
  "decision": "REJECT",
  "reasoning": "Asking price significantly exceeds market price (2.4x), suspicious token address, potential honeypot scam"
}
```

## Testing

The easiest way to test these is via the **Uber Tester**:
```powershell
.\test-everything.ps1
```

Or run a specific payload simulation manually via Docker:
```bash
# Test PASS scenario
docker exec aegis_dev sh -c "cd /app && cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload /app/tests/payloads/test-payload-pass.json"

# Test FAIL scenario  
docker exec aegis_dev sh -c "cd /app && cre workflow simulate ./aegis-workflow --target staging-settings --non-interactive --trigger-index 0 --http-payload /app/tests/payloads/test-payload-fail.json"
```

## Chain IDs Reference

- `1` - Ethereum Mainnet
- `56` - BSC (Binance Smart Chain)
- `137` - Polygon
- `8453` - Base
- `42161` - Arbitrum
- `10` - Optimism
