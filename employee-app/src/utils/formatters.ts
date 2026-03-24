import { format, parseISO, differenceInDays, isValid } from 'date-fns';

/**
 * Format a date string to display format
 */
export const formatDate = (dateString: string | Date, formatStr: string = 'dd MMM yyyy'): string => {
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        if (!isValid(date)) return 'Invalid Date';
        return format(date, formatStr);
    } catch {
        return 'Invalid Date';
    }
};

/**
 * Format time from ISO string
 */
export const formatTime = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        if (!isValid(date)) return '--:--';
        return format(date, 'hh:mm a');
    } catch {
        return '--:--';
    }
};

/**
 * Format currency (INR)
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format working hours from minutes
 */
export const formatWorkingHours = (minutes: number): string => {
    if (minutes <= 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (startDate: string, endDate: string): number => {
    try {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return differenceInDays(end, start) + 1;
    } catch {
        return 0;
    }
};

/**
 * Get month name from month number
 */
export const getMonthName = (month: number): string => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
};

/**
 * Format month-year display
 */
export const formatMonthYear = (month: number, year: number): string => {
    return `${getMonthName(month)} ${year}`;
};
