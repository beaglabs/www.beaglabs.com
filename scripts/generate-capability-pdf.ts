import { chromium } from "playwright"
import { mkdirSync, readdirSync, readFileSync } from "fs"
import { resolve } from "path"

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000"
const OUT_DIR = resolve(process.cwd(), "public/capabilities")
const SHOTS_DIR = resolve(OUT_DIR, "shots")

const SLUGS = [
  "modernization",
  "spec-drive-development",
  "agent-ux",
  "slm-feasibility",
  "slm-deployment",
] as const

async function captureOne(browser: Awaited<ReturnType<typeof chromium.launch>>, slug: string) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } })
  const dir = resolve(SHOTS_DIR, slug)
  mkdirSync(dir, { recursive: true })

  console.log(`\n→ ${slug}`)
  await page.goto(`${BASE_URL}/capability/${slug}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(2500)

  // Hide site chrome and overlays so they don't bleed into section screenshots
  await page.evaluate(() => {
    // Hide nav, footer, announcement banner, cookie consent
    const nav = document.querySelector("nav")
    if (nav) (nav as HTMLElement).style.display = "none"
    const footer = document.querySelector("footer")
    if (footer) (footer as HTMLElement).style.display = "none"

    // Announcement banner (the one above the nav)
    document.querySelectorAll("[class*='announcement' i]").forEach((el) => {
      ;(el as HTMLElement).style.display = "none"
    })
    // Anything sticky/fixed that isn't the page content
    document.querySelectorAll("[class*='fixed' i], [class*='sticky' i]").forEach((el) => {
      if (!el.closest("section")) {
        ;(el as HTMLElement).style.display = "none"
      }
    })

    // Cookie consent banner — multiple possible selectors
    const cookieSelectors = [
      "[class*='cookie' i]",
      "[id*='cookie' i]",
      "[class*='consent' i]",
      "[id*='consent' i]",
      "[class*='gdpr' i]",
      "[aria-label*='cookie' i]",
      "button[aria-label*='Accept' i]",
    ]
    cookieSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const node = el as HTMLElement
        // Hide the element itself or any close ancestor that wraps a banner
        const banner = node.closest<HTMLElement>(
          "[class*='banner' i], [class*='fixed' i], [class*='bottom' i], [role='dialog']",
        )
        ;(banner ?? node).style.display = "none"
      })
    })

    // Vercel / Next.js dev overlays
    const devOverlay = document.querySelector("nextjs-portal")
    if (devOverlay) (devOverlay as HTMLElement).style.display = "none"
  })
  await page.waitForTimeout(400)

  // Force the page to its full natural height so all sections render correctly
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: 1440, height: Math.max(1080, Math.round(fullHeight)) })
  await page.waitForTimeout(600)

  const sectionCount = await page.evaluate(
    () => document.querySelectorAll("main > section").length,
  )
  console.log(`  ${sectionCount} sections`)

  for (let i = 0; i < sectionCount; i++) {
    const file = resolve(dir, `slide-${String(i).padStart(2, "0")}.png`)
    const el = page.locator("main > section").nth(i)
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    await el.screenshot({ path: file })
    console.log(`    ${i + 1}/${sectionCount} captured`)
  }

  await page.close()
  return dir
}

async function buildPdf(slug: string, shotsDir: string) {
  const files = readdirSync(shotsDir)
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort()

  const slidesHtml = files
    .map((f) => {
      const data = readFileSync(resolve(shotsDir, f))
      const b64 = data.toString("base64")
      return `<div class="page"><img src="data:image/png;base64,${b64}" /></div>`
    })
    .join("\n")

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Beag Labs — ${slug}</title>
<style>
  @page { size: 1440px auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; }
  .page {
    page-break-after: always;
    break-after: page;
    width: 1440px;
  }
  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  img {
    display: block;
    width: 1440px;
    height: auto;
  }
</style>
</head>
<body>
${slidesHtml}
</body>
</html>`

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "load" })
  await page.waitForFunction(
    () => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0),
    { timeout: 30000 },
  )
  await page.waitForTimeout(400)

  const pdfPath = resolve(OUT_DIR, `${slug}.pdf`)
  await page.pdf({
    path: pdfPath,
    width: "1440px",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })
  await browser.close()
  console.log(`  → ${pdfPath.replace(process.cwd() + "/", "")}`)
}

async function main() {
  console.log("Generating Beag Labs capability brief PDFs (image-based)…")
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()

  for (const slug of SLUGS) {
    const shotsDir = await captureOne(browser, slug)
    await buildPdf(slug, shotsDir)
  }

  await browser.close()
  console.log("\nDone. PDFs in public/capabilities/")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
