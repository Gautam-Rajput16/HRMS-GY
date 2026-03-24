import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const { colors } = useTheme();
    const isDisabled = disabled || loading;

    const styles = useMemo(() => StyleSheet.create({
        button: {
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BorderRadius.lg,
        },
        button_small: {
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            minHeight: 36,
        },
        button_medium: {
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            minHeight: 48,
        },
        button_large: {
            paddingVertical: Spacing.lg,
            paddingHorizontal: Spacing.xl,
            minHeight: 56,
        },
        button_primary: {
            backgroundColor: colors.primary,
        },
        button_secondary: {
            backgroundColor: colors.accent,
        },
        button_danger: {
            backgroundColor: colors.error,
        },
        button_outline: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.primary,
        },
        button_disabled: {
            backgroundColor: colors.border,
            opacity: 0.6,
        },
        text: {
            color: colors.textInverse,
            fontWeight: Typography.fontWeights.semibold,
        },
        text_small: {
            fontSize: Typography.fontSizes.sm,
        },
        text_medium: {
            fontSize: Typography.fontSizes.md,
        },
        text_large: {
            fontSize: Typography.fontSizes.lg,
        },
    }), [colors]);

    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            ...styles.button,
            ...styles[`button_${size}`],
        };

        if (isDisabled) {
            return { ...baseStyle, ...styles.button_disabled };
        }

        switch (variant) {
            case 'secondary':
                return { ...baseStyle, ...styles.button_secondary };
            case 'danger':
                return { ...baseStyle, ...styles.button_danger };
            case 'outline':
                return { ...baseStyle, ...styles.button_outline };
            default:
                return { ...baseStyle, ...styles.button_primary };
        }
    };

    const getTextStyle = (): TextStyle => {
        const baseStyle: TextStyle = {
            ...styles.text,
            ...styles[`text_${size}`],
        };

        if (variant === 'outline') {
            return { ...baseStyle, color: colors.primary };
        }

        return baseStyle;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            style={[getButtonStyle(), style]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textInverse} />
            ) : (
                <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};
