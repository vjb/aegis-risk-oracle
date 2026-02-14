
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import VerdictCard from './VerdictCard';
import RiskGauge from './RiskGauge';

interface Props {
    status: string;
    scanData: any;
    verdict: 'SAFE' | 'UNSAFE';
}

export default function AegisVisualizer({ status, scanData, verdict }: Props) {
    // Show final verdict card
    if (status === 'COMPLETE') {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-full max-w-md"
            >
                <VerdictCard status={verdict} reason={scanData?.details?.reason} />
            </motion.div>
        );
    }

    // Show Risk Gauge during ANALYZING phase
    if (status === 'ANALYZING' && scanData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full"
            >
                <RiskGauge
                    riskScore={scanData?.riskScore || 0}
                    status={status}
                    verdict={verdict}
                />
            </motion.div>
        );
    }

    // Default scanning animation
    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Central scanning animation */}
            <div className="relative z-10 p-8 rounded-full border border-cyan-500/30 bg-black/40 backdrop-blur-md">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-cyan-500 opacity-50"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-b-2 border-purple-500 opacity-50"
                />

                <div className="flex flex-col items-center justify-center gap-2 w-32 h-32">
                    <Shield className="w-12 h-12 text-cyan-400 opacity-80" />
                    <div className="text-xs font-mono text-cyan-300 animate-pulse">
                        {status === 'SCANNING' ? 'SCANNING...' :
                            status === 'VERIFYING' ? 'VERIFYING...' : 'STANDBY'}
                    </div>
                </div>
            </div>

            {/* Background Data Stream Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 animate-ping text-cyan-500 text-xs font-mono">0x4f...a2</div>
                <div className="absolute bottom-1/3 right-1/4 animate-pulse text-purple-500 text-xs font-mono">SIG_VERIFY</div>
            </div>
        </div>
    );
}
