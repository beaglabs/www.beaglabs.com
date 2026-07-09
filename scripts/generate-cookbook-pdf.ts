import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { parts } from '../data/cookbook/parts'
import { recipes, getRecipesByPart } from '../data/cookbook/recipes'
import { PdfCover } from '../components/cookbook/pdf/cover'
import { PdfToc } from '../components/cookbook/pdf/toc'
import { PdfSectionDivider } from '../components/cookbook/pdf/section-divider'
import { PdfRecipeCard } from '../components/cookbook/pdf/recipe-card'
import { PdfDecisionTree, PdfComputeBudgetGuide, PdfDependencyMap, PdfTimeline } from '../components/cookbook/pdf/bonus-pages'
import { theme } from '../components/cookbook/pdf/theme'

function renderComponent(component: React.ReactElement): string {
  return renderToStaticMarkup(component)
}

async function main() {
  console.log('Generating Beag Labs ML Cookbook 2026...')
  console.log(`  Recipes: ${recipes.length}`)
  console.log(`  Parts: ${parts.length}`)
  console.log()

  const sortedParts = [...parts].sort((a, b) => a.order - b.order)

  const allPages: string[] = []

  allPages.push(renderComponent(React.createElement(PdfCover, { totalRecipes: recipes.length, parts: sortedParts })))

  allPages.push(renderComponent(React.createElement(PdfToc, { parts: sortedParts, allRecipes: recipes })))

  for (const part of sortedParts) {
    const partRecipes = getRecipesByPart(part.id)
    if (partRecipes.length === 0) continue

    allPages.push(
      renderComponent(
        React.createElement(PdfSectionDivider, { part, recipes: partRecipes }),
      ),
    )

    for (const recipe of partRecipes) {
      allPages.push(
        renderComponent(React.createElement(PdfRecipeCard, { recipe })),
      )
    }
  }

  allPages.push(renderComponent(React.createElement(PdfDecisionTree)))
  allPages.push(renderComponent(React.createElement(PdfComputeBudgetGuide)))
  allPages.push(renderComponent(React.createElement(PdfDependencyMap)))
  allPages.push(renderComponent(React.createElement(PdfTimeline)))

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Beag Labs ML Cookbook 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 0; size: A4; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    svg { display: block; }
    ul { margin: 0; padding-left: 14px; }
    li { margin-bottom: 2px; }
  </style>
</head>
<body>
  ${allPages.join('\n')}
</body>
</html>`

  const outDir = resolve(process.cwd(), 'public')
  mkdirSync(outDir, { recursive: true })

  const htmlPath = resolve(outDir, 'cookbook-preview.html')
  writeFileSync(htmlPath, html, 'utf-8')
  console.log(`  HTML preview: ${htmlPath}`)

  console.log('  Launching Playwright...')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } })

  await page.setContent(html, { waitUntil: 'networkidle' })

  const pdfPath = resolve(outDir, 'beag-labs-ml-cookbook-2026.pdf')
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  })

  await browser.close()

  const stats = await import('fs').then((fs) =>
    fs.promises.stat(pdfPath),
  )
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`  PDF: ${pdfPath} (${sizeMB} MB)`)
  console.log()
  console.log('Done!')
}

main().catch((err) => {
  console.error('Failed to generate cookbook PDF:', err)
  process.exit(1)
})
