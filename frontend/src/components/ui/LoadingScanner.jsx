import { useEffect, useState } from 'react';

const LoadingScanner = ({ currentStep, progress }) => {
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const int = setInterval(() => setPulse(p => !p), 400);
        return () => clearInterval(int);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-panel border border-border overflow-hidden relative min-h-[400px]">

            {/* Background Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

            {/* Animated Scan Line */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-accent/30 to-accent shadow-[0_0_15px_rgba(0,212,255,0.5)] z-10 animate-[scan_2s_ease-in-out_infinite_alternate]" style={{ animationName: 'scan' }}></div>

            <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(800px); } /* Adjust width approx for right bound */
        }
      `}</style>

            <div className="relative z-20 flex flex-col items-center max-w-md w-full">
                <div className="w-24 h-24 rounded-full border border-accent flex items-center justify-center mb-8 relative">
                    <div className={`absolute inset-0 rounded-full border-2 border-accent border-dashed animate-[spin_4s_linear_infinite]`}></div>
                    <div className={`absolute inset-2 rounded-full border border-accent/40 ${pulse ? 'bg-accent/20 shadow-glow' : 'bg-transparent'} transition-all duration-300`}></div>
                    <div className={`text-accent font-mono font-bold text-xl`}>{progress}%</div>
                </div>

                <div className="text-center w-full">
                    <h3 className="text-accent font-display font-bold text-xl tracking-widest mb-2 shadow-[0_0_10px_rgba(0,212,255,0.1)]">PERFORMING DEEP SCAN</h3>
                    <div className="bg-bg2 border border-border p-3 text-sm font-mono text-gray-300 mb-6 flex justify-between">
                        <span>ACTIVE LAYER:</span>
                        <span className="text-accent animate-pulse">{currentStep}</span>
                    </div>

                    <div className="w-full bg-bg3 h-1 border border-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 bg-accent transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LoadingScanner;
