import { useState, useEffect } from 'react';

import { DollarSign, TrendingUp, FileText, RefreshCw, Download, CheckCircle, X } from 'lucide-react';
import { payrollAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from './StatCard';

interface PayrollRecord {
    _id: string;
    employee: {
        _id: string;
        name: string;
        employeeId: string;
        department: string;
        designation: string;
    };
    month: number;
    year: number;
    monthYear: string;
    workingDaysInMonth: number;
    daysPresent: number;
    daysAbsent: number;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: 'draft' | 'processed' | 'paid';
}

interface PayrollStats {
    currentMonth: {
        month: number;
        year: number;
        processed: number;
        paid: number;
        totalExpense: number;
    };
    totalPayrolls: number;
    monthlyExpense: Array<{
        _id: { month: number; year: number };
        totalExpense: number;
        count: number;
    }>;
}

export const PayrollDashboard = () => {
    const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
    const [stats, setStats] = useState<PayrollStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [filter, setFilter] = useState({ month: 0, year: 0, status: '' });

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [payrollsRes, statsRes] = await Promise.all([
                payrollAPI.getAll({
                    limit: 50,
                    month: filter.month || undefined,
                    year: filter.year || undefined,
                    status: filter.status || undefined,
                }),
                payrollAPI.getStats(),
            ]);
            setPayrolls(payrollsRes.data.data.payrolls);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch payroll data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const response = await payrollAPI.generate(selectedMonth, selectedYear);
            alert(`Payroll generated for ${response.data.data.processed.length} employees`);
            setShowGenerateModal(false);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setGenerating(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'processed' | 'paid') => {
        try {
            await payrollAPI.updateStatus(id, status);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDownload = async (id: string, name: string, monthYear: string) => {
        try {
            const response = await payrollAPI.downloadPayslip(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip_${name.replace(' ', '_')}_${monthYear.replace(' ', '_')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to download payslip');
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

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Manage employee salaries and payslips
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => fetchData()} disabled={loading} className="w-full sm:w-auto">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowGenerateModal(true)} className="w-full sm:w-auto">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Payroll
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="This Month's Expense"
                        value={formatCurrency(stats.currentMonth.totalExpense)}
                        subtitle={`${months[stats.currentMonth.month - 1]} ${stats.currentMonth.year}`}
                        icon={DollarSign}
                        color="green"
                    />
                    <StatCard
                        title="Processed"
                        value={stats.currentMonth.processed}
                        subtitle="Employees this month"
                        icon={FileText}
                        color="orange"
                    />
                    <StatCard
                        title="Paid"
                        value={stats.currentMonth.paid}
                        subtitle="Salaries disbursed"
                        icon={CheckCircle}
                        color="blue"
                    />
                    <StatCard
                        title="Total Records"
                        value={stats.totalPayrolls}
                        subtitle="All time payrolls"
                        icon={TrendingUp}
                        color="purple"
                    />
                </div>
            )}

            {/* Filters */}
            <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filter.month}
                            onChange={e => setFilter({ ...filter, month: parseInt(e.target.value) })}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[150px]"
                        >
                            <option value={0}>All Months</option>
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={filter.year}
                            onChange={e => setFilter({ ...filter, year: parseInt(e.target.value) })}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[120px]"
                        >
                            <option value={0}>All Years</option>
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <select
                            value={filter.status}
                            onChange={e => setFilter({ ...filter, status: e.target.value })}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white min-w-[130px]"
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="processed">Processed</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Payroll Table */}
            <Card className="shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Spinner size="lg" />
                        <p className="text-gray-500 text-sm mt-3">Loading payroll records...</p>
                    </div>
                ) : payrolls.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 m-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No payroll records</h3>
                        <p className="text-gray-500 text-sm mt-1">Click "Generate Payroll" to create new records</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-semibold text-xs border border-primary-100">
                                                    {payroll.employee.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{payroll.employee.name}</p>
                                                    <p className="text-xs text-gray-500">{payroll.employee.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                                {payroll.status === 'processed' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(payroll._id, 'paid')}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Mark Paid
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(payroll._id, payroll.employee.name, payroll.monthYear)}
                                                >
                                                    <Download className="w-3 h-3 mr-1" />
                                                    PDF
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

            {/* Generate Payroll Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowGenerateModal(false)}>
                    <Card className="w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <FileText className="w-5 h-5 text-primary-600" />
                                Generate Monthly Payroll
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowGenerateModal(false)} className="h-8 w-8">
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <p className="text-sm text-gray-500">
                                This will calculate and generate payroll for all active employees based on their attendance and leave records.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2 font-medium">Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={e => setSelectedMonth(parseInt(e.target.value))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        {months.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-2 font-medium">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        {[2024, 2025, 2026].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowGenerateModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                >
                                    {generating ? (
                                        <>
                                            <Spinner size="sm" className="mr-2" />
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
