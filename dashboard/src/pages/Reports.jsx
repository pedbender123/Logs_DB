import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FileText, Calendar, Server, ChevronRight, Search,
    Brain, Download, ExternalLink, RefreshCcw, X
} from 'lucide-react';
import { format } from 'date-fns';

const Reports = ({ apiUrl }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    const fetchReports = async () => {
        try {
            const response = await axios.get(`${apiUrl}/reports`);
            setReports(response.data);
        } catch (err) {
            console.error("Error fetching reports", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [apiUrl]);

    const filteredReports = reports.filter(rep =>
        rep.system_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rep.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8"><RefreshCcw className="animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Relatórios de Incidentes</h2>
                    <p className="text-slate-400">Análises automatizadas enviadas via email</p>
                </div>
                <button onClick={fetchReports} className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700">
                    <RefreshCcw size={20} className="text-slate-400" />
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Pesquisar análise ou sistema..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <th className="p-4 pl-6">Data / Hora</th>
                            <th className="p-4">Sistema</th>
                            <th className="p-4">ID Log</th>
                            <th className="p-4">Diagnóstico Resumido</th>
                            <th className="p-4 pr-6 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredReports.map(rep => (
                            <tr key={rep.id} className="hover:bg-blue-600/5 transition-colors cursor-pointer group" onClick={() => setSelectedReport(rep)}>
                                <td className="p-4 pl-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{format(new Date(rep.created_at), 'dd/MM/yyyy')}</span>
                                        <span className="text-[10px] text-slate-500">{format(new Date(rep.created_at), 'HH:mm:ss')}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Server size={14} className="text-blue-400" />
                                        <span className="text-xs font-mono text-slate-300">{rep.system_id.substring(0, 12)}...</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">#{rep.log_id}</span>
                                </td>
                                <td className="p-4">
                                    <p className="text-xs text-slate-400 line-clamp-1 max-w-[300px]">
                                        {rep.content.substring(0, 100)}...
                                    </p>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <button className="text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-all transform group-hover:translate-x-1">
                                        <ChevronRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredReports.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                        <FileText size={40} className="text-slate-800" />
                        <p className="text-slate-500 font-medium italic">Nenhum relatório gerado até o momento.</p>
                    </div>
                )}
            </div>

            {/* Report Viewer Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in">
                    <div className="card w-full max-w-3xl max-h-[90vh] bg-slate-900 shadow-2xl overflow-hidden border-slate-700 flex flex-col">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20"><Brain size={20} className="text-white" /></div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Diagnóstico da Inteligência Artificial</h3>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Logs DB Incident Engine</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 pb-20 space-y-8 custom-scrollbar bg-slate-950/30">
                            <div className="flex gap-10">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">ID Incidente</label>
                                    <p className="text-white font-mono text-sm">REP-{selectedReport.id}-{selectedReport.log_id}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Timestamp</label>
                                    <p className="text-white text-sm">{format(new Date(selectedReport.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status Envio</label>
                                    <span className="text-[10px] bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full font-black">EMAIL ENVIADO</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 w-full" />

                            <div className="prose prose-invert max-w-none">
                                <div className="whitespace-pre-line text-slate-200 leading-relaxed font-sans text-lg">
                                    {selectedReport.content}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3">
                            <button className="bg-slate-800 border-slate-700 text-slate-300 p-2 px-6 flex items-center gap-2 text-sm font-bold">
                                <Download size={16} /> Baixar PDF
                            </button>
                            <button className="primary p-2 px-6 flex items-center gap-2 text-sm font-bold">
                                <ExternalLink size={16} /> Ver Log Original
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
