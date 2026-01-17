import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Terminal, TrendingUp } from 'lucide-react';

const Dashboard = ({ apiUrl }) => {
    const [stats, setStats] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, logsRes] = await Promise.all([
                    axios.get(`${apiUrl}/stats/daily`),
                    axios.get(`${apiUrl}/logs?limit=50`)
                ]);
                setStats(statsRes.data);
                setLogs(logsRes.data);
            } catch (err) {
                console.error("Error fetching dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [apiUrl]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    const getSystemKeys = () => {
        const keys = new Set();
        stats.forEach(day => {
            Object.keys(day).forEach(key => {
                if (key !== 'date') keys.add(key);
            });
        });
        return Array.from(keys);
    };

    const systemKeys = getSystemKeys();
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const severityData = [
        { name: 'Erro', value: logs.filter(l => l.level === 'error' || l.level === 'erro').length, color: '#ef4444' },
        { name: 'Atenção', value: logs.filter(l => l.level === 'warning' || l.level === 'attention' || l.level === 'atenção').length, color: '#f59e0b' },
        { name: 'Sucesso', value: logs.filter(l => l.level === 'success' || l.level === 'sucesso').length, color: '#10b981' },
        { name: 'Normal', value: logs.filter(l => l.level === 'info' || l.level === 'normal').length, color: '#64748b' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Executiva</h2>
                    <p className="text-slate-400">Visão geral de atividade e saúde dos sistemas</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
                <div className="card p-6 border-l-4 border-blue-500 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-2">
                        <Activity className="text-blue-400" size={20} />
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">LIVE</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Total de Eventos</p>
                    <p className="text-3xl font-bold text-white">{logs.length}</p>
                </div>
                <div className="card p-6 border-l-4 border-red-500 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="text-red-400" size={20} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Erros Críticos</p>
                    <p className="text-3xl font-bold text-white">{logs.filter(l => l.level === 'error' || l.level === 'erro').length}</p>
                </div>
                <div className="card p-6 border-l-4 border-yellow-500 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="text-yellow-400" size={20} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Alertas de Atenção</p>
                    <p className="text-3xl font-bold text-white">{logs.filter(l => l.level === 'warning' || l.level === 'attention' || l.level === 'atenção').length}</p>
                </div>
                <div className="card p-6 border-l-4 border-green-500 bg-slate-900/40">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="text-green-400" size={20} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Operações Sucesso</p>
                    <p className="text-3xl font-bold text-white">{logs.filter(l => l.level === 'success' || l.level === 'sucesso').length}</p>
                </div>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 card p-6 bg-slate-900/40">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Atividade por Sistema (Últimos 7 dias)
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                />
                                <YAxis stroke="#64748b" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Legend iconType="circle" />
                                {systemKeys.map((key, index) => (
                                    <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-6 bg-slate-900/40 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Terminal size={20} className="text-slate-400" />
                        Distribuição de Severidade
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {severityData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-xs text-slate-400 font-medium uppercase">{item.name}</span>
                                <span className="text-sm font-bold text-white ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
