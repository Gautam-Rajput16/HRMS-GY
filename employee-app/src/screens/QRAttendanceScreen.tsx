import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { attendanceService } from '../services/attendanceService';
import { TodayStatus } from '../types';
import { getErrorMessage } from '../services/api';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

export const QRAttendanceScreen: React.FC = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const [permission, requestPermission] = useCameraPermissions();
    const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);
    const [scanned, setScanned] = useState(false);

    const fetchTodayStatus = async () => {
        try {
            setLoading(true);
            const status = await attendanceService.getTodayStatus();
            setTodayStatus(status);
        } catch (error) {
            console.error('Error fetching today status:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTodayStatus();
            ensureLocationPermission();
            return () => {
                setScanning(false);
                setScanned(false);
            };
        }, [])
    );

    const ensureLocationPermission = async (): Promise<boolean> => {
        try {
            const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
            if (currentStatus === 'granted') {
                setLocationDenied(false);
                setLocationGranted(true);
                return true;
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationDenied(false);
                setLocationGranted(true);
                return true;
            }
            setLocationDenied(true);
            setLocationGranted(false);
            return false;
        } catch (error) {
            console.warn('Location permission error:', error);
            setLocationDenied(true);
            setLocationGranted(false);
            return false;
        }
    };

    const fetchLocationWithTimeout = async (timeoutMs: number = 10000): Promise<{ latitude: number; longitude: number } | null> => {
        try {
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Location fetch timed out')), timeoutMs)
            );
            const location = await Promise.race([locationPromise, timeoutPromise]);
            const { latitude, longitude } = location.coords;
            if (latitude === 0 && longitude === 0) return null;
            return { latitude, longitude };
        } catch (error) {
            console.warn('Location fetch failed:', error);
            return null;
        }
    };

    const startScanning = async () => {
        if (!locationGranted) {
            const hasLocation = await ensureLocationPermission();
            if (!hasLocation) return;
        }
        setScanned(false);
        setScanning(true);
    };

    const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
        // Prevent double scan
        if (scanned || submitting) return;
        setScanned(true);
        setSubmitting(true);

        try {
            // Fetch GPS location
            const coords = await fetchLocationWithTimeout(10000);
            if (!coords) {
                Alert.alert(
                    '📍 Location Unavailable',
                    'Could not get your location. Please ensure GPS/Location is turned ON and try again.',
                    [{ text: 'OK' }]
                );
                setScanning(false);
                setSubmitting(false);
                setScanned(false);
                return;
            }

            const payload = {
                qrCode: data,
                latitude: coords.latitude,
                longitude: coords.longitude,
            };

            const canPunchIn = !todayStatus?.hasLoggedIn;
            const canPunchOut = todayStatus?.hasLoggedIn && !todayStatus?.hasLoggedOut;

            if (canPunchIn) {
                await attendanceService.qrMarkLogin(payload);
                Alert.alert('✅ Success', 'QR Punch In recorded successfully!');
            } else if (canPunchOut) {
                await attendanceService.qrMarkLogout(payload);
                Alert.alert('✅ Success', 'QR Punch Out recorded successfully!');
            } else {
                Alert.alert('⚠️ Already Complete', 'Your attendance for today is already complete.');
            }

            await fetchTodayStatus();
        } catch (error: any) {
            const msg = getErrorMessage(error);
            const msgLower = msg.toLowerCase();

            let title = 'Error';
            let body = msg;

            if (msgLower.includes('invalid qr')) {
                title = '❌ Invalid QR Code';
                body = 'This is not the correct office QR code. Please scan the official QR code at the office.';
            } else if (msgLower.includes('not within')) {
                title = '📍 Outside Office Area';
                body = msg;
            } else if (msgLower.includes('already')) {
                title = '⚠️ Already Recorded';
                body = msg;
            } else if (msgLower.includes('wait') || msgLower.includes('recently')) {
                title = '⏱️ Too Soon';
                body = msg;
            }

            Alert.alert(title, body);
        } finally {
            setScanning(false);
            setSubmitting(false);
            setScanned(false);
        }
    };

    const canPunchIn = !todayStatus?.hasLoggedIn;
    const canPunchOut = todayStatus?.hasLoggedIn && !todayStatus?.hasLoggedOut;
    const isCompleted = !canPunchIn && !canPunchOut;

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surface },

        // Permission
        permissionContainer: {
            flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, backgroundColor: colors.background,
        },
        permissionCard: {
            backgroundColor: colors.card, borderRadius: BorderRadius.xl, padding: Spacing.xl,
            alignItems: 'center', shadowColor: colors.shadowColor, ...Shadows.md, width: '90%',
        },
        permissionIconBg: {
            width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryTint,
            alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
        },
        permissionTitle: {
            fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold,
            color: colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center',
        },
        permissionText: {
            fontSize: Typography.fontSizes.md, color: colors.textSecondary,
            textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 22,
        },
        permissionButton: {
            backgroundColor: colors.primary, borderRadius: BorderRadius.xl,
            paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, width: '100%', alignItems: 'center',
        },
        permissionButtonText: {
            fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semibold, color: colors.textInverse,
        },

        // Header
        header: {
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, position: 'relative',
        },
        headerTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, color: colors.textPrimary },

        // Instruction
        instruction: {
            fontSize: Typography.fontSizes.sm, color: colors.textSecondary,
            textAlign: 'center', marginVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
        },

        // Scanner
        scannerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
        scannerContainer: {
            width: SCANNER_SIZE, height: SCANNER_SIZE, borderRadius: BorderRadius.xl,
            overflow: 'hidden', borderWidth: 3, borderColor: scanning ? colors.primary : colors.border,
        },
        camera: { flex: 1 },

        // Overlay corners
        cornerOverlay: {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', alignItems: 'center',
        },

        // QR Icon placeholder (when not scanning)
        qrPlaceholder: {
            width: SCANNER_SIZE, height: SCANNER_SIZE, borderRadius: BorderRadius.xl,
            backgroundColor: colors.background, borderWidth: 2, borderColor: colors.border,
            borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
        },
        qrPlaceholderText: {
            fontSize: Typography.fontSizes.md, color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center',
        },

        // Actions
        actions: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
        scanButton: {
            backgroundColor: colors.primary, borderRadius: BorderRadius.xxl, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.shadowColor, ...Shadows.md,
        },
        scanOutButton: { backgroundColor: colors.accent },
        scanText: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.textInverse, marginLeft: 8,
        },
        cancelButton: {
            backgroundColor: colors.error, borderRadius: BorderRadius.xxl, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.shadowColor, ...Shadows.md,
        },
        cancelText: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: '#FFFFFF', marginLeft: 8,
        },
        completedContainer: { alignItems: 'center', padding: Spacing.lg },
        completedText: {
            fontSize: Typography.fontSizes.md, color: colors.textSecondary,
            textAlign: 'center', marginTop: Spacing.sm,
        },

        // Location denied
        deniedCard: {
            backgroundColor: colors.errorTint, borderRadius: BorderRadius.xl, padding: Spacing.lg,
            marginHorizontal: Spacing.lg, marginBottom: Spacing.md, alignItems: 'center',
            borderWidth: 1, borderColor: colors.errorLight,
        },
        deniedIconBg: {
            width: 56, height: 56, borderRadius: 28, backgroundColor: colors.errorLight,
            alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
        },
        deniedTitle: {
            fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold,
            color: colors.error, marginBottom: 4, textAlign: 'center',
        },
        deniedText: {
            fontSize: Typography.fontSizes.sm, color: colors.textSecondary,
            textAlign: 'center', marginBottom: Spacing.md, lineHeight: 20,
        },
        deniedButton: {
            backgroundColor: colors.error, borderRadius: BorderRadius.lg,
            paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
        },
        deniedButtonText: {
            fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold, color: '#FFFFFF',
        },

        // Submitting overlay
        submittingOverlay: {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
            borderRadius: BorderRadius.xl,
        },

        // Security
        securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.lg },
        securityText: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginLeft: 6 },

        // Tip
        tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.sm },
        tipText: { fontSize: Typography.fontSizes.sm, color: colors.textMuted, marginLeft: 6 },
    }), [colors, scanning]);

    // Permission check
    if (!permission) {
        return <LoadingSpinner fullScreen message="Checking camera permission..." />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <View style={styles.permissionCard}>
                    <View style={styles.permissionIconBg}>
                        <Ionicons name="camera-outline" size={36} color={colors.primary} />
                    </View>
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to scan QR codes for attendance verification.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission} activeOpacity={0.8}>
                        <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading attendance status..." />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={{ position: 'absolute', left: Spacing.md, padding: Spacing.sm }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>QR Attendance</Text>
            </View>

            {/* Instructions */}
            <Text style={styles.instruction}>
                {submitting
                    ? 'Verifying your QR code and location…'
                    : scanning
                        ? 'Point your camera at the office QR code'
                        : 'Tap the button below and scan the office QR code to mark attendance'}
            </Text>

            {/* Scanner / Placeholder */}
            <View style={styles.scannerSection}>
                {scanning ? (
                    <View style={styles.scannerContainer}>
                        <CameraView
                            style={styles.camera}
                            facing="back"
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr'],
                            }}
                            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                        />
                        {submitting && (
                            <View style={styles.submittingOverlay}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', marginTop: 8, fontWeight: '600' }}>
                                    Submitting...
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.qrPlaceholder}>
                        <Ionicons name="qr-code-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.qrPlaceholderText}>
                            {isCompleted
                                ? 'Attendance complete for today!'
                                : canPunchIn
                                    ? 'Ready to Punch In'
                                    : 'Ready to Punch Out'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Tip */}
            {!scanning && !isCompleted && (
                <View style={styles.tipRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.tipText}>GPS location will be verified automatically</Text>
                </View>
            )}

            {/* Location denied */}
            {locationDenied && !scanning && (
                <View style={styles.deniedCard}>
                    <View style={styles.deniedIconBg}>
                        <Ionicons name="location-outline" size={28} color={colors.error} />
                    </View>
                    <Text style={styles.deniedTitle}>Location Access Required</Text>
                    <Text style={styles.deniedText}>
                        QR Attendance requires GPS location to verify you're at the office. Please enable it in Settings.
                    </Text>
                    <TouchableOpacity style={styles.deniedButton} onPress={() => Linking.openSettings()} activeOpacity={0.8}>
                        <Text style={styles.deniedButtonText}>Open Settings</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                {!scanning && !isCompleted && (
                    <>
                        {canPunchIn && (
                            <TouchableOpacity
                                style={[styles.scanButton, locationDenied && { opacity: 0.5 }]}
                                onPress={() => startScanning()}
                                activeOpacity={0.85}
                                disabled={locationDenied}
                            >
                                <Ionicons name="qr-code-outline" size={20} color={colors.textInverse} />
                                <Text style={styles.scanText}>Scan QR — Punch In</Text>
                            </TouchableOpacity>
                        )}
                        {canPunchOut && (
                            <TouchableOpacity
                                style={[styles.scanButton, styles.scanOutButton, locationDenied && { opacity: 0.5 }]}
                                onPress={() => startScanning()}
                                activeOpacity={0.85}
                                disabled={locationDenied}
                            >
                                <Ionicons name="qr-code-outline" size={20} color={colors.textInverse} />
                                <Text style={styles.scanText}>Scan QR — Punch Out</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
                {scanning && !submitting && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => { setScanning(false); setScanned(false); }}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.cancelText}>Cancel Scan</Text>
                    </TouchableOpacity>
                )}
                {isCompleted && !scanning && (
                    <View style={styles.completedContainer}>
                        <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                        <Text style={styles.completedText}>
                            Today's attendance is complete!
                        </Text>
                    </View>
                )}
            </View>

            {/* Security note */}
            <View style={styles.securityRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
                <Text style={styles.securityText}>QR verified • GPS location-checked</Text>
            </View>
        </SafeAreaView>
    );
};
