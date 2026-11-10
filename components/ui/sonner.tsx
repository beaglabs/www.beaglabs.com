'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': '#fffaf3',
          '--normal-text': '#1a1714',
          '--normal-border': '#1a1714',
          '--success-bg': '#d9f99d',
          '--success-text': '#1a1714',
          '--success-border': '#1a1714',
          '--error-bg': '#fee2e2',
          '--error-text': '#7f1d1d',
          '--error-border': '#1a1714',
          '--warning-bg': '#fff0a6',
          '--warning-text': '#1a1714',
          '--warning-border': '#1a1714',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
