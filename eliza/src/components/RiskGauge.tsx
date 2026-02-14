import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Zap } from 'lucide-react';

interface RiskGaugeProps {
    riskScore: number; // 0-10 scale
    status: 'IDLE' | 'SCANNING' | 'ANALYZING' | 'VERIFYING' | 'COMPLETE';
    verdict?: 'SAFE' | 'UNSAFE';
}

export default function RiskGauge({ riskScore, status, verdict }: RiskGaugeProps) {
    // Color mapping: green (0-3), yellow (4-6), red (7-10)
    const getColor = () => {
        if (riskScore === 0) return { primary: '#10b981', secondary: '#34d399', label: 'SECURE' };
        if (riskScore <= 3) return { primary: '#10b981', secondary: '#34d399', label: 'LOW RISK' };
        if (riskScore <= 6) return { primary: '#f59e0b', secondary: '#fbbf24', label: 'MEDIUM RISK' };
        return { primary: '#ef4444', secondary: '#f87171', label: 'HIGH RISK' };
    };

    const color = getColor();
    const percentage = Math.min((riskScore / 10) * 100, 100);
    const isActive = status !== 'IDLE';

    return (
        <div className="relative w-full flex flex-col items-center gap-6 py-8">
            {/* Circular Gauge */}
            <div className="relative w-48 h-48">
                {/* Background Circle */}
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 200 200">
                    <circle
                        cx="100"
                        cy="100"
                        r="85"
                        stroke="#1f2937"
                        strokeWidth="12"
                        fill="none"
                    />
                    {/* Animated Risk Arc */}
                    <motion.circle
                        cx="100"
                        cy="100"
                        r="85"
                        stroke={`url(#riskGradient-${riskScore})`}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 85}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                        animate={{
                            strokeDashoffset: 2 * Math.PI * 85 * (1 - percentage / 100),
                        }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                    {/* Gradient Definitions */}
                    <defs>
                        <linearGradient id={`riskGradient-${riskScore}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={color.primary} />
                            <stop offset="100%" stopColor={color.secondary} />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                        {riskScore === 0 ? (
                            <Shield className="w-16 h-16 text-green-400" />
                        ) : riskScore <= 6 ? (
                            <AlertTriangle className="w-16 h-16 text-yellow-400" />
                        ) : (
                            <Zap className="w-16 h-16 text-red-400" />
                        )}
                    </motion.div>

                    {/* Risk Score */}
                    <motion.div
                        className="text-6xl font-bold mt-2"
                        style={{ color: color.primary }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        {riskScore}
                    </motion.div>

                    {/* Risk Label */}
                    <motion.div
                        className="text-xs tracking-widest mt-1 font-mono"
                        style={{ color: color.secondary }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        {color.label}
                    </motion.div>
                </div>

                {/* Pulsing Border for Unsafe */}
                {riskScore > 6 && verdict === 'UNSAFE' && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-500"
                        animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}
            </div>

            {/* Risk Breakdown */}
            {isActive && (
                <motion.div
                    className="w-full max-w-xs space-y-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <div className="text-xs text-gray-500 uppercase tracking-wider text-center mb-3">
                        Risk Vector Analysis
                    </div>

                    {/* Individual Risk Flags */}
                    <RiskFlag label="Liquidity" active={riskScore >= 1} />
                    <RiskFlag label="Honeypot Detection" active={riskScore >= 2} />
                    <RiskFlag label="Contract Security" active={riskScore >= 4} />
                    <RiskFlag label="AI Pattern Analysis" active={riskScore >= 7} />
                </motion.div>
            )}
        </div>
    );
}

function RiskFlag({ label, active }: { label: string; active: boolean }) {
    return (
        <motion.div
            className={`flex items-center justify-between px-3 py-2 rounded border ${active
                    ? 'bg-red-950/20 border-red-900/40 text-red-400'
                    : 'bg-zinc-900/20 border-zinc-800/40 text-gray-600'
                }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <span className="text-xs font-mono">{label}</span>
            {active && (
                <motion.div
                    className="w-2 h-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}
        </motion.div>
    );
}
