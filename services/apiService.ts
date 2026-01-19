// API Service for BRD Backend Communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// =====================================================
// USER API
// =====================================================
export const userApi = {
  getAll: () => apiFetch<any[]>('/users'),
  
  getById: (id: string) => apiFetch<any>(`/users/${id}`),
  
  create: (userData: { name: string; email: string; password: string; role: string }) =>
    apiFetch<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  update: (id: string, updates: any) =>
    apiFetch<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  
  login: (email: string, password: string) =>
    apiFetch<{ user: any }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// =====================================================
// BRD API
// =====================================================
export const brdApi = {
  getAll: (status?: string) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<any[]>(`/brds${query}`);
  },
  
  getById: (id: string) => apiFetch<any>(`/brds/${id}`),
  
  getStats: () => apiFetch<any>('/brds/stats'),
  
  create: (brdData: any) =>
    apiFetch<any>('/brds', {
      method: 'POST',
      body: JSON.stringify(brdData),
    }),
  
  update: (id: string, updates: any) =>
    apiFetch<any>(`/brds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  approve: (id: string, type: 'yes' | 'no') =>
    apiFetch<any>(`/brds/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ type }),
    }),
  
  setDecision: (id: string, decision: 'pending' | 'approved' | 'rejected') =>
    apiFetch<any>(`/brds/${id}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision }),
    }),
  
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/brds/${id}`, { method: 'DELETE' }),
};

// =====================================================
// ALERTS API
// =====================================================
export const alertApi = {
  getAll: (userId?: string, recentHours?: number) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (recentHours) params.append('recent', recentHours.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<any[]>(`/alerts${query}`);
  },
  
  getUnreadCount: (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch<{ count: number }>(`/alerts/unread/count${query}`);
  },
  
  getByBrd: (brdId: string) => apiFetch<any[]>(`/alerts/brd/${brdId}`),
  
  getById: (id: string) => apiFetch<any>(`/alerts/${id}`),
  
  create: (alertData: {
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    userId?: string;
    brdId?: string;
    actionType?: string;
    actionBy?: string;
  }) =>
    apiFetch<any>('/alerts', {
      method: 'POST',
      body: JSON.stringify({ ...alertData, timestamp: Date.now() }),
    }),
  
  markAsRead: (id: string) =>
    apiFetch<any>(`/alerts/${id}/read`, { method: 'PATCH' }),
  
  markAllAsRead: (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch<{ updated: number }>(`/alerts/read-all${query}`, { method: 'PATCH' });
  },
  
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),
  
  deleteAll: (userId?: string) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch<{ deleted: number }>(`/alerts${query}`, { method: 'DELETE' });
  },
};

// =====================================================
// HEALTH CHECK
// =====================================================
export const healthCheck = () =>
  apiFetch<{ status: string; database: string; timestamp: string }>('/health');

// Check if API is available
export const isApiAvailable = async (): Promise<boolean> => {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
};
