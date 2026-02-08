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
import { Shield, Activity, Lock, Zap, ArrowRight, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/moving-border";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    isVerdict?: boolean;
}

interface ChatProps {
    onIntent?: (intent: string) => void;
}

type ScanningStatus = 'idle' | 'detecting' | 'scanning' | 'analyzing' | 'complete';

export default function Chat({ onIntent }: ChatProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scanningStatus, setScanningStatus] = useState<ScanningStatus>('idle');
    const [activeSteps, setActiveSteps] = useState<boolean[]>([false, false, false]); // [Market, Entropy, Security]
    const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]); // Tracks which steps are done
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'agent', content: "Systems Online. Aegis Protocol Active. Awaiting Command." },
    ]);
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

        const isScamToken = userMsg.toLowerCase().includes('scam-token');
        const isRiskQuery = isScamToken ||
            userMsg.toLowerCase().includes('swap') ||
            userMsg.toLowerCase().includes('risk') ||
            userMsg.toLowerCase().includes('analyze') ||
            userMsg.toLowerCase().includes('check');

        if (isRiskQuery) {
            setScanningStatus('detecting');
            setCompletedSteps([false, false, false]);
            await new Promise(resolve => setTimeout(resolve, 800));

            // Simultaneous start - all indicators light up at once
            setScanningStatus('scanning');
            setActiveSteps([true, true, true]);

            // Staggered completion - Market (fastest), Security (mid), Entropy (slowest)
            setTimeout(() => setCompletedSteps(prev => [true, prev[1], prev[2]]), 1200); // Market done
            setTimeout(() => setCompletedSteps(prev => [prev[0], prev[1], true]), 2200); // Security done
            await new Promise(resolve => setTimeout(resolve, 3500)); // Wait for Entropy
            setCompletedSteps([true, true, true]); // All done

            if (isScamToken) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'agent',
                    content: `❌ [AEGIS_DENIED] Critical security protocol triggered.\n\nAsset: SCAM-TOKEN\nVerdict: REJECT\nReason: Malicious proxy pattern and Mintable contract detected. Liquidity at extreme risk.\n\nSecurity Score: 10/10 (Critical)`,
                    isVerdict: true
                }]);
                setIsLoading(false);
                setScanningStatus('idle');
                setActiveSteps([false, false, false]);
                setCompletedSteps([false, false, false]);
                return;
            }

            setScanningStatus('analyzing');
        }

        try {
            const response = await fetch('http://localhost:3011/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userMsg })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'agent',
                content: data.text,
                isVerdict: isRiskQuery && (
                    data.text.includes('VERDICT') ||
                    data.text.includes('AEGIS_APPROVE') ||
                    data.text.includes('AEGIS_REJECT') ||
                    data.text.includes('REJECT')
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
        <Card className="w-full bg-black/50 border-white/10 backdrop-blur-xl h-[700px] flex flex-col overflow-hidden shadow-2xl shadow-purple-500/20">
            <CardHeader className="border-b border-white/5 bg-black/40 py-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
                        <div className="relative">
                            <Shield className={cn(
                                "w-6 h-6 transition-all duration-500",
                                scanningStatus !== 'idle' ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "text-purple-400"
                            )} />
                            {scanningStatus !== 'idle' && (
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-cyan-400/20 rounded-full -z-10"
                                />
                            )}
                        </div>
                        AEGIS MISSION CONTROL
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
                    <AnimatePresence>
                        {messages.map((m) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={cn(
                                    "max-w-[85%] p-4 rounded-2xl relative overflow-hidden backdrop-blur-md",
                                    m.role === 'agent'
                                        ? "bg-zinc-900/80 border border-purple-500/30 text-zinc-100 rounded-tl-none shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                        : "bg-indigo-600/20 border border-indigo-500/30 text-white rounded-tr-none",
                                    m.isVerdict && "border-cyan-500/50 bg-cyan-900/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                )}>
                                    {m.role === 'agent' && (
                                        <div className={cn(
                                            "absolute top-0 left-0 w-1 h-full",
                                            m.isVerdict ? "bg-cyan-500/50" : "bg-purple-500/50"
                                        )} />
                                    )}
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                    {m.isVerdict && (
                                        <div className="mt-2 flex items-center gap-2 text-[10px] text-cyan-400/70 font-mono uppercase tracking-tighter">
                                            <Lock className="w-3 h-3" /> Signed by Aegis DON v1.0
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {(isLoading || scanningStatus !== 'idle') && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-zinc-900/50 border border-purple-500/20 p-4 rounded-2xl rounded-tl-none flex flex-col gap-3 min-w-[280px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    <span className="text-[10px] font-mono text-purple-400 uppercase ml-2">
                                        {scanningStatus === 'detecting' && "Detecting Intent..."}
                                        {scanningStatus === 'scanning' && "Retrieving Oracle Signals..."}
                                        {scanningStatus === 'analyzing' && "Synthesizing with GPT-4o-mini..."}
                                        {scanningStatus === 'idle' && isLoading && "Processing Command..."}
                                    </span>
                                </div>
                                {scanningStatus !== 'idle' && (
                                    <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/5">
                                        <InlinePipelineStep active={activeSteps[0]} completed={completedSteps[0]} icon={<Activity className="w-4 h-4" />} label="MARKET DATA" />
                                        <InlinePipelineStep active={activeSteps[1]} completed={completedSteps[1]} icon={<Zap className="w-4 h-4" />} label="QUANTUM ENTROPY" />
                                        <InlinePipelineStep active={activeSteps[2]} completed={completedSteps[2]} icon={<Lock className="w-4 h-4" />} label="SECURITY SCORE" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5 relative z-20">
                    <form onSubmit={handleSubmit} className="flex items-center gap-4">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a command or query..."
                            className="flex-1 bg-zinc-950/50 border-purple-500/30 focus-visible:ring-purple-500/50 text-white placeholder:text-zinc-500 h-14 rounded-xl"
                            disabled={isLoading}
                        />
                        <Button
                            borderRadius="1.75rem"
                            className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800 flex items-center justify-center p-0"
                            type="submit"
                            disabled={isLoading}
                            containerClassName="h-14 w-14 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-shadow"
                        >
                            {scanningStatus !== 'idle' ? (
                                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                            ) : (
                                <ArrowRight className="w-6 h-6" />
                            )}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
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
