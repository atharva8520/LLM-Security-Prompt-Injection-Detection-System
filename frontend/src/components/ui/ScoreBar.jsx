const ScoreBar = ({ value, color = 'accent', label, animated = true }) => {
    const getColorClass = () => {
        switch (color) {
            case 'cyan': return 'bg-accent shadow-glow';
            case 'red': return 'bg-danger shadow-glow-red';
            case 'orange': return 'bg-warning shadow-[0_0_20px_rgba(255,165,0,0.5)]';
            case 'green': return 'bg-success shadow-glow-grn';
            default: return 'bg-accent shadow-glow';
        }
    };

    const getTextColorClass = () => {
        switch (color) {
            case 'cyan': return 'text-accent';
            case 'red': return 'text-danger';
            case 'orange': return 'text-warning';
            case 'green': return 'text-success';
            default: return 'text-accent';
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-mono text-muted uppercase">{label}</span>
                <span className={`text-sm font-display font-bold ${getTextColorClass()}`}>{value}%</span>
            </div>
            <div className="h-2 w-full bg-bg2 rounded-full overflow-hidden border border-border/50">
                <div
                    className={`h-full ${getColorClass()} ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
};
export default ScoreBar;
