/**
 * PDF Generator Utility
 * Generates PDF documents for payslips
 */
const PDFDocument = require('pdfkit');
const { formatCurrency } = require('./payrollUtils');

/**
 * Generate a payslip PDF
 * @param {Object} payroll - Payroll document
 * @param {Object} employee - Employee document
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePayslipPDF = (payroll, employee) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Company Header
            doc.fontSize(20).font('Helvetica-Bold').text('IDentix', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('AI-Powered Attendance Management System', { align: 'center' });
            doc.moveDown();

            // Payslip Title
            doc.fontSize(16).font('Helvetica-Bold').text('SALARY SLIP', { align: 'center' });
            doc.fontSize(12).font('Helvetica').text(payroll.monthYear, { align: 'center' });
            doc.moveDown();

            // Divider
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Employee Details Section
            doc.fontSize(12).font('Helvetica-Bold').text('EMPLOYEE DETAILS');
            doc.moveDown(0.5);

            const detailsY = doc.y;
            doc.fontSize(10).font('Helvetica');

            // Left column
            doc.text(`Employee ID: ${employee.employeeId}`, 50, detailsY);
            doc.text(`Name: ${employee.name}`, 50, detailsY + 15);
            doc.text(`Department: ${employee.department || 'N/A'}`, 50, detailsY + 30);
            doc.text(`Designation: ${employee.designation || 'N/A'}`, 50, detailsY + 45);

            // Right column
            doc.text(`Pay Period: ${payroll.monthYear}`, 300, detailsY);
            doc.text(`Working Days: ${payroll.workingDaysInMonth}`, 300, detailsY + 15);
            doc.text(`Days Present: ${payroll.daysPresent}`, 300, detailsY + 30);
            doc.text(`Joining Date: ${employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-IN') : 'N/A'}`, 300, detailsY + 45);

            doc.moveDown(4);

            // Attendance Summary
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica-Bold').text('ATTENDANCE SUMMARY');
            doc.moveDown(0.5);

            const attendanceY = doc.y;
            doc.fontSize(10).font('Helvetica');
            doc.text(`Days Present: ${payroll.daysPresent}`, 50, attendanceY);
            doc.text(`Days Absent: ${payroll.daysAbsent}`, 200, attendanceY);
            doc.text(`Half Days: ${payroll.halfDays}`, 350, attendanceY);
            doc.text(`Paid Leave: ${payroll.paidLeaveDays}`, 50, attendanceY + 15);
            doc.text(`Unpaid Leave: ${payroll.unpaidLeaveDays}`, 200, attendanceY + 15);

            doc.moveDown(2);

            // Earnings and Deductions Table
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Table Header
            const tableY = doc.y;
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('EARNINGS', 50, tableY, { width: 250, align: 'left' });
            doc.text('DEDUCTIONS', 300, tableY, { width: 250, align: 'left' });
            doc.moveDown();

            // Table Content
            doc.fontSize(10).font('Helvetica');
            let earningsY = doc.y;
            let deductionsY = doc.y;

            // Earnings
            doc.text(`Basic Pay`, 50, earningsY);
            doc.text(formatCurrency(payroll.basicPay), 180, earningsY, { width: 70, align: 'right' });
            earningsY += 15;

            doc.text(`HRA`, 50, earningsY);
            doc.text(formatCurrency(payroll.hra), 180, earningsY, { width: 70, align: 'right' });
            earningsY += 15;

            doc.text(`Conveyance`, 50, earningsY);
            doc.text(formatCurrency(payroll.conveyance), 180, earningsY, { width: 70, align: 'right' });
            earningsY += 15;

            doc.text(`Medical Allowance`, 50, earningsY);
            doc.text(formatCurrency(payroll.medicalAllowance), 180, earningsY, { width: 70, align: 'right' });
            earningsY += 15;

            doc.text(`Special Allowance`, 50, earningsY);
            doc.text(formatCurrency(payroll.specialAllowance), 180, earningsY, { width: 70, align: 'right' });
            earningsY += 20;

            // Deductions
            deductionsY = doc.y - 85;
            doc.text(`Fixed Deductions`, 300, deductionsY);
            doc.text(formatCurrency(payroll.fixedDeductions), 430, deductionsY, { width: 70, align: 'right' });
            deductionsY += 15;

            doc.text(`Absent Deduction`, 300, deductionsY);
            doc.text(formatCurrency(payroll.absentDeduction), 430, deductionsY, { width: 70, align: 'right' });
            deductionsY += 15;

            doc.text(`Unpaid Leave Ded.`, 300, deductionsY);
            doc.text(formatCurrency(payroll.unpaidLeaveDeduction), 430, deductionsY, { width: 70, align: 'right' });
            deductionsY += 30;

            // Totals
            doc.y = Math.max(earningsY, deductionsY);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            const totalsY = doc.y;
            doc.font('Helvetica-Bold');
            doc.text(`Gross Salary`, 50, totalsY);
            doc.text(formatCurrency(payroll.grossSalary), 180, totalsY, { width: 70, align: 'right' });

            doc.text(`Total Deductions`, 300, totalsY);
            doc.text(formatCurrency(payroll.totalDeductions), 430, totalsY, { width: 70, align: 'right' });

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Net Salary
            doc.fontSize(14).font('Helvetica-Bold');
            const netY = doc.y;
            doc.text('NET SALARY:', 50, netY);
            doc.text(formatCurrency(payroll.netSalary), 400, netY, { width: 100, align: 'right' });

            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

            // Footer
            doc.moveDown(2);
            doc.fontSize(8).font('Helvetica').fillColor('gray');
            doc.text('This is a computer-generated payslip and does not require a signature.', { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generatePayslipPDF,
};
