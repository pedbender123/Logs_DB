import React, { useState } from 'react';
import { X, Brain, Loader2 } from 'lucide-react';
import axios from 'axios';

const AnalysisPanel = ({ log, onClose, apiUrl }) => {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);

    const getCategoryTheme = (category) => {
        switch (category) {
            case 'atenção': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', label: 'Atenção' };
            case 'erro': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', label: 'Erro' };
            case 'sucesso': return { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/50', label: 'Sucesso' };
            default: return { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/50', label: 'Normal' };
        }
    };

    React.useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            try {
                const response = await axios.post(`${apiUrl}/analyze/${log.id}`);
                if (response.data.error) {
                    setError(response.data.message || response.data.error);
                } else {
                    setAnalysis(response.data.analysis);
                }
            } catch (err) {
                setError('Falha ao conectar com o serviço de IA.');
            } finally {
                setLoading(false);
            }
        };

        if (log) fetchAnalysis();
    }, [log, apiUrl]);

    if (!log) return null;
    const theme = getCategoryTheme(analysis);

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
                <div className="flex items-center gap-2 font-semibold">
                    <Brain size={20} className="text-blue-400" />
                    <span>Classificação IA Llama 3.2</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Resumo do Log</h4>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm font-mono whitespace-pre-wrap break-all">
                        {typeof log.content?.message === 'object'
                            ? JSON.stringify(log.content.message, null, 2)
                            : log.content?.message}
                    </div>
                </div>

                <div className="analysis-content">
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-4">Classificação Sugerida</h4>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 size={32} className="animate-spin text-blue-500 opacity-50" />
                            <p className="text-sm text-slate-500">O Llama 3.2 está classificando...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-sm text-red-200">
                            <p className="opacity-80">{error}</p>
                        </div>
                    ) : (
                        <div className={`p-8 rounded-xl border ${theme.border} ${theme.bg} flex flex-col items-center justify-center gap-4 text-center`}>
                            <div className={`text-4xl font-black uppercase tracking-tighter ${theme.color}`}>
                                {theme.label}
                            </div>
                            <p className="text-xs text-slate-400 max-w-[200px]">
                                A inteligência artificial classificou este evento como <strong>{theme.label.toLowerCase()}</strong> baseado no conteúdo processado.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-800/50 text-xs text-slate-500 text-center">
                Modelo Llama 3.2:1b em execução local
            </div>
        </div>
    );
};

export default AnalysisPanel;
