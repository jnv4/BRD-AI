
import React, { useState, useEffect, useCallback } from 'react';
import { BRD, BRDStatus, UserRole, LogEntry, NotificationItem, AppUser, BRDContent } from './types';
import { generateBRDContent } from './services/geminiService';
import { userApi, brdApi, alertApi, isApiAvailable } from './services/apiService';
import BRDList from './components/BRDList';
import BRDEditor from './components/BRDEditor';
import Header from './components/Header';
import Notification from './components/Notification';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
};

// Fallback users when API is not available
const DEFAULT_USERS: AppUser[] = [
  { id: '1', name: 'Shreya Tivrekar', role: UserRole.PROJECT_MANAGER, email: 'pm@brd.com', password: 'pm123' },
  { id: '2', name: 'Admin User', role: UserRole.ADMIN, email: 'admin@brd.com', password: 'admin123' },
  { id: '3', name: 'Business Owner', role: UserRole.BUSINESS, email: 'business@brd.com', password: 'business123' },
  { id: '4', name: 'CTO Executive', role: UserRole.CTO, email: 'cto@brd.com', password: 'cto123' },
  { id: '5', name: 'Engineering Lead', role: UserRole.TEAM_LEAD, email: 'lead@brd.com', password: 'lead123' },
];

const App: React.FC = () => {
  const [brds, setBrds] = useState<BRD[]>([]);
  const [activeBrdId, setActiveBrdId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [useDatabase, setUseDatabase] = useState(false);

  // Load all data from database on mount
  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      
      // Check if API/Database is available
      const apiAvailable = await isApiAvailable();
      setUseDatabase(apiAvailable);
      
      if (apiAvailable) {
        console.log('✅ Database connected - using PostgreSQL');
        try {
          // Load users from database
          const dbUsers = await userApi.getAll();
          if (dbUsers.length > 0) {
            setUsers(dbUsers.map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role as UserRole,
              password: '', // Password not returned from API
            })));
          }
          
          // Load BRDs from database
          const dbBrds = await brdApi.getAll();
          setBrds(dbBrds);
          
          // Load alerts from database
          const dbAlerts = await alertApi.getAll();
          setNotifications(dbAlerts.map(a => ({
            id: a.id,
            title: a.title,
            message: a.message,
            type: a.type,
            timestamp: a.timestamp,
            isRead: a.isRead,
          })));
          
        } catch (error) {
          console.error('Error loading from database:', error);
          showToast('Failed to load data from database', 'error');
        }
      } else {
        console.log('⚠️ Database not available - using localStorage');
        // Fallback to localStorage
        const savedBrds = localStorage.getItem('brd_data');
        if (savedBrds) setBrds(JSON.parse(savedBrds));
        
        const savedNotes = localStorage.getItem('brd_notifications');
        if (savedNotes) setNotifications(JSON.parse(savedNotes));
        
        const savedUsers = localStorage.getItem('brd_users');
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setUsers(parsed);
            }
          } catch (e) {
            console.warn('Failed to parse saved users');
          }
        }
      }

      // Check for authenticated session
      const savedSession = localStorage.getItem('brd_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // For database mode, fetch user from API
          if (apiAvailable) {
            try {
              const sessionUser = await userApi.getById(session.userId);
              if (sessionUser) {
                setCurrentUser({
                  id: sessionUser.id,
                  name: sessionUser.name,
                  email: sessionUser.email,
                  role: sessionUser.role as UserRole,
                  password: '',
                });
                setIsAuthenticated(true);
              }
            } catch {
              localStorage.removeItem('brd_session');
            }
          } else {
            // localStorage mode - find user in local state
            const savedUsersData = localStorage.getItem('brd_users');
            const allUsers = savedUsersData ? JSON.parse(savedUsersData) : DEFAULT_USERS;
            const sessionUser = allUsers.find((u: AppUser) => u.id === session.userId);
            if (sessionUser) {
              setCurrentUser(sessionUser);
              setIsAuthenticated(true);
            }
          }
        } catch (e) {
          console.warn('Failed to restore session');
          localStorage.removeItem('brd_session');
        }
      }
      
      setIsInitializing(false);
    };

    initializeApp();
  }, []);

  // Sync BRDs to localStorage when database is not available
  useEffect(() => {
    if (!useDatabase && !isInitializing) {
      localStorage.setItem('brd_data', JSON.stringify(brds));
    }
  }, [brds, useDatabase, isInitializing]);

  // Sync notifications to localStorage when database is not available
  useEffect(() => {
    if (!useDatabase && !isInitializing) {
      localStorage.setItem('brd_notifications', JSON.stringify(notifications));
    }
  }, [notifications, useDatabase, isInitializing]);

  // Sync users to localStorage when database is not available
  useEffect(() => {
    if (!useDatabase && !isInitializing) {
      localStorage.setItem('brd_users', JSON.stringify(users));
    }
  }, [users, useDatabase, isInitializing]);

  // Save session
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      localStorage.setItem('brd_session', JSON.stringify({ userId: currentUser.id, timestamp: Date.now() }));
    }
  }, [currentUser, isAuthenticated]);

  const handleLogin = async (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('brd_session');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addNotification = useCallback(async (title: string, message: string, type: 'success' | 'error' | 'info', brdId?: string) => {
    const newNote: NotificationItem = {
      id: generateId(),
      title,
      message,
      type,
      timestamp: Date.now(),
      isRead: false
    };
    
    setNotifications(prev => [newNote, ...prev]);
    
    // Save to database if available
    if (useDatabase) {
      try {
        await alertApi.create({
          title,
          message,
          type,
          brdId,
          actionBy: currentUser?.name,
        });
      } catch (error) {
        console.error('Failed to save alert to database:', error);
      }
    }
  }, [useDatabase, currentUser]);

  const handleCreateBRD = async (name: string, questions: string[], answers: string[], remarks?: string): Promise<boolean> => {
    if (!currentUser) return false;
    setIsLoading(true);
    try {
      const generated = await generateBRDContent(name, questions, answers, remarks);
      const newBrdId = generateId();
      const newBrd: BRD = {
        id: newBrdId,
        projectName: name,
        preparedBy: `${currentUser.name} (${currentUser.role})`,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        version: 1,
        status: BRDStatus.DRAFT,
        content: generated,
        logs: [{
          id: generateId(),
          timestamp: Date.now(),
          user: `${currentUser.name} (${currentUser.role})`,
          action: "Created Initial Draft",
          version: 1
        }],
        lastModified: Date.now(),
        isVerified: false,
        verificationHistory: []
      };
      
      // Save to database if available
      if (useDatabase) {
        try {
          const savedBrd = await brdApi.create(newBrd);
          setBrds(prev => [savedBrd, ...prev]);
          setActiveBrdId(savedBrd.id);
        } catch (error) {
          console.error('Failed to save BRD to database:', error);
          // Fallback to local state
          setBrds(prev => [newBrd, ...prev]);
          setActiveBrdId(newBrd.id);
        }
      } else {
        setBrds(prev => [newBrd, ...prev]);
        setActiveBrdId(newBrd.id);
      }
      
      showToast("BRD generated successfully!", "success");
      addNotification("BRD Created", `New project "${name}" has been drafted and is ready for AI verification.`, "info", newBrdId);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Generation failed", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBRD = async (id: string, updates: Partial<BRD>) => {
    const brd = brds.find(b => b.id === id);
    if (!brd || !currentUser) return;

    // Add log entry for significant status changes
    let logs = brd.logs;
    if (updates.status && updates.status !== brd.status) {
      const logEntry: LogEntry = {
        id: generateId(),
        timestamp: Date.now(),
        user: `${currentUser.name} (${currentUser.role})`,
        action: getStatusChangeAction(brd.status, updates.status),
        version: brd.version
      };
      logs = [...logs, logEntry];

      // Add notifications and toasts for key status changes
      if (updates.status === BRDStatus.VERIFIED) {
        showToast("BRD Finalized! Ready for approval workflow.", "success");
        addNotification(
          "BRD Verified",
          `Project "${brd.projectName}" has passed AI verification and is ready for stakeholder approval.`,
          "success",
          id
        );
      } else if (updates.status === BRDStatus.PENDING_VERIFICATION) {
        showToast("Starting AI Verification...", "success");
        addNotification(
          "Verification Started",
          `AI audit is analyzing project "${brd.projectName}".`,
          "info",
          id
        );
      }
    }

    // If content was updated (refinement), add a log
    if (updates.content && JSON.stringify(updates.content) !== JSON.stringify(brd.content)) {
      const refineLog: LogEntry = {
        id: generateId(),
        timestamp: Date.now(),
        user: `${currentUser.name} (${currentUser.role})`,
        action: "BRD Refined via AI Suggestions",
        version: brd.version
      };
      logs = [...logs, refineLog];
    }

    await updateBRD(id, { ...updates, logs });
  };

  const getStatusChangeAction = (from: BRDStatus, to: BRDStatus): string => {
    switch (to) {
      case BRDStatus.PENDING_VERIFICATION:
        return "Started AI Verification";
      case BRDStatus.VERIFIED:
        return "BRD Verified - Ready for Approval";
      case BRDStatus.BUSINESS_REVIEW:
        return "Submitted for Business Review";
      default:
        return `Status changed to ${to}`;
    }
  };

  const updateBRD = async (id: string, updates: Partial<BRD>) => {
    const updatedBrd = { ...brds.find(b => b.id === id)!, ...updates, lastModified: Date.now() };
    
    // Update local state immediately
    setBrds(prev => prev.map(b => b.id === id ? updatedBrd : b));
    
    // Sync to database if available
    if (useDatabase) {
      try {
        await brdApi.update(id, updates);
      } catch (error) {
        console.error('Failed to update BRD in database:', error);
      }
    }
  };

  const handleAction = async (id: string, action: string, newStatus: BRDStatus, comment?: string) => {
    const brd = brds.find(b => b.id === id);
    if (!brd || !currentUser) return;

    const logAction = newStatus === BRDStatus.REJECTED 
      ? `Rejected by ${currentUser.role}` 
      : `Approved by ${currentUser.role} (${action})`;

    const log: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      user: `${currentUser.name} (${currentUser.role})`,
      action: logAction,
      details: comment,
      version: brd.version
    };

    let updates: Partial<BRD> = {
      status: newStatus,
      logs: [...brd.logs, log]
    };

    if (newStatus === BRDStatus.REJECTED && comment) {
      updates.rejectionComment = comment;
      addNotification(
        "BRD Rejected (Email Alert Simulation)", 
        `Project "${brd.projectName}" was rejected by ${currentUser.name}. Reason: ${comment}`, 
        "error",
        id
      );
    } else if (newStatus === BRDStatus.APPROVED) {
      addNotification(
        "BRD Fully Approved!", 
        `Project "${brd.projectName}" has completed the workflow and is officially approved.`, 
        "success",
        id
      );
      
      // Update final decision in database
      if (useDatabase) {
        try {
          await brdApi.setDecision(id, 'approved');
        } catch (error) {
          console.error('Failed to update decision:', error);
        }
      }
    } else {
      addNotification(
        "Workflow Update", 
        `Project "${brd.projectName}" has moved to ${newStatus} by ${currentUser.name}.`, 
        "info",
        id
      );
    }

    await updateBRD(id, updates);
    showToast(`BRD ${newStatus}`, "success");
  };

  const handleRevise = async (id: string) => {
    const brd = brds.find(b => b.id === id);
    if (!brd || !currentUser) return;

    const newVersion = brd.version + 1;
    const log: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      user: `${currentUser.name} (${currentUser.role})`,
      action: `Created Revised Version (v${newVersion})`,
      version: newVersion
    };

    await updateBRD(id, {
      version: newVersion,
      status: BRDStatus.DRAFT,
      rejectionComment: undefined,
      logs: [...brd.logs, log],
      // Reset verification state for new version
      isVerified: false,
      audit: undefined,
      verificationHistory: []
    });
    showToast(`Revised to Version ${newVersion}`, "success");
  };

  const handleDeleteBRD = async (id: string) => {
    const brd = brds.find(b => b.id === id);
    if (!brd) return;
    
    // Remove from local state
    setBrds(prev => prev.filter(b => b.id !== id));
    setActiveBrdId(null);
    
    // Delete from database if available
    if (useDatabase) {
      try {
        await brdApi.delete(id);
      } catch (error) {
        console.error('Failed to delete BRD from database:', error);
      }
    }
    
    showToast("BRD deleted successfully", "success");
    addNotification("BRD Deleted", `Project "${brd.projectName}" has been removed.`, "info");
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    
    if (useDatabase) {
      try {
        await alertApi.deleteAll();
      } catch (error) {
        console.error('Failed to clear alerts from database:', error);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    
    if (useDatabase) {
      try {
        await alertApi.markAsRead(id);
      } catch (error) {
        console.error('Failed to mark alert as read:', error);
      }
    }
  };

  const handleUpdateUsers = async (updated: AppUser[]) => {
    setUsers(updated);
    
    // If current user was deleted, reset to first
    if (!updated.find(u => u.id === currentUser?.id)) {
      setCurrentUser(updated[0] || null);
    }
  };

  const activeBrd = brds.find(b => b.id === activeBrdId) || null;

  // Show loading during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading BRD Architect...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} useDatabase={useDatabase} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        currentUser={currentUser}
        users={users}
        onUserChange={setCurrentUser}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onLogout={handleLogout}
        notifications={notifications}
        onClearNotifications={handleClearNotifications}
        onMarkAsRead={handleMarkAsRead}
      />
      
      {/* Database connection indicator */}
      <div className={`text-xs text-center py-1 ${useDatabase ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {useDatabase ? '🗄️ Connected to PostgreSQL Database' : '💾 Using Local Storage (Database not available)'}
      </div>
      
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Mobile BRD List Toggle */}
        <div className="md:hidden bg-white border-b p-3">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <span className="text-sm font-bold text-slate-700">Projects Menu</span>
              <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 max-h-[50vh] overflow-y-auto">
              <BRDList 
                brds={brds} 
                activeId={activeBrdId} 
                onSelect={setActiveBrdId} 
                onCreate={handleCreateBRD}
                isLoading={isLoading}
              />
            </div>
          </details>
        </div>

        <aside className="w-80 border-r bg-white overflow-y-auto hidden md:block flex-shrink-0">
          <BRDList 
            brds={brds} 
            activeId={activeBrdId} 
            onSelect={setActiveBrdId} 
            onCreate={handleCreateBRD}
            isLoading={isLoading}
          />
        </aside>

        <section className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
          {activeBrd ? (
            <BRDEditor 
              brd={activeBrd} 
              onUpdate={(content) => updateBRD(activeBrd.id, { content })}
              onUpdateBRD={(updates) => handleUpdateBRD(activeBrd.id, updates)}
              onAction={(action, status, comment) => handleAction(activeBrd.id, action, status, comment)}
              onRevise={() => handleRevise(activeBrd.id)}
              onDelete={() => handleDeleteBRD(activeBrd.id)}
              currentUser={currentUser}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 px-4">
              <div className="bg-white p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center max-w-sm text-center">
                <div className="bg-slate-50 p-4 sm:p-6 rounded-full mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Welcome to BRD Architect</h3>
                <p className="text-xs sm:text-sm leading-relaxed">Select a project <span className="hidden md:inline">from the sidebar</span> or click <span className="font-bold text-indigo-600">"New BRD"</span> to start.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        users={users} 
        onUpdateUsers={handleUpdateUsers}
        useDatabase={useDatabase}
      />

      {toast && (
        <Notification message={toast.message} type={toast.type} />
      )}
    </div>
  );
};

export default App;
