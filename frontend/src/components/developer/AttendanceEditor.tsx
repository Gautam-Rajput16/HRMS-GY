import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
    Search,
    Filter,
    Plus,
    Edit3,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    MapPin,
    X,
    Terminal,
    Database,
    AlertTriangle,
    Zap,
} from 'lucide-react';
import { developerAPI } from '@/services/api';
import { Spinner } from '@/components/ui/spinner';
import { EditAttendanceModal } from './EditAttendanceModal';

interface Attendance {
    _id: string;
    employee: {
        _id: string;
        name: string;
        employeeId: string;
        email: string;
        department: string;
        designation: string;
    };
    date: string;
    loginTime: string | null;
    logoutTime: string | null;
    loginLocation: { latitude: number; longitude: number } | null;
    logoutLocation: { latitude: number; longitude: number } | null;
    status: string;
    workingMinutes: number;
}

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
}

interface Pagination {
    current: number;
    pages: number;
    total: number;
}

export function AttendanceEditor() {
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ current: 1, pages: 1, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
    const [isCreateMode, setIsCreateMode] = useState(false);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAttendance = useCallback(async (page = 1) => {
        try {
            const params: Record<string, string | number> = { page, limit: 15 };
            if (searchQuery) params.search = searchQuery;
            if (dateFilter) params.date = dateFilter;
            if (statusFilter) params.status = statusFilter;
            if (employeeFilter) params.employeeId = employeeFilter;

            const response = await developerAPI.getAllAttendance(params);
            setAttendance(response.data.data.attendance);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchQuery, dateFilter, statusFilter, employeeFilter]);

    const fetchEmployees = async () => {
        try {
            const response = await developerAPI.getEmployees();
            setEmployees(response.data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    useEffect(() => {
        fetchAttendance();
        fetchEmployees();
    }, [fetchAttendance]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchAttendance(pagination.current);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        fetchAttendance(1);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setDateFilter('');
        setStatusFilter('');
        setEmployeeFilter('');
        setShowFilters(false);
        setIsLoading(true);
        fetchAttendance(1);
    };

    const handleEdit = (record: Attendance) => {
        setSelectedRecord(record);
        setIsCreateMode(false);
        setShowModal(true);
    };

    const handleCreate = () => {
        setSelectedRecord(null);
        setIsCreateMode(true);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedRecord(null);
        setIsCreateMode(false);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        fetchAttendance(pagination.current);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            await developerAPI.deleteAttendance(deleteId);
            setDeleteId(null);
            fetchAttendance(pagination.current);
        } catch (error) {
            console.error('Error deleting attendance:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatTime = (time: string | null) => {
        if (!time) return '--:--';
        return format(new Date(time), 'HH:mm');
    };

    const formatHours = (minutes: number) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const hasActiveFilters = dateFilter || statusFilter || employeeFilter || searchQuery;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-950">
                <div className="text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-cyan-400 font-mono text-sm animate-pulse">
                        FETCHING_DATA...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 -mx-4 sm:-mx-6 lg:-mx-8 -my-6 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Matrix-style background effect */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,255,136,0.03)_25%,rgba(0,255,136,0.03)_26%,transparent_27%,transparent_74%,rgba(0,255,136,0.03)_75%,rgba(0,255,136,0.03)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(0,255,136,0.03)_25%,rgba(0,255,136,0.03)_26%,transparent_27%,transparent_74%,rgba(0,255,136,0.03)_75%,rgba(0,255,136,0.03)_76%,transparent_77%)] bg-[length:50px_50px]"></div>
                </div>

                {/* Header */}
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                                <Terminal className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                                    Data Editor
                                </span>
                            </div>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                            <span className="text-cyan-400">&gt;</span> Attendance<span className="text-purple-400">_</span>Editor
                        </h1>
                        <p className="text-gray-500 font-mono text-sm mt-1">
                            Manage and edit all attendance records
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            SYNC
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-mono text-sm hover:from-cyan-500 hover:to-purple-500 transition-all shadow-lg shadow-cyan-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            ADD_RECORD
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                    <form onSubmit={handleSearch} className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or employee ID..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-mono text-sm transition-all ${showFilters || hasActiveFilters
                                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                FILTERS
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                )}
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-cyan-600 text-white font-mono text-sm rounded-lg hover:bg-cyan-500 transition-colors"
                            >
                                EXECUTE
                            </button>
                        </div>
                    </form>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="px-4 pb-4 pt-0 border-t border-gray-800 bg-gray-900/50 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1.5">DATE</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="date"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1.5">STATUS</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Status</option>
                                        <option value="present">Present</option>
                                        <option value="incomplete">Incomplete</option>
                                        <option value="absent">Absent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-gray-500 mb-1.5">EMPLOYEE</label>
                                    <select
                                        value={employeeFilter}
                                        onChange={(e) => setEmployeeFilter(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Employees</option>
                                        {employees.map((emp) => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-2 mt-4 text-sm font-mono text-orange-400 hover:text-orange-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    CLEAR_FILTERS
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Records Table */}
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                                <Database className="w-4 h-4 text-cyan-400" />
                            </div>
                            <h2 className="text-sm font-bold text-white font-mono">RECORDS</h2>
                        </div>
                        <p className="text-xs font-mono text-gray-500">
                            {pagination.total} <span className="text-cyan-400">total records</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-800/50 border-b border-gray-700">
                                    <th className="px-4 py-3 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        EMPLOYEE
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        DATE
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        LOGIN
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        LOGOUT
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        HOURS
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        STATUS
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        LOCATION
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                        ACTIONS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {attendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
                                                <Database className="w-8 h-8 text-gray-600" />
                                            </div>
                                            <p className="text-gray-500 font-mono text-sm">NO_RECORDS_FOUND</p>
                                            <p className="text-gray-600 font-mono text-xs mt-1">
                                                Try adjusting your filters
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    attendance.map((record) => (
                                        <tr
                                            key={record._id}
                                            className="group hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                                                        {record.employee?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {record.employee?.name || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs font-mono text-gray-500">
                                                            {record.employee?.employeeId || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-300 font-mono">
                                                    <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                                                    {format(new Date(record.date), 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm font-mono text-gray-300">
                                                    <Clock className="w-3.5 h-3.5 text-green-500" />
                                                    {formatTime(record.loginTime)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 text-sm font-mono text-gray-300">
                                                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                                                    {formatTime(record.logoutTime)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-mono text-gray-300">
                                                    {formatHours(record.workingMinutes)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-mono uppercase ${record.status === 'present'
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                        : record.status === 'incomplete'
                                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {record.loginLocation || record.logoutLocation ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        GPS
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-mono text-gray-600">--</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEdit(record)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(record._id)}
                                                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
                            <p className="text-xs font-mono text-gray-500">
                                Page <span className="text-cyan-400">{pagination.current}</span> of{' '}
                                <span className="text-cyan-400">{pagination.pages}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchAttendance(pagination.current - 1)}
                                    disabled={pagination.current === 1}
                                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => fetchAttendance(pagination.current + 1)}
                                    disabled={pagination.current === pagination.pages}
                                    className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center py-2">
                    <p className="text-xs text-gray-600 font-mono">
                        <span className="text-cyan-500">■</span> DB_EDITOR v2.0 <span className="text-cyan-500">■</span>
                    </p>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <EditAttendanceModal
                    record={selectedRecord}
                    employees={employees}
                    isCreate={isCreateMode}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl shadow-red-500/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white font-mono">CONFIRM_DELETE</h3>
                                <p className="text-sm text-gray-400 font-mono">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-6 font-mono">
                            Are you sure you want to delete this attendance record?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm hover:border-gray-600 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 rounded-lg text-white font-mono text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <Zap className="w-4 h-4 animate-pulse" />
                                        DELETING...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        DELETE
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
