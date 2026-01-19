
import React, { useState } from 'react';
import { UserRole, NotificationItem, AppUser } from '../types';

interface HeaderProps {
  currentUser: AppUser;
  users: AppUser[];
  onUserChange: (user: AppUser) => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onMarkAsRead: (id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, users, onUserChange, onOpenAdmin, onLogout, notifications, onClearNotifications, onMarkAsRead }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm no-print">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg text-white">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight hidden xs:block sm:block">BRD Architect</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        {currentUser.role === UserRole.ADMIN && (
          <button 
            onClick={onOpenAdmin}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] sm:text-xs font-bold transition-all"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        )}

        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">Alert Center</h3>
                <button onClick={onClearNotifications} className="text-[10px] text-indigo-600 font-bold hover:underline">CLEAR ALL</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-sm">No new alerts.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => onMarkAsRead(n.id)}
                      className={`p-4 border-b hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                          n.type === 'error' ? 'bg-rose-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 mb-0.5">{n.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-1">{n.message}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{new Date(n.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 border-l pl-2 sm:pl-4 md:pl-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-700">{currentUser.name}</span>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">{currentUser.role}</span>
          </div>
          
          {/* Admin can switch users without re-login */}
          {currentUser.role === UserRole.ADMIN && (
            <div className="relative group hidden sm:block">
              <select 
                value={currentUser.id}
                onChange={(e) => {
                  const found = users.find(u => u.id === e.target.value);
                  if (found) onUserChange(found);
                }}
                className="bg-slate-100 border-none rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-6 sm:pr-8 max-w-[120px] sm:max-w-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] sm:text-xs font-bold transition-all"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
