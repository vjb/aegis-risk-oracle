import { motion } from 'framer-motion';
import { Brain, Lock, Activity, CheckCircle2 } from 'lucide-react';

interface Props {
    status: 'IDLE' | 'ACTIVE' | 'COMPLETED' | 'REJECTED';
    currentStep: number;
}

export default function WorkflowVisualizer({ status, currentStep }: Props) {

    // Config based on the "Graphical Node Map" spec
    const steps = [
        { id: 1, label: "Price Feed", sub: "CoinGecko", icon: Activity },    // Waveform
        { id: 2, label: "Entropy", sub: "QRNG", icon: Brain },               // Brain
        { id: 3, label: "Security", sub: "GoPlus", icon: Lock },             // Lock
    ];

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Main Visualizer Card */}
            <div className="relative rounded-2xl overflow-hidden glass-panel border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]">

                {/* Header */}
                <div className="bg-blue-950/30 px-4 py-2 border-b border-blue-500/20 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">Aegis Protocol Engine</span>
                    {status === 'ACTIVE' && (
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                            <span className="text-[9px] text-blue-400/80 font-mono">PROCESSING</span>
                        </div>
                    )}
                </div>

                {/* Graph Area */}
                <div className="p-8 pb-10 relative flex justify-between items-center bg-gradient-to-b from-[#0a0a12] to-[#0f1019]">

                    {/* Connecting Lines (Background) */}
                    <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />

                    {/* Active Progress Line (Gradient) */}
                    <div
                        className="absolute top-1/2 left-12 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 -translate-y-1/2 z-0 transition-all duration-700 ease-out"
                        style={{ width: status === 'IDLE' ? '0%' : `${(currentStep / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 6rem)' }}
                    />

                    {steps.map((step, index) => {
                        const isActive = status !== 'IDLE' && currentStep >= index;
                        const isScanActive = status === 'ACTIVE' && currentStep === index;
                        const isCompleted = status === 'COMPLETED' || (status !== 'IDLE' && currentStep > index);

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">

                                {/* Node Icon Circle */}
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive
                                        ? 'bg-[#0f1019] border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                                        : 'bg-[#0a0a12] border-zinc-800 text-zinc-700'
                                    }`}>
                                    <step.icon className={`w-6 h-6 transition-colors duration-500 ${isActive ? 'text-white' : 'text-zinc-700'
                                        }`} />

                                    {/* Active Pulse Ring */}
                                    {isScanActive && (
                                        <div className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-40" />
                                    )}

                                    {/* Completion Checkmark */}
                                    {isCompleted && (
                                        <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-[#0a0a12] shadow-sm">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Labels */}
                                <div className="absolute top-16 flex flex-col items-center whitespace-nowrap pt-2">
                                    <span className={`text-[10px] font-bold tracking-widest uppercase mb-0.5 ${isActive ? 'text-blue-300' : 'text-zinc-600'
                                        }`}>
                                        STAGE {step.id}
                                    </span>
                                    <span className={`text-xs font-bold leading-none ${isActive ? 'text-white' : 'text-zinc-500'
                                        }`}>
                                        {step.label}
                                    </span>
                                    <span className="text-[10px] text-zinc-600 font-mono mt-0.5">
                                        ({step.sub})
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
