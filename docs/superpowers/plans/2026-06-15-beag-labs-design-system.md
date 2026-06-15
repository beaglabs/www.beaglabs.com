# Beag Labs Design System & Enterprise Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Beag Labs homepage with a cohesive academic-minimal design system — restrained, institutional, flat — inspired by Anthropic.com.

**Architecture:** Update the CSS design tokens, then refactor each component bottom-up (Footer → Capabilities → Projects → Hero → Navbar), finally wiring them together in page.tsx. Each component gets the new color palette, typography, and spacing. No new dependencies needed.

**Tech Stack:** Next.js 16.2, React 19.2, Tailwind CSS v4, shadcn/ui, Radix primitives, Paper Design shaders, Lucide icons

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/globals.css` | Modify | Design tokens (colors, typography, radii) |
| `components/site-footer.tsx` | Modify | Footer with logo, link columns, copyright |
| `components/capabilities-section.tsx` | Modify | Capabilities section (no icons, numbers only) |
| `components/projects-section.tsx` | Create (replace `approach-section.tsx`) | Projects section with refined card |
| `components/hero-section.tsx` | Modify | Hero with refined typography, pill CTAs |
| `components/navbar.tsx` | Modify | Navbar with pill CTA, Inter links |
| `app/page.tsx` | Modify | Wire up renamed import |

---

### Task 1: Update Design Tokens in CSS

**Files:**
- Modify: `app/globals.css` (full file)

- [ ] **Step 1: Replace the CSS custom properties and theme block**

Replace the entire contents of `app/globals.css` with the new design tokens:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: #FAFAF9;
  --foreground: #111111;
  --card: #ffffff;
  --card-foreground: #111111;
  --popover: #ffffff;
  --popover-foreground: #111111;
  --primary: #111111;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f5;
  --secondary-foreground: #111111;
  --muted: #555555;
  --muted-foreground: #999999;
  --accent: #8B7355;
  --accent-foreground: #ffffff;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --border: rgba(0,0,0,0.06);
  --input: rgba(0,0,0,0.06);
  --ring: #8B7355;
  --chart-1: #FF5F1F;
  --chart-2: #8B7355;
  --chart-3: #555555;
  --chart-4: #111111;
  --chart-5: #999999;
  --radius: 0.625rem;
  --sidebar: #FAFAF9;
  --sidebar-foreground: #111111;
  --sidebar-primary: #111111;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f5f5f5;
  --sidebar-accent-foreground: #111111;
  --sidebar-border: rgba(0,0,0,0.06);
  --sidebar-ring: #8B7355;
}

@theme inline {
  --font-sans: var(--font-sans), 'Inter', sans-serif;
  --font-mono: var(--font-mono), 'JetBrains Mono', monospace;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  ::selection {
    background: #FF5F1F;
    color: #ffffff;
  }
}
```

- [ ] **Step 2: Verify the dev server picks up the changes**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`
Expected: Server starts without CSS errors. Page renders with warm off-white background.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: update design tokens to academic minimal palette

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Refactor Footer with Link Columns

**Files:**
- Modify: `components/site-footer.tsx` (full file)

- [ ] **Step 1: Replace the footer component**

Replace the entire contents of `components/site-footer.tsx`:

```tsx
"use client"

import Image from "next/image"
import Link from "next/link"

