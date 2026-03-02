import React, { useState, useEffect } from 'react';
import ThreatBadge from '../components/ui/ThreatBadge';
import { MagnifyingGlassIcon, TrashIcon, ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';
import axiosClient from '../api/axiosClient';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);
    const [detailedAnalysis, setDetailedAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axiosClient.get('/analyses/history');
            setHistory(res.data.data.map(item => ({
                id: item.id,
                date: new Date(item.analyzed_at).toLocaleString(),
                prompt: item.prompt_text,
                type: item.attack_type.toUpperCase(),
                level: item.threat_level,
                score: item.threat_score,
                blocked: item.is_blocked,
                verdict: item.verdict
            })));
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = async (id) => {
        if (expandedRow === id) {
            setExpandedRow(null);
            setDetailedAnalysis(null);
        } else {
            setExpandedRow(id);
            setDetailedAnalysis(null);
            try {
                const res = await axiosClient.get(`/analyses/${id}`);
                setDetailedAnalysis(res.data.analysis);
            } catch (error) {
                console.error("Failed to fetch details:", error);
            }
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await axiosClient.delete(`/analyses/${id}`);
            if (expandedRow === id) {
                setExpandedRow(null);
                setDetailedAnalysis(null);
            }
            fetchHistory();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col">

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-panel p-4 border border-border">
                <div className="relative w-full md:w-96">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        className="w-full bg-bg2 border border-border py-2 pl-10 pr-4 text-sm font-mono text-gray-200 focus:border-accent focus:outline-none placeholder-muted"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select className="bg-bg2 border border-border px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-accent appearance-none pr-8">
                        <option>ALL THREATS</option>
                        <option>DANGER</option>
                        <option>WARNING</option>
                        <option>SAFE</option>
                    </select>
                    <select className="bg-bg2 border border-border px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-accent appearance-none pr-8">
                        <option>ALL ATTACKS</option>
                        <option>DIRECT</option>
                        <option>JAILBREAK</option>
                        <option>OBFUSCATION</option>
                    </select>
                    <button className="flex items-center space-x-2 border border-border px-4 py-2 hover:bg-bg2 text-muted hover:text-gray-200 transition-colors text-xs font-mono uppercase">
                        <FunnelIcon className="w-4 h-4" />
                        <span>RESET</span>
                    </button>
                    <button className="flex items-center space-x-2 border border-accent text-accent px-4 py-2 hover:bg-accent/10 transition-colors text-xs font-mono uppercase bg-accent/5 ml-auto md:ml-0">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>EXPORT</span>
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 bg-panel border border-border overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left font-mono text-sm border-collapse">
                        <thead className="bg-bg2 sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="px-4 py-3 font-normal text-muted w-16 text-center">ID</th>
                                <th className="px-4 py-3 font-normal text-muted w-48">DATE/TIME</th>
                                <th className="px-4 py-3 font-normal text-muted">PROMPT PREVIEW</th>
                                <th className="px-4 py-3 font-normal text-muted w-32">ATTACK</th>
                                <th className="px-4 py-3 font-normal text-muted w-32">THREAT</th>
                                <th className="px-4 py-3 font-normal text-muted w-24 text-center">SCORE</th>
                                <th className="px-4 py-3 font-normal text-muted w-24 text-center">BLOCKED</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {history.map(row => (
                                <React.Fragment key={row.id}>
                                    <tr
                                        className={`hover:bg-bg2/50 transition-colors cursor-pointer ${expandedRow === row.id ? 'bg-bg2 border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'}`}
                                        onClick={() => toggleRow(row.id)}
                                    >
                                        <td className="px-4 py-4 text-center text-muted text-xs">#{row.id}</td>
                                        <td className="px-4 py-4 text-gray-400 text-xs">{row.date}</td>
                                        <td className="px-4 py-4 text-gray-200 truncate max-w-sm">{row.prompt}</td>
                                        <td className="px-4 py-4 text-gray-400 text-xs">{row.type}</td>
                                        <td className="px-4 py-4"><ThreatBadge level={row.level} /></td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block px-2 py-0.5 border ${row.level === 'danger' ? 'border-danger/50 text-danger bg-danger/10' : row.level === 'warning' ? 'border-warning/50 text-warning bg-warning/10' : 'border-success/50 text-success bg-success/10'}`}>
                                                {row.score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {row.blocked ? <span className="text-danger font-bold">YES</span> : <span className="text-success font-bold">NO</span>}
                                        </td>
                                    </tr>
                                    {/* Expanded Detail Panel */}
                                    {expandedRow === row.id && (
                                        <tr className="bg-bg2/40 border-b-2 border-b-border">
                                            <td colSpan="7" className="p-0">
                                                <div className="p-6 ml-16 border-l border-border/50 animate-[fade-in_0.2s_ease-out]">
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                                                        {/* Left Col - Prompt */}
                                                        <div>
                                                            <h4 className="text-xs font-mono text-muted mb-2 uppercase flex justify-between">
                                                                <span>FULL PROMPT TEXT</span>
                                                                <button className="text-accent hover:underline">COPY</button>
                                                            </h4>
                                                            <div className="p-4 bg-bg border border-border/50 text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                                                                {row.prompt}
                                                            </div>
                                                            <h4 className="text-xs font-mono text-muted mb-2 uppercase mt-6">ENGINE VERDICT</h4>
                                                            <div className="p-3 border-l-2 border-accent bg-bg/50 text-gray-300 text-sm italic">
                                                                {detailedAnalysis ? detailedAnalysis.explanation : "Loading..."}
                                                            </div>
                                                        </div>

                                                        {/* Right Col - Details */}
                                                        <div className="space-y-6">
                                                            {detailedAnalysis ? (
                                                                <div>
                                                                    <h4 className="text-xs font-mono text-muted mb-2 uppercase">DETECTION LAYER BREAKDOWN</h4>
                                                                    <div className="bg-bg border border-border/50 rounded-sm">
                                                                        {(typeof detailedAnalysis.pipeline_steps === 'string' ? JSON.parse(detailedAnalysis.pipeline_steps) : detailedAnalysis.pipeline_steps)?.map((step, idx) => (
                                                                            <div key={idx} className={`flex justify-between p-2 text-xs border-b border-border/30 ${step.status === 'blocked' ? 'bg-danger/5' : ''}`}>
                                                                                <span className="text-muted">{step.name}</span>
                                                                                <span className={`${step.status === 'blocked' ? 'text-danger font-bold' : step.status === 'active' ? 'text-accent' : 'text-success'}`}>{step.status.toUpperCase()}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-muted font-mono text-xs">Loading Details...</div>
                                                            )}

                                                            <div className="flex justify-end pt-4 border-t border-border/50">
                                                                <button onClick={(e) => handleDelete(row.id, e)} className="flex items-center space-x-2 px-4 py-2 text-danger hover:bg-danger/10 border border-transparent hover:border-danger/30 transition-colors text-xs font-mono uppercase">
                                                                    <TrashIcon className="w-4 h-4" />
                                                                    <span>PURGE RECORD</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-border bg-bg/50 flex items-center justify-between text-xs font-mono text-muted">
                    <span>SHOWING 1-5 OF 124</span>
                    <div className="flex space-x-1">
                        <button className="px-3 py-1 border border-border hover:bg-bg2 hover:text-gray-200 transition-colors" disabled>PREV</button>
                        <button className="px-3 py-1 border border-accent bg-accent/10 text-accent font-bold">1</button>
                        <button className="px-3 py-1 border border-border hover:bg-bg2 hover:text-gray-200 transition-colors">2</button>
                        <button className="px-3 py-1 border border-border hover:bg-bg2 hover:text-gray-200 transition-colors">3</button>
                        <span className="px-2 py-1">...</span>
                        <button className="px-3 py-1 border border-border hover:bg-bg2 hover:text-gray-200 transition-colors">NEXT</button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HistoryPage;
