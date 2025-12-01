import api from './api';

// Auth API functions (session-based)
export const authApi = {
    login: (email: string, password: string, remember_me?: boolean) =>
        api.post('/auth/login/', {email, password, remember_me: !!remember_me}),

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
        country_code: string;
        contact_phone: string;
        description?: string;
        gstin?: string;
    }) => api.post('/auth/brand-signup/', data),

    logout: () => api.post('/auth/logout/'),

    googleAuth: (token: string) =>
        api.post('/auth/google/', {token}),

    forgotPassword: (data: { email?: string; phone_number?: string; country_code?: string }) =>
        api.post('/auth/forgot-password/', data),

    verifyOTP: (data: { email?: string; phone_number?: string; country_code?: string; otp: string }) =>
        api.post('/auth/verify-otp/', data),

    resetPassword: (data: {
        email?: string;
        phone_number?: string;
        country_code?: string;
        otp: string;
        password: string
    }) =>
        api.post('/auth/reset-password/', data),

    verifyEmail: (token: string) =>
        api.get(`/auth/verify-email/${token}/`),

    // One-tap login using token
    oneTapLogin: (token: string) =>
        api.get(`/auth/one-tap-login/${token}/`),

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
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file object');
        }

        const formData = new FormData();
        formData.append('profile_image', file);

        return api.post('/influencers/profile/upload-image/', formData, {
            headers: {
                'Content-Type': undefined, // Let browser set the Content-Type with boundary
            },
            transformRequest: [(data) => data], // Don't transform FormData
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
            headers: {
                'Content-Type': undefined,
            },
            transformRequest: [(data) => data],
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
const appendCommonContentFields = (formData: FormData, data: {
    platform: string;
    content_type: string;
    title?: string;
    description?: string;
    caption?: string;
    hashtags?: string;
    mention_brand?: boolean;
    post_url?: string;
    file_url?: string;
}) => {
    formData.append('platform', data.platform);
    formData.append('content_type', data.content_type);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.caption) formData.append('caption', data.caption);
    if (data.hashtags) formData.append('hashtags', data.hashtags);
    if (data.mention_brand !== undefined) formData.append('mention_brand', data.mention_brand.toString());
    if (data.post_url) formData.append('post_url', data.post_url);
    if (data.file_url) formData.append('file_url', data.file_url);
};

const appendAdditionalLinksToFormData = (
    formData: FormData,
    additional_links?: Array<{ url: string; description: string }>
) => {
    if (!additional_links || additional_links.length === 0) return;

    additional_links.forEach((link, index) => {
        formData.append(`additional_links[${index}][url]`, link.url);
        formData.append(`additional_links[${index}][description]`, link.description);
    });
};

const toJsonPayload = (
    data: {
        platform: string;
        content_type: string;
        title?: string;
        description?: string;
        caption?: string;
        hashtags?: string;
        mention_brand?: boolean;
        post_url?: string;
        file_url?: string;
        additional_links?: Array<{ url: string; description: string }>;
    },
    filteredLinks: Array<{ url: string; description: string }>,
    includeNullFileUpload = false,
) => {
    const payload: Record<string, any> = {
        platform: data.platform,
        content_type: data.content_type,
        title: data.title,
        description: data.description,
        caption: data.caption,
        hashtags: data.hashtags,
        mention_brand: data.mention_brand,
        post_url: data.post_url,
        file_url: data.file_url,
        additional_links: filteredLinks,
    };

    if (includeNullFileUpload) {
        payload.file_upload = undefined;
    }

    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });

    return payload;
};

const hasValidFile = (file?: File) => {
    if (!file) return false;
    return typeof window !== "undefined" ? file instanceof File : true;
};

