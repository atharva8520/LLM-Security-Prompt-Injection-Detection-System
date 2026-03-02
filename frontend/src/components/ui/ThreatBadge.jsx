const ThreatBadge = ({ level }) => {
    const configs = {
        safe: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', dot: 'bg-success', shadow: 'shadow-glow-grn', label: 'SAFE' },
        warning: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', dot: 'bg-warning', shadow: 'shadow-[0_0_15px_rgba(255,165,0,0.4)]', label: 'FLAGGED' },
        danger: { color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30', dot: 'bg-danger', shadow: 'shadow-glow-red', label: 'BLOCKED' }
    };

    const config = configs[level] || configs.safe;

    return (
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${config.border} ${config.bg} ${config.color} ${config.shadow} backdrop-blur-sm`}>
            <span className={`h-2 w-2 rounded-full ${config.dot} ${level === 'danger' ? 'animate-pulse' : ''}`}></span>
            <span className="text-xs font-mono font-bold tracking-wider">{config.label}</span>
        </div>
    );
};
export default ThreatBadge;
