import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { payrollService } from '../services/payrollService';
import { TodayStatus, LeaveBalance, PayrollRecord, AttendanceRecord } from '../types';
import { formatCurrency, formatTime } from '../utils/formatters';
import { getErrorMessage } from '../services/api';

const { width } = Dimensions.get('window');

interface DashboardData {
    todayStatus: TodayStatus | null;
    leaveBalance: LeaveBalance | null;
    latestPayroll: PayrollRecord | null;
    presentDays: number;
    totalWorkingDays: number;
    loading: boolean;
    error: string | null;
}

export const DashboardScreen: React.FC = () => {
    const { user } = useAuth();
    const { colors, mode, cycleMode } = useTheme();
    const navigation = useNavigation<any>();
    const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
    const [data, setData] = useState<DashboardData>({
        todayStatus: null,
        leaveBalance: null,
        latestPayroll: null,
        presentDays: 0,
        totalWorkingDays: 22,
        loading: true,
        error: null,
    });
    const [refreshing, setRefreshing] = useState(false);

    // Live clock
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setData((prev) => ({ ...prev, loading: !refreshing, error: null }));

            const [todayStatus, leaveBalance, payrollList, attendanceList] = await Promise.all([
                attendanceService.getTodayStatus().catch(() => null),
                leaveService.getMyLeaveBalance().catch(() => null),
                payrollService.getMyPayroll().catch(() => []),
                attendanceService.getMyAttendance().catch(() => []),
            ]);

            // Calculate present days this month
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const records = attendanceList || [];
            const presentDays = records.filter((r: AttendanceRecord) => {
                const d = new Date(r.date);
                return d.getMonth() === currentMonth &&
                    d.getFullYear() === currentYear &&
                    (r.status === 'present' || r.status === 'incomplete');
            }).length;

            // Working days in current month
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            let workingDays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                const day = new Date(currentYear, currentMonth, d).getDay();
                if (day !== 0) workingDays++;
            }

            const sortedPayroll = payrollList || [];
            setData({
                todayStatus: todayStatus,
                leaveBalance: leaveBalance,
                latestPayroll: sortedPayroll.length > 0 ? sortedPayroll[0] : null,
                presentDays,
                totalWorkingDays: workingDays,
                loading: false,
                error: null,
            });
        } catch (err) {
            setData((prev) => ({ ...prev, loading: false, error: getErrorMessage(err) }));
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData().finally(() => setRefreshing(false));
    };

    const getTotalLeaveBalance = (): number => {
        if (!data.leaveBalance) return 0;
        return (
            (data.leaveBalance.casual?.remaining || 0) +
            (data.leaveBalance.sick?.remaining || 0) +
            (data.leaveBalance.paid?.remaining || 0)
        );
    };

    const getStatusLabel = (): string => {
        if (!data.todayStatus) return 'Not Punched In';
        if (data.todayStatus.hasLoggedOut) return 'Completed';
        if (data.todayStatus.hasLoggedIn) return 'Punched In';
        return 'Not Punched In';
    };

    const getStatusColor = (): string => {
        if (!data.todayStatus) return colors.warning;
        if (data.todayStatus.hasLoggedOut) return colors.success;
        if (data.todayStatus.hasLoggedIn) return colors.primary;
        return colors.warning;
    };

    const getPunchLabel = (): string => {
        if (!data.todayStatus) return 'Punch In';
        if (data.todayStatus.hasLoggedOut) return 'Completed';
        if (data.todayStatus.hasLoggedIn) return 'Punch Out';
        return 'Punch In';
    };

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = (hours % 12 || 12).toString();

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

    const attendancePercent = data.totalWorkingDays > 0
        ? Math.round((data.presentDays / data.totalWorkingDays) * 100)
        : 0;

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            paddingHorizontal: Spacing.md,
            paddingBottom: Spacing.xxl,
        },

        // Header
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Spacing.md,
            marginBottom: Spacing.lg,
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatar: {
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.sm,
        },
        avatarText: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textInverse,
        },
        headerInfo: {
            justifyContent: 'center',
        },
        welcomeLabel: {
            fontSize: 11,
            fontWeight: Typography.fontWeights.semibold,
            color: colors.primary,
            letterSpacing: 0.8,
        },
        userName: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
        },
        themeToggleBtn: {
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            ...Shadows.sm,
        },

        // Section Header
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.sm,
        },
        sectionTitle: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
        },
        sectionDate: {
            fontSize: Typography.fontSizes.sm,
            color: colors.textSecondary,
        },

        // Attendance Card
        attendanceCard: {
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.lg,
            marginBottom: Spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            ...Shadows.sm,
        },
        attendanceTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.sm,
        },
        statusRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        statusDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: 8,
        },
        statusLabel: {
            fontSize: Typography.fontSizes.sm,
            fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary,
        },
        liveTimeBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primaryTint,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: BorderRadius.full,
        },
        liveTimeText: {
            fontSize: 11,
            fontWeight: Typography.fontWeights.bold,
            color: colors.primary,
            letterSpacing: 0.5,
        },
        timeRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
            marginBottom: 4,
        },
        timeHours: {
            fontSize: 48,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
            letterSpacing: -1,
        },
        timePeriod: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.medium,
            color: colors.textMuted,
            marginLeft: 6,
        },
        shiftText: {
            fontSize: Typography.fontSizes.sm,
            color: colors.textMuted,
            marginBottom: Spacing.md,
        },

        // Punch Info Row
        punchInfoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            marginBottom: Spacing.md,
        },
        punchInfoItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        punchInfoDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            marginRight: 8,
        },
        punchInfoLabel: {
            fontSize: Typography.fontSizes.xs,
            color: colors.textMuted,
        },
        punchInfoTime: {
            fontSize: Typography.fontSizes.md,
            fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary,
        },
        punchInfoDivider: {
            width: 1,
            height: 30,
            backgroundColor: colors.border,
            marginHorizontal: Spacing.sm,
        },

        // Punch Button
        punchButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            borderRadius: BorderRadius.xl,
            height: 52,
            shadowColor: colors.shadowColor,
            ...Shadows.md,
        },
        punchButtonCompleted: {
            backgroundColor: colors.success,
            opacity: 0.8,
        },
        punchText: {
            fontSize: Typography.fontSizes.md,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textInverse,
            marginLeft: 10,
        },

        // Stats Row
        statsRow: {
            flexDirection: 'row',
            marginBottom: Spacing.md,
        },
        statCard: {
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.md,
            marginHorizontal: 4,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            ...Shadows.sm,
        },
        statHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.sm,
        },
        statIconBg: {
            width: 36,
            height: 36,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        statPercentBadge: {
            backgroundColor: colors.successLight,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: BorderRadius.full,
        },
        statPercentText: {
            fontSize: 11,
            fontWeight: Typography.fontWeights.bold,
            color: colors.success,
        },
        statLabel: {
            fontSize: Typography.fontSizes.sm,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        statValueRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
        },
        statValueHighlight: {
            fontSize: Typography.fontSizes.xxl,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
        },
        statValueTotal: {
            fontSize: Typography.fontSizes.md,
            color: colors.textMuted,
        },
        statSubText: {
            fontSize: Typography.fontSizes.xs,
            color: colors.textMuted,
            marginTop: 2,
        },
        progressBar: {
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            marginTop: Spacing.sm,
            overflow: 'hidden',
        },
        progressFill: {
            height: 4,
            backgroundColor: colors.primary,
            borderRadius: 2,
        },

        // Payroll
        payrollTitle: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
            marginBottom: Spacing.sm,
        },
        payrollCard: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.md,
            marginBottom: Spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadowColor,
            ...Shadows.sm,
        },
        payrollLeft: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        payrollIconBg: {
            width: 42,
            height: 42,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.sm,
        },
        payrollLabel: {
            fontSize: Typography.fontSizes.sm,
            color: colors.textSecondary,
        },
        payrollAmount: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
        },

        // Quick Actions
        quickActionsTitle: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
            marginBottom: Spacing.sm,
        },
        quickActionsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
        },
        quickAction: {
            width: (width - Spacing.md * 2 - 24) / 4,
            alignItems: 'center',
            marginHorizontal: 4,
            marginBottom: Spacing.md,
        },
        quickActionIcon: {
            width: 52,
            height: 52,
            borderRadius: BorderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
        },
        quickActionLabel: {
            fontSize: 11,
            fontWeight: Typography.fontWeights.medium,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 14,
        },
        // Modal Styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: BorderRadius.xl,
            borderTopRightRadius: BorderRadius.xl,
            padding: Spacing.xl,
            paddingBottom: Spacing.xxl,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.md,
        },
        modalTitle: {
            fontSize: Typography.fontSizes.xl,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
        },
        modalSubtitle: {
            fontSize: Typography.fontSizes.md,
            color: colors.textSecondary,
            marginBottom: Spacing.xl,
        },
        modalOptionsContainer: {
            flexDirection: 'row',
            gap: Spacing.md,
        },
        modalOptionCard: {
            flex: 1,
            borderWidth: 1,
            borderRadius: BorderRadius.xl,
            padding: Spacing.lg,
            alignItems: 'center',
            ...Shadows.sm,
        },
        modalIconContainer: {
            width: 64,
            height: 64,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.md,
        },
        modalOptionTitle: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary,
            marginBottom: 4,
        },
        modalOptionDesc: {
            fontSize: Typography.fontSizes.sm,
            color: colors.textSecondary,
            textAlign: 'center',
        },
    }), [colors]);

    if (data.loading && !refreshing) {
        return <LoadingSpinner fullScreen message="Loading dashboard..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
                            <Text style={styles.userName}>{user?.name || 'Employee'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.themeToggleBtn} onPress={cycleMode} activeOpacity={0.7}>
                        <Ionicons
                            name={mode === 'dark' ? 'moon' : mode === 'light' ? 'sunny' : 'phone-portrait-outline'}
                            size={20}
                            color={mode === 'dark' ? '#A78BFA' : mode === 'light' ? '#F59E0B' : colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Today's Attendance Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Attendance</Text>
                    <Text style={styles.sectionDate}>{formattedDate}</Text>
                </View>

                {/* Attendance Card */}
                <View style={styles.attendanceCard}>
                    {/* Status Row */}
                    <View style={styles.attendanceTop}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                            <Text style={styles.statusLabel}>{getStatusLabel()}</Text>
                        </View>
                        <View style={styles.liveTimeBadge}>
                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                            <Text style={styles.liveTimeText}> LIVE</Text>
                        </View>
                    </View>

                    {/* Clock */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeHours}>{displayHours}:{minutes}</Text>
                        <Text style={styles.timePeriod}>{period}</Text>
                    </View>

                    <Text style={styles.shiftText}>
                        <Feather name="clock" size={12} color={colors.textMuted} /> Shift: 09:00 AM - 06:00 PM
                    </Text>

                    {/* Punch In/Out Row */}
                    <View style={styles.punchInfoRow}>
                        <View style={styles.punchInfoItem}>
                            <View style={[styles.punchInfoDot, { backgroundColor: colors.success }]} />
                            <View>
                                <Text style={styles.punchInfoLabel}>Punch In</Text>
                                <Text style={styles.punchInfoTime}>
                                    {data.todayStatus?.loginTime ? formatTime(data.todayStatus.loginTime) : '--:--'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.punchInfoDivider} />
                        <View style={styles.punchInfoItem}>
                            <View style={[styles.punchInfoDot, { backgroundColor: colors.error }]} />
                            <View>
                                <Text style={styles.punchInfoLabel}>Punch Out</Text>
                                <Text style={styles.punchInfoTime}>
                                    {data.todayStatus?.logoutTime ? formatTime(data.todayStatus.logoutTime) : '--:--'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Punch Button */}
                    <TouchableOpacity
                        style={[
                            styles.punchButton,
                            data.todayStatus?.hasLoggedOut && styles.punchButtonCompleted,
                        ]}
                        disabled={data.todayStatus?.hasLoggedOut === true}
                        onPress={() => setAttendanceModalVisible(true)}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name={data.todayStatus?.hasLoggedOut ? 'checkmark-circle' : 'finger-print'}
                            size={20}
                            color={colors.textInverse}
                        />
                        <Text style={styles.punchText}>{getPunchLabel()}</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {/* Attendance Stats */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIconBg, { backgroundColor: colors.primaryTint }]}>
                                <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.statPercentBadge}>
                                <Text style={styles.statPercentText}>+{attendancePercent}%</Text>
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Attendance</Text>
                        <View style={styles.statValueRow}>
                            <Text style={styles.statValueHighlight}>{data.presentDays}</Text>
                            <Text style={styles.statValueTotal}>/{data.totalWorkingDays}</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${Math.min(attendancePercent, 100)}%` },
                                ]}
                            />
                        </View>
                    </View>

                    {/* Leave Balance Stats */}
                    <View style={styles.statCard}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIconBg, { backgroundColor: colors.accentTint }]}>
                                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
                            </View>
                        </View>
                        <Text style={styles.statLabel}>Leave Bal.</Text>
                        <View style={styles.statValueRow}>
                            <Text style={styles.statValueHighlight}>{getTotalLeaveBalance()}</Text>
                            <Text style={styles.statValueTotal}> Days</Text>
                        </View>
                        <Text style={styles.statSubText}>Leave</Text>
                    </View>
                </View>

                {/* Payroll Section */}
                <Text style={styles.payrollTitle}>Payroll</Text>
                <TouchableOpacity
                    style={styles.payrollCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Payroll')}
                >
                    <View style={styles.payrollLeft}>
                        <View style={[styles.payrollIconBg, { backgroundColor: colors.primaryTint }]}>
                            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.payrollLabel}>Latest Salary</Text>
                            <Text style={styles.payrollAmount}>
                                {data.latestPayroll ? formatCurrency(data.latestPayroll.netSalary) : '--'}
                            </Text>
                        </View>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                {/* Quick Actions */}
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Attendance', { screen: 'FaceAttendance' })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryTint }]}>
                            <Ionicons name="finger-print" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.quickActionLabel}>Face{'\n'}Attend.</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Attendance', { screen: 'QRAttendance' })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: colors.accentTint }]}>
                            <Ionicons name="qr-code-outline" size={22} color={colors.accent} />
                        </View>
                        <Text style={styles.quickActionLabel}>QR{'\n'}Scan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Leaves', { screen: 'ApplyLeave' })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: colors.accentTint }]}>
                            <MaterialCommunityIcons name="file-document-edit-outline" size={22} color={colors.accent} />
                        </View>
                        <Text style={styles.quickActionLabel}>Apply{'\n'}Leave</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Attendance', { screen: 'MyAttendance' })}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: colors.successTint }]}>
                            <Ionicons name="calendar" size={22} color={colors.success} />
                        </View>
                        <Text style={styles.quickActionLabel}>My{'\n'}Attendance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Payroll')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: colors.errorTint }]}>
                            <Ionicons name="receipt-outline" size={22} color={colors.error} />
                        </View>
                        <Text style={styles.quickActionLabel}>Pay{'\n'}Slips</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal for Attendance Source */}
            <Modal
                visible={attendanceModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAttendanceModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mark Attendance</Text>
                            <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>How would you like to punch in/out?</Text>
                        
                        <View style={styles.modalOptionsContainer}>
                            <TouchableOpacity 
                                style={[styles.modalOptionCard, { borderColor: colors.primary, backgroundColor: colors.primaryTint }]} 
                                onPress={() => {
                                    setAttendanceModalVisible(false);
                                    navigation.navigate('Attendance', { screen: 'FaceAttendance' });
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.modalIconContainer, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="finger-print" size={32} color={colors.textInverse} />
                                </View>
                                <Text style={styles.modalOptionTitle}>Face Scan</Text>
                                <Text style={styles.modalOptionDesc}>Use device camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalOptionCard, { borderColor: colors.accent, backgroundColor: colors.accentTint }]} 
                                onPress={() => {
                                    setAttendanceModalVisible(false);
                                    navigation.navigate('Attendance', { screen: 'QRAttendance' });
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.modalIconContainer, { backgroundColor: colors.accent }]}>
                                    <Ionicons name="qr-code-outline" size={32} color={colors.textInverse} />
                                </View>
                                <Text style={styles.modalOptionTitle}>QR Code</Text>
                                <Text style={styles.modalOptionDesc}>Scan office code</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
