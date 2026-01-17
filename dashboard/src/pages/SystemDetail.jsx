import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ChevronLeft, User, Mail, Phone, Shield, FileText,
    Settings, Save, X, Brain, Terminal, Filter, RefreshCcw
} from 'lucide-react';
import LogItem from '../components/LogItem';
import AnalysisPanel from '../components/AnalysisPanel';

const SystemDetail = ({ apiUrl }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [system, setSystem] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFichaEditor, setShowFichaEditor] = useState(false);
    const [techInfo, setTechInfo] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [analyzingLog, setAnalyzingLog] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [filters, setFilters] = useState([]);
    const [newFilterPattern, setNewFilterPattern] = useState('');
    const [cleanupPattern, setCleanupPattern] = useState('');
    const [isCleaning, setIsCleaning] = useState(false);

    const fetchData = async () => {
        try {
            const [sysRes, logsRes] = await Promise.all([
                axios.get(`${apiUrl}/systems/${id}`),
                axios.get(`${apiUrl}/logs?system_id=${id}`)
            ]);
            setSystem(sysRes.data);
            setLogs(logsRes.data);
            setTechInfo(sysRes.data.technical_info || '');
        } catch (err) {
            console.error("Error fetching system detail", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilters = async () => {
        try {
            const res = await axios.get(`${apiUrl}/systems/${id}/filters`);
            setFilters(res.data);
        } catch (err) {
            console.error("Error fetching filters", err);
        }
    };

    useEffect(() => {
        fetchData();
        fetchFilters();
    }, [id, apiUrl]);

    const handleSaveTechInfo = async () => {
        setIsSaving(true);
        try {
            const masterKey = "pbpm_secret_master_key";
            await axios.put(`${apiUrl}/systems/${id}`, {
                technical_info: techInfo
            }, {
                headers: { 'x-master-key': masterKey }
            });
            setSystem({ ...system, technical_info: techInfo });
            setShowFichaEditor(false);
        } catch (err) {
            alert("Erro ao salvar Ficha Técnica.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddFilter = async () => {
        if (!newFilterPattern) return;
        try {
            const masterKey = "pbpm_secret_master_key";
            await axios.post(`${apiUrl}/systems/${id}/filters`, { pattern: newFilterPattern }, {
                headers: { 'x-master-key': masterKey }
            });
            setNewFilterPattern('');
            fetchFilters();
        } catch (err) {
            alert("Erro ao adicionar filtro.");
        }
    };

    const handleDeleteFilter = async (filterId) => {
        if (!window.confirm("Remover este filtro? Logs futuros com este padrão serão salvos normalmente.")) return;
        try {
            const masterKey = "pbpm_secret_master_key";
            await axios.delete(`${apiUrl}/systems/${id}/filters/${filterId}`, {
                headers: { 'x-master-key': masterKey }
            });
            fetchFilters();
        } catch (err) {
            alert("Erro ao remover filtro.");
        }
    };

    const handleCleanup = async () => {
        if (!cleanupPattern) return;
        if (!window.confirm(`Isso irá apagar PERMANENTEMENTE todos os logs que contenham "${cleanupPattern}". Deseja continuar?`)) return;
        setIsCleaning(true);
        try {
            const masterKey = "pbpm_secret_master_key";
            const res = await axios.post(`${apiUrl}/systems/${id}/cleanup`, { pattern: cleanupPattern }, {
                headers: { 'x-master-key': masterKey }
            });
            alert(`Limpeza concluída! ${res.data.cleaned_count} logs removidos.`);
            setCleanupPattern('');
            fetchData();
        } catch (err) {
            alert("Erro ao realizar limpeza.");
        } finally {
            setIsCleaning(false);
        }
    };

    if (loading) return <div className="p-8"><RefreshCcw className="animate-spin" /></div>;
    if (!system) return <div className="p-8 text-white">Sistema não encontrado.</div>;

    const filteredLogs = logs.filter(log => {
        if (filterLevel === 'all') return true;
        return log.level === filterLevel;
    });

    return (
        <div className="flex flex-col gap-6 animate-in h-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/systems')} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{system.name}</h2>
                    <p className="text-slate-500 text-sm">Dashboard › Sistemas › {system.name}</p>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* 30% - Ficha do Sistema */}
                <div className="w-[30%] space-y-6">
                    <div className="card p-6 bg-slate-900/40 border-slate-800 flex flex-col h-fit">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Ficha do Sistema</h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-500/10 p-2 rounded-lg"><User size={18} className="text-blue-400" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Cliente</p>
                                    <p className="text-white font-semibold">{system.client_name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-slate-800 p-2 rounded-lg"><Mail size={18} className="text-slate-400" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Email Cliente</p>
                                    <p className="text-white font-semibold text-sm truncate max-w-[180px]">{system.client_email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-slate-800 p-2 rounded-lg"><Phone size={18} className="text-slate-400" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Telefone</p>
                                    <p className="text-white font-semibold">{system.client_phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-slate-800 p-2 rounded-lg"><Shield size={18} className="text-slate-400" /></div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Responsável TI</p>
                                    <p className="text-white font-semibold text-sm truncate max-w-[180px]">{system.maintenance_email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                {system.status === 'production' ? (
                                    <div className="bg-green-500/10 p-2 rounded-lg"><Activity size={18} className="text-green-500" /></div>
                                ) : (
                                    <div className="bg-yellow-500/10 p-2 rounded-lg"><Settings size={18} className="text-yellow-500" /></div>
                                )}
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Status Atual</p>
                                    <p className={`font-bold ${system.status === 'production' ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {system.status === 'production' ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowFichaEditor(true)}
                            className="mt-8 w-full justify-center gap-2 py-3 bg-slate-800 border-slate-700 hover:bg-blue-600 hover:border-blue-500 transition-all font-bold group"
                        >
                            <FileText size={18} className="group-hover:scale-110 transition-transform" />
                            Editar Ficha Técnica
                        </button>
                    </div>

                    <div className="card p-6 bg-blue-600/5 border-blue-500/20">
                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Chave de API</h4>
                        <div className="bg-slate-950 p-3 rounded font-mono text-[10px] break-all border border-slate-800 text-blue-300">
                            {system.id}
                        </div>
                        <p className="text-[9px] text-slate-500 mt-2 uppercase font-bold tracking-tighter italic">Cuidado: Identificador único de autenticação.</p>
                    </div>

                    {/* Filtros e Otimização */}
                    <div className="card p-6 border-slate-800 space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Filter size={14} /> Filtros de Descarte
                            </h3>
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                                Logs recebidos que contenham estes padrões serão **ignorados** antes de serem salvos ou analisados por IA.
                            </p>
                            <div className="space-y-2 mb-4">
                                {filters.map(f => (
                                    <div key={f.id} className="flex items-center justify-between bg-slate-950 p-2 px-3 rounded-lg border border-slate-800 group">
                                        <span className="text-xs font-mono text-slate-300 truncate max-w-[150px]">{f.pattern}</span>
                                        <button onClick={() => handleDeleteFilter(f.id)} className="p-1 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {filters.length === 0 && <p className="text-[10px] text-slate-600 italic">Nenhum filtro ativo.</p>}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Novo padrão..."
                                    value={newFilterPattern}
                                    onChange={(e) => setNewFilterPattern(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                                />
                                <button onClick={handleAddFilter} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                                    <Save size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                Limpeza Retroativa
                            </h3>
                            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                                Apague logs antigos que contenham um padrão específico e receba um relatório por email.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Padrão para apagar..."
                                    value={cleanupPattern}
                                    onChange={(e) => setCleanupPattern(e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-red-500/50 outline-none"
                                />
                                <button
                                    onClick={handleCleanup}
                                    disabled={isCleaning}
                                    className="p-2 bg-slate-800 text-red-400 border-red-900/20 rounded-lg hover:bg-red-900/10 disabled:opacity-50"
                                >
                                    {isCleaning ? <RefreshCcw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 70% - Logs Explorer */}
                <div className="w-[70%] flex flex-col min-h-0 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-slate-500" />
                                <span className="text-xs font-bold text-slate-500 uppercase">Ações do Sistema</span>
                            </div>
                            <div className="h-4 w-px bg-slate-800" />
                            <div className="flex gap-2">
                                {['all', 'info', 'warning', 'error', 'success'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setFilterLevel(level)}
                                        className={`text-[9px] font-bold uppercase py-1 px-3 rounded-md transition-all border ${filterLevel === level
                                            ? 'bg-blue-600 border-blue-500 text-white'
                                            : 'bg-slate-800 border-slate-800 text-slate-500'
                                            }`}
                                    >
                                        {level === 'all' ? 'Tudo' : level}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={fetchData} className="p-1.5 bg-slate-800 rounded-md hover:bg-slate-700">
                            <RefreshCcw size={14} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredLogs.length > 0 ? (
                            <div className="flex flex-col">
                                {filteredLogs.map(log => (
                                    <LogItem
                                        key={log.id}
                                        log={log}
                                        onAnalyze={(l) => setAnalyzingLog(l)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                                <Terminal size={40} className="opacity-20 mb-4" />
                                <p className="text-sm font-medium">Nenhum rastro encontrado ainda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ficha Técnica Overlay Editor */}
            {showFichaEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in">
                    <div className="card w-full max-w-4xl h-[80vh] bg-slate-900 shadow-2xl overflow-hidden border-slate-700 flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 p-2 rounded-lg"><FileText size={20} className="text-white" /></div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Editor de Ficha Técnica</h3>
                                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{system.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowFichaEditor(false)} className="bg-slate-800 border-slate-700 text-slate-300 p-2 px-4 flex items-center gap-2 text-sm">
                                    <X size={16} /> Cancelar
                                </button>
                                <button
                                    onClick={handleSaveTechInfo}
                                    disabled={isSaving}
                                    className="primary p-2 px-6 flex items-center gap-2 text-sm font-bold shadow-lg shadow-blue-500/20"
                                >
                                    <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Ficha'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-0 relative">
                            <textarea
                                value={techInfo || ''}
                                onChange={(e) => setTechInfo(e.target.value)}
                                placeholder="Insira aqui detalhe por detalhe: Infraestrutura, Banco de Dados, Versão de Linguagem, APIs de terceiros, variáveis críticas de ambiente, etc..."
                                className="w-full h-full bg-slate-950 p-10 text-slate-300 font-mono text-sm focus:outline-none leading-relaxed resize-none custom-scrollbar"
                            />
                            <div className="absolute top-4 right-10 text-[10px] font-black text-slate-700 uppercase tracking-widest pointer-events-none">
                                Technical Context Markdown Ready
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {analyzingLog && (
                <AnalysisPanel
                    log={analyzingLog}
                    onClose={() => setAnalyzingLog(null)}
                    apiUrl={apiUrl}
                />
            )}
        </div>
    );
};

export default SystemDetail;
