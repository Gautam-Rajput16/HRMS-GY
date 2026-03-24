import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { ThemeMode } from '../constants/themeTypes';

const themeModes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
    { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export const ProfileScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const { colors, mode: themeMode, setMode: setThemeMode } = useTheme();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ]
        );
    };

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { paddingBottom: Spacing.xxl },

        // Header
        header: { alignItems: 'center', paddingVertical: Spacing.md },
        headerTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },

        // Avatar Section
        avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg },
        avatarContainer: { position: 'relative', marginBottom: Spacing.md },
        avatar: {
            width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primaryLight,
        },
        avatarText: { fontSize: 36, fontWeight: Typography.fontWeights.bold, color: colors.textInverse },
        editBadge: {
            position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: colors.background,
        },
        userName: {
            fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary, marginBottom: 4,
        },
        userDesignation: { fontSize: Typography.fontSizes.sm, color: colors.textSecondary, marginBottom: Spacing.sm },
        idBadge: {
            backgroundColor: colors.primaryLight, paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs + 2, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: colors.primary,
        },
        idBadgeText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold, color: colors.primary },

        // Info Card
        infoCard: {
            backgroundColor: colors.card, borderRadius: BorderRadius.xl, marginHorizontal: Spacing.md,
            padding: Spacing.md, marginBottom: Spacing.md, shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        infoRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm,
        },
        infoLeft: { flexDirection: 'row', alignItems: 'center' },
        infoIconBg: {
            width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: colors.primaryTint,
            alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
        },
        infoLabel: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.medium, color: colors.textPrimary },
        infoValue: { fontSize: Typography.fontSizes.sm, color: colors.textSecondary, maxWidth: '50%', textAlign: 'right' },
        infoSeparator: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },

        // Theme Selector
        themeCard: {
            backgroundColor: colors.card, borderRadius: BorderRadius.xl, marginHorizontal: Spacing.md,
            padding: Spacing.md, marginBottom: Spacing.md, shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        themeCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
        themeCardTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textPrimary, marginLeft: Spacing.sm },
        themeOptions: { flexDirection: 'row', justifyContent: 'space-between' },
        themeOption: {
            flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 2,
            borderRadius: BorderRadius.lg, marginHorizontal: 4, borderWidth: 1.5, borderColor: colors.border,
        },
        themeOptionActive: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
        themeOptionLabel: { fontSize: Typography.fontSizes.xs, color: colors.textSecondary, marginTop: 4 },
        themeOptionLabelActive: { color: colors.primary, fontWeight: Typography.fontWeights.semibold },

        // Settings
        settingsRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: colors.card, borderRadius: BorderRadius.xl, marginHorizontal: Spacing.md,
            padding: Spacing.md, marginBottom: Spacing.lg, shadowColor: colors.shadowColor, ...Shadows.sm,
        },
        settingsLabel: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.medium, color: colors.textPrimary },

        // Logout
        logoutButton: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            paddingVertical: Spacing.md, marginHorizontal: Spacing.md,
        },
        logoutText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.error, marginLeft: 8 },

        // Version
        versionText: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
    }), [colors]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.userName}>{user?.name || 'Employee'}</Text>
                    <Text style={styles.userDesignation}>
                        {user?.designation || 'Employee'} • {user?.department || 'General'}
                    </Text>

                    <View style={styles.idBadge}>
                        <Text style={styles.idBadgeText}>
                            ID: {user?.employeeId || '--'}
                        </Text>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                            <View style={styles.infoIconBg}>
                                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.infoLabel}>Joining Date</Text>
                        </View>
                        <Text style={styles.infoValue}>
                            {user?.joiningDate ? formatDate(user.joiningDate) : '--'}
                        </Text>
                    </View>

                    <View style={styles.infoSeparator} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                            <View style={styles.infoIconBg}>
                                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.infoLabel}>Email</Text>
                        </View>
                        <Text style={styles.infoValue} numberOfLines={1}>
                            {user?.email || '--'}
                        </Text>
                    </View>

                    <View style={styles.infoSeparator} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                            <View style={styles.infoIconBg}>
                                <Ionicons name="call-outline" size={16} color={colors.primary} />
                            </View>
                            <Text style={styles.infoLabel}>Phone</Text>
                        </View>
                        <Text style={styles.infoValue}>
                            {user?.phone || '--'}
                        </Text>
                    </View>
                </View>

                {/* Theme Selector */}
                <View style={styles.themeCard}>
                    <View style={styles.themeCardHeader}>
                        <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                        <Text style={styles.themeCardTitle}>Appearance</Text>
                    </View>
                    <View style={styles.themeOptions}>
                        {themeModes.map((mode) => (
                            <TouchableOpacity
                                key={mode.value}
                                style={[
                                    styles.themeOption,
                                    themeMode === mode.value && styles.themeOptionActive,
                                ]}
                                onPress={() => setThemeMode(mode.value)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={mode.icon as any}
                                    size={22}
                                    color={themeMode === mode.value ? colors.primary : colors.textMuted}
                                />
                                <Text style={[
                                    styles.themeOptionLabel,
                                    themeMode === mode.value && styles.themeOptionLabelActive,
                                ]}>
                                    {mode.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>



                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>
                    App Version 1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};
