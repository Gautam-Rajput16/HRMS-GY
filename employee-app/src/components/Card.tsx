import React, { useMemo, ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius, Shadows } from '../constants/theme';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'elevated',
    padding = 'medium',
}) => {
    const { colors } = useTheme();

    const styles = useMemo(() => StyleSheet.create({
        card: {
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.lg,
        },
        card_elevated: {
            shadowColor: colors.shadowColor,
            ...Shadows.md,
        },
        card_outlined: {
            borderWidth: 1,
            borderColor: colors.border,
        },
        padding_none: {
            padding: 0,
        },
        padding_small: {
            padding: Spacing.sm,
        },
        padding_medium: {
            padding: Spacing.md,
        },
        padding_large: {
            padding: Spacing.lg,
        },
    }), [colors]);

    const getCardStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            ...styles.card,
            ...styles[`padding_${padding}`],
        };

        switch (variant) {
            case 'outlined':
                return { ...baseStyle, ...styles.card_outlined };
            case 'elevated':
                return { ...baseStyle, ...styles.card_elevated };
            default:
                return baseStyle;
        }
    };

    return <View style={[getCardStyle(), style]}>{children}</View>;
};