const footerColumns = [
  {
    title: "Products",
    links: [
      { label: "Dataset Generation", href: "#services" },
      { label: "Robotics", href: "#services" },
      { label: "Fine-Tuning", href: "#services" },
      { label: "SLM Curation", href: "#services" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Research", href: "#" },
      { label: "GitHub", href: "https://github.com/beaglabs" },
      { label: "Contact", href: "https://cal.com/comradelemoncake/meet-the-founder" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-white py-16 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        {/* Top: Logo + Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Logo column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="Beag Labs"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-sm font-medium tracking-[-0.01em] text-[#111]">
                Beag Labs
              </span>
            </div>
            <p className="text-sm text-[#555] leading-relaxed max-w-xs">
              Applied AI research lab and consulting studio.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="text-[13px] font-medium text-[#111] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#555] hover:text-[#111] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[rgba(0,0,0,0.06)] flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#999]">
            &copy; 2026 BEAG LABS. ALL RIGHTS RESERVED.
          </p>
          <a
            href="https://github.com/beaglabs"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] tracking-[0.15em] text-[#999] hover:text-[#111] transition-colors duration-200"
          >
            GITHUB
          </a>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Verify the footer renders**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`
Check: Navigate to the page, scroll to footer. Three link columns visible on desktop. Logo + tagline present.

- [ ] **Step 3: Commit**

```bash
git add components/site-footer.tsx
git commit -m "feat: rebuild footer with multi-column link grid

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Refactor Capabilities Section

**Files:**
- Modify: `components/capabilities-section.tsx` (full file)

- [ ] **Step 1: Replace the capabilities section component**

Replace the entire contents of `components/capabilities-section.tsx`:

```tsx
"use client"

const services = [
  {
    id: "01",
    title: "Dataset Generation",
    description: "High-fidelity synthetic and curated datasets engineered for your domain. We build the data pipelines that make better models possible.",
  },
  {
    id: "02",
    title: "Robotics",
    description: "Perception, planning, and control systems. We bring AI out of the cloud and into physical environments with production-grade reliability.",
  },
  {
    id: "03",
    title: "Fine-Tuning",
    description: "Foundation model specialization for your domain. We deliver models that understand your data, your constraints, and your infrastructure requirements.",
  },
  {
    id: "04",
    title: "SLM Curation",
    description: "Evaluation, selection, and deployment of efficient small language models. Right-sized intelligence for your specific use case.",
  },
]

export function CapabilitiesSection() {
  return (
    <section id="services" className="relative bg-white py-24 lg:py-28 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
              Capabilities
            </div>
            <h2 className="text-[28px] lg:text-[32px] font-medium text-[#111] tracking-[-0.02em] leading-[1.2]">
              Research-driven
              <br />
              AI services
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-7 flex items-end">
            <p className="text-[15px] text-[#555] leading-[1.75]">
              Every engagement is grounded in rigorous methodology. We don&apos;t apply off-the-shelf solutions — we engineer systems tailored to your problem space, your data, and your operational constraints.
            </p>
          </div>
        </div>

        {/* Service grid — 2x2 with subtle separators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.06)]">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white p-10 group hover:bg-[#FAFAF9] transition-colors duration-200"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[11px] text-[#999]">
                  {service.id}
                </span>
              </div>
              <h3 className="text-[16px] font-medium text-[#111] mb-3 tracking-[-0.01em]">
                {service.title}
              </h3>
              <p className="text-[13px] text-[#555] leading-[1.75]">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify the capabilities section renders**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`
Check: Section renders with "Capabilities" warm taupe label, medium-weight heading, 2×2 grid with mono ID numbers (no icon boxes).

- [ ] **Step 3: Commit**

```bash
git add components/capabilities-section.tsx
git commit -m "feat: refine capabilities section with academic minimal style

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Create Projects Section (replaces ApproachSection)

**Files:**
- Create: `components/projects-section.tsx`
- Modify: `app/page.tsx` (import change)

- [ ] **Step 1: Create the new projects section component**

Create `components/projects-section.tsx`:

```tsx
"use client"

import { ArrowUpRight } from "lucide-react"
import Image from "next/image"

export function ProjectsSection() {
  return (
    <section id="projects" className="relative bg-[#FAFAF9] py-24 lg:py-28 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
              Projects
            </div>
            <h2 className="text-[28px] lg:text-[32px] font-medium text-[#111] tracking-[-0.02em] leading-[1.2]">
              What we&apos;re
              <br />
              building
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-7 flex items-end">
            <p className="text-[15px] text-[#555] leading-[1.75]">
              Open platforms and tools that advance AI research infrastructure.
            </p>
          </div>
        </div>

        {/* Project card */}
        <a
          href="https://chaveta.beaglabs.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.10)] transition-colors duration-300"
        >
          <div className="p-10 lg:p-14">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <Image
                  src="/chavetalogo.png"
                  alt="Chaveta"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain flex-shrink-0"
                />
                <div>
                  <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
                    Active &mdash; 2026
                  </div>
                  <h3 className="text-2xl lg:text-[28px] font-medium text-[#111] tracking-[-0.02em] mb-4">
                    Chaveta
                  </h3>
                  <p className="text-[15px] text-[#555] leading-[1.75] max-w-2xl">
                    Agentic platform for curating synthetic datasets for training and robotics.
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#999] group-hover:text-[#FF5F1F] transition-colors flex-shrink-0 mt-2" />
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Update page.tsx import**

In `app/page.tsx`, change the import:

```tsx
// Change this line:
import { ApproachSection } from "@/components/approach-section"
// To:
import { ProjectsSection } from "@/components/projects-section"
```

And change the component usage from `<ApproachSection />` to `<ProjectsSection />`.

- [ ] **Step 3: Remove the old approach-section file**

Run: `rm /Users/jdbohrman/www.beaglabs.com/components/approach-section.tsx`

- [ ] **Step 4: Verify the projects section renders**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`
Check: Section renders with "Projects" warm taupe label, Chaveta card with subtle border, arrow turns orange on hover.

- [ ] **Step 5: Commit**

```bash
git add components/projects-section.tsx components/approach-section.tsx app/page.tsx
git commit -m "feat: replace approach section with refined projects section

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Refactor Hero Section

**Files:**
- Modify: `components/hero-section.tsx` (full file)

- [ ] **Step 1: Replace the hero section component**

Replace the entire contents of `components/hero-section.tsx`:

```tsx
"use client"

import { Dithering } from "@paper-design/shaders-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#FAFAF9] flex items-center overflow-hidden pt-14">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="herogrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#0a0a0a" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#herogrid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left column */}
          <div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-8 font-medium">
              Applied AI Research Laboratory
            </div>

            <h1 className="text-[44px] lg:text-[56px] font-medium tracking-[-0.025em] leading-[1.12] text-[#111] mb-8">
              We advance the
              <br />
              frontier of artificial
              <br />
              intelligence.
            </h1>

            <p className="text-base text-[#555] max-w-[440px] leading-[1.75] mb-10">
              Beag Labs is an AI research lab and consulting studio. We build datasets, train models, and deploy intelligent systems — from robotics to language model fine-tuning.
            </p>

            <div className="flex items-center gap-6">
              <a
                href="https://cal.com/comradelemoncake/meet-the-founder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-sm font-medium text-white bg-[#111] hover:bg-[#333] px-7 py-3.5 rounded-full transition-colors duration-200"
              >
                Start an engagement
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/projects"
                className="text-sm font-medium text-[#555] hover:text-[#111] transition-colors duration-200"
              >
                View projects →
              </a>
            </div>
          </div>

          {/* Right column — dithering visual */}
          <div className="hidden lg:block relative h-[520px]">
            <div className="absolute inset-0 overflow-hidden">
              <Dithering
                colorBack="#0a0a0a"
                colorFront="#FF5F1F"
                shape="warp"
                type="4x4"
                size={3}
                speed={0.4}
                scale={1.2}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12rem] font-bold tracking-[-0.05em] text-white mix-blend-difference select-none">
                B_
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-left corner label */}
      <div className="absolute bottom-6 left-6 font-mono text-[9px] tracking-[0.15em] text-[#999]">
        BEAG LABS / AI RESEARCH
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify the hero renders**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`
Check: Hero renders with warm taupe label (not orange), medium-weight heading (not bold), dark pill CTA, grid pattern background.

- [ ] **Step 3: Commit**

```bash
git add components/hero-section.tsx
git commit -m "feat: refine hero with academic minimal typography and pill CTAs

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Refactor Navbar

**Files:**
- Modify: `components/navbar.tsx` (full file)

- [ ] **Step 1: Replace the navbar component**

Replace the entire contents of `components/navbar.tsx`:

```tsx
"use client"

import Link from "next/link"
import Image from "next/image"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + wordmark */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Beag Labs"
              width={28}
              height={28}
              className="w-7 h-7"
            />
            <span className="text-sm font-medium tracking-[-0.01em] text-[#111]">
              Beag Labs
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-8">
            <Link
              href="#services"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Services
            </Link>
            <Link
              href="/projects"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Projects
            </Link>
            <Link
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-white bg-[#111] hover:bg-[#333] px-5 py-2 rounded-full transition-colors duration-200"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify the navbar renders**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`
Check: Navbar renders with Inter text links (no mono), dark pill "Contact" button, subtle bottom border.

- [ ] **Step 3: Commit**

```bash
git add components/navbar.tsx
git commit -m "feat: refine navbar with Inter links and pill contact CTA

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Full page review**

Run: `cd /Users/jdbohrman/www.beaglabs.com && npm run dev`

Verify the complete page at `http://localhost:3000`:
- Warm off-white background (`#FAFAF9`)
- Navbar: Logo + Inter links + dark pill "Contact"
- Hero: Warm taupe label, medium-weight headline, dark pill CTA, grid pattern
- Capabilities: 2×2 grid, mono ID numbers, no icon boxes, subtle separators
- Projects: Chaveta card with subtle border, orange arrow on hover
- Footer: 3-column link grid, logo + tagline, copyright bar
- `::selection` is orange
- No orange used for labels or body text — only on CTAs and selection

- [ ] **Step 2: Final commit if anything was tweaked**

```bash
git add -A
git commit -m "chore: final polish on design system implementation

Co-Authored-By: Claude <noreply@anthropic.com>"
```
