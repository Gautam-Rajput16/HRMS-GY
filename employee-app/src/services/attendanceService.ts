import api from './api';
import { AttendanceRecord, TodayStatus, AttendanceMarkPayload } from '../types';

export interface QRAttendancePayload {
    qrCode: string;
    latitude: number;
    longitude: number;
}

export const attendanceService = {
    /**
     * Mark attendance login (punch in) — Face mode
     */
    markLogin: async (payload: AttendanceMarkPayload): Promise<AttendanceRecord> => {
        const response = await api.post<{ success: boolean; data: AttendanceRecord }>(
            '/attendance/login',
            payload
        );
        return response.data.data;
    },

    /**
     * Mark attendance logout (punch out) — Face mode
     */
    markLogout: async (payload: AttendanceMarkPayload): Promise<AttendanceRecord> => {
        const response = await api.post<{ success: boolean; data: AttendanceRecord }>(
            '/attendance/logout',
            payload
        );
        return response.data.data;
    },

    /**
     * Mark attendance login (punch in) — QR mode
     */
    qrMarkLogin: async (payload: QRAttendancePayload): Promise<AttendanceRecord> => {
        const response = await api.post<{ success: boolean; data: AttendanceRecord }>(
            '/attendance/qr-login',
            payload
        );
        return response.data.data;
    },

    /**
     * Mark attendance logout (punch out) — QR mode
     */
    qrMarkLogout: async (payload: QRAttendancePayload): Promise<AttendanceRecord> => {
        const response = await api.post<{ success: boolean; data: AttendanceRecord }>(
            '/attendance/qr-logout',
            payload
        );
        return response.data.data;
    },

    /**
     * Get today's attendance status
     */
    getTodayStatus: async (): Promise<TodayStatus> => {
        const response = await api.get<{ success: boolean; data: TodayStatus }>(
            '/attendance/today-status'
        );
        return response.data.data;
    },

    /**
     * Get my attendance history
     */
    getMyAttendance: async (): Promise<AttendanceRecord[]> => {
        const response = await api.get<{ success: boolean; attendance: AttendanceRecord[] }>(
            '/attendance/my',
            { params: { limit: 9999 } }
        );
        return response.data.attendance;
    },
};

