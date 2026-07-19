import { chromium } from "playwright"
import { mkdirSync, writeFileSync, unlinkSync, readdirSync } from "fs"
import { resolve } from "path"

const BASE_URL = "http://localhost:3000"
const OUT_DIR = resolve(process.cwd(), "public/pitch")
const SHOTS_DIR = resolve(OUT_DIR, "shots")

async function main() {
  console.log("Generating Beag Labs raise PDF pitch deck...")
  mkdirSync(SHOTS_DIR, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } })

  await page.goto(`${BASE_URL}/raise`, { waitUntil: "networkidle" })
  await page.waitForTimeout(2000)

  // Hide nav/footer so they don't interfere with layout
  await page.evaluate(() => {
    const nav = document.querySelector("nav")
    if (nav) nav.style.display = "none"
    const footer = document.querySelector("footer")
    if (footer) footer.style.display = "none"
  })
  await page.waitForTimeout(500)

  // Set viewport tall to minimize reflow between screenshots
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: 1440, height: Math.round(fullHeight) })
  await page.waitForTimeout(500)

  const sectionCount = await page.evaluate(() => document.querySelectorAll("section").length)
  console.log(`  Capturing ${sectionCount} slides via element screenshots...`)

  for (let i = 0; i < sectionCount; i++) {
    const filePath = resolve(SHOTS_DIR, `slide-${String(i).padStart(2, "0")}.png`)

    const el = page.locator("section").nth(i)
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    const box = await el.boundingBox()

    await el.screenshot({ path: filePath })
    const label = `slide-${String(i).padStart(2, "0")}.png`
    console.log(`    ${i + 1}/${sectionCount} — ${label} (${Math.round(box?.height || 0)}px)`)
  }

  await browser.close()

  // Build PDF from images
  const imageFiles = readdirSync(SHOTS_DIR)
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort()

  const slidesHtml = imageFiles
    .map(
      (f) =>
        `<div class="page"><img src="shots/${f}" /></div>`
    )
    .join("\n")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 0; size: A4; }
    html, body { width: 210mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
    .page {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .page img {
      display: block;
      max-width: 210mm;
      max-height: 297mm;
      object-fit: contain;
    }
  </style>
</head>
<body>
${slidesHtml}
</body>
</html>`

  const htmlPath = resolve(OUT_DIR, "raise-deck.html")
  writeFileSync(htmlPath, html, "utf-8")

  const pdfBrowser = await chromium.launch()
  const pdfPage = await pdfBrowser.newPage()
  await pdfPage.goto(`file://${htmlPath}`, { waitUntil: "networkidle" })
  await pdfPage.waitForTimeout(500)

  const pdfPath = resolve(OUT_DIR, "beaglabs-raise-deck.pdf")
  await pdfPage.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  })

  await pdfBrowser.close()

  // Cleanup
  for (const f of imageFiles) {
    unlinkSync(resolve(SHOTS_DIR, f))
  }
  try { unlinkSync(htmlPath) } catch {}

  const stats = await import("fs").then((fs) => fs.promises.stat(pdfPath))
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`  PDF: ${pdfPath} (${sizeMB} MB)`)
  console.log("Done!")
}

main().catch((err) => {
  console.error("Failed to generate raise PDF:", err)
  process.exit(1)
})
