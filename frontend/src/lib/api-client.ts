import api from './api';

// Auth API functions (session-based)
export const authApi = {
  login: (email: string, password: string, remember_me?: boolean) =>
    api.post('/auth/login/', { email, password, remember_me: !!remember_me }),
  
  signup: (data: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    username: string;
    industry: string;
  }) => api.post('/auth/signup/', data),

  brandSignup: (data: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    name: string;
    industry: string;
    website?: string;
    contact_phone?: string;
    description?: string;
  }) => api.post('/auth/signup/brand/', data),
  
  logout: () => api.post('/auth/logout/'),
  
  googleAuth: (token: string) =>
    api.post('/auth/google/', { token }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password/', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password/', { token, password }),
  
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email/${token}/`),
  
  // Check authentication status via profile endpoint
  checkAuth: () => api.get('/auth/profile/'),
  
  // Get CSRF token - Django handles domain automatically
  csrf: () => api.get('/auth/csrf/'),
};

// Profile API functions
export const profileApi = {
  getProfile: () => api.get('/influencers/profile/'),
  
  updateProfile: (data: Record<string, unknown>) => api.patch('/influencers/profile/', data),
  
  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('profile_image', file);
    
    // Axios will automatically handle CSRF tokens from HTTP-only cookies
    return api.post('/influencers/profile/upload-image/', formData, {
      // Let axios set Content-Type automatically for multipart/form-data
      // This ensures proper boundary setting
    });
  },
  
  uploadDocument: async (
    file: File,
    aadharNumber?: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
    signal?: AbortSignal
  ) => {
    const formData = new FormData();
    formData.append('aadhar_document', file);
    if (aadharNumber) {
      formData.append('aadhar_number', aadharNumber);
    }
    
    // Axios will automatically handle CSRF tokens from HTTP-only cookies
    return api.post('/influencers/profile/upload-document/', formData, {
      // Let axios set Content-Type automatically for multipart/form-data
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
  
  getSocialAccounts: () => api.get('/influencers/profile/social-accounts/'),
  
  createSocialAccount: (data: Record<string, unknown>) =>
    api.post('/influencers/profile/social-accounts/', data),
  
  updateSocialAccount: (id: number, data: Record<string, unknown>) =>
    api.put(`/influencers/profile/social-accounts/${id}/`, data),
  
  deleteSocialAccount: (id: number) =>
    api.delete(`/influencers/profile/social-accounts/${id}/`),
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
  
  submitContent: async (
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
    
    // Axios will automatically handle CSRF tokens from HTTP-only cookies
    return api.post(`/deals/${id}/submit-content/`, formData, {
      // Let axios set Content-Type automatically for multipart/form-data
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
  
  sendMessage: async (
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
    
    // Axios will automatically handle CSRF tokens from HTTP-only cookies
    return api.post(`/deals/${id}/messages/`, formData, {
      // Let axios set Content-Type automatically for multipart/form-data
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