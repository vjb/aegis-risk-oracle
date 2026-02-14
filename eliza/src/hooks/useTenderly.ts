import { useState, useEffect } from 'react';
import { createPublicClient, http, type PublicClient, type Address } from 'viem';
import { base } from 'viem/chains';

// Deployed contract addresses on Tenderly Virtual TestNet (Base fork)
export const CONTRACTS = {
    AEGIS_VAULT: '0x1F807a431614756A6866DAd9607ca62e2542ab01' as Address,
    MOCK_VRF: '0x4b81aaD0f4dFB54752e4F389cFfbc6FF264d4d6f' as Address,
} as const;

export const TENDERLY_EXPLORER_BASE = 'https://dashboard.tenderly.co/explorer/vnet/71828c3f-65cb-42ba-bc2a-3938c16ca878';

interface ContractState {
    vaultAddress: Address;
    vrfAddress: Address;
    isConnected: boolean;
    chainId: number | null;
    blockNumber: bigint | null;
}

interface RecentTransaction {
    hash: string;
    from: Address;
    to: Address | null;
    timestamp: number;
    status: 'success' | 'failed';
}

export function useTenderly() {
    const [client, setClient] = useState<PublicClient | null>(null);
    const [contractState, setContractState] = useState<ContractState>({
        vaultAddress: CONTRACTS.AEGIS_VAULT,
        vrfAddress: CONTRACTS.MOCK_VRF,
        isConnected: false,
        chainId: null,
        blockNumber: null,
    });
    const [recentTxs, setRecentTxs] = useState<RecentTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initTenderly = async () => {
            try {
                const rpcUrl = import.meta.env.VITE_TENDERLY_RPC_URL ||
                    'https://virtual.base.eu.rpc.tenderly.co/71828c3f-65cb-42ba-bc2a-3938c16ca878';

                const publicClient = createPublicClient({
                    chain: base,
                    transport: http(rpcUrl),
                }) as PublicClient;

                setClient(publicClient);

                // Fetch initial network state
                const [chainId, blockNumber] = await Promise.all([
                    publicClient.getChainId(),
                    publicClient.getBlockNumber(),
                ]);

                setContractState(prev => ({
                    ...prev,
                    isConnected: true,
                    chainId: Number(chainId),
                    blockNumber,
                }));

                setIsLoading(false);
            } catch (err) {
                console.error('Tenderly connection failed:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsLoading(false);
            }
        };

        initTenderly();
    }, []);

    // Poll for new blocks
    useEffect(() => {
        if (!client) return;

        const interval = setInterval(async () => {
            try {
                const blockNumber = await client.getBlockNumber();
                setContractState(prev => ({
                    ...prev,
                    blockNumber,
                }));
            } catch (err) {
                console.error('Block polling error:', err);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [client]);

    const getContractCode = async (address: Address): Promise<string | null> => {
        if (!client) return null;
        try {
            const code = await client.getBytecode({ address });
            return code || null;
        } catch (err) {
            console.error('Failed to fetch contract code:', err);
            return null;
        }
    };

    const getTenderlyExplorerUrl = (type: 'tx' | 'address', value: string): string => {
        if (type === 'tx') {
            return `${TENDERLY_EXPLORER_BASE}/tx/${value}`;
        }
        return `${TENDERLY_EXPLORER_BASE}/address/${value}`;
    };

    return {
        client,
        contractState,
        recentTxs,
        isLoading,
        error,
        getContractCode,
        getTenderlyExplorerUrl,
        CONTRACTS,
    };
}
