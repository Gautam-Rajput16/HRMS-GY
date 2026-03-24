import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord } from '../types';
import { formatDate, formatTime, formatWorkingHours } from '../utils/formatters';
import { getErrorMessage } from '../services/api';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const MyAttendanceScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const fetchAttendance = async () => {
        try {
            setError(null);
            const data = await attendanceService.getMyAttendance();
            setAttendance(data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAttendance();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const navigateMonth = (direction: number) => {
        let newMonth = selectedMonth + direction;
        let newYear = selectedYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    // Filter records for selected month
    const filteredRecords = attendance.filter((record) => {
        const recordDate = new Date(record.date);
        return (
            recordDate.getMonth() === selectedMonth &&
            recordDate.getFullYear() === selectedYear
        );
    });

    // Calculate summary counts
    const presentCount = filteredRecords.filter((r) => r.status === 'present').length;
    const incompleteCount = filteredRecords.filter((r) => r.status === 'incomplete').length;
    const absentCount = filteredRecords.filter((r) => r.status === 'absent').length;

    // Calculate working days in selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    let workingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(selectedYear, selectedMonth, d).getDay();
        if (day !== 0) workingDays++;
    }

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'present': return colors.success;
            case 'half-day': return colors.warning;
            case 'absent': return colors.error;
            default: return colors.textMuted;
        }
    };

    const getStatusBg = (status: string): string => {
        switch (status) {
            case 'present': return colors.successLight;
            case 'incomplete': return colors.warningLight;
            case 'absent': return colors.errorLight;
            default: return colors.border;
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'present': return 'Present';
            case 'incomplete': return 'Incomplete';
            case 'absent': return 'Absent';
            default: return status;
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: colors.surface,
        },
        headerTitle: {
            fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary,
        },
        filterButton: {
            width: 36, height: 36, borderRadius: BorderRadius.full,
            backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
        },
        monthNav: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.surface, paddingVertical: Spacing.sm,
        },
        monthArrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
        monthLabel: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary, marginHorizontal: Spacing.lg,
        },
        workingDaysText: {
            fontSize: Typography.fontSizes.sm, color: colors.textSecondary, textAlign: 'center',
            backgroundColor: colors.surface, paddingBottom: Spacing.sm,
        },
        summaryRow: {
            flexDirection: 'row', justifyContent: 'center', paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.md, backgroundColor: colors.surface,
            borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        summaryPill: {
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, marginHorizontal: Spacing.xs,
        },
        summaryCount: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, marginRight: 6 },
        summaryLabel: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
        listContent: { padding: Spacing.md, flexGrow: 1 },
        dayRow: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
            borderRadius: BorderRadius.lg, padding: Spacing.md, shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        dayLeft: { width: 48, alignItems: 'center', marginRight: Spacing.sm },
        dayLabel: {
            fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold,
            color: colors.textMuted, letterSpacing: 0.5,
        },
        dayNumber: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        dayCenter: { flex: 1 },
        shiftInfo: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginBottom: 4 },
        punchRow: { flexDirection: 'row', alignItems: 'center' },
        punchItem: { flexDirection: 'row', alignItems: 'center' },
        punchLabel: {
            fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold,
            color: colors.primary, marginRight: 4,
        },
        punchTime: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium, color: colors.textPrimary },
        punchDivider: { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: Spacing.sm },
        dayRight: { alignItems: 'flex-end', marginLeft: Spacing.sm },
        duration: {
            fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary, marginBottom: 4,
        },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
        statusBadgeText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold },
        weekendText: { fontSize: Typography.fontSizes.sm, color: colors.textMuted, fontStyle: 'italic' },
        separator: { height: Spacing.sm },
        emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
        emptyTitle: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm,
        },
        emptyText: { fontSize: Typography.fontSizes.md, color: colors.textSecondary, textAlign: 'center' },
        fab: {
            position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.shadowColor, ...Shadows.md, elevation: 8,
        },
    }), [colors]);

    const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => {
        const date = new Date(item.date);
        const dayOfWeek = dayNames[date.getDay()];
        const dayNumber = date.getDate();
        const isWeekend = date.getDay() === 0;

        if (isWeekend) {
            return (
                <View style={styles.dayRow}>
                    <View style={styles.dayLeft}>
                        <Text style={styles.dayLabel}>{dayOfWeek}</Text>
                        <Text style={styles.dayNumber}>{dayNumber}</Text>
                    </View>
                    <View style={styles.dayCenter}>
                        <Text style={styles.weekendText}>Weekend Off</Text>
                    </View>
                    <View style={styles.dayRight} />
                </View>
            );
        }

        return (
            <View style={styles.dayRow}>
                <View style={styles.dayLeft}>
                    <Text style={styles.dayLabel}>{dayOfWeek}</Text>
                    <Text style={styles.dayNumber}>{dayNumber}</Text>
                </View>
                <View style={styles.dayCenter}>
                    <Text style={styles.shiftInfo}>09:00 AM - 06:00 PM</Text>
                    <View style={styles.punchRow}>
                        <View style={styles.punchItem}>
                            <Text style={styles.punchLabel}>IN</Text>
                            <Text style={styles.punchTime}>
                                {item.loginTime ? formatTime(item.loginTime) : '--:--'}
                            </Text>
                        </View>
                        <View style={styles.punchDivider} />
                        <View style={styles.punchItem}>
                            <Text style={styles.punchLabel}>OUT</Text>
                            <Text style={styles.punchTime}>
                                {item.logoutTime ? formatTime(item.logoutTime) : '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.dayRight}>
                    <Text style={styles.duration}>
                        {item.workingMinutes ? formatWorkingHours(item.workingMinutes) : '--'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Records</Text>
            <Text style={styles.emptyText}>No attendance records found for this month.</Text>
        </View>
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading attendance..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Attendance</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Month Navigator */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthArrow}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                    {monthNames[selectedMonth]} {selectedYear}
                </Text>
                <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthArrow}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
            <Text style={styles.workingDaysText}>{workingDays} Working Days</Text>

            {/* Summary Pills */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryPill, { backgroundColor: colors.successLight }]}>
                    <Text style={[styles.summaryCount, { color: colors.success }]}>{presentCount}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.success }]}>Present</Text>
                </View>
                <View style={[styles.summaryPill, { backgroundColor: colors.warningLight }]}>
                    <Text style={[styles.summaryCount, { color: colors.warning }]}>{incompleteCount}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.warning }]}>Incomplete</Text>
                </View>
                <View style={[styles.summaryPill, { backgroundColor: colors.errorLight }]}>
                    <Text style={[styles.summaryCount, { color: colors.error }]}>{absentCount}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.error }]}>Absent</Text>
                </View>
            </View>

            {/* Records List */}
            <FlatList
                data={filteredRecords}
                keyExtractor={(item) => item._id}
                renderItem={renderAttendanceItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

        </SafeAreaView>
    );
};
