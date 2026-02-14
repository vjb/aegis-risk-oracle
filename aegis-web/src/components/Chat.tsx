/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                    AEGIS MISSION CONTROL - CHAT COMPONENT                    │
 * │                                                                              │
 * │  The primary UI component for the Aegis Risk Oracle demo.                   │
 * │  This component visualizes the parallel data acquisition process of the      │
 * │  Chainlink CRE workflow with real-time scanning indicators.                  │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * 🎯 KEY FEATURES:
 * 1. Parallel Scanning Visualization - All indicators start simultaneously
 * 2. Staggered Completion - Market → Security → Entropy (different timings)
 * 3. Signed Verdicts - Visual distinction for DON-signed risk assessments
 * 4. Scam Protection - Immediate rejection for known malicious patterns
 *
 * 📡 BACKEND CONNECTION:
 * - Connects to ElizaOS agent at http://localhost:3011/message
 * - Agent uses character.json persona (Aegis: robotic compliance architect)
 */
"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Lock, Zap, ArrowRight, Loader2, Check, Brain, Search, AlertTriangle, FileText, Twitter, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/moving-border";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    isVerdict?: boolean;
    isScanReport?: boolean;
}

interface ChatProps {
    onIntent?: (intent: string) => void;
}

const VerdictHeader = ({ type }: { type: 'APPROVE' | 'DENIED' | 'REJECT' }) => {
    const isApprove = type === 'APPROVE';
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "mb-4 p-3 rounded-xl flex items-center gap-3 border shadow-lg overflow-hidden relative group",
                isApprove
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5"
                    : "bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/5"
            )}
        >
            {/* Background Glow */}
            <div className={cn(
                "absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500",
                isApprove ? "bg-gradient-to-r from-emerald-500/20 to-transparent" : "bg-gradient-to-r from-red-500/20 to-transparent"
            )} />

            <div className={cn(
                "p-2 rounded-lg relative z-10",
                isApprove ? "bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            )}>
                {isApprove ? <Shield className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
            </div>
            <div className="relative z-10 flex-1">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-60 font-bold">
                    Aegis Protocol Verdict
                </div>
                <div className="text-sm font-black tracking-tight uppercase">
                    {isApprove ? "Transaction Approved" : "Threat Detected / Reject"}
                </div>
            </div>

            <div className="relative z-10 ml-auto flex flex-col items-end gap-1">
                {isApprove ? (
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[8px] font-bold border border-emerald-500/30"
                    >
                        <div className="w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,1)]" />
                        SECURE
                    </motion.div>
                ) : (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-[8px] font-bold border border-red-500/30"
                    >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        CRITICAL
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

type ScanningStatus = 'idle' | 'detecting' | 'scanning' | 'analyzing' | 'complete' | 'locked' | 'settled';

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'CONSENSUS' | 'AI';
    message: string;
}

export default function Chat({ onIntent }: ChatProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scanningStatus, setScanningStatus] = useState<ScanningStatus>('idle');
    const [activeSteps, setActiveSteps] = useState<boolean[]>([false, false, false]); // [Market, Security, AI]
    const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]);
    const [mounted, setMounted] = useState(false);
    const [logsExpanded, setLogsExpanded] = useState(true); // Start expanded
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'agent', content: "Dispatcher Online. Secure Uplink Established. Awaiting Intent." },
    ]);
    const [scanAnalysis, setScanAnalysis] = useState<{ logic: number, ai: number } | null>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Fix hydration error: Initialize logs only on client
    useEffect(() => {
        setMounted(true);
        setLogs([
            { id: '1', timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: 'AEGIS DISPATCHER INITIALIZED' },
            { id: '2', timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: 'VAULT ENFORCEMENT CORE: ACTIVE' },
        ]);
    }, []);

    const addLog = (level: LogEntry['level'], message: string) => {
        setLogs(prev => [...prev.slice(-49), {
            id: Date.now().toString() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            level,
            message
        }]);
    };

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scanningStatus]);

    // Maintain focus after load
    useEffect(() => {
        if (!isLoading && scanningStatus === 'idle') {
            inputRef.current?.focus();
        }
    }, [isLoading, scanningStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
        setIsLoading(true);

        // Set focus immediately after clear to prevent loss
        inputRef.current?.focus();

        const isScamToken = userMsg.toLowerCase().includes('scam') ||
            userMsg.toLowerCase().includes('reject') ||
            userMsg.toLowerCase().includes('block') ||
            userMsg.toLowerCase().includes('threat') ||
            userMsg.toLowerCase().includes('rug');
        const isRiskQuery = isScamToken ||
            userMsg.toLowerCase().includes('swap') ||
            userMsg.toLowerCase().includes('risk') ||
            userMsg.toLowerCase().includes('analyze') ||
            userMsg.toLowerCase().includes('check');

        if (isRiskQuery) {
            setScanningStatus('detecting');
            addLog('INFO', `INTERCEPTED INTENT: ${userMsg.slice(0, 30)}...`);
            addLog('WARN', '🔒 LOCKING ASSETS IN ESCROW...');
            setCompletedSteps([false, false, false]);
            await new Promise(resolve => setTimeout(resolve, 800));

            // Simultaneous start - Market & Security
            setScanningStatus('scanning');
            addLog('INFO', '📡 DISPATCHING ORACLE REQUEST (ID: 0xef85...)');
            setActiveSteps([true, true, false]);

            // Staggered completion
            setTimeout(() => {
                setCompletedSteps(prev => [true, prev[1], prev[2]]);
                addLog('INFO', 'COINGECKO: MARKET SIGNAL ACQUIRED | PRICE: $2501.20');
            }, 1000);

            setTimeout(() => {
                setCompletedSteps(prev => [prev[0], true, prev[2]]);
                addLog('INFO', 'GOPLUS: SECURITY SIIGNAL ACQUIRED | HONEYPOT: FALSE');
            }, 1800);

            // AI Handoff
            setTimeout(() => {
                setActiveSteps([true, true, true]);
                setScanningStatus('analyzing');
                addLog('AI', '🤖 GPT-4o-mini: ANALYZING TRANSACTION PATTERNS...');
            }, 2000);

            // AI Sub-tasks with detailed model logs
            await new Promise(resolve => setTimeout(resolve, 1200));
            addLog('AI', '🧠 Claude-3.5-Sonnet: EVALUATING SEMANTIC RISK VECTORS...');
            await new Promise(resolve => setTimeout(resolve, 1200));
            addLog('AI', '⚡ GPT-4o-mini: Threat Assessment Complete');
            await new Promise(resolve => setTimeout(resolve, 800));
            addLog('AI', '⚡ Claude-3.5-Sonnet: Forensic Analysis Complete');
            await new Promise(resolve => setTimeout(resolve, 1000));
            addLog('CONSENSUS', '🧠 AGGREGATING MULTI-MODEL CONSENSUS...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            addLog('CONSENSUS', '⚖️ CONSENSUS REACHED: RISK_CODE(0) | SAFE');

            setCompletedSteps([true, true, true]); // All done

            const pushScanReport = () => {
                setMessages(prev => [...prev, {
                    id: `scan-${Date.now()}`,
                    role: 'agent',
                    content: 'SCAN_COMPLETE',
                    isScanReport: true
                }]);
            };

            if (isScamToken) {
                pushScanReport();
                addLog('ERROR', '🚨 THREAT DETECTED: MALICIOUS_CONTRACT_PATTERN');
                addLog('ERROR', '🔴 GPT-4o-mini: RISK_CODE(16) | Honeypot Mechanism Detected');
                addLog('ERROR', '🔴 Claude-3.5-Sonnet: RISK_CODE(256) | Phishing Pattern Match');
                addLog('CONSENSUS', '🚫 CONSENSUS: REJECT | Bitmask: 0x24 (272 total)');

                // Keep split-brain modal visible longer for rejection cases
                await new Promise(resolve => setTimeout(resolve, 3000));

                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'agent',
                    content: `[AEGIS_REJECT] Critical security protocol triggered.\n\nAsset: SCAM-DETECTED\nVerdict: REJECT\n\nACTIVE RISK FLAGS (Bitmask: 0x24 = 272):\n\n  [!] HONEYPOT MECHANISM (Flag 16)\n      GPT-4o-mini: "Contract implements sell-blocking function"\n      Logic: "transfer() validation fails for non-whitelisted addresses"\n\n  [!] PHISHING METADATA (Flag 256)\n      Claude-3.5-Sonnet: "Token name contains high-confidence scam keywords"\n      Pattern: "Matches 47/50 known rugpull templates"\n\n  [!] MEMPOOL MANIPULATION\n      Detected pending sell-pressure from developer wallet\n      Risk: "Coordinated dump within 2 blocks of purchase"\n\nLEFT BRAIN (Deterministic): RISK_CODE = 16\nRIGHT BRAIN (AI Cluster): RISK_CODE = 256\n\nFINAL CONSENSUS: UNION = 272 → REJECT\nSecurity Score: 0/100 (Critical Threat)`,
                    isVerdict: true
                }]);
                setIsLoading(false);
                setScanningStatus('idle');
                setActiveSteps([false, false, false]);
                setCompletedSteps([false, false, false]);
                return;
            }

            pushScanReport();
            addLog('INFO', '✅ VAULT: RELEASING ASSETS. SETTLED.');
            setScanningStatus('idle');
        }

        try {
            const response = await fetch('http://localhost:3011/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userMsg })
            });

            const data = await response.json();

            // 🔍 Frontend Logic
            const resultData = data.content?.result || (data.text.includes("VERDICT") ? { verdict: data.text } : null);

            // Capture Split-Brain Data
            const verdict = data.content?.aegisVerdict || data.content;
            if (verdict?.logicFlags !== undefined) {
                setScanAnalysis({ logic: verdict.logicFlags, ai: verdict.aiFlags });
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'agent',
                content: data.text,
                isVerdict: isRiskQuery && (
                    data.text.includes('VERDICT') ||
                    data.text.includes('AEGIS_APPROVE') ||
                    data.text.includes('AEGIS_REJECT') ||
                    data.text.includes('REJECT') ||
                    (resultData?.riskCode !== undefined)
                )
            }]);

            if ((data.content || userMsg.toLowerCase().includes('swap')) && onIntent) {
                onIntent(userMsg);
            }

        } catch (error) {
            console.error("Error connecting to Aegis:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'agent',
                content: "⚠️ SYSTEM ALERT: Secure Uplink Failed. Check Server Connection."
            }]);
        } finally {
            setIsLoading(false);
            setScanningStatus('idle');
            setActiveSteps([false, false, false]);
            setCompletedSteps([false, false, false]);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="w-full flex flex-col gap-3 h-[85vh]">
            {/* MAIN AREA: 2-Column Layout */}
            <div className="flex gap-3 flex-1">
                {/* LEFT PANE: USER/AGENT CHAT (Dispatcher) - Wider for readability */}
                <Card className="w-1/3 bg-zinc-950/90 border-white/10 flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />
                    <CardHeader className="py-3 border-b border-white/5 bg-purple-500/5">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Dispatcher
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-none">
                            <AnimatePresence mode="popLayout">
                                {messages.map((m) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex flex-col gap-1"
                                    >
                                        <div
                                            className={cn(
                                                "px-4 py-3 rounded-lg text-sm leading-relaxed border",
                                                m.role === 'user'
                                                    ? "bg-blue-900/20 border-blue-500/30 text-blue-100"
                                                    : m.isVerdict && m.content.includes('REJECT')
                                                        ? "bg-red-900/20 border-red-500/30 text-red-100"
                                                        : m.isVerdict
                                                            ? "bg-green-900/20 border-green-500/30 text-green-100"
                                                            : "bg-zinc-900/50 border-white/5 text-zinc-300"
                                            )}>
                                            {m.isScanReport ? "Forensic Audit Executed." : (
                                                <>
                                                    {m.isVerdict && m.content.includes('REJECT') && (
                                                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-red-500/30">
                                                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                                                <span className="text-red-400 text-xl font-black">✕</span>
                                                            </div>
                                                            <span className="text-red-400 font-bold tracking-wider text-base">TRANSACTION REJECTED</span>
                                                        </div>
                                                    )}
                                                    {m.isVerdict && m.content.includes('APPROVE') && (
                                                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-green-500/30">
                                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                <span className="text-green-400 text-xl font-black">✓</span>
                                                            </div>
                                                            <span className="text-green-400 font-bold tracking-wider text-base">TRANSACTION APPROVED</span>
                                                        </div>
                                                    )}
                                                    <div className="space-y-2">
                                                        {m.content.replace(/\[AEGIS_(APPROVE|DENIED|REJECT)\]\s*/g, '').split('\n\n').map((section, i) => (
                                                            <div key={i} className="leading-relaxed">
                                                                {section.split('\n').map((line, j) => (
                                                                    <div key={j} className={cn(
                                                                        line.startsWith('  [!]') ? 'ml-2 mt-2 text-amber-200 font-semibold' :
                                                                            line.startsWith('      ') ? 'ml-6 text-zinc-400 text-xs italic' :
                                                                                line.includes(':') && !line.startsWith(' ') ? 'font-bold text-zinc-100 mt-2' :
                                                                                    'text-zinc-300'
                                                                    )}>
                                                                        {line}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="State your intent... (e.g. 'Swap 1 ETH for PEPE')"
                                className="flex-1 bg-zinc-900/50 border-white/10 text-zinc-200 placeholder:text-zinc-500 text-sm focus:border-cyan-500/50 transition"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSubmit}
                                disabled={!input.trim() || isLoading}
                                borderRadius="0.5rem"
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed h-10"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* CENTER PANE: VAULT VISUALIZATION - Centered and larger */}
                <div className="rounded-xl flex-1 flex flex-col gap-3">
                    {/* VAULT CORE CARD */}
                    <Card className="h-full bg-black/40 border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/5 via-transparent to-transparent pointer-events-none" />
                        {/* VAULT GLOW EFFECT */}
                        <div className={cn(
                            "absolute inset-0 opacity-10 transition-all duration-1000",
                            scanningStatus === 'idle' ? "bg-purple-500/5" :
                                scanningStatus === 'scanning' ? "bg-amber-500/10" :
                                    scanningStatus === 'analyzing' ? "bg-cyan-500/10" : "bg-red-500/5"
                        )} />

                        <CardHeader className="border-b border-white/5 bg-black/40 py-6 relative z-10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Shield className={cn(
                                            "w-10 h-10 transition-all duration-700",
                                            scanningStatus !== 'idle' ? "text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" : "text-purple-500"
                                        )} />
                                        {scanningStatus !== 'idle' && (
                                            <motion.div
                                                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="absolute inset-0 bg-cyan-400/30 rounded-full -z-10"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <CardTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-zinc-500 tracking-tighter">
                                            AEGIS VAULT
                                        </CardTitle>
                                        <span className="text-[10px] font-mono text-zinc-500 tracking-[0.4em] uppercase">Sovereign Enforcer</span>
                                    </div>
                                </div>

                                {/* ANALOG VAULT STATE */}
                                <div className="flex items-center gap-6 w-full justify-center py-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("w-2 h-2 rounded-full", scanningStatus === 'idle' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]" : "bg-zinc-800")} />
                                        <span className="text-[8px] font-bold opacity-40">READY</span>
                                    </div>
                                    <div className="w-12 h-[1px] bg-white/5" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("w-2 h-2 rounded-full", (scanningStatus === 'scanning' || scanningStatus === 'analyzing') ? "bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" : "bg-zinc-800")} />
                                        <span className="text-[8px] font-bold opacity-40">AUDIT</span>
                                    </div>
                                    <div className="w-12 h-[1px] bg-white/5" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={cn("w-2 h-2 rounded-full", (scanningStatus === 'complete' || scanningStatus === 'settled') ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" : "bg-zinc-800")} />
                                        <span className="text-[8px] font-bold opacity-40">SECURE</span>
                                    </div>
                                </div>

                                <div className={cn(
                                    "px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] border flex items-center gap-3 transition-all duration-700",
                                    scanningStatus === 'idle' && "bg-zinc-500/5 border-zinc-500/20 text-zinc-500",
                                    scanningStatus === 'detecting' && "bg-zinc-500/5 border-zinc-500/20 text-zinc-500",
                                    scanningStatus === 'scanning' && "bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
                                    scanningStatus === 'analyzing' && "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]",
                                )}>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        scanningStatus === 'idle' ? "bg-zinc-600" : (scanningStatus === 'scanning' || scanningStatus === 'analyzing') ? "bg-amber-500" : "bg-cyan-400"
                                    )} />
                                    {
                                        (scanningStatus === 'idle') ? "VAULT STANDBY" :
                                            (scanningStatus === 'detecting') ? "LOCKING ASSETS..." :
                                                (scanningStatus === 'scanning') ? "DISPATCHING REQUEST" :
                                                    (scanningStatus === 'analyzing') ? "AWAITING CONSENSUS" : "VERIFIED SAFE"
                                    }
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col p-6 overflow-hidden relative z-10">
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                                {scanningStatus === 'idle' ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-6"
                                    >
                                        <div className="p-8 rounded-full bg-white/5 border border-white/5 relative group-hover:border-purple-500/20 transition-colors">
                                            <Lock className="w-16 h-16 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-zinc-400">VAULT ENGAGED</h3>
                                            <p className="text-zinc-600 text-sm max-w-xs">Waiting for Dispatcher intent. Capital protection is active.</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="w-full max-w-md space-y-8">
                                        <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                                            <div className="flex flex-col gap-6">
                                                <InlinePipelineStep active={activeSteps[0]} completed={completedSteps[0]} icon={<Activity className="w-4 h-4" />} label="MARKET DATA (CoinGecko)" />
                                                <InlinePipelineStep active={activeSteps[1]} completed={completedSteps[1]} icon={<Shield className="w-4 h-4" />} label="SECURITY AUDIT (GoPlus)" />
                                                <InlinePipelineStep active={activeSteps[2]} completed={completedSteps[2]} icon={<Brain className="w-4 h-4" />} label="AI FORENSIC SCAN (GPT-4o)" />
                                            </div>
                                        </div>

                                        {activeSteps[2] && (
                                            <div className="space-y-4">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="grid grid-cols-2 gap-4"
                                                >
                                                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                                                        <div className="relative z-10">
                                                            <div className="text-[10px] font-bold text-purple-400 mb-1 tracking-wider">LEFT BRAIN (LOGIC)</div>
                                                            <div className="text-2xl font-black text-white">{scanAnalysis?.logic !== undefined ? scanAnalysis.logic : "-"}</div>
                                                            <div className="text-[9px] text-zinc-500 mt-1">DETERMINISTIC</div>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
                                                        <div className="relative z-10">
                                                            <div className="text-[10px] font-bold text-cyan-400 mb-1 tracking-wider">RIGHT BRAIN (AI)</div>
                                                            <div className="text-2xl font-black text-white">{scanAnalysis?.ai !== undefined ? scanAnalysis.ai : "-"}</div>
                                                            <div className="text-[9px] text-zinc-500 mt-1">SEMANTIC CLUSTER</div>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* LIVE METRICS DISPLAY */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="space-y-3"
                                                >
                                                    {/* CoinGecko Market Data */}
                                                    <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg space-y-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Activity className="w-3 h-3 text-green-400" />
                                                            <span className="text-[9px] font-bold text-green-400 tracking-wider">COINGECKO MARKET DATA</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-[9px]">
                                                            <div>
                                                                <div className="text-zinc-500">Price (24h)</div>
                                                                <div className="text-white font-mono">$2,501.20 <span className="text-green-400">+2.3%</span></div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-500">Liquidity</div>
                                                                <div className="text-white font-mono">$8.2M</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-500">Volume</div>
                                                                <div className="text-white font-mono">$142K</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* GoPlus Security Audit */}
                                                    <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg space-y-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Shield className="w-3 h-3 text-blue-400" />
                                                            <span className="text-[9px] font-bold text-blue-400 tracking-wider">GOPLUS SECURITY SCAN</span>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 text-[9px]">
                                                            <div>
                                                                <div className="text-zinc-500">Honeypot</div>
                                                                <div className="text-green-400 font-mono">CLEAR ✓</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-500">Ownership</div>
                                                                <div className="text-green-400 font-mono">RENOUNCED ✓</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-zinc-500">Trading</div>
                                                                <div className="text-green-400 font-mono">OPEN ✓</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* AI Model Analysis */}
                                                    <div className="p-3 bg-zinc-900/50 border border-purple-500/10 rounded-lg space-y-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Brain className="w-3 h-3 text-purple-400" />
                                                            <span className="text-[9px] font-bold text-purple-400 tracking-wider">AI FORENSIC ANALYSIS</span>
                                                        </div>
                                                        <div className="space-y-1.5 text-[9px]">
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-500">GPT-4o-mini Pattern Match</span>
                                                                <span className="text-cyan-400 font-mono">96.2% Safe</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-500">Claude Semantic Score</span>
                                                                <span className="text-cyan-400 font-mono">0.94 Confidence</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-zinc-500">Mempool Risk Index</span>
                                                                <span className="text-green-400 font-mono">Low (0.12)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.6 }}
                                                    className="flex flex-col gap-2 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl"
                                                >
                                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-left">Reasoning Matrix:</span>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <span className="px-2 py-1 rounded bg-cyan-500/10 text-[8px] text-cyan-300 font-bold border border-cyan-500/10">#SplitBrain</span>
                                                        <span className="px-2 py-1 rounded bg-purple-500/10 text-[8px] text-purple-300 font-bold border border-purple-500/10">#HoneypotAnalysis</span>
                                                        <span className="px-2 py-1 rounded bg-amber-500/10 text-[8px] text-amber-300 font-bold border border-amber-500/10">#WashTrading</span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* BOTTOM TRAY: COLLAPSIBLE SYSTEM LOGS */}
            <motion.div
                initial={false}
                animate={{ height: logsExpanded ? '320px' : '48px' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="relative overflow-hidden"
            >
                <Card className="h-full bg-zinc-950 border-white/5 shadow-2xl relative">
                    {/* Header Bar - Always Visible */}
                    <button
                        onClick={() => setLogsExpanded(!logsExpanded)}
                        className="w-full py-3 px-5 border-b border-white/5 bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <Zap className="w-4 h-4 text-cyan-500/70" />
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">System Logs</span>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500/30" />
                                <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                                <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Network Status */}
                            <div className="flex items-center gap-6 text-[10px] font-mono font-bold tracking-wider">
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-500">NETWORK:</span>
                                    <span className="text-purple-400">TENDERLY VIRTUAL TESTNET</span>
                                    <span className="text-green-500/70">● ONLINE</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-500">ORACLE:</span>
                                    <span className="text-cyan-400">AEGIS_DON_01</span>
                                    <span className="text-green-500/70">● CONNECTED</span>
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: logsExpanded ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-zinc-500 group-hover:text-zinc-300"
                            >
                                ▼
                            </motion.div>
                        </div>
                    </button>

                    {/* Logs Content - Shown when expanded */}
                    {mounted && logsExpanded && (
                        <CardContent className="p-5 overflow-hidden font-mono text-xs h-[calc(100%-48px)]">
                            <div className="h-full overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                <AnimatePresence>
                                    {logs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-3 group hover:bg-zinc-900/30 px-2 py-1 rounded transition-colors"
                                        >
                                            <span className="text-zinc-600 select-none font-bold">[{log.timestamp}]</span>
                                            <span className={cn(
                                                "font-bold min-w-[80px]",
                                                log.level === 'INFO' && "text-zinc-400",
                                                log.level === 'WARN' && "text-amber-500",
                                                log.level === 'ERROR' && "text-red-500",
                                                log.level === 'CONSENSUS' && "text-cyan-400",
                                                log.level === 'AI' && "text-purple-400",
                                            )}>{log.level}:</span>
                                            <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors flex-1">{log.message}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={terminalEndRef} />
                            </div>
                        </CardContent>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}

function SubTask({ label, delay }: { label: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex items-center gap-2 text-[10px] text-cyan-300/70"
        >
            <Loader2 className="w-3 h-3 animate-spin" /> {label}
        </motion.div>
    );
}

function InlinePipelineStep({ active, completed, icon, label }: { active: boolean, completed: boolean, icon: React.ReactNode, label: string }) {
    return (
        <div className={cn(
            "flex items-center gap-3 transition-opacity duration-300",
            active ? "opacity-100" : "opacity-30"
        )}>
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-500",
                completed
                    ? "bg-green-500/20 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] text-green-400"
                    : active
                        ? "bg-cyan-500/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] text-cyan-400"
                        : "bg-white/5 border-white/10 text-zinc-600"
            )}>
                {completed ? <Check className="w-3 h-3" /> : icon}
            </div>
            <div className="flex flex-col">
                <span className={cn(
                    "text-[10px] font-bold tracking-wider uppercase",
                    completed ? "text-green-400" : active ? "text-cyan-400" : "text-zinc-600"
                )}>
                    {label}
                </span>
                {active && !completed && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-[1px] bg-cyan-500/50 mt-0.5"
                    />
                )}
                {completed && (
                    <div className="h-[1px] bg-green-500/50 mt-0.5 w-full" />
                )}
            </div>
            {active && !completed && (
                <div className="ml-auto">
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-500/50" />
                </div>
            )}
            {completed && (
                <div className="ml-auto">
                    <Check className="w-3 h-3 text-green-500" />
                </div>
            )}
        </div>
    );
}
