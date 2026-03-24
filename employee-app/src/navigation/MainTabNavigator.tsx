import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, Shadows } from '../constants/theme';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { FaceAttendanceScreen } from '../screens/FaceAttendanceScreen';
import { QRAttendanceScreen } from '../screens/QRAttendanceScreen';
import { MyAttendanceScreen } from '../screens/MyAttendanceScreen';
import { ApplyLeaveScreen } from '../screens/ApplyLeaveScreen';
import { LeaveHistoryScreen } from '../screens/LeaveHistoryScreen';
import { PayrollScreen } from '../screens/PayrollScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Types
import { MainTabParamList } from '../types';

// Attendance Stack
const AttendanceStack = createNativeStackNavigator();
const AttendanceStackNavigator = () => (
    <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
        <AttendanceStack.Screen name="MyAttendance" component={MyAttendanceScreen} />
        <AttendanceStack.Screen name="FaceAttendance" component={FaceAttendanceScreen} />
        <AttendanceStack.Screen name="QRAttendance" component={QRAttendanceScreen} />
    </AttendanceStack.Navigator>
);

// Leave Stack
const LeaveStack = createNativeStackNavigator();
const LeaveStackNavigator = () => (
    <LeaveStack.Navigator screenOptions={{ headerShown: false }}>
        <LeaveStack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
        <LeaveStack.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
    </LeaveStack.Navigator>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.tabBarBackground,
                    borderTopWidth: 1,
                    borderTopColor: colors.tabBarBorder,
                    height: 65,
                    paddingBottom: 8,
                    paddingTop: 6,
                    shadowColor: colors.shadowColor,
                    ...Shadows.sm,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: -2,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
                            {focused && (
                                <View style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Attendance"
                component={AttendanceStackNavigator}
                options={{
                    tabBarLabel: 'Attendance',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
                            {focused && (
                                <View style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Leaves"
                component={LeaveStackNavigator}
                options={{
                    tabBarLabel: 'Leaves',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={22} color={color} />
                            {focused && (
                                <View style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Payroll"
                component={PayrollScreen}
                options={{
                    tabBarLabel: 'Salary',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
                            {focused && (
                                <View style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
                            {focused && (
                                <View style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: colors.primary,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};
