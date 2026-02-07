// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AegisVault
 * @dev Example contract demonstrating how to verify Aegis Risk Oracle results on-chain.
 * In a real hackathon submission, this contract would be deployed to a testnet like Base Sepolia.
 */
contract AegisVault {
    address public donPublicKey; // Authorized Aegis DON public key
    mapping(bytes32 => bool) public processedRequests; // Replay protection

    struct RiskAssessment {
        string tokenAddress;
        string chainId;
        uint256 riskScore;
        string decision;
        uint256 timestamp;
    }

    event TradeExecuted(address indexed user, string token, uint256 amount);
    event TradeRejected(address indexed user, string token, string reason);

    constructor(address _donPublicKey) {
        donPublicKey = _donPublicKey;
    }

    /**
     * @dev Example function that an AI agent would call to execute a trade.
     * It requires a valid signature from the Aegis DON.
     */
    function swapWithOracle(
        string memory token,
        uint256 amount,
        RiskAssessment memory assessment,
        bytes memory signature
    ) external {
        // 1. Verify that the assessment matches the intent
        require(keccak256(bytes(assessment.tokenAddress)) == keccak256(bytes(token)), "Token mismatch");
        
        // 2. Prevent replay attacks
        bytes32 requestHash = keccak256(abi.encode(assessment, signature));
        require(!processedRequests[requestHash], "Request already processed");
        
        // 3. Verify DON Signature (Mock Logic for Demo)
        // 🔒 PRODUCTION SECURITY: Use ECDSA.recover(assessmentHash, signature) 
        // to verify that this risk assessment was genuinely signed by the Aegis DON.
        require(_verifySignature(assessment, signature), "Invalid DON signature");

        // 4. Enforce Risk Policy
        if (assessment.riskScore < 7 && keccak256(bytes(assessment.decision)) == keccak256(bytes("EXECUTE"))) {
            processedRequests[requestHash] = true;
            emit TradeExecuted(msg.sender, token, amount);
            // Logic to perform the actual swap would go here
        } else {
            emit TradeRejected(msg.sender, token, "Risk too high or REJECT decision");
            revert("Aegis: Trade blocked by risk oracle");
        }
    }

    function _verifySignature(RiskAssessment memory assessment, bytes memory signature) internal view returns (bool) {
        // This is a placeholder for the actual ECDSA verification logic
        // In production, the DON would sign the hash of the RiskAssessment
        return signature.length > 0; // Simplified for demo
    }

    function updateDonPublicKey(address _newKey) external {
        // In production: onlyAdmin or DAO ownership
        donPublicKey = _newKey;
    }
}
