/**
 * Payroll Utility Functions
 * Helper functions for salary and payroll calculations
 */

/**
 * Get the number of working days in a month (excluding Sundays)
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {number} Number of working days
 */
const getWorkingDaysInMonth = (month, year) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        // Exclude only Sundays (0), meaning Saturdays (6) are considered working days
        if (dayOfWeek !== 0) {
            workingDays++;
        }
    }

    return workingDays;
};

/**
 * Get the start and end date of a month
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {{ startDate: Date, endDate: Date }}
 */
const getMonthDateRange = (month, year) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
};

/**
 * Calculate gross salary from salary structure
 * @param {Object} salaryStructure - Employee's salary structure
 * @returns {number} Gross salary
 */
const calculateGrossSalary = (salaryStructure) => {
    return salaryStructure?.baseSalary || 0;
};

/**
 * Calculate per day salary
 * @param {number} grossSalary - Total gross salary
 * @param {number} workingDays - Number of working days in month
 * @returns {number} Per day salary
 */
const calculatePerDaySalary = (grossSalary, workingDays) => {
    if (workingDays === 0) return 0;
    return Math.round(grossSalary / workingDays);
};

/**
 * Calculate payroll for an employee
 * @param {Object} employee - Employee document with salary structure
 * @param {Object} attendanceSummary - Attendance summary for the month
 * @param {Object} leaveSummary - Leave summary for the month
 * @param {number} workingDaysInMonth - Total working days in the month
 * @returns {Object} Payroll calculation result
 */
const calculatePayroll = (employee, attendanceSummary, leaveSummary, workingDaysInMonth) => {
    const { salaryStructure } = employee;

    // Extract salary components
    const baseSalary = salaryStructure?.baseSalary || 0;
    const fixedDeductions = 0; // Fixed deductions are no longer used in the simple logic

    // Calculate gross salary
    const grossSalary = calculateGrossSalary(salaryStructure);

    // Per day salary
    const perDaySalary = calculatePerDaySalary(grossSalary, workingDaysInMonth);

    // Attendance details
    const daysPresent = attendanceSummary.present || 0;
    const halfDays = attendanceSummary.halfDays || 0;

    // Leave details
    const paidLeaveDays = leaveSummary.paidLeaveDays || 0;
    const unpaidLeaveDays = leaveSummary.unpaidLeaveDays || 0;

    // Calculate effective working days
    const effectivePresent = daysPresent + paidLeaveDays - (halfDays * 0.5);
    const daysAbsent = Math.max(0, workingDaysInMonth - effectivePresent - unpaidLeaveDays);

    // Calculate deductions
    const absentDeduction = Math.round(daysAbsent * perDaySalary);
    const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * perDaySalary);
    const totalDeductions = fixedDeductions + absentDeduction + unpaidLeaveDeduction;

    // Calculate net salary
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
        baseSalary,
        grossSalary,
        fixedDeductions,
        absentDeduction,
        unpaidLeaveDeduction,
        totalDeductions,
        netSalary,
        workingDaysInMonth,
        daysPresent,
        daysAbsent,
        paidLeaveDays,
        unpaidLeaveDays,
        halfDays,
        perDaySalary,
    };
};

/**
 * Format currency for display (Indian Rupees)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

module.exports = {
    getWorkingDaysInMonth,
    getMonthDateRange,
    calculateGrossSalary,
    calculatePerDaySalary,
    calculatePayroll,
    formatCurrency,
};
