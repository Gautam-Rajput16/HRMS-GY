import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { validators } from '../utils/validators';
import { getErrorMessage } from '../services/api';

const { width } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
    const { login } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [accessDenied, setAccessDenied] = useState<{ visible: boolean; roleLabel: string }>({
        visible: false,
        roleLabel: '',
    });

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!validators.isRequired(email)) {
            newErrors.email = 'Email or Employee ID is required';
        }

        if (!validators.isRequired(password)) {
            newErrors.password = 'Password is required';
        } else if (!validators.isValidPassword(password)) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (error: any) {
            const message = error?.message || getErrorMessage(error);
            if (message.startsWith('ACCESS_DENIED:')) {
                const roleLabel = message.split(':')[1];
                setAccessDenied({ visible: true, roleLabel });
            } else {
                Alert.alert('Login Failed', getErrorMessage(error));
            }
        } finally {
            setLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        keyboardView: {
            flex: 1,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.xl,
            justifyContent: 'center',
        },
        // Logo
        logoSection: {
            alignItems: 'center',
            marginTop: Spacing.xl,
            marginBottom: Spacing.lg,
        },
        logoOuter: {
            width: 80,
            height: 80,
            borderRadius: 22,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.shadowColor,
            ...Shadows.lg,
            marginBottom: Spacing.md,
        },
        logoInner: {
            width: 50,
            height: 50,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        logoIcon: {
            fontSize: 24,
            color: colors.textInverse,
        },
        appName: {
            fontSize: Typography.fontSizes.xxl,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
            letterSpacing: 1,
        },
        appTagline: {
            fontSize: Typography.fontSizes.xs,
            fontWeight: Typography.fontWeights.medium,
            color: colors.primary,
            letterSpacing: 2,
            marginTop: 4,
        },
        // Welcome
        welcomeSection: {
            alignItems: 'center',
            marginBottom: Spacing.xl,
        },
        welcomeTitle: {
            fontSize: Typography.fontSizes.xl,
            fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary,
            marginBottom: 6,
        },
        welcomeSubtitle: {
            fontSize: Typography.fontSizes.sm,
            color: colors.textSecondary,
        },
        // Form
        formSection: {
            marginBottom: Spacing.lg,
        },
        inputLabel: {
            fontSize: Typography.fontSizes.sm,
            fontWeight: Typography.fontWeights.medium,
            color: colors.textPrimary,
            marginBottom: Spacing.sm,
            marginTop: Spacing.md,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBackground,
            borderRadius: BorderRadius.lg,
            borderWidth: 1.5,
            borderColor: colors.border,
            paddingHorizontal: Spacing.md,
            height: 54,
        },
        inputError: {
            borderColor: colors.error,
        },
        inputIcon: {
            fontSize: 18,
            marginRight: Spacing.sm,
        },
        input: {
            flex: 1,
            fontSize: Typography.fontSizes.md,
            color: colors.textPrimary,
            height: '100%',
        },
        eyeButton: {
            padding: Spacing.xs,
        },
        eyeIcon: {
            fontSize: 18,
        },
        errorText: {
            fontSize: Typography.fontSizes.xs,
            color: colors.error,
            marginTop: 4,
            marginLeft: 4,
        },
        signInButton: {
            backgroundColor: colors.primary,
            borderRadius: BorderRadius.xl,
            height: 54,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: Spacing.lg,
            shadowColor: colors.shadowColor,
            ...Shadows.md,
        },
        signInButtonDisabled: {
            opacity: 0.7,
        },
        signInText: {
            fontSize: Typography.fontSizes.lg,
            fontWeight: Typography.fontWeights.semibold,
            color: colors.textInverse,
        },
        // Divider
        dividerSection: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: Spacing.lg,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            fontSize: Typography.fontSizes.xs,
            color: colors.textMuted,
            marginHorizontal: Spacing.md,
            letterSpacing: 1,
        },
        // Biometric
        biometricSection: {
            alignItems: 'center',
            marginBottom: Spacing.lg,
        },
        biometricButton: {
            width: 60,
            height: 60,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.shadowColor,
            ...Shadows.md,
        },
        biometricIcon: {
            fontSize: 28,
        },
        // Access Denied Modal
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            paddingHorizontal: Spacing.lg,
        },
        modalCard: {
            width: '92%' as any,
            backgroundColor: colors.surface,
            borderRadius: 24,
            paddingVertical: 36,
            paddingHorizontal: 28,
            alignItems: 'center' as const,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 20,
        },
        modalIconOuter: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FEE2E2',
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            marginBottom: 20,
        },
        modalIconInner: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#FCA5A5',
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        },
        modalTitle: {
            fontSize: 22,
            fontWeight: '700' as const,
            color: '#DC2626',
            marginBottom: 8,
            textAlign: 'center' as const,
        },
        modalRoleBadge: {
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginBottom: 16,
        },
        modalRoleText: {
            fontSize: 13,
            fontWeight: '600' as const,
            color: '#B91C1C',
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
        },
        modalMessage: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center' as const,
            lineHeight: 22,
            marginBottom: 8,
        },
        modalSubMessage: {
            fontSize: 13,
            color: colors.textMuted,
            textAlign: 'center' as const,
            lineHeight: 20,
            marginBottom: 28,
        },
        modalDivider: {
            width: '100%' as any,
            height: 1,
            backgroundColor: colors.border,
            marginBottom: 20,
        },
        modalButton: {
            width: '100%' as any,
            height: 50,
            borderRadius: 14,
            backgroundColor: '#DC2626',
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            shadowColor: '#DC2626',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
        },
        modalButtonText: {
            fontSize: 16,
            fontWeight: '600' as const,
            color: '#FFFFFF',
            letterSpacing: 0.5,
        },
    }), [colors]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoOuter}>
                            <View style={styles.logoInner}>
                                <Ionicons name="finger-print" size={30} color={colors.textInverse} />
                            </View>
                        </View>
                        <Text style={styles.appName}>IDentix</Text>
                        <Text style={styles.appTagline}>HR & PAYROLL MANAGEMENT</Text>
                    </View>

                    {/* Welcome */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>Welcome back</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Please login to your account to continue.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formSection}>
                        {/* Email/Employee ID */}
                        <Text style={styles.inputLabel}>Email or Employee ID</Text>
                        <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errors.email) setErrors({ ...errors, email: undefined });
                                }}
                                placeholder="Enter your email or ID"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        {/* Password */}
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) setErrors({ ...errors, password: undefined });
                                }}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.signInText}>
                                {loading ? 'Signing In...' : 'Sign In  →'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Access Denied Modal */}
            <Modal
                visible={accessDenied.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAccessDenied({ visible: false, roleLabel: '' })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Shield Icon */}
                        <View style={styles.modalIconOuter}>
                            <View style={styles.modalIconInner}>
                                <Ionicons name="shield-outline" size={28} color="#DC2626" />
                            </View>
                        </View>

                        <Text style={styles.modalTitle}>Access Denied</Text>

                        {/* Role Badge */}
                        <View style={styles.modalRoleBadge}>
                            <Text style={styles.modalRoleText}>
                                {accessDenied.roleLabel} Account
                            </Text>
                        </View>

                        <Text style={styles.modalMessage}>
                            This app is exclusively for employees.
                        </Text>
                        <Text style={styles.modalSubMessage}>
                            {accessDenied.roleLabel} accounts must use the web portal to access the dashboard and management tools.
                        </Text>

                        <View style={styles.modalDivider} />

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setAccessDenied({ visible: false, roleLabel: '' })}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalButtonText}>Understood</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};
