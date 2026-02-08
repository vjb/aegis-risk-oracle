import { motion } from "framer-motion";
import { Activity, ShieldCheck, Lock, BrainCircuit, CheckCircle2, Loader2, Zap } from "lucide-react";

interface Props {
    currentStep: number;
    verdict?: 'SAFE' | 'UNSAFE';
}

const STEPS = [
    { icon: Activity, label: "Price Feed", sub: "(CoinGecko)" },
    { icon: Zap, label: "Quantum Entropy", sub: "(QRNG)" },
    { icon: ShieldCheck, label: "Security Scan", sub: "(GoPlus)" },
    { icon: BrainCircuit, label: "AI Synthesis", sub: "(OpenAI)" },
];

export default function AegisVisualizer({ currentStep, verdict }: Props) {
    return (
        <div className="w-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 rounded-xl p-6 my-4 overflow-hidden relative">

            {/* Background Circuitry Effect */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.4),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

            <div className="flex justify-center items-center mb-8 relative z-10">
                <ShieldCheck className="w-6 h-6 text-cyan-400 mr-2" />
                <span className="text-cyan-400 font-bold tracking-[0.2em] text-sm">AEGIS PROTOCOL ACTIVATED</span>
            </div>

            <div className="flex justify-between items-start relative z-10 px-4">
                {/* Connector Line */}
                <div className="absolute top-5 left-10 right-10 h-0.5 bg-white/10 -z-10">
                    <motion.div
                        className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(Math.min(currentStep, STEPS.length - 1) / (STEPS.length - 1)) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {STEPS.map((step, i) => {
                    const isActive = i === currentStep;
                    const isCompleted = i < currentStep;

                    return (
                        <div key={i} className="flex flex-col items-center gap-3 w-24">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    opacity: isCompleted || isActive ? 1 : 0.4,
                                    borderColor: isActive ? '#22d3ee' : isCompleted ? '#22d3ee' : 'rgba(255,255,255,0.1)'
                                }}
                                className={`w-10 h-10 rounded-full bg-black/60 border-2 flex items-center justify-center relative shadow-xl backdrop-blur-md ${isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' :
                                        isCompleted ? 'border-cyan-500 bg-cyan-950' : 'border-white/10'
                                    }`}
                            >
                                <step.icon className={`w-5 h-5 ${isActive || isCompleted ? 'text-cyan-400' : 'text-zinc-500'}`} />
                                {isCompleted && (
                                    <div className="absolute -top-1 -right-1 bg-black rounded-full">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-black" />
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-20" />
                                )}
                            </motion.div>

                            <div className="text-center">
                                <div className={`text-[10px] font-bold tracking-wider mb-0.5 ${isActive || isCompleted ? 'text-white' : 'text-zinc-500'}`}>
                                    STAGE {i + 1}
                                </div>
                                <div className={`text-[11px] font-medium leading-tight ${isActive || isCompleted ? 'text-cyan-100' : 'text-zinc-600'}`}>
                                    {step.label}
                                </div>
                                <div className="text-[9px] text-zinc-500 font-mono mt-1">
                                    {step.sub}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Final Verdict Animation */}
            {currentStep >= STEPS.length && verdict && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 mx-auto max-w-sm bg-black/40 border border-emerald-500/30 rounded-lg p-4 backdrop-blur-md text-center"
                >
                    <div className="text-xs text-zinc-400 mb-1 font-mono uppercase tracking-widest">Final Assessment</div>
                    <div className="text-xl font-bold text-emerald-400 tracking-wider flex items-center justify-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        VERDICT: {verdict}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
