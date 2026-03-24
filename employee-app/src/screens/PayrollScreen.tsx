import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { payrollService } from '../services/payrollService';
import { PayrollRecord } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../services/api';

const { width } = Dimensions.get('window');

const monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PayrollScreen: React.FC = () => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSalary, setShowSalary] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

    const fetchPayroll = async () => {
        try {
            setError(null);
            const data = await payrollService.getMyPayroll();
            setPayroll(data || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPayroll();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayroll();
    };

    const handleViewPayslip = (payrollRecord: PayrollRecord) => {
        setSelectedPayslip(payrollRecord);
    };

    const handleDownload = async (payrollId: string, monthYear: string) => {
        try {
            setDownloading(payrollId);
            const fileName = `Payslip_${monthYear.replace(' ', '_')}`;
            await payrollService.downloadPayslip(payrollId, fileName);
        } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
        } finally {
            setDownloading(null);
        }
    };

    const latestPayroll = payroll.length > 0 ? payroll[0] : null;
    const historyPayroll = payroll.length > 1 ? payroll.slice(1) : [];

    const getMonthAbbr = (monthYear: string): string => {
        const parts = monthYear.split(' ');
        if (parts.length >= 1) {
            return parts[0].substring(0, 3);
        }
        return monthYear;
    };

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },

        // Header
        header: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            marginTop: Spacing.md, marginBottom: Spacing.lg,
        },
        headerLeft: { flexDirection: 'row', alignItems: 'center' },
        avatar: {
            width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: colors.accent,
            alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
        },
        avatarText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: colors.textInverse },
        welcomeText: { fontSize: Typography.fontSizes.xs, color: colors.textMuted },
        userName: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        notificationBtn: {
            width: 40, height: 40, borderRadius: BorderRadius.full, backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center', shadowColor: colors.shadowColor, ...Shadows.sm,
        },

        // Title
        titleRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md,
        },
        title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },

        // Latest Card
        latestCard: {
            backgroundColor: colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg,
        },
        latestTop: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
        },
        latestMonth: {
            fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold,
            color: colors.textInverse, opacity: 0.9,
        },
        paidBadge: {
            backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.sm + 2,
            paddingVertical: 4, borderRadius: BorderRadius.full,
        },
        paidBadgeText: {
            fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold,
            color: colors.textInverse, letterSpacing: 0.5,
        },
        netPayLabel: { fontSize: Typography.fontSizes.sm, color: colors.textInverse, opacity: 0.7 },
        netPayAmount: {
            fontSize: Typography.fontSizes.xxxl, fontWeight: Typography.fontWeights.bold,
            color: colors.textInverse, marginBottom: Spacing.md,
        },
        subCardsRow: { flexDirection: 'row', marginBottom: Spacing.md },
        subCard: {
            flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.lg,
            padding: Spacing.sm + 2, marginHorizontal: 4, alignItems: 'center',
        },
        subCardLabel: { fontSize: Typography.fontSizes.xs, color: colors.textInverse, opacity: 0.8, marginBottom: 4 },
        subCardValue: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: colors.textInverse },
        actionRow: { flexDirection: 'row', alignItems: 'center' },
        viewSlipButton: {
            flex: 1, backgroundColor: colors.textInverse, borderRadius: BorderRadius.xxl,
            height: 44, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
        },
        viewSlipText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.primary },
        downloadBtn: {
            width: 44, height: 44, borderRadius: BorderRadius.full,
            backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
        },

        // History
        historyHeader: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md,
        },
        historyTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        yearBadge: {
            borderWidth: 1.5, borderColor: colors.border, borderRadius: BorderRadius.full,
            paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
        },
        yearText: { fontSize: Typography.fontSizes.sm, color: colors.textSecondary, fontWeight: Typography.fontWeights.medium },

        // History Item
        historyItem: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
            marginBottom: Spacing.sm, shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        historyLeft: { flexDirection: 'row', alignItems: 'center' },
        monthCircle: {
            width: 44, height: 44, borderRadius: BorderRadius.full, borderWidth: 2, borderColor: colors.primary,
            alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
        },
        monthCircleText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold, color: colors.primary },
        historyInfo: { justifyContent: 'center' },
        historyMonth: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textPrimary },
        historyCredited: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginTop: 2 },
        historyRight: { alignItems: 'flex-end' },
        historyAmount: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        paidDot: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
        greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 4 },
        paidText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold, color: colors.success },

        // Empty
        emptyContainer: {
            flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, marginTop: 80,
        },
        emptyTitle: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center', marginTop: Spacing.sm,
        },
        emptyText: { fontSize: Typography.fontSizes.md, color: colors.textSecondary, textAlign: 'center' },

        // Modal
        modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'flex-end' },
        modalContent: {
            backgroundColor: colors.surface, borderTopLeftRadius: BorderRadius.xxl,
            borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.md,
            paddingBottom: Spacing.xl, maxHeight: '90%',
        },
        modalHeader: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: Spacing.md,
        },
        modalTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        modalMonthYear: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.primary, marginBottom: Spacing.md,
        },
        modalSection: { marginBottom: Spacing.lg },
        modalSectionTitle: {
            fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold,
            color: colors.textPrimary, marginBottom: Spacing.sm,
        },
        attendanceGrid: {
            flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background,
            borderRadius: BorderRadius.lg, padding: Spacing.md,
        },
        attendanceItem: { flex: 1, alignItems: 'center' },
        attendanceLabel: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginBottom: 4 },
        attendanceValue: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        earningsBox: { backgroundColor: colors.earningsBoxBg, borderRadius: BorderRadius.lg, padding: Spacing.md },
        deductionsBox: { backgroundColor: colors.deductionsBoxBg, borderRadius: BorderRadius.lg, padding: Spacing.md },
        breakdownRow: {
            flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs,
            borderBottomWidth: 1, borderBottomColor: colors.breakdownBorder,
        },
        totalRow: { borderBottomWidth: 0, paddingTop: Spacing.sm, marginTop: Spacing.xs },
        breakdownLabel: { fontSize: Typography.fontSizes.sm, color: colors.textSecondary },
        breakdownValue: { fontSize: Typography.fontSizes.sm, color: colors.textPrimary },
        totalLabel: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textPrimary },
        totalValue: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold, color: colors.success },
        netSalaryBox: {
            backgroundColor: colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg,
            marginBottom: Spacing.md, alignItems: 'center',
        },
        netSalaryLabel: { fontSize: Typography.fontSizes.sm, color: colors.textInverse, opacity: 0.9, marginBottom: 4 },
        netSalaryValue: { fontSize: Typography.fontSizes.xxxl, fontWeight: Typography.fontWeights.bold, color: colors.textInverse },
        modalActions: { flexDirection: 'row', gap: Spacing.sm },
        modalCloseButton: {
            flex: 1, backgroundColor: colors.background, borderRadius: BorderRadius.lg,
            paddingVertical: Spacing.md, alignItems: 'center',
        },
        modalCloseText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textSecondary },
        modalDownloadButton: {
            flex: 1, backgroundColor: colors.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
        },
        modalDownloadText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textInverse },
    }), [colors]);

    const renderHistoryItem = ({ item }: { item: PayrollRecord }) => (
        <View style={styles.historyItem}>
            <View style={styles.historyLeft}>
                <View style={styles.monthCircle}>
                    <Text style={styles.monthCircleText}>{getMonthAbbr(item.monthYear)}</Text>
                </View>
                <View style={styles.historyInfo}>
                    <Text style={styles.historyMonth}>{item.monthYear}</Text>
                    <Text style={styles.historyCredited}>
                        Credited on {item.paidOn ? new Date(item.paidOn).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '--'}
                    </Text>
                </View>
            </View>
            <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>{formatCurrency(item.netSalary)}</Text>
                <View style={styles.paidDot}>
                    <View style={styles.greenDot} />
                    <Text style={styles.paidText}>PAID</Text>
                </View>
            </View>
        </View>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Payroll Records</Text>
            <Text style={styles.emptyText}>
                Your salary slips will appear here once payroll is processed.
            </Text>
        </View>
    );

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading payroll..." />;
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
                    <Text style={styles.emptyTitle}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FlatList
                data={historyPayroll}
                keyExtractor={(item) => item._id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.scrollContent}
                ListEmptyComponent={payroll.length === 0 ? renderEmptyList : null}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.welcomeText}>Welcome back,</Text>
                                    <Text style={styles.userName}>{user?.name || 'Employee'}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.notificationBtn}>
                                <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Title */}
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>Payroll</Text>
                            <TouchableOpacity onPress={() => setShowSalary(!showSalary)}>
                                <Ionicons name={showSalary ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Latest Payroll Card */}
                        {latestPayroll && (
                            <View style={styles.latestCard}>
                                <View style={styles.latestTop}>
                                    <Text style={styles.latestMonth}>{latestPayroll.monthYear}</Text>
                                    <View style={styles.paidBadge}>
                                        <Text style={styles.paidBadgeText}>PAID</Text>
                                    </View>
                                </View>

                                <Text style={styles.netPayLabel}>Net Pay</Text>
                                <Text style={styles.netPayAmount}>
                                    {showSalary ? formatCurrency(latestPayroll.netSalary) : '••••••'}
                                </Text>

                                <View style={styles.subCardsRow}>
                                    <View style={styles.subCard}>
                                        <Text style={styles.subCardLabel}>Gross Earnings</Text>
                                        <Text style={styles.subCardValue}>
                                            {showSalary ? formatCurrency(latestPayroll.grossSalary) : '••••'}
                                        </Text>
                                    </View>
                                    <View style={styles.subCard}>
                                        <Text style={styles.subCardLabel}>Deductions</Text>
                                        <Text style={styles.subCardValue}>
                                            {showSalary ? `-${formatCurrency(latestPayroll.totalDeductions)}` : '••••'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={styles.viewSlipButton}
                                        onPress={() => handleViewPayslip(latestPayroll)}
                                    >
                                        <Text style={styles.viewSlipText}>View Payslip</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.downloadBtn}
                                        onPress={() => handleDownload(latestPayroll._id, latestPayroll.monthYear)}
                                    >
                                        <Ionicons name="download-outline" size={18} color={colors.textInverse} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* History Header */}
                        {historyPayroll.length > 0 && (
                            <View style={styles.historyHeader}>
                                <Text style={styles.historyTitle}>History</Text>
                                <View style={styles.yearBadge}>
                                    <Text style={styles.yearText}>
                                        {new Date().getFullYear()} ▾
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                }
            />

            {/* Payslip Detail Modal */}
            {selectedPayslip && (
                <Modal
                    visible={true}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setSelectedPayslip(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Payslip Details</Text>
                                <TouchableOpacity onPress={() => setSelectedPayslip(null)}>
                                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalMonthYear}>{selectedPayslip.monthYear}</Text>

                                {/* Attendance Summary */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Attendance Summary</Text>
                                    <View style={styles.attendanceGrid}>
                                        <View style={styles.attendanceItem}>
                                            <Text style={styles.attendanceLabel}>Working Days</Text>
                                            <Text style={styles.attendanceValue}>{selectedPayslip.workingDaysInMonth}</Text>
                                        </View>
                                        <View style={styles.attendanceItem}>
                                            <Text style={styles.attendanceLabel}>Present</Text>
                                            <Text style={[styles.attendanceValue, { color: colors.success }]}>{selectedPayslip.daysPresent}</Text>
                                        </View>
                                        <View style={styles.attendanceItem}>
                                            <Text style={styles.attendanceLabel}>Absent</Text>
                                            <Text style={[styles.attendanceValue, { color: colors.error }]}>{selectedPayslip.daysAbsent}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Earnings */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Earnings</Text>
                                    <View style={styles.earningsBox}>
                                        {[
                                            { label: 'Base Salary', value: selectedPayslip.baseSalary },
                                        ].map((item, index) => (
                                            <View key={index} style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>{item.label}</Text>
                                                <Text style={styles.breakdownValue}>{formatCurrency(item.value)}</Text>
                                            </View>
                                        ))}
                                        <View style={[styles.breakdownRow, styles.totalRow]}>
                                            <Text style={styles.totalLabel}>Gross Salary</Text>
                                            <Text style={styles.totalValue}>{formatCurrency(selectedPayslip.grossSalary)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Deductions */}
                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Deductions</Text>
                                    <View style={styles.deductionsBox}>
                                        {[
                                            { label: 'Fixed Deductions', value: selectedPayslip.fixedDeductions },
                                            { label: 'Absent Deduction', value: selectedPayslip.absentDeduction },
                                            { label: 'Unpaid Leave Deduction', value: selectedPayslip.unpaidLeaveDeduction },
                                        ].map((item, index) => (
                                            <View key={index} style={styles.breakdownRow}>
                                                <Text style={styles.breakdownLabel}>{item.label}</Text>
                                                <Text style={styles.breakdownValue}>-{formatCurrency(item.value)}</Text>
                                            </View>
                                        ))}
                                        <View style={[styles.breakdownRow, styles.totalRow]}>
                                            <Text style={styles.totalLabel}>Total Deductions</Text>
                                            <Text style={[styles.totalValue, { color: colors.error }]}>-{formatCurrency(selectedPayslip.totalDeductions)}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Net Salary */}
                                <View style={styles.netSalaryBox}>
                                    <Text style={styles.netSalaryLabel}>Net Salary</Text>
                                    <Text style={styles.netSalaryValue}>{formatCurrency(selectedPayslip.netSalary)}</Text>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={() => setSelectedPayslip(null)}
                                    >
                                        <Text style={styles.modalCloseText}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalDownloadButton}
                                        onPress={() => {
                                            handleDownload(selectedPayslip._id, selectedPayslip.monthYear);
                                            setSelectedPayslip(null);
                                        }}
                                    >
                                        <Ionicons name="download-outline" size={18} color={colors.textInverse} />
                                        <Text style={styles.modalDownloadText}>Download PDF</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
};
