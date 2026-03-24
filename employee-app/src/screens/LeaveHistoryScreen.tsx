import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { leaveService } from '../services/leaveService';
import { LeaveRecord, LeaveBalance } from '../types';
import { formatDate } from '../utils/formatters';
import { getErrorMessage } from '../services/api';

const leaveTypeLabels: Record<string, string> = {
    casual: 'Casual Leave',
    sick: 'Sick Leave',
    paid: 'Annual Leave',
    unpaid: 'Unpaid Leave',
};

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export const LeaveHistoryScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Dynamic icon/status color maps that use theme tokens
    const leaveTypeIcons = useMemo(() => ({
        casual: { name: 'cafe-outline', color: colors.success },
        sick: { name: 'medkit-outline', color: colors.error },
        paid: { name: 'airplane-outline', color: colors.primary },
        unpaid: { name: 'document-text-outline', color: colors.textMuted },
    }), [colors]);

    const statusColorMap = useMemo(() => ({
        pending: { text: colors.primary, bg: colors.primaryTint, border: colors.primary },
        approved: { text: colors.success, bg: colors.successTint, border: colors.success },
        rejected: { text: colors.error, bg: colors.errorTint, border: colors.error },
        cancelled: { text: colors.textMuted, bg: colors.border, border: colors.textMuted },
    }), [colors]);

    const fetchData = async () => {
        try {
            setError(null);
            const [leavesData, balanceData] = await Promise.all([
                leaveService.getMyLeaves(),
                leaveService.getMyLeaveBalance().catch(() => null),
            ]);
            setLeaves(leavesData || []);
            setLeaveBalance(balanceData);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleCancelLeave = async (leaveId: string) => {
        Alert.alert(
            'Cancel Leave',
            'Are you sure you want to cancel this leave request?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await leaveService.cancelLeave(leaveId);
                            Alert.alert('Success', 'Leave request cancelled successfully');
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', getErrorMessage(error));
                        }
                    },
                },
            ]
        );
    };

    const filteredLeaves = activeFilter === 'all'
        ? leaves
        : leaves.filter((l) => l.status === activeFilter);

    const filters: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
    ];

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
        },
        headerTitle: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        headerSubtitle: { fontSize: Typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
        addButton: {
            width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center', shadowColor: colors.shadowColor, ...Shadows.md,
        },
        balanceRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginVertical: Spacing.md },
        balanceCard: {
            flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
            marginHorizontal: 4, alignItems: 'flex-start', shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        balanceIconBg: {
            width: 32, height: 32, borderRadius: BorderRadius.md, alignItems: 'center',
            justifyContent: 'center', marginBottom: Spacing.sm,
        },
        balanceValue: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        balanceLabel: { fontSize: Typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
        filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
        filterPill: {
            paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
            backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, marginRight: Spacing.sm,
        },
        filterPillActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
        filterText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium, color: colors.textSecondary },
        filterTextActive: { color: colors.textInverse },
        sectionLabel: {
            fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold,
            color: colors.textMuted, letterSpacing: 1, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
        },
        listContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, flexGrow: 1 },
        leaveCard: {
            backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
            marginBottom: Spacing.sm, borderLeftWidth: 4, shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
        cardTopLeft: { flexDirection: 'row', alignItems: 'center' },
        leaveIconBg: {
            width: 40, height: 40, borderRadius: BorderRadius.full, alignItems: 'center',
            justifyContent: 'center', marginRight: Spacing.sm,
        },
        leaveInfo: { justifyContent: 'center' },
        leaveType: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textPrimary },
        appliedDate: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginTop: 2 },
        statusBadge: { paddingHorizontal: Spacing.sm + 2, paddingVertical: 4, borderRadius: BorderRadius.full },
        statusText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold },
        cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
        dateRange: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold, color: colors.textPrimary },
        reason: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginTop: 2, maxWidth: 200 },
        daysCount: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        rejectionBox: {
            backgroundColor: colors.errorLight, borderRadius: BorderRadius.md, padding: Spacing.sm, marginTop: Spacing.sm,
        },
        rejectionText: { fontSize: Typography.fontSizes.xs, color: colors.error },
        cancelButton: {
            backgroundColor: colors.errorLight, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md, alignSelf: 'flex-start', marginTop: Spacing.sm,
        },
        cancelText: { fontSize: Typography.fontSizes.sm, color: colors.error, fontWeight: Typography.fontWeights.medium },
        emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
        emptyTitle: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm,
        },
        emptyText: { fontSize: Typography.fontSizes.md, color: colors.textSecondary, textAlign: 'center' },
    }), [colors]);

    const renderLeaveItem = ({ item }: { item: LeaveRecord }) => {
        const statusClr = statusColorMap[item.status] || statusColorMap.pending;
        const iconData = leaveTypeIcons[item.leaveType] || leaveTypeIcons.unpaid;

        return (
            <View style={[styles.leaveCard, { borderLeftColor: statusClr.border }]}>
                {/* Top Row */}
                <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                        <View style={[styles.leaveIconBg, { backgroundColor: statusClr.bg }]}>
                            <Ionicons name={iconData.name as any} size={18} color={iconData.color} />
                        </View>
                        <View style={styles.leaveInfo}>
                            <Text style={styles.leaveType}>
                                {leaveTypeLabels[item.leaveType] || item.leaveType}
                            </Text>
                            <Text style={styles.appliedDate}>
                                Applied on {formatDate(item.appliedOn, 'MMM dd')}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusClr.bg }]}>
                        <Text style={[styles.statusText, { color: statusClr.text }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Date Range + Days */}
                <View style={styles.cardBottom}>
                    <View>
                        <Text style={styles.dateRange}>
                            {formatDate(item.startDate, 'MMM dd')} - {formatDate(item.endDate, 'MMM dd')}
                        </Text>
                        <Text style={styles.reason} numberOfLines={1}>
                            {item.reason}
                        </Text>
                    </View>
                    <Text style={styles.daysCount}>
                        {item.totalDays} {item.totalDays === 1 ? 'Day' : 'Days'}
                    </Text>
                </View>

                {/* Rejection Reason */}
                {item.status === 'rejected' && item.rejectionReason && (
                    <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionText}>
                            Reason: {item.rejectionReason}
                        </Text>
                    </View>
                )}

                {/* Cancel Button */}
                {item.status === 'pending' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelLeave(item._id)}
                    >
                        <Text style={styles.cancelText}>Cancel Request</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Leave Requests</Text>
            <Text style={styles.emptyText}>
                Your leave history will appear here once you apply for leave.
            </Text>
        </View>
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading leave history..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Leaves</Text>
                    <Text style={styles.headerSubtitle}>Manage your time off</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => (navigation as any).navigate('ApplyLeave')}
                >
                    <Ionicons name="add" size={20} color={colors.textInverse} />
                </TouchableOpacity>
            </View>

            {/* Balance Cards */}
            <View style={styles.balanceRow}>
                <View style={styles.balanceCard}>
                    <View style={[styles.balanceIconBg, { backgroundColor: colors.errorTint }]}>
                        <Ionicons name="airplane-outline" size={16} color={colors.error} />
                    </View>
                    <Text style={styles.balanceValue}>{leaveBalance?.paid?.remaining ?? 0}</Text>
                    <Text style={styles.balanceLabel}>Annual Remaining</Text>
                </View>
                <View style={styles.balanceCard}>
                    <View style={[styles.balanceIconBg, { backgroundColor: colors.successTint }]}>
                        <Ionicons name="cafe-outline" size={16} color={colors.success} />
                    </View>
                    <Text style={styles.balanceValue}>{leaveBalance?.casual?.remaining ?? 0}</Text>
                    <Text style={styles.balanceLabel}>Casual Leaves</Text>
                </View>
                <View style={styles.balanceCard}>
                    <View style={[styles.balanceIconBg, { backgroundColor: colors.errorTint }]}>
                        <Ionicons name="medkit-outline" size={16} color={colors.error} />
                    </View>
                    <Text style={styles.balanceValue}>{leaveBalance?.sick?.remaining ?? 0}</Text>
                    <Text style={styles.balanceLabel}>Sick</Text>
                </View>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[
                            styles.filterPill,
                            activeFilter === f.key && styles.filterPillActive,
                        ]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === f.key && styles.filterTextActive,
                            ]}
                        >
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Section Title */}
            <Text style={styles.sectionLabel}>RECENT REQUESTS</Text>

            {/* Leave List */}
            <FlatList
                data={filteredLeaves}
                keyExtractor={(item) => item._id}
                renderItem={renderLeaveItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};
