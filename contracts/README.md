# 🔐 Contracts

**Solidity smart contracts** for on-chain verification of Aegis Risk Oracle verdicts.

## AegisVault.sol

The `AegisVault` contract demonstrates how AI agents can execute trades **only** when they have a valid signature from the Aegis DON.

### Key Functions

```solidity
function swapWithOracle(
    string memory token,
    uint256 amount,
    RiskAssessment memory assessment,
    bytes memory signature
) external
```

### Security Features
1. **Signature Verification** - Uses `ecrecover` to validate DON signatures
2. **Replay Protection** - Tracks processed request hashes
3. **Risk Enforcement** - Reverts if `riskScore >= 7` or `decision != "EXECUTE"`

### Triple Lock Standard
The signature binds:
- **Identity** - User address (prevents hijacking)
- **Value** - Asset price (ensures immutability)
- **Time** - 5-minute expiry (prevents replay)

## 🏆 Hackathon Qualification: Protocol Safeguard Triggers

`AegisVault.sol` implements the mandatory **Protocol Safeguard Triggers**.

**Key Features for Judges:**
1.  **Transaction Revert:** The contract *reverts* (does not execute) if the signature is invalid or the risk score is too high.
2.  **Non-Interactive Enforcement:** The agent cannot bypass the check; the `swapWithOracle` modifier is enforced at the EVM level.
3.  **Cryptographic Binding:** The signature binds the specific `token`, `amount`, and `user` to the `verdict`, preventing front-running or parameter swapping.

## Deployment
```bash
# Deploy to Base Sepolia (example)
forge create --rpc-url $BASE_SEPOLIA_RPC AegisVault --constructor-args $DON_PUBLIC_KEY
```

## Files
| File | Purpose |
| :--- | :--- |
| `AegisVault.sol` | Main vault with signature verification |
