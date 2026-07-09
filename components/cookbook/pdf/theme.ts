export const theme = {
  colors: {
    black: '#111111',
    offWhite: '#FAFAF9',
    white: '#FFFFFF',
    accent: '#FF5F1F',
    accentLight: '#FFF3E6',
    gray: '#555555',
    lightGray: '#999999',
    green: '#E6FFF2',
    blue: '#E6F2FF',
    yellow: '#FFF9E6',
    red: '#FFE6E6',
  },
  fonts: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },
  weights: {
    heading: 800,
    body: 400,
    mono: 700,
    bold: 700,
  },
  border: {
    width: 3,
    color: '#111111',
    radius: 0,
  },
  shadow: {
    x: 6,
    y: 6,
    color: '#111111',
  },
  sizes: {
    page: {
      width: '210mm',
      height: '297mm',
    },
    margin: '15mm',
    coverMargin: '20mm',
  },
} as const

export function borderStyle() {
  return `${theme.border.width}px solid ${theme.border.color}`
}

export function shadowStyle() {
  const s = theme.shadow
  return `${s.x}px ${s.y}px 0px 0px ${s.color}`
}

export function cardStyle(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    border: borderStyle(),
    borderRadius: theme.border.radius,
    boxShadow: shadowStyle(),
    backgroundColor: theme.colors.white,
    ...overrides,
  }
}

export function labelStyle(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    fontFamily: theme.fonts.mono,
    fontSize: 8,
    fontWeight: theme.weights.mono,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    backgroundColor: theme.colors.accent,
    color: theme.colors.black,
    border: borderStyle(),
    padding: '3px 8px',
    display: 'inline-block',
    ...overrides,
  }
}

export function chipStyle(overrides?: React.CSSProperties): React.CSSProperties {
  return {
    fontFamily: theme.fonts.mono,
    fontSize: 7,
    fontWeight: theme.weights.mono,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: theme.colors.black,
    border: `2px solid ${theme.colors.black}`,
    backgroundColor: theme.colors.white,
    boxShadow: `3px 3px 0px 0px ${theme.colors.black}`,
    padding: '2px 7px',
    display: 'inline-block',
    ...overrides,
  }
}
