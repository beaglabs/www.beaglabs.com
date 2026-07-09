import { theme } from './theme'
import type { Part } from '@/data/cookbook/types'
import type { Recipe } from '@/data/cookbook/types'

interface SectionDividerProps {
  part: Part
  recipes: Recipe[]
}

export function PdfSectionDivider({ part, recipes }: SectionDividerProps) {
  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.black,
        color: theme.colors.offWhite,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '25mm 20mm',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: 14,
          fontWeight: theme.weights.mono,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: theme.colors.accent,
          marginBottom: 8,
        }}
      >
        Part {part.order}
      </div>

      <div
        style={{
          width: 60,
          height: 3,
          backgroundColor: theme.colors.accent,
          marginBottom: 20,
        }}
      />

      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: 44,
          fontWeight: theme.weights.heading,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          color: theme.colors.white,
          marginBottom: 16,
        }}
      >
        {part.title}
      </div>

      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: 10,
          fontWeight: theme.weights.body,
          lineHeight: 1.7,
          color: theme.colors.gray,
          marginBottom: 32,
          maxWidth: '70%',
        }}
      >
        {part.description}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {recipes.map((recipe, i) => (
          <div
            key={recipe.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 9,
                fontWeight: theme.weights.mono,
                color: theme.colors.accent,
                width: 24,
                textAlign: 'right',
              }}
            >
              {String(recipe.order).padStart(2, '0')}
            </span>
            <span
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: 10,
                fontWeight: theme.weights.body,
                color: theme.colors.offWhite,
              }}
            >
              {recipe.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
