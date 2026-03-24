/**
 * Validation utility functions
 */

export const validators = {
    /**
     * Validate email format
     */
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate required field
     */
    isRequired: (value: string): boolean => {
        return value.trim().length > 0;
    },

    /**
     * Validate minimum length
     */
    minLength: (value: string, min: number): boolean => {
        return value.trim().length >= min;
    },

    /**
     * Validate maximum length
     */
    maxLength: (value: string, max: number): boolean => {
        return value.trim().length <= max;
    },

    /**
     * Validate password (min 6 characters)
     */
    isValidPassword: (password: string): boolean => {
        return password.length >= 6;
    },

    /**
     * Validate date range (end >= start)
     */
    isValidDateRange: (startDate: Date, endDate: Date): boolean => {
        return endDate >= startDate;
    },
};

/**
 * Get validation error message
 */
export const getValidationError = (fieldName: string, rule: string, minMax?: number): string => {
    const messages: Record<string, string> = {
        required: `${fieldName} is required`,
        email: 'Please enter a valid email address',
        minLength: `${fieldName} must be at least ${minMax} characters`,
        maxLength: `${fieldName} cannot exceed ${minMax} characters`,
        password: 'Password must be at least 6 characters',
        dateRange: 'End date must be after start date',
    };
    return messages[rule] || 'Invalid input';
};
