import { theme, borderStyle, shadowStyle, labelStyle } from './theme'
import type { Part } from '@/data/cookbook/types'
import type { Recipe } from '@/data/cookbook/types'
import { getRecipesByPart } from '@/data/cookbook/recipes'

interface TocProps {
  parts: Part[]
  allRecipes: Recipe[]
}

export function PdfToc({ parts, allRecipes }: TocProps) {
  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.offWhite,
        padding: '14mm 16mm',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          border: borderStyle(),
          borderRadius: theme.border.radius,
          boxShadow: shadowStyle(),
          backgroundColor: theme.colors.white,
          padding: '10mm 12mm',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 26,
            fontWeight: theme.weights.heading,
            letterSpacing: '-0.04em',
            color: theme.colors.black,
            marginBottom: 20,
          }}
        >
          Contents
        </div>

        {parts.map((part) => {
          const partRecipes = getRecipesByPart(part.id)

          return (
            <div key={part.id} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span style={labelStyle({ fontSize: 6.5, padding: '2px 6px' })}>
                  Part {part.order}
                </span>
                <span
                  style={{
                    fontFamily: theme.fonts.sans,
                    fontSize: 13,
                    fontWeight: theme.weights.heading,
                    letterSpacing: '-0.02em',
                    color: theme.colors.black,
                  }}
                >
                  {part.title}
                </span>
                <span
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: 7,
                    color: theme.colors.lightGray,
                    fontWeight: theme.weights.mono,
                  }}
                >
                  {partRecipes.length} recipes
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  marginLeft: 80,
                }}
              >
                {partRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: 7,
                        fontWeight: theme.weights.mono,
                        color: theme.colors.accent,
                        width: 20,
                        textAlign: 'right',
                      }}
                    >
                      {String(recipe.order).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: 9,
                        color: theme.colors.black,
                      }}
                    >
                      {recipe.title}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: 6,
                        color: theme.colors.lightGray,
                        fontWeight: theme.weights.mono,
                      }}
                    >
                      {'★'.repeat(recipe.complexity)}
                      {'☆'.repeat(5 - recipe.complexity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div
          style={{
            marginTop: 'auto',
            border: borderStyle(),
            borderRadius: theme.border.radius,
            backgroundColor: theme.colors.black,
            padding: '7mm 9mm',
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: 7,
              fontWeight: theme.weights.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: theme.colors.accent,
              marginBottom: 6,
            }}
          >
            Bonus Materials
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 7.5,
              fontWeight: theme.weights.mono,
              color: theme.colors.offWhite,
              lineHeight: 1.8,
            }}
          >
            <span style={{ color: theme.colors.accent }}>✦</span> Decision Tree
            &nbsp;&nbsp;&nbsp;
            <span style={{ color: theme.colors.accent }}>✦</span> Compute Budget Guide
            &nbsp;&nbsp;&nbsp;
            <span style={{ color: theme.colors.accent }}>✦</span> Dependency Map
            &nbsp;&nbsp;&nbsp;
            <span style={{ color: theme.colors.accent }}>✦</span> Timeline of Paradigms
          </div>
        </div>
      </div>
    </div>
  )
}
