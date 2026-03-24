import type { ElementType } from 'react';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: ElementType;
    color: 'blue' | 'green' | 'red' | 'orange' | 'purple';
}

const colorConfig = {
    blue: {
        borderColor: '#6366f1',
        bgColor: '#eef2ff',
        iconColor: '#4f46e5',
    },
    green: {
        borderColor: '#22c55e',
        bgColor: '#f0fdf4',
        iconColor: '#16a34a',
    },
    red: {
        borderColor: '#ef4444',
        bgColor: '#fef2f2',
        iconColor: '#dc2626',
    },
    orange: {
        borderColor: '#f97316',
        bgColor: '#fff7ed',
        iconColor: '#ea580c',
    },
    purple: {
        borderColor: '#8b5cf6',
        bgColor: '#f5f3ff',
        iconColor: '#7c3aed',
    },
};

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
    const colors = colorConfig[color];

    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${colors.borderColor}`,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                padding: '16px',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                    <p style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        {title}
                    </p>
                    <p style={{
                        fontSize: typeof value === 'string' && value.length > 10 ? '22px' : '28px',
                        fontWeight: 700,
                        color: '#111827',
                        marginTop: '4px',
                    }}>
                        {value}
                    </p>
                    {subtitle && (
                        <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginTop: '4px',
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div
                    style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        backgroundColor: colors.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Icon style={{ width: '22px', height: '22px', color: colors.iconColor }} />
                </div>
            </div>
        </div>
    );
}
