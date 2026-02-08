import { useEffect, useState, useRef } from 'react';
import { ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    status: string;
}

export default function SecurityFeed({ status }: Props) {
    const [logs, setLogs] = useState<{ time: string, msg: string, type: 'info' | 'warn' | 'success' }[]>([
        { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "AEGIS PROTOCOL ENGINE: v1.0.4 - READY", type: 'info' },
        { time: new Date().toLocaleTimeString('en-US', { hour12: false }), msg: "ORACLE CLUSTER: CONNECTED [LATENCY: 12ms]", type: 'info' }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom only when new logs arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs]);

    // React to status changes with specific log messages
    useEffect(() => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        if (status === 'ACTIVE') {
            setLogs(prev => [...prev, { time, msg: "NETWORK SIGNAL DETECTOR: INCOMING TRANSACTION", type: 'warn' }]);
            setLogs(prev => [...prev, { time, msg: "PARSING EVM_PARAMS... SUCCESS", type: 'info' }]);
        }
        if (status === 'COMPLETED') {
            setLogs(prev => [...prev, { time, msg: "TRIPLE-LOCK VERIFICATION COMPLETE", type: 'success' }]);
            setLogs(prev => [...prev, { time, msg: "SIGNATURE GENERATED + BROADCASTED", type: 'success' }]);
        }
        if (status === 'REJECTED') {
            setLogs(prev => [...prev, { time, msg: "SECURITY EXCEPTION: POLICY VIOLATION", type: 'warn' }]);
            setLogs(prev => [...prev, { time, msg: "TRANSACTION REJECTED BY AEGIS ORACLE", type: 'warn' }]);
        }
    }, [status]);

    return (
        <div className="h-full bg-black/20 font-mono text-[10px] p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent selection:bg-emerald-500/20" ref={scrollRef}>
            <AnimatePresence>
                {logs.map((log, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className="flex gap-2.5 mb-2.5"
                    >
                        <span className="text-zinc-700 shrink-0 select-none">[{log.time}]</span>
                        <div className="flex gap-2">
                            <span className={`leading-relaxed tracking-tight ${log.type === 'warn' ? 'text-amber-500/90' :
                                    log.type === 'success' ? 'text-emerald-500/90' :
                                        'text-zinc-500'
                                }`}>
                                {log.msg}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Blinking Cursor at bottom */}
            <div className="mt-1 animate-pulse text-emerald-500/50">_</div>
        </div>
    );
}
