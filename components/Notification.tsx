
import React from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
}

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div className={`fixed bottom-3 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-2xl border z-[60] flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[calc(100%-24px)] sm:max-w-md ${
      type === 'success' 
        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
        : 'bg-rose-50 border-rose-100 text-rose-800'
    }`}>
      <div className={`p-0.5 sm:p-1 rounded-full flex-shrink-0 ${type === 'success' ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
        {type === 'success' ? (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className="text-xs sm:text-sm font-bold tracking-tight">{message}</span>
    </div>
  );
};

export default Notification;
