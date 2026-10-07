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
          '--normal-bg': '#ffffff',
          '--normal-text': '#111111',
          '--normal-border': '#111111',
          '--success-bg': '#d9f99d',
          '--success-text': '#111111',
          '--success-border': '#111111',
          '--error-bg': '#fee2e2',
          '--error-text': '#7f1d1d',
          '--error-border': '#111111',
          '--warning-bg': '#fff0a6',
          '--warning-text': '#111111',
          '--warning-border': '#111111',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
