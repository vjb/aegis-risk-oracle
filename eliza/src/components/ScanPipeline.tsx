
import { Search, Cpu, Scale, CheckCircle } from 'lucide-react';

const steps = [
    { icon: Search, label: "Scanning Code" },
    { icon: Cpu, label: "AI Analysis" },
    { icon: Scale, label: "Compliance Check" },
    { icon: CheckCircle, label: "Verdict" }
];

export default function ScanPipeline() {
    return (
        <div className="w-full bg-base-300 p-6 rounded-box">
            <ul className="steps steps-vertical lg:steps-horizontal w-full">
                {steps.map((Step, index) => (
                    <li key={index} className={`step ${index < 2 ? 'step-primary' : ''}`}>
                        <span className="flex items-center gap-2">
                            <Step.icon className="w-4 h-4" />
                            {Step.label}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="mt-4 text-center">
                <span className="loading loading-infinity loading-lg text-primary"></span>
                <div className="text-xs font-mono mt-2 animate-pulse text-secondary">ESTABLISHING QUANTUM LINK...</div>
            </div>
        </div>
    );
}
