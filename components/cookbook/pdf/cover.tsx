import { theme } from './theme'
import type { Part } from '@/data/cookbook/types'

interface CoverProps {
  totalRecipes: number
  parts: Part[]
}

export function PdfCover({ totalRecipes, parts }: CoverProps) {
  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.black,
        color: theme.colors.offWhite,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '25mm 20mm',
        pageBreakAfter: 'always',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 10,
            fontWeight: theme.weights.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            color: theme.colors.accent,
            marginBottom: 12,
          }}
        >
          Beag Labs
        </div>

        <div
          style={{
            width: '100%',
            height: 3,
            backgroundColor: theme.colors.accent,
            marginBottom: 20,
          }}
        />

        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 52,
            fontWeight: theme.weights.heading,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: theme.colors.white,
            marginBottom: 8,
          }}
        >
          ML Cookbook
        </div>

        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 52,
            fontWeight: theme.weights.heading,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: theme.colors.accent,
          }}
        >
          2026
        </div>

        <div
          style={{
            width: 80,
            height: 3,
            backgroundColor: theme.colors.accent,
            marginTop: 24,
            marginBottom: 24,
          }}
        />

        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 9,
            fontWeight: theme.weights.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: theme.colors.lightGray,
            lineHeight: 1.6,
          }}
        >
          {totalRecipes} Modern Training Recipes
        </div>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 9,
            fontWeight: theme.weights.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: theme.colors.lightGray,
            lineHeight: 1.6,
          }}
        >
          Every AI Engineer Should Know
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 9,
            fontWeight: theme.weights.body,
            color: theme.colors.gray,
            lineHeight: 1.7,
            marginBottom: 20,
            maxWidth: '70%',
          }}
        >
          A practical collection of state-of-the-art training recipes across{' '}
          {parts.length} domains: language models, vision, 3D generation,
          speech, robotics, agents, and synthetic data.
        </div>

        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 8,
            fontWeight: theme.weights.mono,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            color: theme.colors.gray,
          }}
        >
          {parts.map((p) => p.title).join('  ·  ')}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '25mm',
          right: '25mm',
          width: 32,
          height: 32,
          backgroundColor: theme.colors.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 14,
            fontWeight: theme.weights.mono,
            color: theme.colors.black,
          }}
        >
          B_
        </span>
      </div>
    </div>
  )
}
