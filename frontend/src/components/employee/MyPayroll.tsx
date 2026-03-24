import { useState, useEffect } from 'react';

import { DollarSign, Download, Eye, TrendingUp, TrendingDown, X, FileText, Calendar } from 'lucide-react';
import { payrollAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface PayrollRecord {
    _id: string;
    month: number;
    year: number;
    monthYear: string;
    workingDaysInMonth: number;
    daysPresent: number;
    daysAbsent: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    baseSalary: number;
    grossSalary: number;
    fixedDeductions: number;
    absentDeduction: number;
    unpaidLeaveDeduction: number;
    totalDeductions: number;
    netSalary: number;
    status: 'draft' | 'processed' | 'paid';
}

export const MyPayroll = () => {
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        fetchPayroll();
    }, []);

    const fetchPayroll = async () => {
        try {
            setLoading(true);
            const response = await payrollAPI.getMyPayroll({ limit: 24 });
            setPayrolls(response.data.payroll);
        } catch (error) {
            console.error('Failed to fetch payroll:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (id: string, monthYear: string) => {
        try {
            setDownloading(id);
            const response = await payrollAPI.downloadMyPayslip(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip_${monthYear.replace(' ', '_')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download payslip:', error);
            alert('Failed to download payslip');
        } finally {
            setDownloading(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <Badge variant="success">Paid</Badge>;
            case 'processed': return <Badge variant="warning">Processed</Badge>;
            case 'draft': return <Badge variant="default">Draft</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Payroll</h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    View your salary history and payslips
                </p>
            </div>

            {/* Summary Cards */}
            {payrolls.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Latest Net Salary */}
                    <Card className="shadow-sm border border-green-200 bg-gradient-to-br from-green-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Latest Net Salary</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(payrolls[0]?.netSalary || 0)}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">{payrolls[0]?.monthYear}</p>
                        </CardContent>
                    </Card>

                    {/* Gross Salary */}
                    <Card className="shadow-sm border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Gross Salary</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(payrolls[0]?.grossSalary || 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Deductions */}
                    <Card className="shadow-sm border border-red-200 bg-gradient-to-br from-red-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <TrendingDown className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Deductions</p>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(payrolls[0]?.totalDeductions || 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Salary History */}
            <Card className="shadow-sm overflow-hidden border border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b border-gray-200">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        Salary History
                    </CardTitle>
                </CardHeader>
                {payrolls.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 m-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No payroll records</h3>
                        <p className="text-gray-500 text-sm mt-1">Your payroll history will appear here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payrolls.map(payroll => (
                                    <tr key={payroll._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {payroll.monthYear}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                            {formatCurrency(payroll.grossSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                            -{formatCurrency(payroll.totalDeductions)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                                            {formatCurrency(payroll.netSalary)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(payroll.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedPayroll(payroll)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(payroll._id, payroll.monthYear)}
                                                    disabled={downloading === payroll._id}
                                                >
                                                    {downloading === payroll._id ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <>
                                                            <Download className="w-4 h-4 mr-1" />
                                                            PDF
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Payslip Detail Modal */}
            {selectedPayroll && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayroll(null)}>
                    <Card className="w-full max-w-xl shadow-2xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <FileText className="w-5 h-5 text-primary-600" />
                                Payslip - {selectedPayroll.monthYear}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedPayroll(null)} className="h-8 w-8">
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            {/* Attendance Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Summary</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Working Days</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedPayroll.workingDaysInMonth}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Present</p>
                                        <p className="text-lg font-semibold text-green-600">{selectedPayroll.daysPresent}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Absent</p>
                                        <p className="text-lg font-semibold text-red-600">{selectedPayroll.daysAbsent}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Earnings */}
                            <div>
                                <h3 className="text-sm font-semibold text-green-700 mb-3">Earnings</h3>
                                <div className="bg-green-50 rounded-xl p-4 space-y-2">
                                    {[
                                        { label: 'Base Salary', value: selectedPayroll.baseSalary },
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between py-1 border-b border-green-100 last:border-0">
                                            <span className="text-sm text-gray-600">{item.label}</span>
                                            <span className="text-sm text-gray-900">{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 font-semibold">
                                        <span className="text-green-700">Gross Salary</span>
                                        <span className="text-green-700">{formatCurrency(selectedPayroll.grossSalary)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div>
                                <h3 className="text-sm font-semibold text-red-700 mb-3">Deductions</h3>
                                <div className="bg-red-50 rounded-xl p-4 space-y-2">
                                    {[
                                        { label: 'Fixed Deductions', value: selectedPayroll.fixedDeductions },
                                        { label: 'Absent Deduction', value: selectedPayroll.absentDeduction },
                                        { label: 'Unpaid Leave Deduction', value: selectedPayroll.unpaidLeaveDeduction },
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between py-1 border-b border-red-100 last:border-0">
                                            <span className="text-sm text-gray-600">{item.label}</span>
                                            <span className="text-sm text-gray-900">-{formatCurrency(item.value)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 font-semibold">
                                        <span className="text-red-700">Total Deductions</span>
                                        <span className="text-red-700">-{formatCurrency(selectedPayroll.totalDeductions)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Salary */}
                            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-5 flex justify-between items-center">
                                <span className="text-lg font-semibold text-primary-800">Net Salary</span>
                                <span className="text-2xl font-bold text-primary-700">{formatCurrency(selectedPayroll.netSalary)}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setSelectedPayroll(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => handleDownload(selectedPayroll._id, selectedPayroll.monthYear)}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