export const dealsApi = {
    getDeals: (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) => api.get('/deals/', {params}),

    getDeal: (id: number) => api.get(`/deals/${id}/`),

    acceptDeal: (id: number) => {
        return api.post(`/deals/${id}/action/`, {action: 'accept'});
    },

    rejectDeal: (id: number, reason?: string) => {
        return api.post(`/deals/${id}/action/`, {action: 'reject', rejection_reason: reason});
    },

    submitContent: async (
        id: number,
        data: {
            platform: string;
            content_type: string;
            title?: string;
            description?: string;
            caption?: string;
            hashtags?: string;
            mention_brand?: boolean;
            post_url?: string;
            file_url?: string;
            additional_links?: Array<{ url: string; description: string }>;
            file?: File;
        },
        onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
        signal?: AbortSignal
    ) => {
        const filteredLinks = (data.additional_links || []).filter(
            (link) => link && link.url && link.description
        );

        if (hasValidFile(data.file)) {
            const formData = new FormData();
            appendCommonContentFields(formData, data);
            appendAdditionalLinksToFormData(formData, filteredLinks);
            formData.append('file_upload', data.file as File);

            return api.post(`/content/deals/${id}/content-submissions/`, formData, {
                headers: {
                    'Content-Type': undefined,
                },
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
        }

        const payload = toJsonPayload(data, filteredLinks, true);
        return api.post(`/content/deals/${id}/content-submissions/`, payload, {signal});
    },

    getContentSubmissions: (id: number) => api.get(`/deals/${id}/content-submissions/`),

    deleteContentSubmission: (dealId: number, submissionId: number) =>
        api.delete(`/content/deals/${dealId}/content-submissions/${submissionId}/`),

    updateContentSubmission: async (
        dealId: number,
        submissionId: number,
        data: {
            platform: string;
            content_type: string;
            title?: string;
            description?: string;
            caption?: string;
            hashtags?: string;
            mention_brand?: boolean;
            post_url?: string;
            file_url?: string;
            additional_links?: Array<{ url: string; description: string }>;
            file?: File;
        },
        onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
        signal?: AbortSignal
    ) => {
        const filteredLinks = (data.additional_links || []).filter(
            (link) => link && link.url && link.description
        );

        if (hasValidFile(data.file)) {
            const formData = new FormData();
            appendCommonContentFields(formData, data);
            appendAdditionalLinksToFormData(formData, filteredLinks);
            formData.append('file_upload', data.file as File);

            return api.put(`/content/deals/${dealId}/content-submissions/${submissionId}/`, formData, {
                headers: {
                    'Content-Type': undefined,
                },
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
        }

        const payload = toJsonPayload(data, filteredLinks, true);
        return api.put(
            `/content/deals/${dealId}/content-submissions/${submissionId}/`,
            payload,
            {signal},
        );
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
};

// Dashboard API functions
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats/'),

    getRecentDeals: () => api.get('/dashboard/recent-deals/'),

    getNotifications: () => api.get('/dashboard/notifications/'),
};

// Analytics API functions
export const analyticsApi = {
    getCollaborationHistory: (params?: {
        page?: number;
        limit?: number;
        brand?: string;
        status?: string;
    }) => api.get('/dashboard/analytics/collaborations/', {params}),

    getEarnings: (params?: {
        period?: 'month' | 'quarter' | 'year';
        year?: number;
    }) => api.get('/dashboard/analytics/earnings/', {params}),

    rateBrand: (dealId: number, rating: number, review?: string) => {
        return api.post(`/deals/${dealId}/rate/`, {rating, review});
    },
};

// Brand API functions
export const brandApi = {
    // Dashboard
    getDashboard: () => api.get('/brands/dashboard/'),

    // Deals
    getDeal: (id: number) => api.get(`/brands/deals/${id}/`),
    getDeals: (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) => api.get('/brands/deals/', {params}),

    getContentSubmissions: (dealId: number) => api.get(`/content/deals/${dealId}/brand-review/`),

    reviewContent: (dealId: number, submissionId: number, data: {
        action: 'approve' | 'reject' | 'request_revision';
        feedback?: string;
        revision_notes?: string;
    }) => api.post(`/content/deals/${dealId}/content-submissions/${submissionId}/review/`, data),

    updateDealStatus: (dealId: number, data: {
        status: string;
        notes?: string;
        tracking_number?: string;
        tracking_url?: string;
    }) => api.patch(`/brands/deals/${dealId}/status/`, data),

    updateDealNotes: (dealId: number, notes: string) => api.patch(`/brands/deals/${dealId}/notes/`, {notes}),

    requestAddress: (dealId: number) => api.post(`/brands/deals/${dealId}/request-address/`),

    updateTracking: (dealId: number, data: {
        tracking_number: string;
        tracking_url?: string;
    }) => api.patch(`/brands/deals/${dealId}/tracking/`, data),

    uploadVerificationDocument: (file: File) => {
        const formData = new FormData();
        formData.append('document', file);

        return api.post('/brands/verification/document/', formData, {
            headers: {
                'Content-Type': undefined,
            },
            transformRequest: [(data) => data],
        });
    },
};