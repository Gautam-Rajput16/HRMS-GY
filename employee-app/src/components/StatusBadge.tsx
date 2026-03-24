import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../constants/theme';

type StatusType = 'present' | 'incomplete' | 'absent' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'draft' | 'processed' | 'paid' | 'not_marked';

interface StatusBadgeProps {
    status: StatusType;
    size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
    const { colors } = useTheme();

    const statusConfig: Record<StatusType, { label: string; bgColor: string; textColor: string }> = useMemo(() => ({
        present: { label: 'Present', bgColor: colors.successLight, textColor: colors.success },
        incomplete: { label: 'Incomplete', bgColor: colors.warningLight, textColor: colors.warning },
        absent: { label: 'Absent', bgColor: colors.errorLight, textColor: colors.error },
        not_marked: { label: 'Not Marked', bgColor: colors.background, textColor: colors.textMuted },
        pending: { label: 'Pending', bgColor: colors.warningLight, textColor: colors.warning },
        approved: { label: 'Approved', bgColor: colors.successLight, textColor: colors.success },
        rejected: { label: 'Rejected', bgColor: colors.errorLight, textColor: colors.error },
        cancelled: { label: 'Cancelled', bgColor: colors.background, textColor: colors.textMuted },
        draft: { label: 'Draft', bgColor: colors.background, textColor: colors.textMuted },
        processed: { label: 'Processed', bgColor: colors.infoLight, textColor: colors.info },
        paid: { label: 'Paid', bgColor: colors.successLight, textColor: colors.success },
    }), [colors]);

    const config = statusConfig[status] || statusConfig.pending;

    const styles = useMemo(() => StyleSheet.create({
        badge: {
            paddingVertical: Spacing.xs,
            paddingHorizontal: Spacing.sm,
            borderRadius: BorderRadius.full,
            alignSelf: 'flex-start',
        },
        badge_small: {
            paddingVertical: 2,
            paddingHorizontal: Spacing.xs,
        },
        text: {
            fontSize: Typography.fontSizes.sm,
            fontWeight: Typography.fontWeights.medium,
        },
        text_small: {
            fontSize: Typography.fontSizes.xs,
        },
    }), []);

    return (
        <View
            style={[
                styles.badge,
                { backgroundColor: config.bgColor },
                size === 'small' && styles.badge_small,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    { color: config.textColor },
                    size === 'small' && styles.text_small,
                ]}
            >
                {config.label}
            </Text>
        </View>
    );
};
