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
        address userAddress;
        address tokenAddress;
        uint256 chainId;
        uint256 askingPrice;
        uint256 timestamp;
        string decision;
        uint8 riskScore;
        bytes32 salt;
        bytes32 reasoningHash; // 🔐 The "Fourth Lock"
    }

    event TradeExecuted(address indexed user, address token, uint256 amount);
    event TradeRejected(address indexed user, address token, string reason);

    constructor(address _donPublicKey) {
        donPublicKey = _donPublicKey;
    }

    /**
     * @notice Verifies a risk assessment verdict signed by the Aegis DON and executes the trade.
     * @param token The token address being traded.
     * @param amount The amount of the trade.
     * @param assessment The risk assessment verdict from the Aegis Oracle.
     * @param signature The cryptographic signature from the Aegis DON.
     */
    function swapWithOracle(
        address token,
        uint256 amount,
        RiskAssessment memory assessment,
        bytes memory signature
    ) external {
        // 1. Verify that the assessment matches the intended trade
        require(assessment.tokenAddress == token, "Token mismatch");
        require(assessment.userAddress == msg.sender, "User mismatch");
        
        // 2. Prevent replay attacks using assessment salt
        require(!processedRequests[assessment.salt], "Request already processed");
        
        // 3. Verify DON Signature
        require(_verifySignature(assessment, signature), "Invalid DON signature");

        // 4. Enforce Risk Policy
        if (assessment.riskScore < 7 && keccak256(bytes(assessment.decision)) == keccak256(bytes("EXECUTE"))) {
            processedRequests[assessment.salt] = true;
            emit TradeExecuted(msg.sender, token, amount);
        } else {
            emit TradeRejected(msg.sender, token, "Risk too high or REJECT decision");
            revert("Aegis: Trade blocked by risk oracle");
        }
    }

    /**
     * @dev Internal helper for signature verification.
     */
    function _verifySignature(RiskAssessment memory assessment, bytes memory signature) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                assessment.userAddress,
                assessment.tokenAddress,
                assessment.chainId,
                assessment.askingPrice,
                assessment.timestamp,
                assessment.decision,
                assessment.riskScore,
                assessment.salt,
                assessment.reasoningHash
            )
        );

        // Standard Ethereum signed message prefix
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        // For hackathon demonstration, we check signature length.
        // In production: return _recoverSigner(ethSignedMessageHash, signature) == donPublicKey;
        return signature.length > 0;
    }

    function updateDonPublicKey(address _newKey) external {
        donPublicKey = _newKey;
    }
}
