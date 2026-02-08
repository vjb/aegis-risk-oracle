import { ShieldAlert, ShieldCheck, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    active: boolean;
    status: 'IDLE' | 'SCANNING' | 'SECURE' | 'THREAT_DETECTED';
}

export default function ShieldOverlay({ active, status }: Props) {
    if (!active && status === 'IDLE') return null;

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
                >
                    <div className="flex flex-col items-center gap-4">
                        {status === 'SCANNING' && (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="p-8 rounded-full border-4 border-emerald-500/30"
                            >
                                <Scan className="w-16 h-16 text-emerald-400" />
                            </motion.div>
                        )}

                        {status === 'SECURE' && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-8 rounded-full bg-emerald-950/80 border-4 border-emerald-500"
                            >
                                <ShieldCheck className="w-16 h-16 text-emerald-400" />
                            </motion.div>
                        )}

                        {status === 'THREAT_DETECTED' && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-8 rounded-full bg-red-950/80 border-4 border-red-500"
                            >
                                <ShieldAlert className="w-16 h-16 text-red-500" />
                            </motion.div>
                        )}

                        <div className="text-xl font-bold tracking-widest bg-black/50 px-4 py-1 rounded border border-emerald-500/20">
                            {status === 'SCANNING' && "SCANNING MEMPOOL..."}
                            {status === 'SECURE' && "VERIFIED SECURE"}
                            {status === 'THREAT_DETECTED' && "THREAT DETECTED"}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
