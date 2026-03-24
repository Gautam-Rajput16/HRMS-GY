import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Plus, X } from 'lucide-react';
import { leaveAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface LeaveBalance {
    total: number;
    used: number;
    remaining: number;
}

interface LeaveBalanceData {
    year: number;
    casual: LeaveBalance;
    sick: LeaveBalance;
    paid: LeaveBalance;
}

interface LeaveRequest {
    _id: string;
    leaveType: 'casual' | 'sick' | 'paid' | 'unpaid';
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    appliedOn: string;
    rejectionReason?: string;
}

export const LeaveManagement = () => {
    const [balance, setBalance] = useState<LeaveBalanceData | null>(null);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'balance' | 'history'>('balance');

    // Form state
    const [formData, setFormData] = useState({
        leaveType: 'casual' as 'casual' | 'sick' | 'paid' | 'unpaid',
        startDate: '',
        endDate: '',
        reason: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balanceRes, leavesRes] = await Promise.all([
                leaveAPI.getMyBalance(),
                leaveAPI.getMyLeaves({ limit: 20 }),
            ]);
            setBalance(balanceRes.data.balance);
            setLeaves(leavesRes.data.leaves);
        } catch (error) {
            console.error('Failed to fetch leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startDate || !formData.endDate || !formData.reason) {
            alert('Please fill all fields');
            return;
        }
        if (formData.reason.trim().length < 10) {
            alert('Reason must be at least 10 characters long');
            return;
        }
        if (formData.reason.trim().length > 500) {
            alert('Reason cannot exceed 500 characters');
            return;
        }

        try {
            setSubmitting(true);
            await leaveAPI.apply(formData);
            setShowApplyModal(false);
            setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
            fetchData();
            alert('Leave request submitted successfully!');
        } catch (error: any) {
            // Parse backend validation errors
            const errorMessage = error.response?.data?.message || 'Failed to apply for leave';
            const validationErrors = error.response?.data?.errors;

            if (validationErrors && Array.isArray(validationErrors)) {
                // Show first validation error
                const firstError = validationErrors[0];
                alert(firstError.msg || errorMessage);
            } else {
                alert(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this leave request?')) return;

        try {
            await leaveAPI.cancel(id);
            fetchData();
            alert('Leave request cancelled');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to cancel leave');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge variant="success">Approved</Badge>;
            case 'rejected': return <Badge variant="danger">Rejected</Badge>;
            case 'pending': return <Badge variant="warning">Pending</Badge>;
            case 'cancelled': return <Badge variant="default">Cancelled</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    const getLeaveTypeBadge = (type: string) => {
        switch (type) {
            case 'casual': return <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">Casual</Badge>;
            case 'sick': return <Badge variant="default" className="bg-red-100 text-red-700 border-red-200">Sick</Badge>;
            case 'paid': return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">Paid</Badge>;
            case 'unpaid': return <Badge variant="default" className="bg-gray-100 text-gray-700 border-gray-200">Unpaid</Badge>;
            default: return <Badge>{type}</Badge>;
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
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Track your leave balance and history
                    </p>
                </div>
                <Button onClick={() => setShowApplyModal(true)} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Apply for Leave
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-4">
                {(['balance', 'history'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab === 'balance' ? 'Leave Balance' : 'Leave History'}
                    </button>
                ))}
            </div>

            {/* Leave Balance Tab */}
            {activeTab === 'balance' && balance && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Casual Leave Card */}
                    <Card className="shadow-sm border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-blue-700">Casual Leave</h3>
                                <Badge className="bg-blue-600 text-white">{balance.casual.remaining} left</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 mb-3">
                                <span>Total: {balance.casual.total}</span>
                                <span>Used: {balance.casual.used}</span>
                            </div>
                            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${(balance.casual.remaining / balance.casual.total) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sick Leave Card */}
                    <Card className="shadow-sm border border-red-200 bg-gradient-to-br from-red-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-red-700">Sick Leave</h3>
                                <Badge className="bg-red-600 text-white">{balance.sick.remaining} left</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 mb-3">
                                <span>Total: {balance.sick.total}</span>
                                <span>Used: {balance.sick.used}</span>
                            </div>
                            <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full transition-all"
                                    style={{ width: `${(balance.sick.remaining / balance.sick.total) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Paid Leave Card */}
                    <Card className="shadow-sm border border-green-200 bg-gradient-to-br from-green-50 to-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-green-700">Paid Leave</h3>
                                <Badge className="bg-green-600 text-white">{balance.paid.remaining} left</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 mb-3">
                                <span>Total: {balance.paid.total}</span>
                                <span>Used: {balance.paid.used}</span>
                            </div>
                            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: `${(balance.paid.remaining / balance.paid.total) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Leave History Tab */}
            {activeTab === 'history' && (
                <Card className="shadow-sm overflow-hidden border border-gray-200">
                    {leaves.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 m-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Calendar className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No leave requests</h3>
                            <p className="text-gray-500 text-sm mt-1">You haven't applied for any leaves yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {leaves.map(leave => (
                                        <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getLeaveTypeBadge(leave.leaveType)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                                {leave.totalDays}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getStatusBadge(leave.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(leave.appliedOn), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {leave.status === 'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancel(leave._id)}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowApplyModal(false)}>
                    <Card className="w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                Apply for Leave
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowApplyModal(false)} className="h-8 w-8">
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleApply} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                                    <select
                                        value={formData.leaveType}
                                        onChange={e => setFormData({ ...formData, leaveType: e.target.value as any })}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="casual">Casual Leave</option>
                                        <option value="sick">Sick Leave</option>
                                        <option value="paid">Paid Leave</option>
                                        <option value="unpaid">Unpaid Leave</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                                    <textarea
                                        value={formData.reason}
                                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Enter your reason for leave (minimum 10 characters)..."
                                        rows={4}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-500">Minimum 10 characters required</p>
                                        <p className={`text-xs font-medium ${formData.reason.length < 10
                                            ? 'text-red-500'
                                            : formData.reason.length > 500
                                                ? 'text-red-500'
                                                : 'text-green-600'
                                            }`}>
                                            {formData.reason.length}/500 {formData.reason.length >= 10 && formData.reason.length <= 500 && '✓'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowApplyModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Spinner size="sm" className="mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Request'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
