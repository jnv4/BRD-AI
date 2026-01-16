
import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onUpdateUsers: (users: AppUser[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, users, onUpdateUsers }) => {
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>(UserRole.BUSINESS);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (!isOpen) return null;

  const handleAddUser = () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    const newUser: AppUser = {
      id: Math.random().toString(36).substring(2, 9),
      name: newName,
      role: newRole,
      email: newEmail,
      password: newPassword
    };
    onUpdateUsers([...users, newUser]);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) return; // Prevent deleting last user
    onUpdateUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin Control Panel</h2>
            <p className="text-xs text-slate-500">Manage organizational access and workflow rights</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Add User Section */}
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 mb-4 uppercase tracking-wider">Provision New Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Full Name</label>
                <input 
                  className="w-full p-2.5 rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-sm transition-all"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Assigned Role</label>
                <select 
                  className="w-full p-2.5 rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-sm font-bold bg-white"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  {Object.values(UserRole).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Email Address</label>
                <input 
                  type="email"
                  className="w-full p-2.5 rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-sm transition-all"
                  placeholder="e.g. user@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-600 mb-1 block uppercase">Password</label>
                <input 
                  type="text"
                  className="w-full p-2.5 rounded-xl border-2 border-white focus:border-indigo-400 outline-none text-sm transition-all"
                  placeholder="e.g. demo123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleAddUser}
                disabled={!newName.trim() || !newEmail.trim() || !newPassword.trim()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
              >
                Create User
              </button>
            </div>
            <p className="text-[10px] text-indigo-400 mt-4 leading-relaxed font-medium">
              Note: Rights are strictly tied to the role. Business users only approve Business phases. CTOs only provide final sign-off. In this demo, passwords are visible for testing purposes.
            </p>
          </div>

          {/* User List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Registered System Users</h3>
            <div className="divide-y border rounded-2xl bg-white">
              {users.map(u => (
                <div key={u.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white uppercase ${
                      u.role === UserRole.ADMIN ? 'bg-purple-500' : 
                      u.role === UserRole.CTO ? 'bg-amber-500' : 
                      u.role === UserRole.PROJECT_MANAGER ? 'bg-indigo-500' : 
                      u.role === UserRole.BUSINESS ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{u.email}</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">••• {u.password.slice(-3)}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 text-rose-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Revoke access"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
