const PipelineVisualizer = ({ steps }) => {
    return (
        <div className="flex items-center justify-between w-full overflow-x-auto py-4 no-scrollbar">
            {steps.map((step, index) => {
                const isPassed = step.status === 'passed';
                const isActive = step.status === 'active';
                const isBlocked = step.status === 'blocked';
                const isPending = step.status === 'pending';

                let boxClasses = "px-3 py-2 text-xs font-mono border whitespace-nowrap bg-bg2 transition-colors relative ";

                if (isPassed) boxClasses += "border-success text-success shadow-[inset_0_0_10px_rgba(57,255,20,0.1)]";
                if (isActive) boxClasses += "border-accent text-accent shadow-glow font-bold before:absolute before:inset-0 before:bg-accent/10 before:animate-pulse";
                if (isBlocked) boxClasses += "border-danger text-danger shadow-glow-red bg-danger/10 font-bold";
                if (isPending) boxClasses += "border-border text-muted border-dashed";

                return (
                    <div key={step.name} className="flex items-center flex-shrink-0">
                        <div className={boxClasses}>
                            {step.name}
                        </div>

                        {/* Connector arrow except for last item */}
                        {index < steps.length - 1 && (
                            <div className="w-8 flex items-center justify-center text-muted mx-1">
                                <svg className={`w-4 h-4 ${isActive || isPassed ? '!text-accent' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
export default PipelineVisualizer;
