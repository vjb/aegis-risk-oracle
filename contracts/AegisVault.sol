// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVRFCoordinatorV2.sol";
import "./VRFConsumerBaseV2.sol";

/**
 * @title AegisVault
 * @dev "Sovereign Executor" Architecture for the Chainlink Convergence Hackathon.
 * The Vault initiates the forensic scan, locks funds, and enforces the verdict.
 */
contract AegisVault is Pausable, Ownable, VRFConsumerBaseV2 {
    address public functionsRouter; // Simulated Chainlink Functions Router
    
    // VRF Config
    VRFCoordinatorV2Interface COORDINATOR;
    bytes32 keyHash;
    uint64 s_subscriptionId;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    struct PendingRequest {
        address user;
        address token;
        uint256 amount;
        bool active;
        uint256 randomness; // Store the entropy
    }

    mapping(bytes32 => PendingRequest) public requests;
    mapping(uint256 => bytes32) public vrfToTradeRequest; // VRF Request ID -> Trade Request ID
    mapping(address => uint256) public riskCache; // Persistent Risk Registry (Chainlink Automation compatible)
    mapping(address => uint256) public userEscrow; // Tracks locked funds during scan

    event TradeInitiated(bytes32 indexed requestId, address indexed user, address token, uint256 amount);
    event EntropyGenerated(bytes32 indexed requestId, uint256 randomness); // New event for off-chain agent
    event TradeSettled(bytes32 indexed requestId, address indexed user, address token, uint256 amount, uint256 riskCode);
    event TradeRefunded(bytes32 indexed requestId, address indexed user, address token, uint256 amount, uint256 riskCode);
    event RiskCacheUpdated(address indexed token, uint256 riskCode);
    event OracleError(bytes32 indexed requestId, string reason);

    constructor(
        address _router,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subId
    ) Ownable() VRFConsumerBaseV2(_vrfCoordinator) {
        functionsRouter = _router;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        s_subscriptionId = _subId;
    }

    /**
     * @notice Circuit Breaker: Emergency Pause
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Phase 1: The Trigger
     * Agent calls this to initiate a trade. Funds are locked in escrow.
     */
    function swap(address token, uint256 amount) external payable whenNotPaused {
        require(msg.value == amount, "Aegis: Incorrect escrow amount");
        
        // PREEMPTIVE CHECK: Chainlink Automation Blacklist
        if (riskCache[token] != 0) {
             revert("Aegis: Token blacklisted by preemptive Automation");
        }
        
        // Use a mock Request ID for the demo (normally returned by Router.sendRequest)
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, token, block.timestamp));
        
        requests[requestId] = PendingRequest({
            user: msg.sender,
            token: token,
            amount: amount,
            active: true,
            randomness: 0
        });

        userEscrow[msg.sender] += amount;

        // NEW: Request Verifiable Randomness
        uint256 vrfRequestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        vrfToTradeRequest[vrfRequestId] = requestId;

        emit TradeInitiated(requestId, msg.sender, token, amount);
    }

    /**
     * @notice Phase 1.5: Randomness Callback
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        bytes32 tradeRequestId = vrfToTradeRequest[requestId];
        require(requests[tradeRequestId].active, "Request not active");
        
        requests[tradeRequestId].randomness = randomWords[0];
        
        emit EntropyGenerated(tradeRequestId, randomWords[0]);
    }

    /**
     * @notice Phase 3: The Enforcement
     * Callback from the Chainlink DON (simulated via bypass for demo).
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external whenNotPaused {
        // require(msg.sender == functionsRouter, "Only Router");
        PendingRequest storage req = requests[requestId];
        require(req.active, "Request not active");
        // Ensure entropy was generated before settlement
        // require(req.randomness != 0, "Wait for VRF"); // Optional check

        if (err.length > 0) {
            emit OracleError(requestId, string(err));
            _refund(requestId);
            return;
        }

        // Decode Risk Code from DON Response
        uint256 riskCode = abi.decode(response, (uint256));
        
        if (riskCode == 0) {
            // ✅ SAFE: Settle Trade
            req.active = false;
            userEscrow[req.user] -= req.amount;
            
            // In Prod: This would trigger the actual DEX swap (via Uniswap etc.)
            // For Demo: We just emit success
            emit TradeSettled(requestId, req.user, req.token, req.amount, riskCode);
        } else {
            // 🚫 SCAM: Refund User
            riskCache[req.token] = riskCode; // Auto-update cache on detection
            emit TradeRefunded(requestId, req.user, req.token, req.amount, riskCode);
            _refund(requestId);
        }
    }

    /**
     * @notice Preemptive Security: DON-Initiated Risk Cache Update
     * Allows Chainlink Automation to update risk levels without a user trade trigger.
     */
    function updateRiskCache(address token, uint256 riskCode) external {
        // require(msg.sender == owner || msg.sender == automationForwarder, "Unauthorized");
        riskCache[token] = riskCode;
        emit RiskCacheUpdated(token, riskCode);
    }

    function _refund(bytes32 requestId) internal {
        PendingRequest storage req = requests[requestId];
        req.active = false;
        uint256 amount = req.amount;
        userEscrow[req.user] -= amount;
        
        (bool success, ) = payable(req.user).call{value: amount}("");
        require(success, "Refund failed");
    }

    receive() external payable {}
}

