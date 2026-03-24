import api from './api';
import { LeaveRecord, LeaveBalance, ApplyLeavePayload } from '../types';

export const leaveService = {
    /**
     * Apply for leave
     */
    applyLeave: async (payload: ApplyLeavePayload): Promise<LeaveRecord> => {
        const response = await api.post<{ success: boolean; data: LeaveRecord }>(
            '/leaves/apply',
            payload
        );
        return response.data.data;
    },

    /**
     * Get my leave requests
     */
    getMyLeaves: async (): Promise<LeaveRecord[]> => {
        const response = await api.get<{ success: boolean; leaves: LeaveRecord[] }>(
            '/leaves/my',
            { params: { limit: 9999 } } // Fetch all records
        );
        return response.data.leaves;
    },

    /**
     * Get my leave balance
     */
    getMyLeaveBalance: async (): Promise<LeaveBalance> => {
        const response = await api.get<{ success: boolean; balance: LeaveBalance }>(
            '/leaves/my/balance'
        );
        return response.data.balance;
    },

    /**
     * Cancel a pending leave request
     */
    cancelLeave: async (leaveId: string): Promise<void> => {
        await api.delete(`/leaves/${leaveId}/cancel`);
    },
};
