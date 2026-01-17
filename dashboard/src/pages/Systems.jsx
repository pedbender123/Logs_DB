import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Server, User, Phone, Mail, Activity, ArrowUpRight, Search } from 'lucide-react';

const Systems = ({ apiUrl }) => {
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        maintenance_email: '',
        status: 'development'
    });
    const navigate = useNavigate();

    const fetchSystems = async () => {
        try {
            const response = await axios.get(`${apiUrl}/systems`);
            setSystems(response.data);
        } catch (err) {
            console.error("Error fetching systems", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystems();
    }, [apiUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Need MASTER_KEY for registration
            const masterKey = "pbpm_secret_master_key";
            await axios.post(`${apiUrl}/register`, formData, {
                headers: { 'x-master-key': masterKey }
            });
            setShowModal(false);
            fetchSystems();
            setFormData({ name: '', client_name: '', client_email: '', client_phone: '', maintenance_email: '', status: 'development' });
        } catch (err) {
            alert("Erro ao registrar sistema. Verifique a Master Key.");
        }
    };

    const filteredSystems = systems.filter(sys =>
        sys.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Gestão de Sistemas</h2>
                    <p className="text-slate-400">Administre as integrações e chaves de API</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} /> Novo Sistema
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-6 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSystems.map(sys => (
                    <div
                        key={sys.id}
                        onClick={() => navigate(`/systems/${sys.id}`)}
                        className="card p-6 bg-slate-900/40 cursor-pointer group hover:border-blue-500/50"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-slate-800 p-3 rounded-2xl group-hover:bg-blue-600/10 transition-colors">
                                <Globe className="text-blue-400" size={24} />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${sys.status === 'production' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                }`}>
                                {sys.status === 'production' ? 'Produção' : 'Desenvolvimento'}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{sys.name}</h3>
                        <p className="text-slate-400 text-sm mb-6 flex items-center gap-1.5">
                            <User size={14} /> {sys.client_name || 'Sem cliente'}
                        </p>

                        <div className="space-y-2 border-t border-slate-800 pt-6">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">Logs Diários</span>
                                <span className="text-white font-bold flex items-center gap-1">
                                    12 <Activity size={12} className="text-green-500" />
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">ID API</span>
                                <span className="text-slate-400 font-mono truncate max-w-[120px]">{sys.id}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end">
                            <span className="text-blue-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                Acessar Perfil <ArrowUpRight size={14} />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Register Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in">
                    <div className="card w-full max-w-lg bg-slate-900 shadow-2xl overflow-hidden border-slate-700">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Novo Sistema</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome do Sistema</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm">
                                        <option value="development">Desenvolvimento</option>
                                        <option value="production">Produção</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome do Cliente</label>
                                    <input value={formData.client_name} onChange={e => setFormData({ ...formData, client_name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                                    <input value={formData.client_phone} onChange={e => setFormData({ ...formData, client_phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email do Cliente</label>
                                <input required type="email" value={formData.client_email} onChange={e => setFormData({ ...formData, client_email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Email do Responsável (Manutenção)</label>
                                <input required type="email" value={formData.maintenance_email} onChange={e => setFormData({ ...formData, maintenance_email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm" />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 justify-center opacity-60">Cancelar</button>
                                <button type="submit" className="flex-1 justify-center primary">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Systems;
