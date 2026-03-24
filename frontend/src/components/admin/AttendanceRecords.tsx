import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import {
    Eye,
    MapPin,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Search,
    X,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { attendanceAPI, employeeAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { LocationMap } from './LocationMap';

interface Employee {
    _id: string;
    employeeId: string;
    name: string;
    email: string;
    department: string;
}

interface AttendanceRecord {
    _id: string;
    employee: Employee;
    date: string;
    loginTime: string | null;
    logoutTime: string | null;
    loginPhoto: string | null;
    logoutPhoto: string | null;
    loginLocation: { latitude: number; longitude: number } | null;
    logoutLocation: { latitude: number; longitude: number } | null;
    loginFaceDetected: boolean;
    logoutFaceDetected: boolean;
    status: 'present' | 'incomplete' | 'absent';
    workingHours: string;
}

export function AttendanceRecords() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employees, setEmployees] = useState<{ _id: string; name: string; employeeId: string }[]>([]);
    const [viewPhoto, setViewPhoto] = useState<string | null>(null);
    const [viewLocation, setViewLocation] = useState<{
        login: { latitude: number; longitude: number } | null;
        logout: { latitude: number; longitude: number } | null;
    } | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [page, selectedDate, selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            const response = await employeeAPI.getAll({ limit: 100 });
            setEmployees(response.data.data.employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const params: { page: number; limit: number; date?: string; employeeId?: string } = { page, limit: 10 };
            if (selectedDate) params.date = selectedDate;
            if (selectedEmployee) params.employeeId = selectedEmployee;

            const response = await attendanceAPI.getAllAttendance(params);
            setRecords(response.data.data.attendance);
            setTotalPages(response.data.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'hh:mm a');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present':
                return <Badge variant="success">Present</Badge>;
            case 'incomplete':
                return <Badge variant="warning">Incomplete</Badge>;
            default:
                return <Badge variant="danger">Absent</Badge>;
        }
    };

    const clearFilters = () => {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setSelectedEmployee('');
        setPage(1);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
                <p className="text-gray-500 mt-1">View and manage employee attendance history</p>
            </div>

            {/* Filters */}
            <Card className="shadow-sm">
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                                    className="w-full h-10 pl-10 pr-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-5 lg:col-span-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Filter by Employee</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    value={selectedEmployee}
                                    onChange={(e) => { setSelectedEmployee(e.target.value); setPage(1); }}
                                    className="w-full h-10 pl-10 pr-10 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
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
                        <div className="md:col-span-3 lg:col-span-3">
                            <Button variant="outline" onClick={clearFilters} className="w-full h-10 hover:bg-gray-50 hover:text-gray-900 border-gray-300 text-gray-700">
                                <X className="w-4 h-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Records Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Spinner size="lg" />
                    <p className="text-gray-500 text-sm mt-3">Loading records...</p>
                </div>
            ) : records.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <>
                    <Card className="shadow-sm overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Login</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Logout</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Face Scan</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map((record) => (
                                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-semibold text-xs border border-primary-100">
                                                        {record.employee.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{record.employee.name}</p>
                                                        <p className="text-xs text-gray-500">{record.employee.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(record.date), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {record.loginPhoto && (
                                                        <div className="w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => setViewPhoto(record.loginPhoto)}>
                                                            <img src={record.loginPhoto} alt="Login" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-green-700">{formatTime(record.loginTime)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {record.logoutPhoto && (
                                                        <div className="w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-gray-200 hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => setViewPhoto(record.logoutPhoto)}>
                                                            <img src={record.logoutPhoto} alt="Logout" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-orange-700">{formatTime(record.logoutTime)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.workingHours}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1.5 align-middle">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium w-fit ${record.loginFaceDetected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                        {record.loginFaceDetected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        IN
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium w-fit ${record.logoutFaceDetected ? 'bg-green-50 text-green-700' :
                                                        record.logoutTime ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {record.logoutFaceDetected ? <CheckCircle2 className="w-3 h-3" /> : record.logoutTime ? <XCircle className="w-3 h-3" /> : null}
                                                        OUT
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {(record.loginLocation || record.logoutLocation) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full"
                                                        onClick={() => setViewLocation({ login: record.loginLocation, logout: record.logoutLocation })}
                                                    >
                                                        <MapPin className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-9 w-9">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-500">
                                Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                            </span>
                            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="h-9 w-9">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Photo Modal */}
            {viewPhoto && createPortal(
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    style={{ zIndex: 9999 }}
                    onClick={() => setViewPhoto(null)}
                >
                    <div
                        className="relative w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Attendance Photo
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewPhoto(null)}
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-2 bg-gray-50 flex justify-center items-center min-h-[400px]">
                            <img
                                src={viewPhoto}
                                alt="Attendance Photo"
                                className="max-w-full max-h-[70vh] w-auto h-auto rounded-lg shadow-sm border border-gray-200"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Location Modal */}
            {viewLocation && (
                <LocationMap loginLocation={viewLocation.login} logoutLocation={viewLocation.logout} onClose={() => setViewLocation(null)} />
            )}
        </div>
    );
}
