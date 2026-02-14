
import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { createWalletClient, http, publicActions, getContract, parseEther, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

// Contract ABI for swap
const VAULT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "swap",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

// Configuration
const TENDERLY_RPC = process.env.VITE_TENDERLY_RPC_URL || "https://virtual.base.eu.rpc.tenderly.co/71828c3f-65cb-42ba-bc2a-3938c16ca878";
// Use a fixed demo key if not in env (Deployer Key)
const PRIVATE_KEY = (process.env.PRIVATE_KEY as Hex) || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const AEGIS_VAULT_ADDRESS = "0x1F807a431614756A6866DAd9607ca62e2542ab01";
// Mock Token (WETH) specific to this deployed instance, or use zero address for ETH
const MOCK_TOKEN_ADDRESS = "0x4200000000000000000000000000000000000006"; // WETH on Base

export const executeSwapAction: Action = {
    name: "EXECUTE_SWAP",
    similes: ["SWAP_TOKEN", "TRADE_ASSET", "BUY_TOKEN"],
    description: "Executes a swap transaction on the AegisVault contract via Tenderly.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = (message.content.text || "").toLowerCase();
        return text.includes("swap") || text.includes("buy");
    },
    handler: async (runtime: IAgentRuntime, message: Memory, state: State, _options: any, callback: HandlerCallback) => {
        console.log("🚀 [AEGIS ACTION] Initiating Swap Sequence...");

        if (callback) {
            callback({
                text: "Initiating secure swap via Aegis Vault...",
                action: "SWAP_INITIATED"
            });
        }

        try {
            const account = privateKeyToAccount(PRIVATE_KEY);
            const client = createWalletClient({
                account,
                chain: base,
                transport: http(TENDERLY_RPC)
            }).extend(publicActions);

            console.log(`🔌 Connected to Tenderly: ${TENDERLY_RPC}`);
            console.log(`👤 Wallet: ${account.address}`);

            // Parse amount from text (naive implementation for demo)
            // "Swap 1 ETH" -> 1.0
            const text = (message.content.text || "").toLowerCase();
            const amountMatch = text.match(/[\d\.]+/);
            const amountVal = amountMatch ? amountMatch[0] : "0.1";
            const amountWei = parseEther(amountVal);

            console.log(`💸 Amount: ${amountVal} ETH (${amountWei.toString()} wei)`);

            // Execute Transaction
            const hash = await client.writeContract({
                address: AEGIS_VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: 'swap',
                args: [MOCK_TOKEN_ADDRESS, amountWei],
                value: amountWei, // Fix: Send the actual ETH to lock in escrow
            });

            console.log(`✅ Transaction Sent! Hash: ${hash}`);

            if (callback) {
                callback({
                    text: `Transaction broadcasted to Tenderly Virtual TestNet.\nHash: ${hash}`,
                    content: {
                        hash: hash,
                        status: "PENDING_AUDIT",
                        amount: amountVal,
                        token: "WETH"
                    }
                });
            }
            return true;

        } catch (error) {
            console.error("❌ Transaction Failed:", error);
            if (callback) {
                callback({
                    text: `Transaction failed: ${(error as Error).message}`,
                    error: true
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Swap 1 ETH for PEPE" }
            },
            {
                user: "{{agentName}}",
                content: { text: "Initiating secure swap...", action: "EXECUTE_SWAP" }
            }
        ]
    ]
};
