// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AegisVault
 * @dev "Sovereign Executor" Architecture for the Chainlink Convergence Hackathon.
 * The Vault initiates the forensic scan, locks funds, and enforces the verdict.
 */
contract AegisVault {
    address public owner;
    address public functionsRouter; // Simulated Chainlink Functions Router
    
    struct PendingRequest {
        address user;
        address token;
        uint256 amount;
        bool active;
    }

    mapping(bytes32 => PendingRequest) public requests;
    mapping(address => uint256) public riskCache; // Persistent Risk Registry (Chainlink Automation compatible)
    mapping(address => uint256) public userEscrow; // Tracks locked funds during scan

    event TradeInitiated(bytes32 indexed requestId, address indexed user, address token, uint256 amount);
    event TradeSettled(bytes32 indexed requestId, address indexed user, address token, uint256 amount, uint256 riskCode);
    event TradeRefunded(bytes32 indexed requestId, address indexed user, address token, uint256 amount, uint256 riskCode);
    event RiskCacheUpdated(address indexed token, uint256 riskCode);
    event OracleError(bytes32 indexed requestId, string reason);

    constructor(address _router) {
        owner = msg.sender;
        functionsRouter = _router;
    }

    /**
     * @notice Phase 1: The Trigger
     * Agent calls this to initiate a trade. Funds are locked in escrow.
     */
    function swap(address token, uint256 amount) external payable {
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
            active: true
        });

        userEscrow[msg.sender] += amount;

        emit TradeInitiated(requestId, msg.sender, token, amount);
        
        // In Prod: router.sendRequest(...) happens here
    }

    /**
     * @notice Phase 3: The Enforcement
     * Callback from the Chainlink DON (simulated via bypass for demo).
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external {
        // require(msg.sender == functionsRouter, "Only Router");
        PendingRequest storage req = requests[requestId];
        require(req.active, "Request not active");

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

