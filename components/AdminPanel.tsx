
import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { userApi } from '../services/apiService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onUpdateUsers: (users: AppUser[]) => void;
  useDatabase?: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, users, onUpdateUsers, useDatabase = false }) => {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>(UserRole.BUSINESS);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      if (useDatabase) {
        // Create user via API
        const createdUser = await userApi.create({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        });
        
        const newUser: AppUser = {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role as UserRole,
          password: '', // Don't store password
        };
        
        onUpdateUsers([...users, newUser]);
      } else {
        // Local storage mode
        const newUser: AppUser = {
          id: Math.random().toString(36).substring(2, 9),
          name: newName,
          role: newRole,
          email: newEmail,
          password: newPassword
        };
        onUpdateUsers([...users, newUser]);
      }
      
      setNewName("");
      setNewEmail("");
      setNewPassword("");
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) return; // Prevent deleting last user
    
    setIsLoading(true);
    setError("");
    
    try {
      if (useDatabase) {
        await userApi.delete(id);
      }
      
      onUpdateUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Admin Panel</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] sm:text-xs text-slate-500">Manage access and workflow rights</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                useDatabase 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {useDatabase ? '🗄️ Database' : '💾 Local'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-full text-slate-400">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
              <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Add User Section */}
          <div className="bg-indigo-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-100">
            <h3 className="text-xs sm:text-sm font-bold text-indigo-900 mb-3 sm:mb-4 uppercase tracking-wider">New User</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <label className="text-[9px] sm:text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Full Name</label>
                <input 
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-xs sm:text-sm transition-all"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Assigned Role</label>
                <select 
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-xs sm:text-sm font-bold bg-white"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  disabled={isLoading}
                >
                  {Object.values(UserRole).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Email Address</label>
                <input 
                  type="email"
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-xs sm:text-sm transition-all"
                  placeholder="e.g. user@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-[9px] sm:text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Password</label>
                <input 
                  type="text"
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-xs sm:text-sm transition-all"
                  placeholder="e.g. demo123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleAddUser}
                disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim() || isLoading}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 text-xs sm:text-sm flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
            <p className="text-[9px] sm:text-[10px] text-indigo-400 mt-3 sm:mt-4 leading-relaxed font-medium">
              {useDatabase 
                ? 'User will be saved to PostgreSQL database with encrypted password.'
                : 'Note: Rights tied to role. Demo passwords visible for testing.'
              }
            </p>
          </div>

          {/* User List */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              Users
              <span className="text-slate-400 font-normal">({users.length})</span>
            </h3>
            <div className="divide-y border rounded-xl sm:rounded-2xl bg-white">
              {users.map(u => (
                <div key={u.id} className="p-3 sm:p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white uppercase text-xs sm:text-sm flex-shrink-0 ${
                      u.role === UserRole.ADMIN ? 'bg-purple-500' : 
                      u.role === UserRole.CTO ? 'bg-amber-500' : 
                      u.role === UserRole.PROJECT_MANAGER ? 'bg-indigo-500' : 
                      u.role === UserRole.BUSINESS ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{u.name}</p>
                        <span className={`text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded uppercase flex-shrink-0 ${
                          u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-3 text-[9px] sm:text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1 sm:px-1.5 py-0.5 rounded truncate max-w-[120px] sm:max-w-none">{u.email}</span>
                        {!useDatabase && u.password && (
                          <span className="hidden sm:inline font-mono bg-slate-100 px-1.5 py-0.5 rounded">••• {u.password.slice(-3)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={isLoading || users.length <= 1}
                    className="p-1.5 sm:p-2 text-rose-300 hover:text-rose-600 transition-colors sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Revoke access"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 sm:px-6 py-2 bg-slate-800 text-white rounded-lg sm:rounded-xl font-bold hover:bg-slate-900 transition-all text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
