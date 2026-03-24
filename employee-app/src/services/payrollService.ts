import api from './api';
import { PayrollRecord } from '../types';
import { Alert, Linking } from 'react-native';
import { API_BASE_URL, TOKEN_KEY } from '../constants/config';
import { storage } from '../utils/storage';

export const payrollService = {
    /**
     * Get my payroll history
     */
    getMyPayroll: async (): Promise<PayrollRecord[]> => {
        const response = await api.get<{ success: boolean; payroll: PayrollRecord[] }>(
            '/payroll/my'
        );
        return response.data.payroll;
    },

    /**
     * Get payroll by ID
     */
    getPayrollById: async (payrollId: string): Promise<PayrollRecord> => {
        const response = await api.get<{ success: boolean; data: PayrollRecord }>(
            `/payroll/${payrollId}`
        );
        return response.data.data;
    },

    /**
     * Download payslip PDF - Opens in browser for download
     */
    downloadPayslip: async (payrollId: string, _fileName: string): Promise<void> => {
        try {
            // Get the auth token
            const token = await storage.getItem(TOKEN_KEY);

            if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please login again.');
                return;
            }

            // NOTE: Token passed as query param for browser-based PDF download.
            // This is a known security trade-off (token in URL/logs/history).
            // Ideally, use a short-lived download token endpoint instead.
            const url = `${API_BASE_URL}/payroll/my/${payrollId}/payslip?token=${encodeURIComponent(token)}`;
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'Download Not Available',
                    'Unable to open the payslip. Please try again later or access it from the web portal.'
                );
            }
        } catch (error) {
            throw new Error('Failed to download payslip');
        }
    },
};
