import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator, navigationRef } from './src/navigation/AppNavigator';
import {
  setupNotificationHandlers,
  addNotificationResponseListener,
  getScreenFromNotification,
} from './src/services/notificationService';
import * as Notifications from 'expo-notifications';

// Set up foreground notification handler (must be outside component)
setupNotificationHandlers();

// Screen name → navigation route mapping
const SCREEN_MAP: Record<string, { stack?: string; screen: string }> = {
  FaceAttendance: { stack: 'Attendance', screen: 'FaceAttendance' },
  MyAttendance: { stack: 'Attendance', screen: 'MyAttendance' },
  LeaveHistory: { stack: 'Leaves', screen: 'LeaveHistory' },
  Payroll: { screen: 'Payroll' },
  Dashboard: { screen: 'Dashboard' },
  Profile: { screen: 'Profile' },
};

const navigateToScreen = (screen: string) => {
  if (!navigationRef.isReady()) return;
  const route = SCREEN_MAP[screen];
  if (route?.stack) {
    (navigationRef as any).navigate(route.stack, { screen: route.screen });
  } else if (route) {
    (navigationRef as any).navigate(route.screen);
  }
};

const AppContent = () => {
  const { colors } = useTheme();

  useEffect(() => {
    // Handle notification tap while app is open
    const subscription = addNotificationResponseListener((response) => {
      const screen = getScreenFromNotification(response);
      if (screen) navigateToScreen(screen);
    });

    // Handle cold start from notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const screen = getScreenFromNotification(response);
        if (screen) {
          setTimeout(() => navigateToScreen(screen), 1000);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style={colors.statusBarStyle === 'light' ? 'light' : 'dark'} />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


