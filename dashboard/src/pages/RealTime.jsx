import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Terminal, Activity, Radio, Info, Brain,
    ChevronRight, ArrowDown, Activity as Pulse
} from 'lucide-react';
import LogItem from '../components/LogItem';

const RealTime = ({ apiUrl }) => {
    const [logs, setLogs] = useState([]);
    const [analyzingStatus, setAnalyzingStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const scrollRef = useRef(null);

    const fetchData = async () => {
        try {
            const [logsRes, statusRes] = await Promise.all([
                axios.get(`${apiUrl}/logs?limit=20`),
                axios.get(`${apiUrl}/logs/status`)
            ]);
            setLogs(logsRes.data);
            setAnalyzingStatus(statusRes.data);
        } catch (err) {
            console.error("Error fetching live logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        let interval;
        if (isLive) {
            interval = setInterval(fetchData, 2000); // Poll every 2 seconds
        }
        return () => clearInterval(interval);
    }, [apiUrl, isLive]);

    return (
        <div className="flex flex-col gap-6 animate-in h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Radio size={24} className={`${isLive ? 'text-red-500' : 'text-slate-600'}`} />
                        {isLive && <span className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-20" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Live Stream</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Monitoramento em Tempo Real (20 últimos)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${isLive ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                        {isLive ? 'Ao Vivo' : 'Pausado'}
                    </div>
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className="p-2 py-1 bg-slate-800 border-slate-700 text-xs font-bold rounded-lg hover:bg-slate-700"
                    >
                        {isLive ? 'Pausar' : 'Retomar'}
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl">
                {/* Stream Info Bar */}
                <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Terminal size={14} /> pbpm-logs-v2-stream
                        </div>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <div className="flex items-center gap-1.5">
                            <Pulse size={14} className="text-blue-500" /> Latência: 2s
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                        Processamento Inteligente Ativo
                    </div>
                </div>

                {/* Logs Feed */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2" ref={scrollRef}>
                    {loading && logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-600">
                            <Activity className="animate-spin mr-3" /> Conectando ao feed...
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {logs.map((log) => (
                                <div key={log.id} className="relative group">
                                    <LogItem
                                        log={log}
                                        onAnalyze={() => { }}
                                        isAnalyzed={analyzingStatus[log.id] === 'completed'}
                                        isAnalyzing={analyzingStatus[log.id] === 'analyzing'}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    {logs.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-700">
                            <Radio size={48} className="opacity-20 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">Aguardando logs de entrada...</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 p-x-8 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="text-[10px] flex items-center gap-2">
                            <div className="w-2 h-2 rounded bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Crítico</span>
                        </div>
                        <div className="text-[10px] flex items-center gap-2">
                            <div className="w-2 h-2 rounded bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Alerta</span>
                        </div>
                        <div className="text-[10px] flex items-center gap-2">
                            <div className="w-2 h-2 rounded bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="text-slate-400 font-bold uppercase tracking-widest">Operacional</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Brain size={14} className="text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">GPT-4o & Llama Provisoned</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealTime;
