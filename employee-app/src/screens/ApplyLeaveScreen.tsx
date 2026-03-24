import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { leaveService } from '../services/leaveService';
import { LeaveBalance } from '../types';
import { getErrorMessage } from '../services/api';

const leaveTypes = [
    { value: 'casual', label: 'Casual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'paid', label: 'Paid Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
];

export const ApplyLeaveScreen: React.FC = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [leaveType, setLeaveType] = useState('casual');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const fetchLeaveBalance = async () => {
        try {
            const balance = await leaveService.getMyLeaveBalance();
            setLeaveBalance(balance);
        } catch (error) {
            console.error('Error fetching leave balance:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLeaveBalance();
        }, [])
    );

    const calculateDuration = (): number => {
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(1, diffDays);
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const validateForm = (): boolean => {
        if (!reason.trim()) {
            Alert.alert('Validation Error', 'Please enter a reason for your leave.');
            return false;
        }
        if (reason.trim().length < 10) {
            Alert.alert('Validation Error', 'Reason must be at least 10 characters long.');
            return false;
        }
        if (reason.trim().length > 500) {
            Alert.alert('Validation Error', 'Reason cannot exceed 500 characters.');
            return false;
        }
        if (endDate < startDate) {
            Alert.alert('Validation Error', 'End date cannot be before start date.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            await leaveService.applyLeave({
                leaveType: leaveType as 'casual' | 'sick' | 'paid' | 'unpaid',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                reason: reason.trim(),
            });

            Alert.alert('Success', 'Leave application submitted successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to submit leave application';
            const validationErrors = error.response?.data?.errors;

            if (validationErrors && Array.isArray(validationErrors)) {
                const firstError = validationErrors[0];
                Alert.alert('Validation Error', firstError.msg || errorMessage);
            } else {
                Alert.alert('Error', errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getSelectedTypeLabel = (): string => {
        return leaveTypes.find((t) => t.value === leaveType)?.label || 'Select';
    };

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
        header: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md,
        },
        headerTitle: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        historyButton: {
            width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center', shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        sectionLabel: {
            fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold,
            color: colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm,
        },
        balanceRow: { flexDirection: 'row', marginBottom: Spacing.lg },
        balanceCard: {
            flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginHorizontal: 4,
        },
        balanceValue: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },
        balanceLabel: { fontSize: Typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
        fieldLabel: {
            fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium,
            color: colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm,
        },
        dropdown: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: colors.inputBackground, borderRadius: BorderRadius.lg,
            borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: Spacing.md, height: 50,
        },
        dropdownText: { fontSize: Typography.fontSizes.md, color: colors.textPrimary },
        dropdownMenu: {
            backgroundColor: colors.surface, borderRadius: BorderRadius.lg, marginTop: 4,
            borderWidth: 1, borderColor: colors.border, shadowColor: colors.shadowColor, ...Shadows.md,
        },
        dropdownItem: {
            paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md,
            borderBottomWidth: 1, borderBottomColor: colors.borderLight,
        },
        dropdownItemActive: { backgroundColor: colors.primaryLight },
        dropdownItemText: { fontSize: Typography.fontSizes.md, color: colors.textPrimary },
        dropdownItemTextActive: { color: colors.primary, fontWeight: Typography.fontWeights.semibold },
        dateRow: { flexDirection: 'row', marginTop: Spacing.sm },
        dateField: { flex: 1 },
        dateSpacer: { width: Spacing.md },
        dateInput: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground,
            borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: colors.border,
            paddingHorizontal: Spacing.md, height: 50,
        },
        dateText: { fontSize: Typography.fontSizes.md, color: colors.textPrimary, marginLeft: 8 },
        durationRow: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryTint,
            borderRadius: BorderRadius.md, padding: Spacing.sm + 2, marginTop: Spacing.md,
        },
        durationText: {
            fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold,
            color: colors.primary, marginLeft: 6,
        },
        reasonInput: {
            backgroundColor: colors.inputBackground, borderRadius: BorderRadius.lg, borderWidth: 1.5,
            borderColor: colors.border, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm + 2,
            paddingBottom: Spacing.sm + 2, fontSize: Typography.fontSizes.md, color: colors.textPrimary, minHeight: 100,
        },
        characterCount: { marginTop: 4, alignItems: 'flex-end' },
        characterCountText: { fontSize: Typography.fontSizes.xs, color: colors.textMuted },
        characterCountError: { color: colors.error },
        characterCountSuccess: { color: colors.success },
        submitButton: {
            backgroundColor: colors.primary, borderRadius: BorderRadius.xl, height: 54,
            alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl,
            shadowColor: colors.shadowColor, ...Shadows.md,
        },
        submitButtonDisabled: { opacity: 0.7 },
        submitText: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold, color: colors.textInverse },
    }), [colors]);

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading leave balance..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Apply for Leave</Text>
                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => (navigation as any).navigate('LeaveHistory')}
                    >
                        <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Balance Cards */}
                <Text style={styles.sectionLabel}>YOUR BALANCE</Text>
                <View style={styles.balanceRow}>
                    <View style={[styles.balanceCard, { backgroundColor: colors.primaryTint }]}>
                        <Ionicons name="airplane-outline" size={20} color={colors.primary} />
                        <Text style={styles.balanceValue}>{leaveBalance?.paid?.remaining ?? 0}</Text>
                        <Text style={styles.balanceLabel}>Annual</Text>
                    </View>
                    <View style={[styles.balanceCard, { backgroundColor: colors.errorTint }]}>
                        <Ionicons name="medkit-outline" size={20} color={colors.error} />
                        <Text style={styles.balanceValue}>{leaveBalance?.sick?.remaining ?? 0}</Text>
                        <Text style={styles.balanceLabel}>Sick</Text>
                    </View>
                    <View style={[styles.balanceCard, { backgroundColor: colors.warningTint }]}>
                        <Ionicons name="cafe-outline" size={20} color={colors.warning} />
                        <Text style={styles.balanceValue}>{leaveBalance?.casual?.remaining ?? 0}</Text>
                        <Text style={styles.balanceLabel}>Casual</Text>
                    </View>
                </View>

                {/* Leave Type Selector */}
                <Text style={styles.fieldLabel}>Leave Type</Text>
                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.dropdownText}>{getSelectedTypeLabel()}</Text>
                    <Ionicons name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
                {showTypeDropdown && (
                    <View style={styles.dropdownMenu}>
                        {leaveTypes.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.dropdownItem,
                                    leaveType === type.value && styles.dropdownItemActive,
                                ]}
                                onPress={() => {
                                    setLeaveType(type.value);
                                    setShowTypeDropdown(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        leaveType === type.value && styles.dropdownItemTextActive,
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Date Pickers */}
                <View style={styles.dateRow}>
                    <View style={styles.dateField}>
                        <Text style={styles.fieldLabel}>From</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.dateSpacer} />
                    <View style={styles.dateField}>
                        <Text style={styles.fieldLabel}>To</Text>
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showStartPicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowStartPicker(Platform.OS === 'ios');
                            if (selectedDate) {
                                setStartDate(selectedDate);
                                if (selectedDate > endDate) {
                                    setEndDate(selectedDate);
                                }
                            }
                        }}
                    />
                )}
                {showEndPicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={startDate}
                        onChange={(event, selectedDate) => {
                            setShowEndPicker(Platform.OS === 'ios');
                            if (selectedDate) {
                                setEndDate(selectedDate);
                            }
                        }}
                    />
                )}

                {/* Duration */}
                <View style={styles.durationRow}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                    <Text style={styles.durationText}>
                        Total Duration: {calculateDuration()} Day{calculateDuration() !== 1 ? 's' : ''}
                    </Text>
                </View>

                {/* Reason */}
                <Text style={styles.fieldLabel}>Reason for leave</Text>
                <TextInput
                    style={styles.reasonInput}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Write your reason here (minimum 10 characters)..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
                <View style={styles.characterCount}>
                    <Text style={[
                        styles.characterCountText,
                        reason.length < 10 && styles.characterCountError,
                        reason.length >= 10 && styles.characterCountSuccess
                    ]}>
                        {reason.length}/500 characters {reason.length < 10 ? `(${10 - reason.length} more needed)` : '✓'}
                    </Text>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    <Text style={styles.submitText}>
                        {submitting ? 'Submitting...' : 'Submit Application  >'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};
