import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('agrivision_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agrivision_token');
        localStorage.removeItem('agrivision_user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/auth/profile', data),
};

// ─── Crops ───────────────────────────────────────────────────────────────────
export const cropsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/crops', { params }),
  getById: (id: string) => api.get(`/crops/${id}`),
  create: (data: Record<string, unknown>) => api.post('/crops', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/crops/${id}`, data),
  remove: (id: string) => api.delete(`/crops/${id}`),
  getStats: () => api.get('/crops/stats/summary'),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  updateStatus: (id: string, data: { status: string; trackingNumber?: string }) =>
    api.patch(`/orders/${id}/status`, data),
  sendMessage: (id: string, message: string) =>
    api.post(`/orders/${id}/messages`, { message }),
  getStats: () => api.get('/orders/stats/summary'),
  // B2B Deal Management
  confirmDeal: (id: string, notes?: string) =>
    api.post(`/orders/${id}/confirm-deal`, { notes }),
  updateProcurement: (id: string, data: Record<string, unknown>) =>
    api.post(`/orders/${id}/procurement`, data),
  verifyPickup: (id: string, data: Record<string, unknown>) =>
    api.post(`/orders/${id}/verify-pickup`, data),
  markInTransit: (id: string, data?: Record<string, unknown>) =>
    api.post(`/orders/${id}/mark-in-transit`, data),
  markDelivered: (id: string, data?: Record<string, unknown>) =>
    api.post(`/orders/${id}/mark-delivered`, data),
};

// ─── Negotiations ────────────────────────────────────────────────────────────
export const negotiationApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/negotiations', { params }),
  getById: (id: string) => api.get(`/negotiations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/negotiations', data),
  counter: (id: string, data: Record<string, unknown>) =>
    api.post(`/negotiations/${id}/counter`, data),
  accept: (id: string, body?: Record<string, unknown>) => api.post(`/negotiations/${id}/accept`, body || {}),
  reject: (id: string, reason?: string) =>
    api.post(`/negotiations/${id}/reject`, { reason }),
  sendMessage: (id: string, message: string) =>
    api.post(`/negotiations/${id}/message`, { message }),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiApi = {
  // Primary: memory-storage scan (no files saved on server)
  scanCrop: (formData: FormData) =>
    api.post('/ai/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 45000, // Gemini can take up to 30s
    }),
  // Legacy: disk-storage analyze
  analyzeImage: (formData: FormData) =>
    api.post('/ai/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAnalyses: (params?: Record<string, unknown>) => api.get('/ai/analyses', { params }),
  getAnalysisById: (id: string) => api.get(`/ai/analyses/${id}`),
  archiveAnalysis: (id: string) => api.delete(`/ai/analyses/${id}`),
};

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/inventory', { params }),
  getById: (id: string) => api.get(`/inventory/${id}`),
  getDetails: (id: string) => api.get(`/inventory/${id}/details`), // NEW - with order info
  getMyListings: (params?: Record<string, unknown>) =>
    api.get('/inventory/my/listings', { params }),
  create: (data: Record<string, unknown>) => api.post('/inventory', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/inventory/${id}`, data),
  remove: (id: string) => api.delete(`/inventory/${id}`),
};

// ─── Weather ─────────────────────────────────────────────────────────────────
export const weatherApi = {
  getWeather: (params?: Record<string, unknown>) => api.get('/weather', { params }),
  updateLocation: (data: { lat: number; lng: number; address: string }) =>
    api.put('/weather/location', data),
  getRecommendations: () => api.get('/weather/recommendations'),
};

// ─── Geocoding ─────────────────────────────────────────────────────────────────
export const geocodeApi = {
  // Reverse geocode: coordinates to address
  reverseGeocode: (lat: number, lng: number) =>
    api.get('/geocode/reverse', { params: { lat, lng } }),
  // Geocode: address to coordinates
  geocodeAddress: (address: string) =>
    api.get('/geocode/geocode', { params: { address } }),
};

// ─── Market Prices ───────────────────────────────────────────────────────────
export const marketPricesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/market-prices', { params }),
  getTrends: (cropName: string) => api.get(`/market-prices/trends/${cropName}`),
  getNearby: (params?: Record<string, unknown>) => api.get('/market-prices/nearby', { params }),
  // Fetches districts for a state, or talukas when district param is also passed
  getDistricts: (state: string, district?: string) =>
    api.get('/market-prices/districts', { params: { state, ...(district ? { district } : {}) } }),
};

// ─── Crop Encyclopedia ───────────────────────────────────────────────────────
export const cropEncyclopediaApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/crop-encyclopedia', { params }),
  getById: (id: string) => api.get(`/crop-encyclopedia/${id}`),
  search: (q: string) => api.get('/crop-encyclopedia/search', { params: { q } }),
  getByName: (name: string) => api.get(`/crop-encyclopedia/name/${name}`),
  getPestsAndDiseases: (id: string) => api.get(`/crop-encyclopedia/${id}/pests-diseases`),
  getAdvice: (id: string, question: string) =>
    api.post(`/crop-encyclopedia/${id}/advice`, { question }),
  // Server-side AI search proxy — Gemini key stays on server, never in browser
  aiSearch: (cropName: string, language: string = 'en') =>
    api.post('/crop-encyclopedia/ai-search', { cropName, language }),
};

// ─── Financial ─────────────────────────────────────────────────────────────────
export const financialApi = {
  getSummary: (params?: Record<string, unknown>) => api.get('/financial/summary', { params }),
  getRecords: (params?: Record<string, unknown>) => api.get('/financial/records', { params }),
  createRecord: (data: Record<string, unknown>) => api.post('/financial/records', data),
  updateRecord: (id: string, data: Record<string, unknown>) =>
    api.put(`/financial/records/${id}`, data),
  deleteRecord: (id: string) => api.delete(`/financial/records/${id}`),
  getBudgets: (params?: Record<string, unknown>) => api.get('/financial/budgets', { params }),
  createBudget: (data: Record<string, unknown>) => api.post('/financial/budgets', data),
};

// ─── Upload / S3 ───────────────────────────────────────────────────────────────
export const uploadApi = {
  // Get upload configuration (max file size, allowed types, etc.)
  getConfig: () => api.get('/upload/config'),
  
  // Upload single image to S3
  uploadImage: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Upload multiple images to S3
  uploadImages: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    if (folder) formData.append('folder', folder);
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Upload and analyze crop image (S3 + AI in one call)
  uploadAndAnalyze: (file: File, language?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (language) formData.append('language', language);
    return api.post('/upload/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // AI analysis may take longer
    });
  },
  
  // Get user's uploaded images
  getMyImages: () => api.get('/upload/my-images'),
  
  // Delete uploaded image
  deleteImage: (id: string) => api.delete(`/upload/${id}`),
};

// ─── Feedback ───────────────────────────────────────────────────────────────
export const feedbackApi = {
  create: (data: Record<string, unknown>) => api.post('/feedback', data),
  getAll: () => api.get('/feedback'),
};

// ─── User Profile & Crops ───────────────────────────────────────────────────
export const userApi = {
  // Profile
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/user/profile', data),
  
  // Selected Crops
  getSelectedCrops: () => api.get('/user/crops'),
  addSelectedCrop: (cropName: string) => api.post('/user/crops', { cropName }),
  removeSelectedCrop: (cropName: string) => api.delete(`/user/crops/${encodeURIComponent(cropName)}`),
  updateSelectedCrops: (crops: string[]) => api.put('/user/crops', { crops }),
  
  // Notifications
  getNotifications: () => api.get('/user/notifications'),
  markAllNotificationsRead: () => api.put('/user/notifications/read'),
  markNotificationRead: (id: string) => api.put(`/user/notifications/${id}/read`),
};

export default api;
