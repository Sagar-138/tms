import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3002/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove double /api/ in the URL if present
    if (config.url?.startsWith('/api/')) {
      config.url = config.url.replace('/api/', '/');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear local storage and redirect to login
          localStorage.clear();
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access denied');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('An error occurred');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Routes
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// User Routes
export const users = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.patch('/users/profile/password', data), // New endpoint for changing password
  getEmployees: () => api.get('/users/employees'),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  uploadAvatar: (formData) => api.patch('/users/upload-avatar', formData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserById: (id) => api.get(`/users/${id}`),
};

// Company Routes
export const companies = {
  create: (data) => api.post('/companies', data),
  createWithAdmin: (data) => api.post('/companies/with-admin', data),
  getAll: () => api.get('/companies'),
  getOne: (id) => api.get(`/companies/${id}`),
  getStats: () => api.get('/companies/stats'),
  updateCompany: (id, data) => api.put(`/companies/${id}`, data),
};

// Task Routes
export const tasks = {
  create: (data) => api.post('/tasks', data),
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  getByHierarchy: () => api.get('/tasks/hierarchy'),
  getAnalytics: () => api.get('/tasks/analytics'),
  getByDepartment: (dept) => api.get(`/tasks/department/${dept}`),
  getTimeline: (params) => api.get('/tasks/timeline', { params }),
  getCompanyStats: () => api.get('/tasks/company-stats'),
  assignTask: (taskId, userId) => api.post(`/tasks/${taskId}/assign`, { userId }),
};

// Hierarchy Routes
export const hierarchy = {
  create: (data) => api.post('/hierarchy', data),
  getAll: () => api.get('/hierarchy'),
  update: (id, data) => api.put(`/hierarchy/${id}`, data),
};

// Notification Routes
export const notifications = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Export all API functions
export default api;