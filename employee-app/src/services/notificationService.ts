import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

/**
 * Configure notification handler for foreground notifications
 */
export const setupNotificationHandlers = () => {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
};

/**
 * Register for push notifications and send token to backend
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
    try {
        // Must be a physical device
        if (!Device.isDevice) {
            console.warn('[Notification] Push notifications require a physical device');
            return null;
        }

        // Check and request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('[Notification] Permission not granted');
            return null;
        }

        // Set up Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'IDentix Notifications',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4F46E5',
                sound: 'default',
            });
        }

        // Get Expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        const pushToken = tokenData.data;

        // Register token with backend
        await api.post('/notifications/register-token', {
            token: pushToken,
            deviceInfo: `${Device.modelName || 'Unknown'} (${Platform.OS} ${Platform.Version})`,
        });

        console.log('[Notification] Push token registered:', pushToken.substring(0, 30) + '...');
        return pushToken;
    } catch (error) {
        console.error('[Notification] Registration error:', error);
        return null;
    }
};

/**
 * Unregister push token from backend (call on logout)
 */
export const unregisterPushToken = async (): Promise<void> => {
    try {
        if (!Device.isDevice) return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        await api.delete('/notifications/unregister-token', {
            data: { token: tokenData.data },
        });

        console.log('[Notification] Push token unregistered');
    } catch (error) {
        console.error('[Notification] Unregister error:', error);
    }
};

/**
 * Add a listener for notification responses (taps)
 */
export const addNotificationResponseListener = (
    callback: (response: Notifications.NotificationResponse) => void
) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get the screen to navigate to from notification data
 */
export const getScreenFromNotification = (
    response: Notifications.NotificationResponse
): string | null => {
    const data = response.notification.request.content.data;
    return (data?.screen as string) || null;
};
