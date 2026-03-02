const StatCard = ({ title, value, subtitle, accentColor, icon, trend }) => {
    const getBorderColor = () => {
        switch (accentColor) {
            case 'cyan': return 'border-t-accent shadow-[0_-2px_15px_-3px_rgba(0,212,255,0.2)]';
            case 'red': return 'border-t-danger shadow-[0_-2px_15px_-3px_rgba(255,60,110,0.2)]';
            case 'green': return 'border-t-success shadow-[0_-2px_15px_-3px_rgba(57,255,20,0.2)]';
            case 'orange': return 'border-t-warning shadow-[0_-2px_15px_-3px_rgba(255,165,0,0.2)]';
            default: return 'border-t-border shadow-none';
        }
    };

    const getTextColor = () => {
        switch (accentColor) {
            case 'cyan': return 'text-accent';
            case 'red': return 'text-danger';
            case 'green': return 'text-success';
            case 'orange': return 'text-warning';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className={`bg-panel border border-border border-t-2 ${getBorderColor()} p-5 hover:bg-bg2/80 transition-all group`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-muted font-mono text-xs tracking-widest uppercase">{title}</h3>
                <div className={`w-8 h-8 rounded border border-border flex items-center justify-center bg-bg group-hover:border-[currentColor] transition-colors ${getTextColor()}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-end space-x-3 mt-4">
                <span className={`text-4xl font-display font-bold tabular-nums ${getTextColor()} group-hover:drop-shadow-[0_0_8px_currentColor] transition-all`}>
                    {value}
                </span>
                {trend && (
                    <span className={`text-sm font-mono mb-1 ${trend > 0 ? 'text-danger font-bold' : trend < 0 ? 'text-success font-bold' : 'text-muted'}`}>
                        {trend > 0 ? '▲' : trend < 0 ? '▼' : '▬'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            {subtitle && (
                <p className="text-muted text-xs font-mono mt-3 uppercase border-t border-border/50 pt-2">{subtitle}</p>
            )}
        </div>
    );
};

export default StatCard;
