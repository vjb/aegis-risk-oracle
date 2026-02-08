import { ArrowUp, Shield } from 'lucide-react';

interface AegisInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isProcessing: boolean;
    isAegisMode: boolean;
    onToggleMode: () => void;
}

export default function AegisInput({ value, onChange, onSubmit, isProcessing, isAegisMode, onToggleMode }: AegisInputProps) {
    return (
        <div className="w-full max-w-2xl mx-auto mb-6">
            <form onSubmit={onSubmit} className="join w-full shadow-lg">

                {/* Toggle Mode */}
                <button
                    type="button"
                    className={`btn join-item ${isAegisMode ? 'btn-primary' : 'btn-neutral'}`}
                    onClick={onToggleMode}
                >
                    <Shield className={isAegisMode ? 'fill-current' : ''} />
                    <span className="hidden sm:inline">Aegis Mode</span>
                </button>

                {/* Input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={isProcessing}
                    placeholder="Enter contract address or ask Aegis..."
                    className="input input-bordered join-item w-full flex-1 focus:outline-none"
                />

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!value.trim() || isProcessing}
                    className="btn btn-neutral join-item"
                >
                    <ArrowUp />
                </button>
            </form>
        </div>
    );
}
