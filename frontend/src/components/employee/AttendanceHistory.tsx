import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface AttendanceRecord {
    _id: string;
    date: string;
    loginTime: string | null;
    logoutTime: string | null;
    status: 'present' | 'incomplete' | 'absent';
    workingMinutes: number;
    workingHours: string;
}

export function AttendanceHistory() {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchAttendance();
    }, [page]);

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const response = await attendanceAPI.getMyAttendance({ page, limit: 10 });
            // Updated to match new backend response structure
            setAttendance(response.data.attendance);
            setTotalPages(response.data.pagination.pages);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'hh:mm a');
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'EEE, MMM d, yyyy');
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

    if (isLoading && attendance.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }} className="animate-fade-in">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Attendance History</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>View your attendance records</p>
            </div>

            {attendance.length === 0 ? (
                <Card>
                    <CardContent style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <Calendar style={{ width: '32px', height: '32px', color: '#9ca3af' }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#111827' }}>No attendance records</h3>
                        <p style={{ color: '#6b7280', marginTop: '4px' }}>Your attendance history will appear here</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login Time</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logout Time</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Hours</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((record, index) => (
                                        <tr key={record._id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: index % 2 === 1 ? '#fafafa' : 'white' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                                                    <span style={{ color: '#111827', fontWeight: 500, fontSize: '14px' }}>{formatDate(record.date)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                                                    <span style={{ color: '#4b5563', fontSize: '14px' }}>{formatTime(record.loginTime)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Clock style={{ width: '16px', height: '16px', color: '#f97316' }} />
                                                    <span style={{ color: '#4b5563', fontSize: '14px' }}>{formatTime(record.logoutTime)}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ color: '#111827', fontWeight: 500, fontSize: '14px' }}>{record.workingHours}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>{getStatusBadge(record.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-9 w-9">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                Page <span style={{ fontWeight: 500, color: '#111827' }}>{page}</span> of <span style={{ fontWeight: 500, color: '#111827' }}>{totalPages}</span>
                            </span>
                            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="h-9 w-9">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
