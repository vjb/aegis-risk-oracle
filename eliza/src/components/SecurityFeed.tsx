import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveRiskFeed from './LiveRiskFeed';

interface Props {
    status: string;
}

export default function SecurityFeed({ status }: Props) {
    const [activeTab, setActiveTab] = useState<'logs' | 'threats'>('logs');
    const [logs, setLogs] = useState<{ time: string, msg: string, type: 'info' | 'warn' | 'success' | 'err' }[]>([
        { time: "INIT", msg: "AEGIS PROTOCOL ENGINE: v1.0.4 - READY", type: 'success' },
        { time: "NET", msg: "ORACLE CLUSTER: CONNECTED [LATENCY: 12ms]", type: 'info' }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs]);

    // React to status changes with REALISTIC log messages
    useEffect(() => {
        const t = () => new Date().toISOString().split('T')[1].slice(0, 8); // HH:MM:SS

        if (status === 'SCANNING') {
            setLogs(prev => [...prev,
            { time: t(), msg: "[DISPATCH] INCOMING INTENT DETECTED", type: 'warn' },
            { time: t(), msg: "[VAULT] ASSETS LOCKED IN ESCROW (1.0 ETH)", type: 'success' },
            { time: t(), msg: "[CRE] DISPATCHING JOB: 0x7f2...a1", type: 'info' }
            ]);
        }
        if (status === 'ANALYZING') {
            setLogs(prev => [...prev,
            { time: t(), msg: "[CRE] FETCHING COINGECKO: 200 OK", type: 'info' },
            { time: t(), msg: "[CRE] GOPLUS HONEYPOT SCAN: CLEAN", type: 'info' },
            { time: t(), msg: "[AI] GPT-4o FORENSIC ANALYSIS: STARTED", type: 'warn' }
            ]);
        }
        if (status === 'VERIFYING') {
            setLogs(prev => [...prev,
            { time: t(), msg: "[DON] CONSENSUS REACHED (3/3 Nodes)", type: 'success' },
            { time: t(), msg: "[AI] BITMASK GENERATED: 0x000000", type: 'info' }
            ]);
        }
        if (status === 'COMPLETE') {
            setLogs(prev => [...prev,
            { time: t(), msg: "[VAULT] 🔓 VERDICT RECEIVED: SAFE", type: 'success' },
            { time: t(), msg: "[VAULT] EXECUTING SWAP...", type: 'success' }
            ]);
        }
    }, [status]);

    return (
        <div className="h-full flex flex-col">
            {/* Tab Switcher */}
            <div className="flex border-b border-green-900/30 mb-2">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition-colors ${activeTab === 'logs'
                            ? 'text-green-400 bg-black/40 border-b-2 border-green-500'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                >
                    System Logs
                </button>
                <button
                    onClick={() => setActiveTab('threats')}
                    className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition-colors ${activeTab === 'threats'
                            ? 'text-purple-400 bg-black/40 border-b-2 border-purple-500'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                >
                    Threat Feed
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'logs' ? (
                    <div className="h-full bg-black font-mono text-xs leading-tight px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-black" ref={scrollRef}>
                        <AnimatePresence>
                            {logs.map((log, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className="mb-1 whitespace-pre-wrap break-all flex group hover:bg-zinc-900/50"
                                >
                                    <span className="text-zinc-600 mr-2 shrink-0 select-none">[{log.time}]</span>
                                    <span className={`${log.type === 'warn' ? 'text-amber-500' :
                                        log.type === 'success' ? 'text-emerald-500' :
                                            log.type === 'err' ? 'text-red-500' :
                                                'text-zinc-500'
                                        }`}>
                                        {log.msg}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div className="mt-2 animate-pulse text-green-500">_</div>
                    </div>
                ) : (
                    <div className="h-full px-2">
                        <LiveRiskFeed />
                    </div>
                )}
            </div>
        </div>
    );
}
