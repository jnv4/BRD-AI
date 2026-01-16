
import React from 'react';
import { LogEntry } from '../types';

interface ActionLogProps {
  logs: LogEntry[];
}

const ActionLog: React.FC<ActionLogProps> = ({ logs }) => {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Detailed Audit Trail</h3>
            <p className="text-xs text-slate-400 font-medium">Full history of approvals, rejections, and revisions</p>
          </div>
        </div>
        <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {logs.length} ACTIONS LOGGED
        </div>
      </div>

      <div className="space-y-8">
        {logs.slice().reverse().map((log, idx) => {
          const isRejection = log.action.toLowerCase().includes("rejected");
          const isApproval = log.action.toLowerCase().includes("approved");
          const isRevision = log.action.toLowerCase().includes("revised");

          return (
            <div key={log.id} className="relative flex gap-6 group">
              {idx !== logs.length - 1 && (
                <div className="absolute left-[13px] top-8 w-[2px] h-full bg-slate-50 group-hover:bg-indigo-50 transition-colors"></div>
              )}
              
              <div className={`mt-1 w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border-4 border-white shadow-sm ring-2 ${
                isRejection ? 'bg-rose-500 ring-rose-100 text-white' : 
                isApproval ? 'bg-emerald-500 ring-emerald-100 text-white' : 
                isRevision ? 'bg-amber-500 ring-amber-100 text-white' :
                'bg-indigo-500 ring-indigo-100 text-white'
              }`}>
                {isApproval ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isRejection ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </div>

              <div className="flex-1 pb-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                  <div>
                    <span className={`text-sm font-bold tracking-tight ${
                      isRejection ? 'text-rose-700' : isApproval ? 'text-emerald-700' : 'text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-bold text-slate-700">{log.user}</span>
                      <span className="text-slate-200">|</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border self-start uppercase">
                    Version {log.version}
                  </span>
                </div>

                {log.details && (
                  <div className={`mt-3 p-4 rounded-xl border-l-4 text-sm leading-relaxed ${
                    isRejection ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600 italic'
                  }`}>
                    {isRejection && <span className="font-bold block mb-1 uppercase text-[10px]">Reason for Rejection:</span>}
                    "{log.details}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionLog;
