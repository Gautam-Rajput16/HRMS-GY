import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing } from '../constants/theme';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    message?: string;
    size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    fullScreen = false,
    message,
    size = 'large',
}) => {
    const { colors } = useTheme();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing.lg,
        },
        fullScreenContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        },
        message: {
            marginTop: Spacing.md,
            fontSize: Typography.fontSizes.md,
            color: colors.textSecondary,
        },
    }), [colors]);

    if (fullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <ActivityIndicator size={size} color={colors.primary} />
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
};
