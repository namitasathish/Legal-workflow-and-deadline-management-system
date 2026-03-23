export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export function buildTypography(colors) {
    return {
        h1: {
            fontSize: 24,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -0.5,
        },
        h2: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: -0.3,
        },
        h3: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
        },
        subtitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
        body: {
            fontSize: 14,
            fontWeight: '400',
            color: colors.text,
            lineHeight: 20,
        },
        bodyBold: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        caption: {
            fontSize: 12,
            fontWeight: '500',
            color: colors.textSecondary,
        },
        tiny: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
        },
    };
}

export const radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
};

export const theme = {
    spacing,
    radius,
    shadows,
};
