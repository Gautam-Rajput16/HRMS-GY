// Theme type definitions for IDentix

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
    // Backgrounds
    background: string;
    surface: string;
    card: string;

    // Primary brand
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Accent
    accent: string;
    accentLight: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Borders
    border: string;
    borderLight: string;

    // Input
    inputBackground: string;

    // Status
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    info: string;
    infoLight: string;

    // Special cards
    darkCard: string;
    darkCardText: string;

    // Gradient
    gradientStart: string;
    gradientEnd: string;

    // Overlay
    overlay: string;
    modalOverlay: string;

    // Navigation
    tabBarBackground: string;
    tabBarBorder: string;

    // StatusBar
    statusBarStyle: 'light' | 'dark';

    // Semantic backgrounds (used in specific screens)
    primaryTint: string;      // e.g. blue-tinted bg (#EBF2FF in light)
    accentTint: string;       // e.g. orange-tinted bg (#FFF0E6 in light)
    successTint: string;      // e.g. green-tinted bg (#E8F5E9 in light)
    errorTint: string;        // e.g. red-tinted bg (#FEE2E2 in light)
    warningTint: string;      // e.g. yellow-tinted bg (#FEF3C7 in light)

    // Payroll modal
    earningsBoxBg: string;
    deductionsBoxBg: string;
    breakdownBorder: string;

    // Shadows
    shadowColor: string;
}
