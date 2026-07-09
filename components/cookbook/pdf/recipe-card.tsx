import React from 'react'
import { theme, borderStyle, shadowStyle, labelStyle, chipStyle } from './theme'
import { PipelineSvg } from './pipeline-svg'
import type { Recipe } from '@/data/cookbook/types'

interface RecipeCardProps {
  recipe: Recipe
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: theme.colors.accent, fontFamily: theme.fonts.sans, fontSize: 9 }}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 10, pageBreakInside: 'avoid' }}>
      <div
        style={{
          fontFamily: theme.fonts.mono,
          fontSize: 7,
          fontWeight: theme.weights.mono,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: theme.colors.accent,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function TagList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((item) => (
        <span key={item} style={chipStyle({ fontSize: 6.5 })}>
          {item}
        </span>
      ))}
    </div>
  )
}

export function PdfRecipeCard({ recipe }: RecipeCardProps) {
  const isTopOfPart = recipe.order === 1
  const columnWidth = '47%'

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: theme.colors.offWhite,
        color: theme.colors.black,
        padding: '14mm 16mm',
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid',
      }}
    >
      <div
        style={{
          border: borderStyle(),
          borderRadius: theme.border.radius,
          boxShadow: shadowStyle(),
          backgroundColor: theme.colors.white,
          padding: '10mm 12mm',
          minHeight: '230mm',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={labelStyle({ fontSize: 6.5, padding: '2px 6px' })}>
                Recipe {String(recipe.order).padStart(2, '0')}
              </span>
              {isTopOfPart && (
                <span style={labelStyle({ fontSize: 6.5, padding: '2px 6px' })}>
                  Part {recipe.part}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: 22,
                fontWeight: theme.weights.heading,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: theme.colors.black,
              }}
            >
              {recipe.title}
            </div>
          </div>

          <div
            style={{
              textAlign: 'right',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 7,
                fontWeight: theme.weights.mono,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme.colors.gray,
                marginBottom: 2,
              }}
            >
              Complexity
            </div>
            <Stars n={recipe.complexity} />
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 7,
                fontWeight: theme.weights.mono,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: theme.colors.gray,
                marginTop: 4,
                marginBottom: 2,
              }}
            >
              Compute
            </div>
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: 8,
                fontWeight: theme.weights.bold,
                color: theme.colors.black,
                maxWidth: 140,
              }}
            >
              {recipe.compute}
            </div>
          </div>
        </div>

        <Section title="Purpose">
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: 9.5,
              fontWeight: theme.weights.body,
              lineHeight: 1.6,
              color: theme.colors.black,
            }}
          >
            {recipe.purpose}
          </div>
        </Section>

        <Section title="Used By">
          <TagList items={recipe.usedBy} />
        </Section>

        <Section title="Core Idea">
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: 9,
              fontWeight: theme.weights.body,
              lineHeight: 1.65,
              color: theme.colors.gray,
            }}
          >
            {recipe.coreIdea}
          </div>
        </Section>

        <Section title="Training Pipeline">
          <PipelineSvg steps={recipe.pipeline} />
        </Section>

        <div
          style={{
            display: 'flex',
            gap: '6%',
            marginBottom: 6,
          }}
        >
          <div style={{ width: columnWidth }}>
            <Section title="Advantages">
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 12,
                  fontFamily: theme.fonts.sans,
                  fontSize: 8.5,
                  lineHeight: 1.65,
                  color: theme.colors.black,
                }}
              >
                {recipe.advantages.map((a) => (
                  <li key={a} style={{ marginBottom: 2 }}>
                    {a}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
          <div style={{ width: columnWidth }}>
            <Section title="Disadvantages">
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 12,
                  fontFamily: theme.fonts.sans,
                  fontSize: 8.5,
                  lineHeight: 1.65,
                  color: theme.colors.gray,
                }}
              >
                {recipe.disadvantages.map((d) => (
                  <li key={d} style={{ marginBottom: 2 }}>
                    {d}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '6%',
            flex: 1,
          }}
        >
          <div style={{ width: columnWidth }}>
            <Section title="Best For">
              <TagList items={recipe.worksBestFor} />
            </Section>

            {recipe.variants && recipe.variants.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <Section title="Variants">
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 12,
                      fontFamily: theme.fonts.sans,
                      fontSize: 8.5,
                      lineHeight: 1.65,
                      color: theme.colors.gray,
                    }}
                  >
                    {recipe.variants.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </Section>
              </div>
            )}
          </div>

          <div style={{ width: columnWidth }}>
            <Section title="Key Papers">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                {recipe.keyPapers.map((paper, i) => (
                  <div
                    key={paper.url}
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: 7.5,
                      lineHeight: 1.4,
                      color: theme.colors.gray,
                    }}
                  >
                    <span
                      style={{
                        color: theme.colors.accent,
                        fontFamily: theme.fonts.mono,
                        fontSize: 7,
                        fontWeight: theme.weights.mono,
                      }}
                    >
                      [{i + 1}]{' '}
                    </span>
                    {paper.title}
                    {paper.authors && (
                      <span style={{ color: theme.colors.lightGray }}>
                        {' '}— {paper.authors}
                      </span>
                    )}
                    {paper.year && (
                      <span style={{ color: theme.colors.lightGray }}>
                        , {paper.year}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            <div style={{ marginTop: 10 }}>
              <Section title="Open Source">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {recipe.openSource.map((url) => (
                    <div
                      key={url}
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: 7,
                        lineHeight: 1.5,
                        color: theme.colors.gray,
                      }}
                    >
                      {url}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>

        <Section title="Common Mistakes">
          <ul
            style={{
              margin: 0,
              paddingLeft: 12,
              fontFamily: theme.fonts.sans,
              fontSize: 8.5,
              lineHeight: 1.6,
              color: theme.colors.gray,
              fontStyle: 'italic',
            }}
          >
            {recipe.commonMistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Section>

        {recipe.futureDirections && (
          <Section title="Future Directions">
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: 8.5,
                lineHeight: 1.6,
                color: theme.colors.gray,
              }}
            >
              {recipe.futureDirections}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
