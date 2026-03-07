import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Squares2X2Icon, BoltIcon, ClockIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: <Squares2X2Icon className="w-5 h-5" /> },
        { name: 'Analyze', path: '/analyze', icon: <BoltIcon className="w-5 h-5" />, pulse: true },
        { name: 'History', path: '/history', icon: <ClockIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="w-60 h-screen fixed left-0 top-0 bg-bg border-r border-border flex flex-col z-10">
            {/* Logo Area */}
            <div className="p-6 border-b border-border flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-bg2 border border-accent flex items-center justify-center shadow-glow">
                    <BoltIcon className="w-5 h-5 text-accent" />
                </div>
                <h1 className="font-display font-bold text-accent tracking-widest text-lg">LLM SHIELD</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navLinks.map((link) => {
                    const isActive = location.pathname.startsWith(link.path);
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all font-mono text-sm uppercase tracking-wide
                ${isActive ? 'bg-accent/10 text-accent border-l-2 border-accent shadow-[inset_4px_0_0_0_rgba(0,212,255,1)]' : 'text-muted hover:text-gray-200 hover:bg-bg2'}`}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                            {link.pulse && (
                                <span className="relative flex h-2 w-2 ml-auto">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-border bg-bg2/50 mt-auto">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-panel border border-border flex items-center justify-center text-accent font-bold font-mono">
                        {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AZ'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-gray-200 truncate">{user?.username || 'GUEST'}</p>
                        <p className="text-xs text-accent font-mono border border-accent/30 bg-accent/10 px-1 py-0.5 rounded inline-block mt-0.5 uppercase">
                            {user?.role || 'SYSTEM'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
