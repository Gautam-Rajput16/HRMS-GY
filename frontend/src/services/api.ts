import axios from 'axios';

// API Base URL - uses environment variable or production URL as default
const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://hrms-gy-be.vercel.app/api');

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('identix_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('identix_token');
            localStorage.removeItem('identix_user');
            
            // Do not redirect if already on login page or if the request was a login attempt
            if (window.location.pathname !== '/login' && error.config?.url !== '/auth/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    getProfile: () => api.get('/auth/profile'),
};

// Attendance APIs
export const attendanceAPI = {
    markLogin: (data: {
        photo: string;
        latitude: number;
        longitude: number;
        faceDetected: boolean;
    }) => api.post('/attendance/login', data),

    markLogout: (data: {
        photo: string;
        latitude: number;
        longitude: number;
        faceDetected: boolean;
    }) => api.post('/attendance/logout', data),

    getTodayStatus: () => api.get('/attendance/today-status'),

    getMyAttendance: (params?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    }) => api.get('/attendance/my', { params }),

    getAllAttendance: (params?: {
        page?: number;
        limit?: number;
        date?: string;
        employeeId?: string;
        status?: string;
    }) => api.get('/attendance/all', { params }),

    getStats: () => api.get('/attendance/stats'),
};

// Employee APIs
export const employeeAPI = {
    getAll: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }) => api.get('/employees', { params }),

    getById: (id: string) => api.get(`/employees/${id}`),

    create: (data: {
        employeeId: string;
        name: string;
        email: string;
        password: string;
        department?: string;
        designation?: string;
        phone?: string;
    }) => api.post('/employees', data),

    update: (
        id: string,
        data: {
            name?: string;
            email?: string;
            department?: string;
            designation?: string;
            phone?: string;
            password?: string;
        }
    ) => api.put(`/employees/${id}`, data),

    toggleStatus: (id: string) => api.patch(`/employees/${id}/toggle`),

    delete: (id: string) => api.delete(`/employees/${id}`),
};

// Developer APIs
export const developerAPI = {
    getAllAttendance: (params?: {
        page?: number;
        limit?: number;
        date?: string;
        employeeId?: string;
        status?: string;
        search?: string;
    }) => api.get('/developer/attendance', { params }),

    getAttendanceById: (id: string) => api.get(`/developer/attendance/${id}`),

    createAttendance: (data: {
        employeeId: string;
        date: string;
        loginTime?: string;
        logoutTime?: string;
        loginLocation?: { latitude: number; longitude: number };
        logoutLocation?: { latitude: number; longitude: number };
        status?: string;
    }) => api.post('/developer/attendance', data),

    updateAttendance: (
        id: string,
        data: {
            date?: string;
            loginTime?: string;
            logoutTime?: string;
            loginLocation?: { latitude: number; longitude: number };
            logoutLocation?: { latitude: number; longitude: number };
            status?: string;
        }
    ) => api.put(`/developer/attendance/${id}`, data),

    deleteAttendance: (id: string) => api.delete(`/developer/attendance/${id}`),

    getStats: () => api.get('/developer/stats'),

    getEmployees: () => api.get('/developer/employees'),
};

// Leave APIs
export const leaveAPI = {
    // Employee endpoints
    apply: (data: {
        leaveType: 'casual' | 'sick' | 'paid' | 'unpaid';
        startDate: string;
        endDate: string;
        reason: string;
    }) => api.post('/leaves/apply', data),

    getMyLeaves: (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }) => api.get('/leaves/my', { params }),

    getMyBalance: () => api.get('/leaves/my/balance'),

    cancel: (id: string) => api.delete(`/leaves/${id}/cancel`),

    // HR/Admin endpoints
    getAll: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
    }) => api.get('/leaves', { params }),

    getStats: () => api.get('/leaves/stats'),

    getPending: () => api.get('/leaves/pending'),

    approve: (id: string) => api.patch(`/leaves/${id}/approve`),

    reject: (id: string, reason?: string) =>
        api.patch(`/leaves/${id}/reject`, { reason }),
};

// Payroll APIs
export const payrollAPI = {
    // Employee endpoints
    getMyPayroll: (params?: {
        page?: number;
        limit?: number;
    }) => api.get('/payroll/my', { params }),

    downloadMyPayslip: (id: string) =>
        api.get(`/payroll/my/${id}/payslip`, { responseType: 'blob' }),

    // HR/Admin endpoints
    generate: (month: number, year: number) =>
        api.post('/payroll/generate', { month, year }),

    getAll: (params?: {
        page?: number;
        limit?: number;
        month?: number;
        year?: number;
        status?: string;
        employeeId?: string;
    }) => api.get('/payroll', { params }),

    getById: (id: string) => api.get(`/payroll/${id}`),

    getStats: () => api.get('/payroll/stats'),

    updateStatus: (id: string, status: 'draft' | 'processed' | 'paid') =>
        api.patch(`/payroll/${id}/status`, { status }),

    downloadPayslip: (id: string) =>
        api.get(`/payroll/${id}/payslip`, { responseType: 'blob' }),
};

// Reports APIs
export const reportsAPI = {
    getAttendance: (params: { month: number; year: number; employeeId?: string }) =>
        api.get('/reports/attendance', { params }),

    getLeaves: (params?: { month?: number; year?: number; leaveType?: string }) =>
        api.get('/reports/leaves', { params }),

    getPayroll: (params: { month?: number; year?: number; department?: string }) =>
        api.get('/reports/payroll', { params }),

    exportCSV: (type: 'attendance' | 'leaves' | 'payroll', month: number, year: number) =>
        api.get('/reports/export/csv', {
            params: { type, month, year },
            responseType: 'blob',
        }),
};

export default api;

