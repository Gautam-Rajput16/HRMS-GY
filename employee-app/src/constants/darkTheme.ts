import { ThemeColors } from './themeTypes';

// Futuristic Dark Theme — Deep space navy with electric blue accents
export const darkColors: ThemeColors = {
    // Backgrounds — layered depth with subtle blue undertone
    background: '#0B1121',       // Deep space navy
    surface: '#111B2E',          // Slightly elevated surface
    card: '#162036',             // Card panels with visible lift

    // Primary brand — electric blue, brighter to pop on dark
    primary: '#3B82F6',
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    primaryDark: '#2563EB',

    // Accent — warm glow
    accent: '#FB923C',
    accentLight: 'rgba(251, 146, 60, 0.15)',

    // Text — high contrast for readability
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0B1121',

    // Borders — subtle glow lines
    border: '#1E293B',
    borderLight: '#1A2332',

    // Input
    inputBackground: '#162036',

    // Status — vivid neon-style status colors
    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.15)',
    warning: '#FBBF24',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    error: '#F87171',
    errorLight: 'rgba(248, 113, 113, 0.15)',
    info: '#60A5FA',
    infoLight: 'rgba(96, 165, 250, 0.15)',

    // Special cards
    darkCard: '#1E293B',
    darkCardText: '#F1F5F9',

    // Gradient — electric blue sweep
    gradientStart: '#3B82F6',
    gradientEnd: '#1D4ED8',

    // Overlay
    overlay: 'rgba(255,255,255,0.04)',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',

    // Navigation — glass-like tab bar
    tabBarBackground: '#111B2E',
    tabBarBorder: '#1E293B',

    // StatusBar
    statusBarStyle: 'light',

    // Semantic tints — subtle glows
    primaryTint: 'rgba(59, 130, 246, 0.12)',
    accentTint: 'rgba(251, 146, 60, 0.12)',
    successTint: 'rgba(52, 211, 153, 0.12)',
    errorTint: 'rgba(248, 113, 113, 0.12)',
    warningTint: 'rgba(251, 191, 36, 0.12)',

    // Payroll modal
    earningsBoxBg: 'rgba(52, 211, 153, 0.1)',
    deductionsBoxBg: 'rgba(248, 113, 113, 0.1)',
    breakdownBorder: 'rgba(255,255,255,0.06)',

    // Shadows
    shadowColor: '#000',
};
