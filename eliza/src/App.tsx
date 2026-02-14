import { useState } from 'react';
import Chat, { Message } from './components/Chat';
import AegisVisualizer from './components/AegisVisualizer';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import ScanPipeline from './components/ScanPipeline';
import AegisInput from './components/AegisInput';
import SecurityFeed from './components/SecurityFeed';
import TenderlyStatus from './components/TenderlyStatus';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
    const [workflowStatus, setWorkflowStatus] = useState<"IDLE" | "SCANNING" | "ANALYZING" | "VERIFYING" | "COMPLETE">("IDLE");
    const [scanData, setScanData] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [verdict, setVerdict] = useState<'SAFE' | 'UNSAFE'>('SAFE');

    // Lifted State for Chat
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'agent', content: "Systems Online. Aegis Protocol Active. Awaiting Command." },
    ]);
    const [isThinking, setIsThinking] = useState(false);

    const handleIntent = async (intent: string) => {
        console.log("Intent triggered:", intent);
        setWorkflowStatus("SCANNING");
        setCurrentStep(1);

        // Determine verdict based on keywords
        const isUnsafe = intent.toLowerCase().match(/fail|scam|honey|bad|rug/);
        const finalVerdict = isUnsafe ? 'UNSAFE' : 'SAFE';
        setVerdict(finalVerdict);

        // Simulate scanning process
        setTimeout(() => {
            setWorkflowStatus("ANALYZING");
            setCurrentStep(2);
            setScanData({
                riskScore: isUnsafe ? 10 : 3,
                details: {
                    reason: isUnsafe ? (intent.toUpperCase().includes("HONEY") ? "HONEYPOT DETECTED" : "HIGH RISK DETECTED") : "SAFE",
                    honeypot: !!isUnsafe,
                    simulation: true,
                    holderAnalysis: true
                }
            });
        }, 3000);

        setTimeout(() => {
            setWorkflowStatus("VERIFYING");
            setCurrentStep(3);
        }, 6000);

        setTimeout(() => {
            setWorkflowStatus("COMPLETE");
            setCurrentStep(4);
        }, 9000);

        // State persists until next interaction
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // AI thinking delay

            const response = await fetch('http://localhost:3011/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: userMsg,
                    userId: 'user',
                    roomId: 'default-room-1',
                    userName: 'User'
                })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'agent',
                content: data.text
            }]);

            if (data.content || /swap|buy|trade|sell|check|scan|verify|risk|analyze|safe|token/i.test(userMsg)) {
                handleIntent(userMsg);
            }

        } catch (error) {
            console.error("Error connecting to Aegis:", error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'agent',
                content: "⚠️ SYSTEM ALERT: Secure Uplink Failed. Check Server Connection."
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    // Processing state logic
    const isProcessing = workflowStatus !== "IDLE" && workflowStatus !== "COMPLETE";
    const isLoading = isThinking || isProcessing;

    return (
        <div className="h-screen bg-black text-green-500 font-mono grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black z-0 pointer-events-none" />

            {/* LEFT PANE (25%): THE DISPATCHER - On mobile: full width, collapsible */}
            <div className="col-span-1 lg:col-span-1 border-r border-green-900/30 bg-zinc-950/80 backdrop-blur-sm flex flex-col relative z-10">
                <div className="p-4 border-b border-green-900/30 flex items-center justify-between">
                    <span className="text-xs text-green-600 tracking-widest uppercase">⚡ Dispatcher</span>
                    <span className="text-[10px] text-green-800 animate-pulse">● ONLINE</span>
                </div>

                {/* Tenderly Network Status */}
                <div className="p-3 border-b border-purple-900/30">
                    <TenderlyStatus />
                </div>

                <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide px-2">
                    <Chat
                        messages={messages}
                        isProcessing={isLoading}
                    />
                </div>

                <div className="mt-auto">
                    <AegisInput
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSendMessage}
                        isProcessing={isLoading}
                    />
                </div>
            </div>

            {/* CENTER PANE (50%): THE VAULT (Hero Section) - On mobile: full width */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col h-full relative z-10 p-4 md:p-6 gap-4 md:gap-6">

                {/* Upper: Pipeline */}
                <div className="h-1/3 min-h-[250px] bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
                    <h3 className="text-sm font-bold text-purple-400 mb-6 tracking-widest uppercase">Target Acquisition & Analysis</h3>
                    <WorkflowVisualizer status={workflowStatus} currentStep={currentStep} />
                    <div className="mt-auto">
                        {/* Pass scanData to ensure persistence */}
                        <ScanPipeline status={workflowStatus} scanData={scanData} />
                    </div>
                </div>

                {/* Lower: The Brain / Verdict */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                    <h3 className="text-sm font-bold text-cyan-400 mb-4 tracking-widest uppercase flex items-center gap-2">
                        <span>Deep Neural Scan</span>
                        {workflowStatus === "ANALYZING" && <span className="animate-pulse text-xs text-white">[PROCESSING]</span>}
                    </h3>

                    <div className="flex-1 relative flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {/* Logic: If IDLE and NO scanData, show standby. Otherwise show Visualizer (which handles verdict) */}
                            {workflowStatus === "IDLE" && !scanData ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center text-white/30"
                                >
                                    <div className="text-6xl mb-6 opacity-20 mx-auto w-fit">🛡️</div>
                                    <p className="tracking-widest text-sm">AWAITING TARGET</p>
                                    <p className="text-[10px] mt-2 text-green-900/50">SECURE CHANNEL ACTIVE</p>
                                </motion.div>
                            ) : (
                                <AegisVisualizer
                                    status={workflowStatus}
                                    scanData={scanData}
                                    verdict={verdict}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* RIGHT PANE (25%): SYSTEM LOGS (The Matrix) - On mobile: full width */}
            <div className="col-span-1 lg:col-span-1 border-l border-green-900/30 bg-black flex flex-col relative z-20">
                <div className="p-3 border-b border-green-900/30 bg-zinc-900/50">
                    <span className="text-xs text-green-600 tracking-widest uppercase">Encryption Layer // Logs</span>
                </div>
                <div className="flex-1 overflow-hidden p-2">
                    <SecurityFeed status={workflowStatus} />
                </div>
            </div>

        </div>
    );
}


