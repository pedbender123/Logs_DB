import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Database, LayoutDashboard, Settings, Activity,
  FileText, Globe, LifeBuoy
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Systems from './pages/Systems';
import SystemDetail from './pages/SystemDetail';
import Reports from './pages/Reports';
import RealTime from './pages/RealTime';

import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const SidebarLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
        ? 'bg-blue-600/10 text-blue-400 font-bold border-l-4 border-l-blue-500 rounded-l-none'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
      <Icon size={20} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
      <span className="text-sm tracking-wide">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div className="flex bg-[#020617] min-h-screen text-slate-200 font-sans selection:bg-blue-500/30">
        {/* Modern Sidebar */}
        <aside className="w-72 border-r border-slate-900 bg-[#020617] flex flex-col fixed inset-y-0 z-50">
          <div className="p-8 flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
              <Database size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white">LOGS_DB</h1>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest leading-none">Management v2</p>
            </div>
          </div>

          <nav className="px-4 flex-1 space-y-1">
            <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Principal</div>
            <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
            <SidebarLink to="/systems" icon={Globe} label="Sistemas" />

            <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-8 mb-2">Análise</div>
            <SidebarLink to="/reports" icon={FileText} label="Relatórios IA" />
            <SidebarLink to="/realtime" icon={Activity} label="Live Stream" />
          </nav>

          <div className="p-6 mt-auto">
            <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <LifeBuoy size={16} className="text-blue-400" />
                </div>
                <span className="text-xs font-bold text-white">Suporte Ativo</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-3">Logs críticos estão sendo processados via GPT-4o-mini.</p>
              <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">
                Documentação
              </button>
            </div>
            <SidebarLink to="/settings" icon={Settings} label="Configurações" />
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 ml-72 p-10 min-h-screen relative overflow-x-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />

          <Routes>
            <Route path="/" element={<Dashboard apiUrl={API_URL} />} />
            <Route path="/systems" element={<Systems apiUrl={API_URL} />} />
            <Route path="/systems/:id" element={<SystemDetail apiUrl={API_URL} />} />
            <Route path="/reports" element={<Reports apiUrl={API_URL} />} />
            <Route path="/realtime" element={<RealTime apiUrl={API_URL} />} />
            {/* Fallback for components not yet implemented/refactored */}
            <Route path="/settings" element={<div className="p-10 card bg-slate-900/40 text-slate-500 italic">Configurações globais do sistema.</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
