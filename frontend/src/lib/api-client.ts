import api from './api';

// Auth API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  
  signup: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    username: string;
    industry: string;
  }) => api.post('/auth/signup/', data),
  
  logout: () => api.post('/auth/logout/'),
  
  googleAuth: (token: string) =>
    api.post('/auth/google/', { token }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password/', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password/', { token, password }),
  
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email/${token}/`),
  
  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),
};

// Profile API functions
export const profileApi = {
  getProfile: () => api.get('/profile/'),
  
  updateProfile: (data: Record<string, unknown>) => api.put('/profile/', data),
  
  uploadDocument: (
    file: File, 
    documentType: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
    signal?: AbortSignal
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    return api.post('/profile/upload-document/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    });
  },
  
  getSocialAccounts: () => api.get('/profile/social-accounts/'),
  
  createSocialAccount: (data: Record<string, unknown>) =>
    api.post('/profile/social-accounts/', data),
  
  updateSocialAccount: (id: number, data: Record<string, unknown>) =>
    api.put(`/profile/social-accounts/${id}/`, data),
  
  deleteSocialAccount: (id: number) =>
    api.delete(`/profile/social-accounts/${id}/`),
};

// Deals API functions
export const dealsApi = {
  getDeals: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/deals/', { params }),
  
  getDeal: (id: number) => api.get(`/deals/${id}/`),
  
  acceptDeal: (id: number) => api.post(`/deals/${id}/accept/`),
  
  rejectDeal: (id: number, reason?: string) =>
    api.post(`/deals/${id}/reject/`, { reason }),
  
  submitContent: (
    id: number, 
    data: {
      platform: string;
      content_type: string;
      file?: File;
      caption?: string;
    },
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
    signal?: AbortSignal
  ) => {
    const formData = new FormData();
    formData.append('platform', data.platform);
    formData.append('content_type', data.content_type);
    if (data.file) formData.append('file', data.file);
    if (data.caption) formData.append('caption', data.caption);
    
    return api.post(`/deals/${id}/submit-content/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    });
  },
  
  getMessages: (id: number) => api.get(`/deals/${id}/messages/`),
  
  sendMessage: (
    id: number, 
    data: {
      message: string;
      file?: File;
    },
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
    signal?: AbortSignal
  ) => {
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.file) formData.append('file', data.file);
    
    return api.post(`/deals/${id}/messages/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    });
  },

  getContentSubmissions: (id: number) => api.get(`/deals/${id}/content-submissions/`),
};

// Dashboard API functions
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats/'),
  
  getRecentDeals: () => api.get('/dashboard/recent-deals/'),
  
  getNotifications: () => api.get('/dashboard/notifications/'),
  
  markNotificationRead: (id: number) =>
    api.patch(`/dashboard/notifications/${id}/`, { read: true }),
};

// Analytics API functions
export const analyticsApi = {
  getCollaborationHistory: (params?: {
    page?: number;
    limit?: number;
    brand?: string;
    status?: string;
  }) => api.get('/analytics/collaborations/', { params }),
  
  getEarnings: (params?: {
    period?: 'month' | 'quarter' | 'year';
    year?: number;
  }) => api.get('/analytics/earnings/', { params }),
  
  getPerformanceMetrics: () => api.get('/analytics/performance/'),
  
  rateBrand: (dealId: number, rating: number, review?: string) =>
    api.post(`/analytics/rate-brand/`, {
      deal_id: dealId,
      rating,
      review,
    }),
};