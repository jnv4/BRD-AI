
import React, { useState, useEffect } from 'react';
import { BRD, BRDStatus, UserRole, LogEntry, NotificationItem, AppUser, BRDContent } from './types';
import { generateBRDContent } from './services/geminiService';
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
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedBrds = localStorage.getItem('brd_data');
    if (savedBrds) setBrds(JSON.parse(savedBrds));
    
    const savedNotes = localStorage.getItem('brd_notifications');
    if (savedNotes) setNotifications(JSON.parse(savedNotes));

    const savedUsers = localStorage.getItem('brd_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));

    // Check for authenticated session
    const savedSession = localStorage.getItem('brd_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const savedUsersList = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
      const sessionUser = savedUsersList.find((u: AppUser) => u.id === session.userId);
      if (sessionUser) {
        setCurrentUser(sessionUser);
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('brd_data', JSON.stringify(brds));
  }, [brds]);

  useEffect(() => {
    localStorage.setItem('brd_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('brd_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      localStorage.setItem('brd_session', JSON.stringify({ userId: currentUser.id, timestamp: Date.now() }));
    }
  }, [currentUser, isAuthenticated]);

  const handleLogin = (user: AppUser) => {
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

  const addNotification = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    const newNote: NotificationItem = {
      id: generateId(),
      title,
      message,
      type,
      timestamp: Date.now(),
      isRead: false
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const handleCreateBRD = async (name: string, questions: string[], answers: string[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const generated = await generateBRDContent(name, questions, answers);
      const newBrd: BRD = {
        id: generateId(),
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
      setBrds(prev => [newBrd, ...prev]);
      setActiveBrdId(newBrd.id);
      showToast("BRD generated successfully!", "success");
      addNotification("BRD Created", `New project "${name}" has been drafted and is ready for AI verification.`, "info");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Generation failed", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBRD = (id: string, updates: Partial<BRD>) => {
    const brd = brds.find(b => b.id === id);
    if (!brd) return;

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
          "success"
        );
      } else if (updates.status === BRDStatus.PENDING_VERIFICATION) {
        showToast("Starting AI Verification...", "success");
        addNotification(
          "Verification Started",
          `AI audit is analyzing project "${brd.projectName}".`,
          "info"
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

    updateBRD(id, { ...updates, logs });
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

  const updateBRD = (id: string, updates: Partial<BRD>) => {
    setBrds(prev => prev.map(b => b.id === id ? { ...b, ...updates, lastModified: Date.now() } : b));
  };

  const handleAction = (id: string, action: string, newStatus: BRDStatus, comment?: string) => {
    const brd = brds.find(b => b.id === id);
    if (!brd) return;

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
        "error"
      );
    } else if (newStatus === BRDStatus.APPROVED) {
      addNotification(
        "BRD Fully Approved!", 
        `Project "${brd.projectName}" has completed the workflow and is officially approved.`, 
        "success"
      );
    } else {
      addNotification(
        "Workflow Update", 
        `Project "${brd.projectName}" has moved to ${newStatus} by ${currentUser.name}.`, 
        "info"
      );
    }

    updateBRD(id, updates);
    showToast(`BRD ${newStatus}`, "success");
  };

  const handleRevise = (id: string) => {
    const brd = brds.find(b => b.id === id);
    if (!brd) return;

    const newVersion = brd.version + 1;
    const log: LogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      user: `${currentUser.name} (${currentUser.role})`,
      action: `Created Revised Version (v${newVersion})`,
      version: newVersion
    };

    updateBRD(id, {
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

  const activeBrd = brds.find(b => b.id === activeBrdId) || null;

  // Show login page if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} />;
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
        onClearNotifications={() => setNotifications([])}
        onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))}
      />
      
      <main className="flex-1 overflow-hidden flex">
        <aside className="w-80 border-r bg-white overflow-y-auto hidden md:block">
          <BRDList 
            brds={brds} 
            activeId={activeBrdId} 
            onSelect={setActiveBrdId} 
            onCreate={handleCreateBRD}
            isLoading={isLoading}
          />
        </aside>

        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeBrd ? (
            <BRDEditor 
              brd={activeBrd} 
              onUpdate={(content) => updateBRD(activeBrd.id, { content })}
              onUpdateBRD={(updates) => handleUpdateBRD(activeBrd.id, updates)}
              onAction={(action, status, comment) => handleAction(activeBrd.id, action, status, comment)}
              onRevise={() => handleRevise(activeBrd.id)}
              onDelete={() => {
                setBrds(prev => prev.filter(b => b.id !== activeBrd.id));
                setActiveBrdId(null);
                showToast("BRD deleted successfully", "success");
                addNotification("BRD Deleted", `Project "${activeBrd.projectName}" has been removed.`, "info");
              }}
              currentUser={currentUser}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center max-w-sm text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to BRD Architect</h3>
                <p className="text-sm leading-relaxed">Select an existing project from the sidebar to track status or click <span className="font-bold text-indigo-600">"New BRD"</span> to start.</p>
              </div>
            </div>
          )}
        </section>
      </main>

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        users={users} 
        onUpdateUsers={(updated) => {
          setUsers(updated);
          // If current user was deleted, reset to first
          if (!updated.find(u => u.id === currentUser.id)) {
            setCurrentUser(updated[0]);
          }
        }}
      />

      {toast && (
        <Notification message={toast.message} type={toast.type} />
      )}
    </div>
  );
};

export default App;
