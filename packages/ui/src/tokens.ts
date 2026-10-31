/**
 * Brightloop Design System Tokens
 * Source: Brightloop Subscription Management System — UI-First Implementation
 * Visual Direction: Jet Black canvas, Electric Yellow primary brand accent,
 * Off-white/light neutral legibility text and light data surfaces.
 */

export const colors = {
  // Core Jet Black Canvas
  canvas: {
    black: '#08090d',
    surface: '#0d111a',
    surfaceElevated: '#151b28',
    surfaceHigh: '#1c2436',
    border: '#242f44',
    borderMuted: '#1b2333',
  },

  // Electric Yellow Brand Accent
  electricYellow: {
    DEFAULT: '#fcee21',
    hover: '#edd913',
    active: '#d9c50a',
    light: '#fefb80',
    contrastText: '#000000', // Always pure black on electric yellow for AAA contrast
  },

  // Off-white / High-legibility text & light data reading surfaces
  neutral: {
    white: '#ffffff',
    offWhite: '#f8fafc',
    paper: '#f1f5f9',
    muted: '#94a3b8',
    subtle: '#64748b',
    darkText: '#0f172a',
  },

  // Semantic Status Tokens (paired with icons/labels, never color alone)
  status: {
    draft: {
      bg: 'rgba(100, 116, 139, 0.15)',
      text: '#94a3b8',
      border: 'rgba(100, 116, 139, 0.35)',
      icon: 'file',
    },
    quotation: {
      bg: 'rgba(6, 182, 212, 0.15)',
      text: '#38bdf8',
      border: 'rgba(6, 182, 212, 0.35)',
      icon: 'send',
    },
    confirmed: {
      bg: 'rgba(245, 158, 11, 0.15)',
      text: '#fbbf24',
      border: 'rgba(245, 158, 11, 0.35)',
      icon: 'check-circle',
    },
    active: {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)',
      icon: 'zap',
    },
    closed: {
      bg: 'rgba(148, 163, 184, 0.12)',
      text: '#94a3b8',
      border: 'rgba(148, 163, 184, 0.25)',
      icon: 'archive',
    },
    paid: {
      bg: 'rgba(16, 185, 129, 0.15)',
      text: '#34d399',
      border: 'rgba(16, 185, 129, 0.35)',
      icon: 'shield-check',
    },
    void: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#f87171',
      border: 'rgba(239, 68, 68, 0.35)',
      icon: 'x-circle',
    },
    overdue: {
      bg: 'rgba(225, 29, 72, 0.2)',
      text: '#fb7185',
      border: 'rgba(225, 29, 72, 0.45)',
      icon: 'alert-triangle',
    },
  },

  // Focus Ring
  focus: {
    ring: '#fcee21',
    ringOffset: '#08090d',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
} as const;

export const radius = {
  sm: '0.25rem', // 4px
  md: '0.5rem',  // 8px
  lg: '0.75rem', // 12px
  xl: '1rem',    // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -4px rgba(0, 0, 0, 0.6)',
  glowYellow: '0 0 15px rgba(252, 238, 33, 0.3)',
} as const;
