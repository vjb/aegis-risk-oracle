import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Skull, Shield } from 'lucide-react';

interface RiskItem {
    id: string;
    token: string;
    address: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    timestamp: number;
}

export default function LiveRiskFeed() {
    const [feed, setFeed] = useState<RiskItem[]>([]);
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        // Simulate real-time feed updates
        // In production, this would poll GoPlus API or subscribe to WebSocket
        const mockRiskItems: RiskItem[] = [
            {
                id: '1',
                token: 'SCAM-TOKEN',
                address: '0x1234...abcd',
                riskLevel: 'critical',
                reason: 'Honeypot detected',
                timestamp: Date.now() - 2000,
            },
            {
                id: '2',
                token: 'SUS-COIN',
                address: '0x5678...ef01',
                riskLevel: 'high',
                reason: 'Low liquidity + High slippage',
                timestamp: Date.now() - 5000,
            },
            {
                id: '3',
                token: 'PEPE-V2',
                address: '0x9abc...def2',
                riskLevel: 'medium',
                reason: 'Unverified contract',
                timestamp: Date.now() - 8000,
            },
        ];

        setFeed(mockRiskItems);

        // Simulate new items arriving
        const interval = setInterval(() => {
            const newItem: RiskItem = {
                id: Date.now().toString(),
                token: `TOKEN-${Math.floor(Math.random() * 1000)}`,
                address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
                riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
                reason: [
                    'Suspicious metadata',
                    'Honeypot mechanism',
                    'Rug pull risk',
                    'Low liquidity',
                    'High holder concentration',
                ][Math.floor(Math.random() * 5)],
                timestamp: Date.now(),
            };

            setFeed(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10 items
        }, 8000); // New item every 8 seconds

        return () => clearInterval(interval);
    }, []);

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return 'text-red-500 border-red-900/50 bg-red-950/20';
            case 'high': return 'text-orange-500 border-orange-900/50 bg-orange-950/20';
            case 'medium': return 'text-yellow-500 border-yellow-900/50 bg-yellow-950/20';
            default: return 'text-green-500 border-green-900/50 bg-green-950/20';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'critical': return <Skull className="w-3 h-3" />;
            case 'high': return <AlertTriangle className="w-3 h-3" />;
            case 'medium': return <TrendingUp className="w-3 h-3" />;
            default: return <Shield className="w-3 h-3" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-900/30">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-xs text-purple-400 tracking-wider uppercase">Live Threat Feed</span>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">{feed.length} alerts</span>
            </div>

            {/* Feed Items */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {feed.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`p-2 rounded border ${getRiskColor(item.riskLevel)}`}
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5">{getRiskIcon(item.riskLevel)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-mono font-bold truncate">{item.token}</div>
                                    <div className="text-[10px] text-gray-500 font-mono truncate">{item.address}</div>
                                    <div className="text-[10px] mt-1">{item.reason}</div>
                                    <div className="text-[9px] text-gray-600 mt-1">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
