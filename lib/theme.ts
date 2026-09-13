/**
 * App colors and theme definitions.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
    },
};

export const Fonts = Platform.select({
    ios: {
        sans: 'system-ui',
        serif: 'ui-serif',
        rounded: 'ui-rounded',
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded:
            "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});

export const THEME = {
    light: {
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 3.9%)',
        card: 'hsl(0 0% 100%)',
        cardForeground: 'hsl(0 0% 3.9%)',
        popover: 'hsl(0 0% 100%)',
        popoverForeground: 'hsl(0 0% 3.9%)',
        primary: 'hsl(0 0% 9%)',
        primaryForeground: 'hsl(0 0% 98%)',
        secondary: 'hsl(0 0% 96.1%)',
        secondaryForeground: 'hsl(0 0% 9%)',
        muted: 'hsl(0 0% 96.1%)',
        mutedForeground: 'hsl(0 0% 45.1%)',
        accent: 'hsl(0 0% 96.1%)',
        accentForeground: 'hsl(0 0% 9%)',
        destructive: 'hsl(0 84.2% 60.2%)',
        border: 'hsl(0 0% 89.8%)',
        input: 'hsl(0 0% 89.8%)',
        ring: 'hsl(0 0% 63%)',
        radius: '0.625rem',
        chart1: 'hsl(12 76% 61%)',
        chart2: 'hsl(173 58% 39%)',
        chart3: 'hsl(197 37% 24%)',
        chart4: 'hsl(43 74% 66%)',
        chart5: 'hsl(27 87% 67%)',
    },

    dark: {
        background: 'hsl(0 0% 3.9%)',
        foreground: 'hsl(0 0% 98%)',
        card: 'hsl(0 0% 3.9%)',
        cardForeground: 'hsl(0 0% 98%)',
        popover: 'hsl(0 0% 3.9%)',
        popoverForeground: 'hsl(0 0% 98%)',
        primary: 'hsl(0 0% 98%)',
        primaryForeground: 'hsl(0 0% 9%)',
        secondary: 'hsl(0 0% 14.9%)',
        secondaryForeground: 'hsl(0 0% 98%)',
        muted: 'hsl(0 0% 14.9%)',
        mutedForeground: 'hsl(0 0% 63.9%)',
        accent: 'hsl(0 0% 14.9%)',
        accentForeground: 'hsl(0 0% 98%)',
        destructive: 'hsl(0 70.9% 59.4%)',
        border: 'hsl(0 0% 14.9%)',
        input: 'hsl(0 0% 14.9%)',
        ring: 'hsl(300 0% 45%)',
        radius: '0.625rem',
        chart1: 'hsl(220 70% 50%)',
        chart2: 'hsl(160 60% 45%)',
        chart3: 'hsl(30 80% 55%)',
        chart4: 'hsl(280 65% 60%)',
        chart5: 'hsl(340 75% 55%)',
    },
};

/**
 * Navigation theme colors.
 *
 * Kept independent from React Navigation so this file
 * can be used with Expo Router without importing
 * @react-navigation/native.
 */
export const NAV_THEME = {
    light: {
        colors: {
            background: THEME.light.background,
            border: THEME.light.border,
            card: THEME.light.card,
            notification: THEME.light.destructive,
            primary: THEME.light.primary,
            text: THEME.light.foreground,
        },
    },

    dark: {
        colors: {
            background: THEME.dark.background,
            border: THEME.dark.border,
            card: THEME.dark.card,
            notification: THEME.dark.destructive,
            primary: THEME.dark.primary,
            text: THEME.dark.foreground,
        },
    },
} as const;
