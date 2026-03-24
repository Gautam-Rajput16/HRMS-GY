import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LogIn, LogOut, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AttendanceCamera } from '@/components/employee/AttendanceCamera';

interface TodayStatus {
    hasLoggedIn: boolean;
    hasLoggedOut: boolean;
    loginTime: string | null;
    logoutTime: string | null;
    status: string;
    workingHours?: string;
    attendance: {
        loginTime: string;
        logoutTime: string | null;
        workingHours: string;
    } | null;
}

export function EmployeeDashboard() {
    const { user } = useAuth();
    const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showCamera, setShowCamera] = useState<'login' | 'logout' | null>(null);

    useEffect(() => {
        fetchTodayStatus();
    }, []);

    const fetchTodayStatus = async () => {
        try {
            const response = await attendanceAPI.getTodayStatus();
            // Updated to match new backend response structure
            setTodayStatus(response.data.data);
        } catch (error) {
            console.error('Error fetching today status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAttendanceSuccess = () => {
        setShowCamera(null);
        fetchTodayStatus();
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');
    const currentTime = format(new Date(), 'hh:mm a');

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }} className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                        Welcome back, <span style={{ color: '#4f46e5' }}>{user?.name}</span>
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>{currentDate}</p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#4b5563',
                    backgroundColor: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                }}>
                    <Clock style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
                    <span style={{ fontWeight: 500 }}>{currentTime}</span>
                </div>
            </div>

            {/* Today's Attendance Card */}
            <Card style={{ marginBottom: '24px' }}>
                <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                        <CardTitle>Today's Attendance</CardTitle>
                    </div>
                    <CardDescription>
                        {todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut
                            ? "You've completed today's attendance"
                            : todayStatus?.hasLoggedIn
                                ? "Don't forget to logout before leaving"
                                : 'Mark your attendance to start the day'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Login Card */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${todayStatus?.hasLoggedIn ? '#bbf7d0' : '#e5e7eb'}`,
                            backgroundColor: todayStatus?.hasLoggedIn ? '#f0fdf4' : 'white',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: todayStatus?.hasLoggedIn ? '#dcfce7' : '#f3f4f6',
                                    color: todayStatus?.hasLoggedIn ? '#16a34a' : '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <LogIn style={{ width: '20px', height: '20px' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Login</p>
                                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                                        {todayStatus?.loginTime
                                            ? format(new Date(todayStatus.loginTime), 'hh:mm a')
                                            : '--:--'}
                                    </p>
                                </div>
                            </div>
                            {todayStatus?.hasLoggedIn ? (
                                <Badge variant="success" style={{ width: '100%', justifyContent: 'center', padding: '6px' }}>
                                    <CheckCircle2 style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                    Logged In
                                </Badge>
                            ) : (
                                <Button className="w-full" variant="success" onClick={() => setShowCamera('login')}>
                                    <LogIn className="w-4 h-4" />
                                    Mark Login
                                </Button>
                            )}
                        </div>

                        {/* Logout Card */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${todayStatus?.hasLoggedOut ? '#fed7aa' : todayStatus?.hasLoggedIn ? '#e5e7eb' : '#f3f4f6'}`,
                            backgroundColor: todayStatus?.hasLoggedOut ? '#fff7ed' : todayStatus?.hasLoggedIn ? 'white' : '#f9fafb',
                            opacity: todayStatus?.hasLoggedIn ? 1 : 0.6,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: todayStatus?.hasLoggedOut ? '#ffedd5' : '#f3f4f6',
                                    color: todayStatus?.hasLoggedOut ? '#ea580c' : '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <LogOut style={{ width: '20px', height: '20px' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Logout</p>
                                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                                        {todayStatus?.logoutTime
                                            ? format(new Date(todayStatus.logoutTime), 'hh:mm a')
                                            : '--:--'}
                                    </p>
                                </div>
                            </div>
                            {todayStatus?.hasLoggedOut ? (
                                <Badge variant="warning" style={{ width: '100%', justifyContent: 'center', padding: '6px' }}>
                                    <CheckCircle2 style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                    Logged Out
                                </Badge>
                            ) : todayStatus?.hasLoggedIn ? (
                                <Button className="w-full" onClick={() => setShowCamera('logout')}>
                                    <LogOut className="w-4 h-4" />
                                    Mark Logout
                                </Button>
                            ) : (
                                <Button className="w-full" disabled variant="secondary">
                                    <AlertCircle className="w-4 h-4" />
                                    Login First
                                </Button>
                            )}
                        </div>

                        {/* Working Hours Card */}
                        <div style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `2px solid ${todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut ? '#bfdbfe' : '#e5e7eb'}`,
                            backgroundColor: todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut ? '#eff6ff' : 'white',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut ? '#dbeafe' : '#f3f4f6',
                                    color: todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut ? '#2563eb' : '#9ca3af',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Clock style={{ width: '20px', height: '20px' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Working Hours</p>
                                    <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                                        {todayStatus?.attendance?.workingHours || '0h 0m'}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant={
                                    todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut
                                        ? 'success'
                                        : todayStatus?.hasLoggedIn
                                            ? 'warning'
                                            : 'secondary'
                                }
                                style={{ width: '100%', justifyContent: 'center', padding: '6px' }}
                            >
                                {todayStatus?.hasLoggedIn && todayStatus?.hasLoggedOut
                                    ? 'Completed'
                                    : todayStatus?.hasLoggedIn
                                        ? 'In Progress'
                                        : 'Not Started'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: '16px' }}>Employee Information</CardTitle>
                    </CardHeader>
                    <CardContent style={{ paddingTop: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 gap-1">
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>Employee ID</span>
                                <span style={{ color: '#111827', fontWeight: 500, fontSize: '14px' }}>{user?.employeeId}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 gap-1">
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>Email</span>
                                <span style={{ color: '#111827', fontSize: '14px' }}>{user?.email}</span>
                            </div>
                            {user?.department && (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 gap-1">
                                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Department</span>
                                    <span style={{ color: '#111827', fontSize: '14px' }}>{user.department}</span>
                                </div>
                            )}
                            {user?.designation && (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-1">
                                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Designation</span>
                                    <span style={{ color: '#111827', fontSize: '14px' }}>{user.designation}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle style={{ fontSize: '16px' }}>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent style={{ paddingTop: 0 }}>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#4b5563' }}>
                                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                                <span>Position your face clearly in the camera frame</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#4b5563' }}>
                                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                                <span>Photo will be captured automatically when face is detected</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#4b5563' }}>
                                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                                <span>Ensure good lighting for better detection</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: '#4b5563' }}>
                                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                                <span>Location access is required for attendance</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <AttendanceCamera
                    type={showCamera}
                    onSuccess={handleAttendanceSuccess}
                    onCancel={() => setShowCamera(null)}
                />
            )}
        </div>
    );
}
