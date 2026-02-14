import { useTenderly } from '../hooks/useTenderly';
import { ExternalLink, Circle } from 'lucide-react';

export default function TenderlyStatus() {
    const { contractState, isLoading, error, getTenderlyExplorerUrl, CONTRACTS } = useTenderly();

    if (isLoading) {
        return (
            <div className="p-4 bg-black/40 border border-purple-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-purple-400 text-xs">
                    <Circle className="w-3 h-3 animate-pulse" />
                    <span>Connecting to Tenderly...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-black/40 border border-red-900/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 text-xs">
                    <Circle className="w-3 h-3 fill-red-500" />
                    <span>Tenderly Offline</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-black/40 border border-purple-900/30 rounded-lg space-y-3">
            {/* Network Status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Circle className="w-2 h-2 fill-green-500 animate-pulse" />
                    <span className="text-xs text-green-400 tracking-wider">TENDERLY VIRTUAL TESTNET</span>
                </div>
                <a
                    href={getTenderlyExplorerUrl('address', CONTRACTS.AEGIS_VAULT)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Chain Info */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                    <div className="text-gray-500 uppercase tracking-wider">Chain ID</div>
                    <div className="text-cyan-400 font-mono">{contractState.chainId || 'N/A'}</div>
                </div>
                <div>
                    <div className="text-gray-500 uppercase tracking-wider">Block</div>
                    <div className="text-cyan-400 font-mono">
                        {contractState.blockNumber ? `#${contractState.blockNumber.toString().slice(-6)}` : 'N/A'}
                    </div>
                </div>
            </div>

            {/* Contract Addresses */}
            <div className="pt-2 border-t border-purple-900/20 space-y-2">
                <div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">AegisVault</div>
                    <a
                        href={getTenderlyExplorerUrl('address', CONTRACTS.AEGIS_VAULT)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                        <span className="truncate">{CONTRACTS.AEGIS_VAULT}</span>
                        <ExternalLink className="w-2 h-2 flex-shrink-0" />
                    </a>
                </div>

                <div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">MockVRF</div>
                    <a
                        href={getTenderlyExplorerUrl('address', CONTRACTS.MOCK_VRF)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                        <span className="truncate">{CONTRACTS.MOCK_VRF}</span>
                        <ExternalLink className="w-2 h-2 flex-shrink-0" />
                    </a>
                </div>
            </div>
        </div>
    );
}
