import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle, XCircle, Users, RefreshCw, X } from 'lucide-react';
import { leaveAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from './StatCard';

interface LeaveRequest {
    _id: string;
    employee: {
        _id: string;
        name: string;
        employeeId: string;
        department: string;
        designation: string;
    };
    leaveType: 'casual' | 'sick' | 'paid' | 'unpaid';
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    appliedOn: string;
    reviewedBy?: { name: string; employeeId: string };
    reviewedOn?: string;
    rejectionReason?: string;
}

interface LeaveStats {
    pending: number;
    approved: number;
    rejected: number;
    onLeaveToday: number;
    totalEmployees: number;
}

export const AdminLeaveManagement = () => {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [stats, setStats] = useState<LeaveStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [leavesRes, statsRes] = await Promise.all([
                filter === 'pending'
                    ? leaveAPI.getPending()
                    : leaveAPI.getAll({ status: filter === 'all' ? undefined : filter, limit: 50 }),
                leaveAPI.getStats(),
            ]);

            setLeaves(filter === 'pending' ? leavesRes.data.data : leavesRes.data.data.leaves);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this leave request?')) return;

        try {
            setProcessing(id);
            await leaveAPI.approve(id);
            fetchData();
            setSelectedLeave(null);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to approve leave');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setProcessing(id);
            await leaveAPI.reject(id, rejectReason);
            fetchData();
            setSelectedLeave(null);
            setRejectReason('');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reject leave');
        } finally {
            setProcessing(null);
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
                    <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Manage employee leave requests
                    </p>
                </div>
                <Button variant="outline" onClick={() => fetchData()} disabled={loading} className="w-full sm:w-auto">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div onClick={() => setFilter('pending')} className="cursor-pointer">
                        <StatCard title="Pending Requests" value={stats.pending} icon={Clock} color="orange" />
                    </div>
                    <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
                    <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
                    <StatCard title="On Leave Today" value={stats.onLeaveToday} icon={Users} color="blue" />
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === tab
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leave Requests Table */}
            <Card className="shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Spinner size="lg" />
                        <p className="text-gray-500 text-sm mt-3">Loading requests...</p>
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 m-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No {filter === 'all' ? '' : filter} requests</h3>
                        <p className="text-gray-500 text-sm mt-1">No leave requests found for this filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leaves.map(leave => (
                                    <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-semibold text-xs border border-primary-100">
                                                    {leave.employee?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{leave.employee?.name || 'Unknown Employee'}</p>
                                                    <p className="text-xs text-gray-500">{leave.employee?.employeeId || 'N/A'} • {leave.employee?.department || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getLeaveTypeBadge(leave.leaveType)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                            {leave.totalDays}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(leave.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedLeave(leave)}>
                                                    View
                                                </Button>
                                                {leave.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(leave._id)}
                                                        disabled={processing === leave._id}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Approve
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Leave Detail Modal */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setSelectedLeave(null); setRejectReason(''); }}>
                    <Card className="w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                Leave Request Details
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedLeave(null); setRejectReason(''); }} className="h-8 w-8">
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Employee Info */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                                        {selectedLeave.employee?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{selectedLeave.employee?.name || 'Unknown Employee'}</p>
                                        <p className="text-sm text-gray-500">{selectedLeave.employee?.employeeId || 'N/A'} • {selectedLeave.employee?.department || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Leave Type</p>
                                    {getLeaveTypeBadge(selectedLeave.leaveType)}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedLeave.totalDays} day(s)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">From</p>
                                    <p className="text-sm text-gray-900">{format(new Date(selectedLeave.startDate), 'MMM d, yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">To</p>
                                    <p className="text-sm text-gray-900">{format(new Date(selectedLeave.endDate), 'MMM d, yyyy')}</p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <p className="text-xs text-gray-500 mb-2">Reason</p>
                                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                                    {selectedLeave.reason}
                                </div>
                            </div>

                            {/* Applied On */}
                            <p className="text-xs text-gray-500">
                                Applied on: {format(new Date(selectedLeave.appliedOn), 'MMM d, yyyy h:mm a')}
                            </p>

                            {/* Actions for Pending */}
                            {selectedLeave.status === 'pending' && (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">Rejection Reason (required to reject)</label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Enter reason for rejection..."
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                            onClick={() => handleReject(selectedLeave._id)}
                                            disabled={processing === selectedLeave._id}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(selectedLeave._id)}
                                            disabled={processing === selectedLeave._id}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Status Display for non-pending */}
                            {selectedLeave.status !== 'pending' && (
                                <div className={`p-4 rounded-xl text-center ${selectedLeave.status === 'approved' ? 'bg-green-50 border border-green-200' :
                                    selectedLeave.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                                        'bg-gray-50 border border-gray-200'
                                    }`}>
                                    <div className="mb-2">{getStatusBadge(selectedLeave.status)}</div>
                                    {selectedLeave.reviewedBy && (
                                        <p className="text-xs text-gray-500">
                                            by {selectedLeave.reviewedBy.name} on {format(new Date(selectedLeave.reviewedOn!), 'MMM d, yyyy')}
                                        </p>
                                    )}
                                    {selectedLeave.rejectionReason && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            Reason: {selectedLeave.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
