/**
 * App color palette - clean modern UI
 */
export const lightColors = {
  // Brand Colors
  primary: '#4f46e5', // Indigo 600
  primaryLight: '#818cf8', // Indigo 400
  primaryDark: '#3730a3', // Indigo 800
  indigo50: '#eef2ff',
  indigo400: '#818cf8',
  indigo600: '#4f46e5',

  // Neutral Colors (Slate)
  background: '#f8fafc',
  surface: '#ffffff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate950: '#020617',

  // UI Semantics
  text: '#1e293b', // Slate 800
  textSecondary: '#64748b', // Slate 500
  border: '#e2e8f0', // Slate 200
  divider: '#f1f5f9', // Slate 100

  // Contextual
  success: '#10b981', // Emerald 500
  successLight: '#dcfce7',
  warning: '#f59e0b', // Amber 500
  warningLight: '#fef3c7',
  error: '#ef4444',   // Red 500
  errorLight: '#fee2e2',
  info: '#3b82f6',    // Blue 500
  infoLight: '#dbeafe',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const darkColors = {
  // Brand Colors
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4338ca',
  indigo50: '#312e81',
  indigo400: '#818cf8',
  indigo600: '#6366f1',

  // Neutral Colors (Slate Flipped)
  background: '#0f172a',
  surface: '#1e293b',
  slate50: '#020617',
  slate100: '#0f172a',
  slate200: '#1e293b',
  slate300: '#334155',
  slate400: '#475569',
  slate500: '#64748b',
  slate600: '#94a3b8',
  slate700: '#cbd5e1',
  slate800: '#f1f5f9',
  slate950: '#f8fafc',

  // UI Semantics
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#334155',
  divider: '#1e293b',

  // Contextual (Dark Mode Tints)
  success: '#10b981',
  successLight: '#064e3b',
  warning: '#f59e0b',
  warningLight: '#78350f',
  error: '#ef4444',
  errorLight: '#7f1d1d',
  info: '#3b82f6',
  infoLight: '#1e3a8a',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Fallback for unmigrated specific non-contextual components
export const colors = lightColors;
