import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    X,
    Save,
    Calendar,
    Clock,
    MapPin,
    User,
    CheckCircle,
    AlertCircle,
    Zap,
    Terminal,
} from 'lucide-react';
import { developerAPI } from '@/services/api';

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

interface EditAttendanceModalProps {
    record: Attendance | null;
    employees: Employee[];
    isCreate: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditAttendanceModal({
    record,
    employees,
    isCreate,
    onClose,
    onSuccess,
}: EditAttendanceModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [employeeId, setEmployeeId] = useState('');
    const [date, setDate] = useState('');
    const [loginTime, setLoginTime] = useState('');
    const [logoutTime, setLogoutTime] = useState('');
    const [loginLat, setLoginLat] = useState('');
    const [loginLng, setLoginLng] = useState('');
    const [logoutLat, setLogoutLat] = useState('');
    const [logoutLng, setLogoutLng] = useState('');
    const [status, setStatus] = useState('incomplete');

    useEffect(() => {
        if (record && !isCreate) {
            setDate(format(new Date(record.date), 'yyyy-MM-dd'));
            setLoginTime(record.loginTime ? format(new Date(record.loginTime), 'HH:mm') : '');
            setLogoutTime(record.logoutTime ? format(new Date(record.logoutTime), 'HH:mm') : '');
            setLoginLat(record.loginLocation?.latitude?.toString() || '');
            setLoginLng(record.loginLocation?.longitude?.toString() || '');
            setLogoutLat(record.logoutLocation?.latitude?.toString() || '');
            setLogoutLng(record.logoutLocation?.longitude?.toString() || '');
            setStatus(record.status);
        } else {
            // Default date to today for new records
            setDate(format(new Date(), 'yyyy-MM-dd'));
        }
    }, [record, isCreate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isCreate) {
                // Create new record
                if (!employeeId) {
                    setError('Please select an employee');
                    setIsLoading(false);
                    return;
                }

                const createData: Record<string, unknown> = {
                    employeeId,
                    date: new Date(date).toISOString(),
                    status,
                };

                if (loginTime) {
                    const loginDateTime = new Date(date);
                    const [hours, minutes] = loginTime.split(':');
                    loginDateTime.setHours(parseInt(hours), parseInt(minutes));
                    createData.loginTime = loginDateTime.toISOString();
                }

                if (logoutTime) {
                    const logoutDateTime = new Date(date);
                    const [hours, minutes] = logoutTime.split(':');
                    logoutDateTime.setHours(parseInt(hours), parseInt(minutes));
                    createData.logoutTime = logoutDateTime.toISOString();
                }

                if (loginLat && loginLng) {
                    createData.loginLocation = {
                        latitude: parseFloat(loginLat),
                        longitude: parseFloat(loginLng),
                    };
                }

                if (logoutLat && logoutLng) {
                    createData.logoutLocation = {
                        latitude: parseFloat(logoutLat),
                        longitude: parseFloat(logoutLng),
                    };
                }

                await developerAPI.createAttendance(createData as Parameters<typeof developerAPI.createAttendance>[0]);
            } else if (record) {
                // Update existing record
                const updateData: Record<string, unknown> = {
                    date: new Date(date).toISOString(),
                    status,
                };

                if (loginTime) {
                    const loginDateTime = new Date(date);
                    const [hours, minutes] = loginTime.split(':');
                    loginDateTime.setHours(parseInt(hours), parseInt(minutes));
                    updateData.loginTime = loginDateTime.toISOString();
                }

                if (logoutTime) {
                    const logoutDateTime = new Date(date);
                    const [hours, minutes] = logoutTime.split(':');
                    logoutDateTime.setHours(parseInt(hours), parseInt(minutes));
                    updateData.logoutTime = logoutDateTime.toISOString();
                }

                if (loginLat && loginLng) {
                    updateData.loginLocation = {
                        latitude: parseFloat(loginLat),
                        longitude: parseFloat(loginLng),
                    };
                }

                if (logoutLat && logoutLng) {
                    updateData.logoutLocation = {
                        latitude: parseFloat(logoutLat),
                        longitude: parseFloat(logoutLng),
                    };
                }

                await developerAPI.updateAttendance(record._id, updateData as Parameters<typeof developerAPI.updateAttendance>[1]);
            }

            onSuccess();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string } } };
                setError(axiosError.response?.data?.message || 'An error occurred');
            } else {
                setError('An error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-900 border border-cyan-500/30 rounded-xl w-full max-w-lg shadow-2xl shadow-cyan-500/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-cyan-500/20 bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                            <Terminal className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white font-mono">
                                {isCreate ? 'CREATE_RECORD' : 'EDIT_RECORD'}
                            </h2>
                            <p className="text-xs text-gray-500 font-mono">
                                {isCreate ? 'Add new attendance entry' : `ID: ${record?._id.slice(-8)}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-mono">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Employee Selection (only for create) */}
                    {isCreate && (
                        <div>
                            <label className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                                <User className="w-3.5 h-3.5" />
                                EMPLOYEE
                            </label>
                            <select
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select Employee...</option>
                                {employees.map((emp) => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.name} ({emp.employeeId}) - {emp.department}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Employee Info (only for edit) */}
                    {!isCreate && record && (
                        <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                            <p className="text-xs font-mono text-gray-500 mb-1">EMPLOYEE</p>
                            <p className="text-white font-medium">{record.employee?.name}</p>
                            <p className="text-sm font-mono text-cyan-400">{record.employee?.employeeId}</p>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                            <Calendar className="w-3.5 h-3.5" />
                            DATE
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                        />
                    </div>

                    {/* Time Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-mono text-green-400 mb-2">
                                <Clock className="w-3.5 h-3.5" />
                                LOGIN_TIME
                            </label>
                            <input
                                type="time"
                                value={loginTime}
                                onChange={(e) => setLoginTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-mono text-orange-400 mb-2">
                                <Clock className="w-3.5 h-3.5" />
                                LOGOUT_TIME
                            </label>
                            <input
                                type="time"
                                value={logoutTime}
                                onChange={(e) => setLogoutTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-mono text-purple-400 mb-2">
                            <CheckCircle className="w-3.5 h-3.5" />
                            STATUS
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['present', 'incomplete', 'absent'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`px-3 py-2 rounded-lg font-mono text-xs uppercase transition-all ${status === s
                                            ? s === 'present'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                : s === 'incomplete'
                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Login Location */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-mono text-green-400">
                            <MapPin className="w-3.5 h-3.5" />
                            LOGIN_LOCATION
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                step="any"
                                value={loginLat}
                                onChange={(e) => setLoginLat(e.target.value)}
                                placeholder="Latitude"
                                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                            />
                            <input
                                type="number"
                                step="any"
                                value={loginLng}
                                onChange={(e) => setLoginLng(e.target.value)}
                                placeholder="Longitude"
                                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Logout Location */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-mono text-orange-400">
                            <MapPin className="w-3.5 h-3.5" />
                            LOGOUT_LOCATION
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                step="any"
                                value={logoutLat}
                                onChange={(e) => setLogoutLat(e.target.value)}
                                placeholder="Latitude"
                                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                            />
                            <input
                                type="number"
                                step="any"
                                value={logoutLng}
                                onChange={(e) => setLogoutLng(e.target.value)}
                                placeholder="Longitude"
                                className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm hover:border-gray-600 transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-mono text-sm hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <Zap className="w-4 h-4 animate-pulse" />
                                    PROCESSING...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isCreate ? 'CREATE' : 'UPDATE'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
