import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, UserCheck, UserX, Clock, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { attendanceAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/admin/StatCard';
import { Link } from 'react-router-dom';

interface Stats {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    incompleteToday: number;
}

interface EmployeeWorkingHours {
    _id: string;
    employee: {
        _id: string;
        name: string;
        employeeId: string;
        department: string;
    };
    workingMinutes: number;
    workingHours: string;
    loginTime: string;
    logoutTime: string | null;
    status: string;
}

export function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [employeeWorkingHours, setEmployeeWorkingHours] = useState<EmployeeWorkingHours[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await attendanceAPI.getStats();
            setStats(response.data.data.stats);
            setEmployeeWorkingHours(response.data.data.employeeWorkingHours || []);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchStats();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, <span className="text-primary-600">{user?.name}</span>
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {currentDate}
                    </p>
                </div>
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="w-full sm:w-auto">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Employees" value={stats?.totalEmployees || 0} icon={Users} color="blue" />
                <StatCard title="Present Today" value={stats?.presentToday || 0} icon={UserCheck} color="green" />
                <StatCard title="Absent Today" value={stats?.absentToday || 0} icon={UserX} color="red" />
                <StatCard title="Incomplete" value={stats?.incompleteToday || 0} icon={Clock} color="orange" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Total Working Hours */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                            <Clock className="w-5 h-5 text-primary-600" />
                            Total Working Hours
                        </CardTitle>
                        <Link
                            to="/admin/attendance"
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1 transition-colors"
                        >
                            View All <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {employeeWorkingHours.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-sm">No attendance recorded today</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {employeeWorkingHours.map((record) => (
                                    <div
                                        key={record._id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm shadow-sm">
                                                {record.employee.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 font-medium text-sm">{record.employee.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {record.employee.employeeId} • {record.employee.department || 'No Dept'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:block w-32">
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${record.status === 'present' ? 'bg-green-500' : 'bg-yellow-500'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min((record.workingMinutes / 480) * 100, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-right min-w-[80px]">
                                                <p className="text-sm font-bold text-gray-900">
                                                    {record.workingHours}
                                                </p>
                                                <Badge variant={record.status === 'present' ? 'success' : 'warning'}>
                                                    {record.status === 'present' ? 'Completed' : 'Active'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Today's Overview */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Today's Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-medium">Attendance Rate</span>
                                    <span className="text-gray-900 font-bold">
                                        {stats?.totalEmployees ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${stats?.totalEmployees ? (stats.presentToday / stats.totalEmployees) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-medium">Absent Rate</span>
                                    <span className="text-gray-900 font-bold">
                                        {stats?.totalEmployees ? Math.round((stats.absentToday / stats.totalEmployees) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${stats?.totalEmployees ? (stats.absentToday / stats.totalEmployees) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-1">Present</p>
                                    <p className="text-2xl font-bold text-green-700">{stats?.presentToday || 0}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                                    <p className="text-xs text-red-700 font-bold uppercase tracking-wider mb-1">Absent</p>
                                    <p className="text-2xl font-bold text-red-700">{stats?.absentToday || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link
                                to="/admin/attendance"
                                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-medium text-sm group-hover:text-primary-700">Attendance Records</p>
                                    <p className="text-xs text-gray-500">View logs & history</p>
                                </div>
                            </Link>
                            <Link
                                to="/admin/employees"
                                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-medium text-sm group-hover:text-purple-700">Manage Employees</p>
                                    <p className="text-xs text-gray-500">Add or edit staff</p>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
