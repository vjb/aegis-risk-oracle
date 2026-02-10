// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IVRFCoordinatorV2.sol";
import "./VRFConsumerBaseV2.sol";

contract MockVRFCoordinator is VRFCoordinatorV2Interface {
    uint256 private counter;
    mapping(uint256 => address) public requestToConsumer;

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );

    event RandomWordsFulfilled(
        uint256 indexed requestId,
        uint256 outputSeed,
        uint96 payment,
        bool success
    );

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external override returns (uint256 requestId) {
        requestId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, counter)));
        counter++;
        requestToConsumer[requestId] = msg.sender;
        
        emit RandomWordsRequested(
            keyHash,
            requestId,
            counter,
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );

        // Auto-fulfill for easier testing in this environment
        // In a real environment, this happens in a separate transaction from the Oracle
        fulfillRandomWords(requestId, msg.sender);
        
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, address consumer) public {
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = uint256(keccak256(abi.encodePacked(requestId, block.timestamp)));
        
        VRFConsumerBaseV2(consumer).rawFulfillRandomness(requestId, randomWords);
        
        emit RandomWordsFulfilled(requestId, randomWords[0], 0, true);
    }

    // Dummy implementations for interface compliance
    function getRequestConfig() external pure override returns (uint16, uint32, bytes32[] memory) { return (0, 0, new bytes32[](0)); }
    function createSubscription() external pure override returns (uint64) { return 1; }
    function getSubscription(uint64) external pure override returns (uint96, uint64, address, address[] memory) { return (0, 0, address(0), new address[](0)); }
    function requestSubscriptionOwnerTransfer(uint64, address) external override {}
    function acceptSubscriptionOwnerTransfer(uint64) external override {}
    function addConsumer(uint64, address) external override {}
    function removeConsumer(uint64, address) external override {}
    function cancelSubscription(uint64, address) external override {}
}
