import React, { useState, useMemo } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

interface InputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    error?: string;
    disabled?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    style?: ViewStyle;
    inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    error,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    autoCapitalize = 'none',
    style,
    inputStyle,
}) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const styles = useMemo(() => StyleSheet.create({
        container: {
            marginBottom: Spacing.md,
        },
        label: {
            fontSize: Typography.fontSizes.sm,
            fontWeight: Typography.fontWeights.medium,
            color: colors.textPrimary,
            marginBottom: Spacing.xs,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBackground,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
        },
        inputContainer_focused: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        inputContainer_error: {
            borderColor: colors.error,
            borderWidth: 2,
        },
        inputContainer_disabled: {
            backgroundColor: colors.background,
            opacity: 0.6,
        },
        input: {
            flex: 1,
            fontSize: Typography.fontSizes.md,
            color: colors.textPrimary,
            paddingVertical: Spacing.md,
        },
        input_multiline: {
            minHeight: 100,
            textAlignVertical: 'top',
        },
        eyeButton: {
            padding: Spacing.xs,
        },
        eyeText: {
            fontSize: 20,
        },
        errorText: {
            fontSize: Typography.fontSizes.sm,
            color: colors.error,
            marginTop: Spacing.xs,
        },
    }), [colors]);

    const getInputContainerStyle = (): ViewStyle => {
        if (error) {
            return { ...styles.inputContainer, ...styles.inputContainer_error };
        }
        if (isFocused) {
            return { ...styles.inputContainer, ...styles.inputContainer_focused };
        }
        if (disabled) {
            return { ...styles.inputContainer, ...styles.inputContainer_disabled };
        }
        return styles.inputContainer;
    };

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={getInputContainerStyle()}>
                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.input_multiline,
                        inputStyle,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secureTextEntry && !showPassword}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                    >
                        <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};
