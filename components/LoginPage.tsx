
import React, { useState } from 'react';
import { AppUser, UserRole } from '../types';
import { userApi } from '../services/apiService';

interface LoginPageProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  useDatabase?: boolean;
}

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@brd.com', password: 'admin123', description: 'Full system control & user management', color: 'purple' },
  { role: 'Project Manager', email: 'pm@brd.com', password: 'pm123', description: 'Create BRDs & manage workflow', color: 'indigo' },
  { role: 'Business', email: 'business@brd.com', password: 'business123', description: 'Business review & approval', color: 'emerald' },
  { role: 'CTO', email: 'cto@brd.com', password: 'cto123', description: 'Final executive approval', color: 'amber' },
  { role: 'Team Lead', email: 'lead@brd.com', password: 'lead123', description: 'Technical review & sign-off', color: 'cyan' },
];

// Normalize credentials for comparison (handles whitespace/case issues from cache or autofill)
const normalizeEmail = (e: string) => (e || '').trim().toLowerCase();
const normalizePassword = (p: string) => (p || '').trim();

const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin, useDatabase = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Find user with normalized comparison to handle cache/autofill edge cases (for localStorage mode)
  const findUser = (inputEmail: string, inputPassword: string): AppUser | undefined => {
    const normEmail = normalizeEmail(inputEmail);
    const normPassword = normalizePassword(inputPassword);
    
    return users.find(u => 
      normalizeEmail(u.email) === normEmail && 
      normalizePassword(u.password) === normPassword
    );
  };

  // Login via database API
  const loginViaApi = async (inputEmail: string, inputPassword: string): Promise<AppUser | null> => {
    try {
      const result = await userApi.login(inputEmail, inputPassword);
      if (result.user) {
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role as UserRole,
          password: '', // Don't store password on client
        };
      }
      return null;
    } catch (error: any) {
      console.error('Login API error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let user: AppUser | null | undefined = null;
      
      if (useDatabase) {
        // Database mode - authenticate via API
        user = await loginViaApi(email, password);
      } else {
        // LocalStorage mode - check local users array
        user = findUser(email, password);
      }
      
      if (user) {
        onLogin(user);
      } else {
        // Enhanced error messages
        if (useDatabase) {
          setError('Invalid email or password. Check the demo credentials below.');
        } else {
          const normEmail = normalizeEmail(email);
          const emailExists = users.some(u => normalizeEmail(u.email) === normEmail);
          
          if (!users.length) {
            setError('No users loaded. Try clearing browser cache and refreshing.');
          } else if (!emailExists) {
            setError('Email not found. Check the demo credentials below.');
          } else {
            setError('Invalid password. Check the demo credentials below.');
          }
        }
        
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      let user: AppUser | null | undefined = null;
      
      if (useDatabase) {
        user = await loginViaApi(demoEmail, demoPassword);
      } else {
        user = findUser(demoEmail, demoPassword);
      }
      
      if (user) {
        onLogin(user);
      } else {
        console.warn('[Login Debug] Quick login failed');
        setEmail(demoEmail);
        setPassword(demoPassword);
        setError('Credentials mismatch. Try the Sign In button.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'from-purple-500 to-purple-700 shadow-purple-200',
      indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-200',
      emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-200',
      amber: 'from-amber-500 to-amber-700 shadow-amber-200',
      cyan: 'from-cyan-500 to-cyan-700 shadow-cyan-200',
    };
    return colors[color] || colors.indigo;
  };

  const getRoleBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-100 text-amber-700 border-amber-200',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-start max-h-[95vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
        {/* Login Form Card */}
        <div className={`bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-8 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="text-center mb-5 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">BRD Architect</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">AI-Powered Business Requirements</p>
            
            {/* Database connection indicator */}
            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[10px] font-bold ${
              useDatabase 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${useDatabase ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {useDatabase ? 'Connected to Database' : 'Local Storage Mode'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" autoComplete="off">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="demo-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-xs sm:text-sm font-medium"
                  placeholder="Enter your email"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 sm:mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  name="demo-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-slate-50 border-2 border-slate-200 rounded-lg sm:rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all text-xs sm:text-sm font-medium"
                  placeholder="Enter your password"
                  required
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 text-center">
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              <br></br> <span className="hidden sm:inline">Click any credential card to login instantly →</span><span className="sm:hidden">Tap credential below ↓</span>
            </p>
          </div>
        </div>

        {/* Demo Credentials Cards */}
        <div className="space-y-3 sm:space-y-4">
          

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4">
            {DEMO_CREDENTIALS.map((cred, idx) => (
              <button
                key={cred.role}
                onClick={() => handleQuickLogin(cred.email, cred.password)}
                disabled={isLoading}
                className="w-full text-left bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 hover:bg-white/20 transition-all group hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${getRoleColor(cred.color)} shadow-lg flex items-center justify-center text-white font-black text-sm sm:text-lg flex-shrink-0`}>
                    {cred.role.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <span className="font-bold text-white text-xs sm:text-base">{cred.role}</span>
                      <span className={`hidden sm:inline text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(cred.color)}`}>
                        {cred.role === 'Admin' ? 'FULL ACCESS' : 'LIMITED'}
                      </span>
                    </div>
                    <p className="text-white/60 text-[10px] sm:text-xs truncate hidden sm:block">{cred.description}</p>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4 mt-1 sm:mt-2">
                      <code className="text-[8px] sm:text-[10px] bg-black/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-white/80 font-mono truncate max-w-full">{cred.email}</code>
                      <code className="hidden sm:inline text-[10px] bg-black/20 px-2 py-1 rounded text-white/80 font-mono">{cred.password}</code>
                    </div>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default LoginPage;
