import React from 'react';
import { Terminal, AlertTriangle, XCircle, CheckCircle, Brain } from 'lucide-react';
import { format } from 'date-fns';

const LogItem = ({ log, onAnalyze, isAnalyzing, isAnalyzed }) => {
  const getLevelInfo = (level) => {
    switch (level?.toLowerCase()) {
      case 'warning':
      case 'attention':
      case 'atenção':
        return {
          icon: <AlertTriangle size={18} className="text-yellow-500" />,
          className: 'badge-warning',
          label: 'Atenção'
        };
      case 'error':
      case 'erro':
        return {
          icon: <XCircle size={18} className="text-red-500" />,
          className: 'badge-error',
          label: 'Erro'
        };
      case 'success':
      case 'sucesso':
        return {
          icon: <CheckCircle size={18} className="text-green-500" />,
          className: 'badge-success',
          label: 'Sucesso'
        };
      case 'info':
      case 'normal':
      default:
        return {
          icon: <Terminal size={18} className="text-slate-400" />,
          className: 'badge-normal',
          label: 'Normal'
        };
    }
  };

  const info = getLevelInfo(log.level);
  const date = new Date(log.created_at);
  const formattedDate = format(date, 'dd/MM/yyyy HH:mm:ss');

  return (
    <div className="log-item p-4 border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">{info.icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${info.className}`}>{info.label}</span>
              {isAnalyzing && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20 animate-pulse">
                  <Brain size={10} /> Em Análise
                </span>
              )}
              {isAnalyzed && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                  Concluído
                </span>
              )}
              <span className="text-xs text-slate-500">{formattedDate}</span>
              <span className="text-xs font-mono text-slate-400">ID: {log.id}</span>
              {log.content?.container && (
                <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                  {log.content.container}
                </span>
              )}
            </div>
            <div className="text-sm font-mono text-slate-200 break-all">
              {typeof log.content?.message === 'object'
                ? JSON.stringify(log.content.message)
                : log.content?.message || 'Empty Message'}
            </div>
          </div>
        </div>
        <button
          onClick={() => onAnalyze(log)}
          className="text-xs flex items-center gap-1.5 opacity-60 hover:opacity-100 bg-slate-700 p-1.5 rounded"
        >
          <Brain size={14} />
          Analisar
        </button>
      </div>
    </div>
  );
};

export default LogItem;
