
import React from 'react';
import { LogEntry } from '../types';

interface ActionLogProps {
  logs: LogEntry[];
}

const ActionLog: React.FC<ActionLogProps> = ({ logs }) => {
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-slate-100 p-1.5 sm:p-2 rounded-lg text-slate-500">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Audit Trail</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">History of approvals & revisions</p>
          </div>
        </div>
        <div className="bg-slate-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest self-start sm:self-auto">
          {logs.length} LOGGED
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {logs.slice().reverse().map((log, idx) => {
          const isRejection = log.action.toLowerCase().includes("rejected");
          const isApproval = log.action.toLowerCase().includes("approved");
          const isRevision = log.action.toLowerCase().includes("revised");

          return (
            <div key={log.id} className="relative flex gap-3 sm:gap-4 md:gap-6 group">
              {idx !== logs.length - 1 && (
                <div className="absolute left-[10px] sm:left-[13px] top-6 sm:top-8 w-[2px] h-full bg-slate-50 group-hover:bg-indigo-50 transition-colors"></div>
              )}
              
              <div className={`mt-0.5 sm:mt-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex-shrink-0 flex items-center justify-center border-2 sm:border-4 border-white shadow-sm ring-1 sm:ring-2 ${
                isRejection ? 'bg-rose-500 ring-rose-100 text-white' : 
                isApproval ? 'bg-emerald-500 ring-emerald-100 text-white' : 
                isRevision ? 'bg-amber-500 ring-amber-100 text-white' :
                'bg-indigo-500 ring-indigo-100 text-white'
              }`}>
                {isApproval ? (
                  <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isRejection ? (
                  <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white"></div>
                )}
              </div>

              <div className="flex-1 pb-2 sm:pb-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-2 gap-1 sm:gap-2">
                  <div className="min-w-0">
                    <span className={`text-xs sm:text-sm font-bold tracking-tight ${
                      isRejection ? 'text-rose-700' : isApproval ? 'text-emerald-700' : 'text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5">
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate max-w-[150px] sm:max-w-none">{log.user}</span>
                      <span className="text-slate-200 hidden sm:inline">|</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 bg-slate-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border self-start uppercase flex-shrink-0">
                    v{log.version}
                  </span>
                </div>

                {log.details && (
                  <div className={`mt-2 sm:mt-3 p-2 sm:p-4 rounded-lg sm:rounded-xl border-l-4 text-xs sm:text-sm leading-relaxed ${
                    isRejection ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600 italic'
                  }`}>
                    {isRejection && <span className="font-bold block mb-0.5 sm:mb-1 uppercase text-[9px] sm:text-[10px]">Rejection Reason:</span>}
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
