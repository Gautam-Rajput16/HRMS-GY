import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Dimensions,
    Animated,
    Easing,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
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
const FRAME_SIZE = width * 0.65;
const COUNTDOWN_SECONDS = 3;

type CapturePhase = 'idle' | 'countdown' | 'capturing' | 'submitting';

export const FaceAttendanceScreen: React.FC = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const [permission, requestPermission] = useCameraPermissions();
    const [facing] = useState<CameraType>('front');
    const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // Auto-capture state
    const [phase, setPhase] = useState<CapturePhase>('idle');
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const [pendingAction, setPendingAction] = useState<'login' | 'logout' | null>(null);
    const [locationDenied, setLocationDenied] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const cameraRef = useRef<CameraView>(null);
    const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const submittingRef = useRef(false); // Debounce guard — prevents double-tap
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ringAnim = useRef(new Animated.Value(0)).current;

    // ─── Fetch today's attendance status ───
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
            // Request location permission upfront on screen load
            ensureLocationPermission();
            // Reset state when screen comes back into focus
            return () => {
                stopCountdown();
                setPhase('idle');
                setPendingAction(null);
            };
        }, [])
    );

    // ─── Pulse animation for countdown ───
    useEffect(() => {
        if (phase === 'countdown') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [phase]);

    // ─── Ring progress animation ───
    useEffect(() => {
        if (phase === 'countdown') {
            ringAnim.setValue(0);
            Animated.timing(ringAnim, {
                toValue: 1,
                duration: COUNTDOWN_SECONDS * 1000,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
        } else {
            ringAnim.setValue(0);
        }
    }, [phase]);

    // ─── Stop active countdown ───
    const stopCountdown = () => {
        if (countdownTimer.current) {
            clearInterval(countdownTimer.current);
            countdownTimer.current = null;
        }
    };

    // ─── Location permission check ───
    const ensureLocationPermission = async (): Promise<boolean> => {
        try {
            // Check current status first — don't re-prompt if already granted
            const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
            if (currentStatus === 'granted') {
                setLocationDenied(false);
                setLocationGranted(true);
                return true;
            }

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setLocationDenied(false);
                setLocationGranted(true);
                return true;
            }

            // Permission denied
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

    // ─── Fetch location with timeout ───
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
            // Reject dummy 0,0 (some devices return this when GPS is off)
            if (latitude === 0 && longitude === 0) {
                return null;
            }
            return { latitude, longitude };
        } catch (error) {
            console.warn('Location fetch failed:', error);
            return null;
        }
    };

    // ─── Start the auto-capture flow ───
    const startCapture = async (type: 'login' | 'logout') => {
        // Debounce — prevent double-tap
        if (submittingRef.current) return;

        // 1. Ensure location permission
        if (!locationGranted) {
            const hasLocation = await ensureLocationPermission();
            if (!hasLocation) return; // Will show denied UI
        }

        // 2. Fetch actual GPS location BEFORE proceeding
        setLocationLoading(true);
        const coords = await fetchLocationWithTimeout(10000);
        setLocationLoading(false);

        if (!coords) {
            Alert.alert(
                '📍 Location Unavailable',
                'We could not get your location. Please ensure GPS/Location is turned ON, you are outdoors or near a window, and try again.',
                [{ text: 'OK' }]
            );
            return;
        }

        // 3. Start countdown
        setPendingAction(type);
        setCountdown(COUNTDOWN_SECONDS);
        setPhase('countdown');

        let remaining = COUNTDOWN_SECONDS;
        countdownTimer.current = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                stopCountdown();
                performCapture(type, coords);
            }
        }, 1000);
    };

    // ─── Cancel ongoing capture ───
    const cancelCapture = () => {
        stopCountdown();
        setPhase('idle');
        setPendingAction(null);
        setCountdown(COUNTDOWN_SECONDS);
    };

    // ─── Perform the actual photo capture + submission ───
    const performCapture = async (type: 'login' | 'logout', coords: { latitude: number; longitude: number }) => {
        if (submittingRef.current) return;
        submittingRef.current = true;

        if (!cameraRef.current) {
            Alert.alert('Camera Error', 'Camera is not ready. Please try again.');
            setPhase('idle');
            submittingRef.current = false;
            return;
        }

        try {
            setPhase('capturing');

            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.7,
            });

            if (!photo?.base64) {
                throw new Error('Failed to capture photo');
            }

            setPhase('submitting');

            const payload = {
                photo: `data:image/jpeg;base64,${photo.base64}`,
                latitude: coords.latitude,
                longitude: coords.longitude,
            };

            if (type === 'login') {
                await attendanceService.markLogin(payload);
                Alert.alert('✅ Success', 'Punch In recorded successfully!');
            } else {
                await attendanceService.markLogout(payload);
                Alert.alert('✅ Success', 'Punch Out recorded successfully!');
            }

            await fetchTodayStatus();
        } catch (error: any) {
            const msg = getErrorMessage(error);
            const msgLower = msg.toLowerCase();
            const isFaceError = msgLower.includes('no face detected');
            const isLocationError = msgLower.includes('location');
            const isAlreadyError = msgLower.includes('already');
            const isTooSoonError = msgLower.includes('wait') || msgLower.includes('recently');

            let title = 'Error';
            let body = msg;

            if (isFaceError) {
                title = '😶 Face Not Detected';
                body = 'Your face was not visible in the photo. Please remove any obstructions, ensure good lighting, and try again.';
            } else if (isLocationError) {
                title = '📍 Location Required';
                body = msg;
            } else if (isAlreadyError) {
                title = '⚠️ Already Recorded';
                body = msg;
            } else if (isTooSoonError) {
                title = '⏱️ Too Soon';
                body = msg;
            }

            Alert.alert(title, body);
        } finally {
            setPhase('idle');
            setPendingAction(null);
            setCountdown(COUNTDOWN_SECONDS);
            submittingRef.current = false;
        }
    };

    // ─── Derived states ───
    const canPunchIn = !todayStatus?.hasLoggedIn;
    const canPunchOut = todayStatus?.hasLoggedIn && !todayStatus?.hasLoggedOut;
    const isCompleted = !canPunchIn && !canPunchOut;
    const isActive = phase !== 'idle';
    const isButtonDisabled = locationDenied || locationLoading || isActive;

    // ─── Styles ───
    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surface },

        // Permission screens
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
        helpButton: {
            position: 'absolute', right: Spacing.md, width: 32, height: 32,
            borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: colors.border,
            alignItems: 'center', justifyContent: 'center',
        },

        // Instruction
        instruction: {
            fontSize: Typography.fontSizes.sm, color: colors.textSecondary,
            textAlign: 'center', marginVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
        },

        // Camera
        cameraSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
        cameraContainer: {
            width: FRAME_SIZE + 40, height: FRAME_SIZE + 40, borderRadius: (FRAME_SIZE + 40) / 2,
            overflow: 'hidden', borderWidth: 3,
            borderColor: phase === 'countdown' ? colors.warning
                : phase === 'capturing' || phase === 'submitting' ? colors.success
                    : colors.border,
        },
        camera: { flex: 1 },
        overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },

        // Countdown overlay
        countdownOverlay: {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
        },
        countdownCircle: {
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center', alignItems: 'center',
        },
        countdownNumber: {
            fontSize: 36, fontWeight: Typography.fontWeights.bold, color: '#FFFFFF',
        },
        countdownLabel: {
            fontSize: Typography.fontSizes.xs, color: 'rgba(255,255,255,0.8)',
            marginTop: 2,
        },

        // Live badge
        liveBadge: {
            position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
        },
        liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 5 },
        liveText: {
            fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semibold,
            color: '#FFFFFF', letterSpacing: 0.5,
        },

        // Phase status
        statusBanner: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, marginHorizontal: Spacing.lg,
            borderRadius: BorderRadius.lg, marginTop: Spacing.sm,
        },
        statusBannerText: {
            fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semibold,
            marginLeft: 8,
        },

        // Tip
        tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.sm },
        tipText: { fontSize: Typography.fontSizes.sm, color: colors.textMuted, marginLeft: 6 },

        // Actions
        actions: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
        punchButton: {
            backgroundColor: colors.primary, borderRadius: BorderRadius.xxl, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.shadowColor, ...Shadows.md,
        },
        punchOutButton: { backgroundColor: colors.accent },
        cancelButton: {
            backgroundColor: colors.error, borderRadius: BorderRadius.xxl, height: 54,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.shadowColor, ...Shadows.md,
        },
        punchText: {
            fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semibold,
            color: colors.textInverse, marginLeft: 8,
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

        // Location denied card
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

        // Security
        securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.lg },
        securityText: { fontSize: Typography.fontSizes.xs, color: colors.textMuted, marginLeft: 6 },
    }), [colors, phase]);

    // ─── Render: Camera permission check ───
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
                        We need camera access to capture your face for attendance verification.
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

    // ─── Render: Main screen ───
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
                <Text style={styles.headerTitle}>Face Attendance</Text>
                <TouchableOpacity style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={22} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Instructions */}
            <Text style={styles.instruction}>
                {locationLoading
                    ? 'Fetching your location…'
                    : phase === 'idle'
                        ? 'Position your face within the frame and tap the button below.'
                        : phase === 'countdown'
                            ? 'Hold still — capturing in...'
                            : phase === 'capturing'
                                ? 'Capturing your photo...'
                                : 'Submitting attendance...'}
            </Text>

            {/* Camera View */}
            <View style={styles.cameraSection}>
                <Animated.View style={{ transform: [{ scale: phase === 'countdown' ? pulseAnim : 1 }] }}>
                    <View style={styles.cameraContainer}>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing={facing}
                        />
                        {/* Overlay when counting down or capturing */}
                        {(phase === 'countdown') && (
                            <View style={styles.countdownOverlay}>
                                <View style={styles.countdownCircle}>
                                    <Text style={styles.countdownNumber}>{countdown}</Text>
                                    <Text style={styles.countdownLabel}>sec</Text>
                                </View>
                            </View>
                        )}
                        {(phase === 'capturing' || phase === 'submitting') && (
                            <View style={styles.countdownOverlay}>
                                <ActivityIndicator size="large" color="#FFFFFF" />
                            </View>
                        )}
                        {/* LIVE badge */}
                        <View style={[styles.liveBadge, { position: 'absolute', top: 12, right: 12 }]}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Phase status banner */}
            {phase === 'countdown' && (
                <View style={[styles.statusBanner, { backgroundColor: colors.warningTint }]}>
                    <Ionicons name="timer-outline" size={18} color={colors.warning} />
                    <Text style={[styles.statusBannerText, { color: colors.warning }]}>
                        Auto-capturing in {countdown}s — hold steady
                    </Text>
                </View>
            )}
            {phase === 'submitting' && (
                <View style={[styles.statusBanner, { backgroundColor: colors.successTint }]}>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.success} />
                    <Text style={[styles.statusBannerText, { color: colors.success }]}>
                        Submitting your attendance…
                    </Text>
                </View>
            )}

            {/* Tip */}
            {phase === 'idle' && (
                <View style={styles.tipRow}>
                    <Ionicons name="sunny-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.tipText}>Ensure good lighting for best results</Text>
                </View>
            )}

            {/* Location denied error */}
            {locationDenied && phase === 'idle' && (
                <View style={styles.deniedCard}>
                    <View style={styles.deniedIconBg}>
                        <Ionicons name="location-outline" size={28} color={colors.error} />
                    </View>
                    <Text style={styles.deniedTitle}>Location Access Required</Text>
                    <Text style={styles.deniedText}>
                        Attendance requires your location to verify you're at the workplace. Please enable location access in Settings.
                    </Text>
                    <TouchableOpacity style={styles.deniedButton} onPress={() => Linking.openSettings()} activeOpacity={0.8}>
                        <Text style={styles.deniedButtonText}>Open Settings</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                {phase === 'idle' && !isCompleted && (
                    <>
                        {canPunchIn && (
                            <TouchableOpacity
                                style={[styles.punchButton, isButtonDisabled && { opacity: 0.5 }]}
                                onPress={() => startCapture('login')}
                                activeOpacity={0.85}
                                disabled={isButtonDisabled}
                            >
                                {locationLoading ? (
                                    <ActivityIndicator size="small" color={colors.textInverse} />
                                ) : (
                                    <Ionicons name="finger-print" size={20} color={colors.textInverse} />
                                )}
                                <Text style={styles.punchText}>
                                    {locationLoading ? 'Getting Location…' : 'Punch In'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {canPunchOut && (
                            <TouchableOpacity
                                style={[styles.punchButton, styles.punchOutButton, isButtonDisabled && { opacity: 0.5 }]}
                                onPress={() => startCapture('logout')}
                                activeOpacity={0.85}
                                disabled={isButtonDisabled}
                            >
                                {locationLoading ? (
                                    <ActivityIndicator size="small" color={colors.textInverse} />
                                ) : (
                                    <Ionicons name="finger-print" size={20} color={colors.textInverse} />
                                )}
                                <Text style={styles.punchText}>
                                    {locationLoading ? 'Getting Location…' : 'Punch Out'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
                {(phase === 'countdown') && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={cancelCapture}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
                {isCompleted && phase === 'idle' && (
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
                <Text style={styles.securityText}>Your data is encrypted & location-verified</Text>
            </View>
        </SafeAreaView>
    );
};
