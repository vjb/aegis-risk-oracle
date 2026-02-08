export default function VerdictCard() {
    return (
        <div className="card w-full bg-base-100 shadow-xl border border-success/20">
            <div className="card-body p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="card-title text-2xl font-bold">ETH-USDC</h3>
                        <div className="badge badge-outline text-xs opacity-70">PROTOCOL AUDIT</div>
                    </div>
                    <div className="badge badge-success gap-2 p-3">
                        <div className="w-2 h-2 bg-success-content rounded-full animate-pulse"></div>
                        SAFE
                    </div>
                </div>

                {/* Stats */}
                <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-200">
                    <div className="stat place-items-center">
                        <div className="stat-title">Trust Score</div>
                        <div className="stat-value text-success">98</div>
                        <div className="stat-desc">Top 1% of protocols</div>
                    </div>
                    <div className="stat place-items-center">
                        <div className="stat-title">Liquidity</div>
                        <div className="stat-value">$4.2M</div>
                        <div className="stat-desc">High depth</div>
                    </div>
                </div>

                {/* Action */}
                <div className="card-actions justify-end mt-4">
                    <button className="btn btn-sm btn-outline btn-block">
                        View Technical Proofs (JSON)
                    </button>
                </div>
            </div>
        </div>
    );
}
