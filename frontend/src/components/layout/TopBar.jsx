import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const TopBar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour12: false });
    };

    const getPageTitle = (pathname) => {
        if (pathname.startsWith('/dashboard')) return 'SYSTEM DASHBOARD';
        if (pathname.startsWith('/analyze')) return 'THREAT DETECTOR';
        if (pathname.startsWith('/history')) return 'ANALYSIS ARCHIVE';
        return 'LLM SECURITY SHIELD';
    };

    return (
        <div className="h-16 ml-60 flex items-center justify-between px-6 border-b border-border bg-bg/95 backdrop-blur z-10 sticky top-0">
            <div className="flex items-center space-x-4">
                <h2 className="font-display font-bold text-gray-200 tracking-wider">
                    {getPageTitle(location.pathname)}
                </h2>
                <div className="h-4 w-px bg-border"></div>
                <div className="flex items-center space-x-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success shadow-glow-grn"></span>
                    </span>
                    <span className="text-xs font-mono text-success tracking-widest hidden sm:inline-block">ALL SYSTEMS OPERATIONAL</span>
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <div className="text-muted font-mono text-sm border bg-bg2 border-border px-3 py-1 uppercase tracking-widest">
                    {formatTime(time)}
                </div>
                <div className="text-sm font-mono text-gray-400">
                    OPERATOR: <span className="text-accent">{user?.username || 'UNKNOWN'}</span>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
