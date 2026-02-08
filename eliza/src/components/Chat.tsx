import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Hammer, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/moving-border"; // Using the Moving Border Button wrapper

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
}

interface ChatProps {
    onIntent: (intent: string) => void;
    isProcessing: boolean;
    workflowStatus: string;
    currentStep: number;
}

export default function Chat({ onIntent, isProcessing }: ChatProps) {
    const [input, setInput] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'agent', content: "Systems Online. Aegis Protocol Active. Awaiting Command." },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isLoading = localLoading || isProcessing;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
        setLocalLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // AI thinking delay

            const response = await fetch('http://localhost:3011/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: userMsg })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'agent',
                content: data.text
            }]);

            if (data.content || /swap|buy|trade|sell|check|scan|verify|risk|analyze|safe|token/i.test(userMsg)) {
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
            setLocalLoading(false);
        }
    };

    return (
        <Card className="w-full bg-black/50 border-white/10 backdrop-blur-xl h-[700px] flex flex-col overflow-hidden shadow-2xl shadow-purple-500/20">
            <CardHeader className="border-b border-white/5 bg-black/40">
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-purple-400" />
                    AEGIS MISSION CONTROL
                </CardTitle>
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
                                <div className={`max-w-[80%] p-4 rounded-2xl relative overflow-hidden backdrop-blur-md ${m.role === 'agent'
                                    ? 'bg-zinc-900/80 border border-purple-500/30 text-zinc-100 rounded-tl-none shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                                    : 'bg-indigo-600/20 border border-indigo-500/30 text-white rounded-tr-none'
                                    }`}>
                                    {m.role === 'agent' && <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50" />}
                                    <p className="text-sm leading-relaxed">{m.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-zinc-900/50 border border-purple-500/20 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Hammer className="w-4 h-4 text-purple-400 animate-pulse" />
                                <span className="text-xs text-purple-400/70 font-mono animate-pulse">
                                    USING TOOL: CHECK_RISK
                                </span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5 relative z-20">
                    <form onSubmit={handleSubmit} className="flex items-center gap-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a command or query..."
                            className="flex-1 bg-zinc-950/50 border-purple-500/30 focus-visible:ring-purple-500/50 text-white placeholder:text-zinc-500 h-14 rounded-xl"
                            disabled={isLoading}
                        />
                        <Button
                            borderRadius="1.75rem"
                            className={`font-bold transition-all duration-300 ${isLoading
                                ? 'bg-purple-900/50 text-purple-200 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                : 'bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800'
                                }`}
                            type="submit"
                            disabled={isLoading}
                            containerClassName="h-14 w-32"
                        >
                            {isLoading ? (
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    <Hammer className="w-6 h-6" />
                                </motion.div>
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
