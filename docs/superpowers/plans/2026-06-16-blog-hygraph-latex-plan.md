# Blog & Research Publication System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two independent blogs (/blog, /research) powered by Hygraph CMS with LaTeX math rendering via remark-math + rehype-katex, supporting Draft → Preview → Publish editorial workflow.

**Architecture:** Next.js ISR with on-demand revalidation. react-markdown + remark-math + rehype-katex render markdown and LaTeX server-side. Hygraph GraphQL API with separate published/preview endpoints. Next.js Draft Mode for content preview.

**Tech Stack:** Next.js 16 App Router, React 19, Hygraph GraphQL, react-markdown, remark-math, rehype-katex, KaTeX

---

## Critical Pre-step: Remove `output: 'export'`

The current `next.config.mjs` uses static export (`output: 'export'`), which is incompatible with ISR and Draft Mode — both require a Next.js server. This MUST be changed before any blog work.

---

### Task 1: Install dependencies and update config

**Files:**
- Modify: `package.json`
- Modify: `next.config.mjs`
- Create: `.env.local.example`

- [ ] **Step 1: Install npm packages**

Run:
```bash
cd /Users/jdbohrman/www.beaglabs.com && npm install react-markdown remark-math rehype-katex katex
```

Expected: Packages install without errors.

- [ ] **Step 2: Update next.config.mjs to remove static export**

Read the current file, then replace with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.graphcms.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 3: Create .env.local.example**

Create file `app/../.env.local.example`:

```
# Hygraph CMS
HYGRAPH_ENDPOINT=https://<region>.graphcms.com/v2/<project-id>
HYGRAPH_PREVIEW_ENDPOINT=https://<region>.graphcms.com/v2/<project-id>/preview
HYGRAPH_TOKEN=your-permanent-auth-token
HYGRAPH_PREVIEW_TOKEN=your-preview-token

# Draft Mode & Revalidation
DRAFT_SECRET=generate-a-random-secret-here
REVALIDATE_SECRET=generate-another-random-secret-here
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.mjs .env.local.example
git commit -m "chore: install blog dependencies, remove static export, add env template

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create Hygraph lib layer — types, client, queries

**Files:**
- Create: `lib/hygraph/types.ts`
- Create: `lib/hygraph/client.ts`
- Create: `lib/hygraph/queries.ts`

- [ ] **Step 1: Create lib/hygraph/types.ts**

```ts
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  coverImage?: {
    url: string
    width: number
    height: number
  } | null
  category: 'Case Study' | 'Project Update' | 'Tutorial' | 'Opinion'
  tags: string[]
  publishedAt: string
  seoTitle?: string | null
  seoDescription?: string | null
}

export interface ResearchPaper {
  id: string
  slug: string
  title: string
  abstract: string
  body: string
  coverImage?: {
    url: string
    width: number
    height: number
  } | null
  authors: string[]
  publishedAt: string
  doi?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

export interface BlogPostsResponse {
  blogPosts: BlogPost[]
  blogPostsConnection: {
    aggregate: { count: number }
  }
}

export interface BlogPostResponse {
  blogPost: BlogPost | null
}

export interface ResearchPapersResponse {
  researchPapers: ResearchPaper[]
  researchPapersConnection: {
    aggregate: { count: number }
  }
}

export interface ResearchPaperResponse {
  researchPaper: ResearchPaper | null
}
```

- [ ] **Step 2: Create lib/hygraph/client.ts**

```ts
const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT
const HYGRAPH_PREVIEW_ENDPOINT = process.env.HYGRAPH_PREVIEW_ENDPOINT
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN
const HYGRAPH_PREVIEW_TOKEN = process.env.HYGRAPH_PREVIEW_TOKEN

export async function fetchHygraph<T>(
  query: string,
  variables?: Record<string, unknown>,
  draft = false
): Promise<T> {
  if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
    throw new Error(
      'Missing Hygraph environment variables. Set HYGRAPH_ENDPOINT and HYGRAPH_TOKEN in .env.local'
    )
  }

  const endpoint = draft ? HYGRAPH_PREVIEW_ENDPOINT : HYGRAPH_ENDPOINT
  const token = draft ? HYGRAPH_PREVIEW_TOKEN : HYGRAPH_TOKEN

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    next: draft ? { revalidate: 0 } : { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(
      `Hygraph request failed: ${res.status} ${res.statusText}`
    )
  }

  const json = await res.json()

  if (json.errors) {
    throw new Error(
      `Hygraph GraphQL errors: ${JSON.stringify(json.errors)}`
    )
  }

  return json.data as T
}
```

- [ ] **Step 3: Create lib/hygraph/queries.ts**

```ts
const BLOG_POST_CARD_FIELDS = `
  id
  slug
  title
  excerpt
  category
  tags
  publishedAt
  coverImage {
    url
    width
    height
  }
`

const BLOG_POST_FULL_FIELDS = `
  ${BLOG_POST_CARD_FIELDS}
  body
  seoTitle
  seoDescription
`

const RESEARCH_PAPER_CARD_FIELDS = `
  id
  slug
  title
  abstract
  authors
  publishedAt
  doi
`

const RESEARCH_PAPER_FULL_FIELDS = `
  ${RESEARCH_PAPER_CARD_FIELDS}
  body
  coverImage {
    url
    width
    height
  }
  seoTitle
  seoDescription
`

// --- Blog queries ---

export const GET_BLOG_POSTS = `
  query GetBlogPosts($first: Int!, $skip: Int!) {
    blogPosts(
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${BLOG_POST_CARD_FIELDS}
    }
    blogPostsConnection {
      aggregate {
        count
      }
    }
  }
`

export const GET_BLOG_POST = `
  query GetBlogPost($slug: String!) {
    blogPost(where: { slug: $slug }) {
      ${BLOG_POST_FULL_FIELDS}
    }
  }
`

export const GET_BLOG_POSTS_BY_CATEGORY = `
  query GetBlogPostsByCategory($category: BlogPostCategory!, $first: Int!, $skip: Int!) {
    blogPosts(
      where: { category: $category }
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${BLOG_POST_CARD_FIELDS}
    }
    blogPostsConnection(where: { category: $category }) {
      aggregate {
        count
      }
    }
  }
`

export const GET_BLOG_POSTS_BY_TAG = `
  query GetBlogPostsByTag($tag: String!, $first: Int!, $skip: Int!) {
    blogPosts(
      where: { tags_contains_some: [$tag] }
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${BLOG_POST_CARD_FIELDS}
    }
    blogPostsConnection(where: { tags_contains_some: [$tag] }) {
      aggregate {
        count
      }
    }
  }
`

export const GET_ALL_BLOG_CATEGORIES = `
  query GetAllBlogCategories {
    blogPosts {
      category
    }
  }
`

export const GET_ALL_BLOG_TAGS = `
  query GetAllBlogTags {
    blogPosts {
      tags
    }
  }
`

// --- Research queries ---

export const GET_RESEARCH_PAPERS = `
  query GetResearchPapers($first: Int!, $skip: Int!) {
    researchPapers(
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${RESEARCH_PAPER_CARD_FIELDS}
    }
    researchPapersConnection {
      aggregate {
        count
      }
    }
  }
`

export const GET_RESEARCH_PAPER = `
  query GetResearchPaper($slug: String!) {
    researchPaper(where: { slug: $slug }) {
      ${RESEARCH_PAPER_FULL_FIELDS}
    }
  }
`

export const GET_RESEARCH_PAPERS_BY_AUTHOR = `
  query GetResearchPapersByAuthor($author: String!, $first: Int!, $skip: Int!) {
    researchPapers(
      where: { authors_contains_some: [$author] }
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${RESEARCH_PAPER_CARD_FIELDS}
    }
    researchPapersConnection(where: { authors_contains_some: [$author] }) {
      aggregate {
        count
      }
    }
  }
`

export const GET_ALL_RESEARCH_AUTHORS = `
  query GetAllResearchAuthors {
    researchPapers {
      authors
    }
  }
`
```

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add Hygraph lib layer — types, client, and queries

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Create math rendering core

**Files:**
- Create: `components/blog/math-styles.tsx`
- Create: `components/blog/markdown-renderer.tsx`

- [ ] **Step 1: Create components/blog/math-styles.tsx**

```tsx
'use client'

import 'katex/dist/katex.min.css'

export function MathStyles() {
  return null
}
```

- [ ] **Step 2: Create components/blog/markdown-renderer.tsx**

```tsx
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-3xl font-bold tracking-[-0.03em] text-[#111] mt-12 mb-6"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-2xl font-bold tracking-[-0.02em] text-[#111] mt-10 mb-4"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-xl font-semibold tracking-[-0.01em] text-[#111] mt-8 mb-3"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-base leading-relaxed text-[#333] mb-5" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-[#8B7355] hover:text-[#6b5740] underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="font-mono text-sm bg-[#f5f5f5] text-[#555] px-1.5 py-0.5 rounded"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={`font-mono text-sm block bg-[#f5f5f5] text-[#333] p-4 rounded-lg overflow-x-auto ${className || ''}`}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre className="mb-5" {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-2 border-l-[#8B7355] pl-4 italic text-[#555] mb-5"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 mb-5 space-y-1 text-[#333]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="list-decimal pl-6 mb-5 space-y-1 text-[#333]"
      {...props}
    >
      {children}
    </ol>
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      className="w-full rounded-lg my-8"
      {...props}
    />
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto mb-5">
      <table className="w-full text-sm border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-[rgba(0,0,0,0.06)] px-4 py-2 text-left font-semibold bg-[#f5f5f5] text-[#111]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border border-[rgba(0,0,0,0.06)] px-4 py-2 text-[#333]"
      {...props}
    >
      {children}
    </td>
  ),
}

interface MarkdownRendererProps {
  children: string
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
```

- [ ] **Step 3: Verify the build compiles**

Run:
```bash
cd /Users/jdbohrman/www.beaglabs.com && npx tsc --noEmit 2>&1 | head -30
```

Expected: No new TypeScript errors related to these files.

- [ ] **Step 4: Commit**

```bash
git add components/blog/math-styles.tsx components/blog/markdown-renderer.tsx
git commit -m "feat: add math rendering core — KaTeX styles + markdown renderer

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Create shared article components

**Files:**
- Create: `components/blog/draft-banner.tsx`
- Create: `components/blog/table-of-contents.tsx`
- Create: `components/blog/blog-layout.tsx`

- [ ] **Step 1: Create components/blog/draft-banner.tsx**

```tsx
import Link from 'next/link'

export function DraftBanner() {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2 flex items-center justify-between">
        <p className="text-sm text-amber-800">
          You are viewing a draft.
        </p>
        <Link
          href="/api/disable-draft"
          className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          Exit preview mode
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create components/blog/table-of-contents.tsx**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface TocHeading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: TocHeading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    for (const heading of headings) {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  return (
    <nav className="sticky top-24">
      <h4 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">
        On this page
      </h4>
      <ul className="space-y-1.5 border-l border-[rgba(0,0,0,0.06)]">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12 + 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block text-xs py-0.5 border-l-2 -ml-[1px] transition-colors ${
                activeId === heading.id
                  ? 'border-l-[#8B7355] text-[#111] font-medium'
                  : 'border-l-transparent text-[#555] hover:text-[#111]'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 3: Create components/blog/blog-layout.tsx**

```tsx
import { MathStyles } from './math-styles'
import { DraftBanner } from './draft-banner'
import { TableOfContents } from './table-of-contents'

interface TocHeading {
  id: string
  text: string
  level: number
}

interface BlogLayoutProps {
  children: React.ReactNode
  toc?: TocHeading[]
  isDraft?: boolean
}

export function BlogLayout({
  children,
  toc,
  isDraft = false,
}: BlogLayoutProps) {
  return (
    <>
      <MathStyles />
      {isDraft && <DraftBanner />}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="flex gap-12">
          <article className="flex-1 min-w-0 max-w-[65ch] mx-auto">
            {children}
          </article>
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <TableOfContents headings={toc} />
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/blog/draft-banner.tsx components/blog/table-of-contents.tsx components/blog/blog-layout.tsx
git commit -m "feat: add shared article components — draft banner, TOC, blog layout

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Create blog and research cards

**Files:**
- Create: `components/blog/blog-card.tsx`
- Create: `components/blog/research-card.tsx`

- [ ] **Step 1: Create components/blog/blog-card.tsx**

```tsx
import Link from 'next/link'
import type { BlogPost } from '@/lib/hygraph/types'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group bg-white rounded-lg border border-[rgba(0,0,0,0.06)] border-l-[3px] border-l-[#8B7355] overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {post.coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.coverImage.url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <span className="inline-block text-xs font-medium text-[#8B7355] bg-[#8B7355]/10 px-2 py-0.5 rounded-full mb-3">
            {post.category}
          </span>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-[#111] mb-2 group-hover:text-[#8B7355] transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-[#555] line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-[#999]">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{post.tags.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
```

- [ ] **Step 2: Create components/blog/research-card.tsx**

```tsx
import Link from 'next/link'
import type { ResearchPaper } from '@/lib/hygraph/types'

interface ResearchCardProps {
  paper: ResearchPaper
}

export function ResearchCard({ paper }: ResearchCardProps) {
  return (
    <Link href={`/research/${paper.slug}`}>
      <article className="group bg-white rounded-lg border border-[rgba(0,0,0,0.06)] p-6 hover:border-[rgba(0,0,0,0.12)] hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5">
        <p className="font-mono text-xs text-[#555] mb-2">
          {paper.authors.join(', ')}
        </p>
        <h3 className="text-lg font-bold tracking-[-0.02em] text-[#111] mb-2 group-hover:text-[#8B7355] transition-colors">
          {paper.title}
        </h3>
        <p className="text-sm text-[#555] line-clamp-3 mb-3 leading-relaxed">
          {paper.abstract}
        </p>
        <div className="flex items-center gap-3 text-xs text-[#999]">
          <time dateTime={paper.publishedAt}>
            {new Date(paper.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          {paper.doi && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[#8B7355]">DOI</span>
            </>
          )}
        </div>
      </article>
    </Link>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/blog/blog-card.tsx components/blog/research-card.tsx
git commit -m "feat: add blog and research listing cards

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Create listing and filter components

**Files:**
- Create: `components/blog/blog-list.tsx`
- Create: `components/blog/blog-category-filter.tsx`
- Create: `components/blog/research-author-list.tsx`

- [ ] **Step 1: Create components/blog/blog-list.tsx**

```tsx
import { BlogCard } from './blog-card'
import { ResearchCard } from './research-card'
import type { BlogPost, ResearchPaper } from '@/lib/hygraph/types'

interface BlogListProps {
  posts?: BlogPost[]
  papers?: ResearchPaper[]
  emptyMessage?: string
}

function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number
  totalPages: number
  basePath: string
}) {
  if (totalPages <= 1) return null

  const separator = basePath.includes('?') ? '&' : '?'

  return (
    <nav className="flex items-center justify-center gap-2 mt-12">
      {currentPage > 1 && (
        <a
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="text-xs text-[#555] hover:text-[#111] px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors"
        >
          Previous
        </a>
      )}
      <span className="text-xs text-[#999] px-3">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <a
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="text-xs text-[#555] hover:text-[#111] px-3 py-1.5 rounded-md border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)] transition-colors"
        >
          Next
        </a>
      )}
    </nav>
  )
}

export function BlogList({
  posts,
  papers,
  emptyMessage = 'No posts found.',
}: BlogListProps) {
  if (posts && posts.length === 0) {
    return (
      <p className="text-center text-[#999] py-16 text-sm">{emptyMessage}</p>
    )
  }
  if (papers && papers.length === 0) {
    return (
      <p className="text-center text-[#999] py-16 text-sm">{emptyMessage}</p>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts?.map((post) => <BlogCard key={post.id} post={post} />)}
      {papers?.map((paper) => (
        <ResearchCard key={paper.id} paper={paper} />
      ))}
    </div>
  )
}

export { Pagination }
```

- [ ] **Step 2: Create components/blog/blog-category-filter.tsx**

```tsx
import Link from 'next/link'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Case Study', label: 'Case Studies' },
  { value: 'Project Update', label: 'Project Updates' },
  { value: 'Tutorial', label: 'Tutorials' },
  { value: 'Opinion', label: 'Opinion' },
] as const

interface BlogCategoryFilterProps {
  currentCategory?: string
}

export function BlogCategoryFilter({
  currentCategory,
}: BlogCategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-8">
      {CATEGORIES.map((cat) => {
        const isActive = cat.value === (currentCategory || '')
        const href = cat.value
          ? `/blog/category/${encodeURIComponent(cat.value)}`
          : '/blog'

        return (
          <Link
            key={cat.value}
            href={href}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              isActive
                ? 'bg-[#111] text-white'
                : 'text-[#555] hover:text-[#111] bg-[#f5f5f5] hover:bg-[#eee]'
            }`}
          >
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create components/blog/research-author-list.tsx**

```tsx
import Link from 'next/link'

interface ResearchAuthorListProps {
  authors: string[]
}

export function ResearchAuthorList({ authors }: ResearchAuthorListProps) {
  return (
    <p className="font-mono text-sm text-[#555]">
      {authors.map((author, i) => (
        <span key={author}>
          <Link
            href={`/research/authors/${encodeURIComponent(author)}`}
            className="hover:text-[#111] hover:underline underline-offset-2 transition-colors"
          >
            {author}
          </Link>
          {i < authors.length - 1 && ', '}
        </span>
      ))}
    </p>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/blog/blog-list.tsx components/blog/blog-category-filter.tsx components/blog/research-author-list.tsx
git commit -m "feat: add listing grid, category filter, and author list components

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Create API routes

**Files:**
- Create: `app/api/draft/route.ts`
- Create: `app/api/disable-draft/route.ts`
- Create: `app/api/revalidate/route.ts`

- [ ] **Step 1: Create app/api/draft/route.ts**

```ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const type = searchParams.get('type') // 'blog' | 'research'

  if (secret !== process.env.DRAFT_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }

  if (!slug || !type) {
    return new Response('Missing slug or type parameter', { status: 400 })
  }

  const draft = await draftMode()
  draft.enable()

  const basePath = type === 'research' ? '/research' : '/blog'
  redirect(`${basePath}/${slug}`)
}
```

- [ ] **Step 2: Create app/api/disable-draft/route.ts**

```ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()

  const { searchParams } = new URL(request.url)
  const returnTo = searchParams.get('returnTo') || '/'
  redirect(returnTo)
}
```

- [ ] **Step 3: Create app/api/revalidate/route.ts**

```ts
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const secret =
    request.headers.get('x-hygraph-secret') ||
    new URL(request.url).searchParams.get('secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const model = body?.data?.__typename
  const slug = body?.data?.slug

  // Revalidate all listings
  revalidatePath('/blog', 'layout')
  revalidatePath('/research', 'layout')

  // Revalidate specific post if slug available
  if (slug) {
    if (model === 'BlogPost') {
      revalidatePath(`/blog/${slug}`)
    }
    if (model === 'ResearchPaper') {
      revalidatePath(`/research/${slug}`)
    }
  }

  return NextResponse.json({
    revalidated: true,
    model,
    slug,
    timestamp: Date.now(),
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for draft mode and revalidation

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Create blog section pages

**Files:**
- Create: `app/blog/layout.tsx`
- Create: `app/blog/page.tsx`
- Create: `app/blog/[slug]/page.tsx`
- Create: `app/blog/category/[category]/page.tsx`
- Create: `app/blog/tag/[tag]/page.tsx`

- [ ] **Step 1: Create app/blog/layout.tsx**

```tsx
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create app/blog/page.tsx**

```tsx
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const POSTS_PER_PAGE = 9

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const data = await fetchHygraph<BlogPostsResponse>(GET_BLOG_POSTS, {
    first: POSTS_PER_PAGE,
    skip,
  })

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            Blog
          </h1>
          <p className="text-[#555]">
            Project updates, case studies, and tutorials.
          </p>
        </div>
        <BlogCategoryFilter />
        <BlogList posts={data.blogPosts} emptyMessage="No posts yet." />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/blog"
        />
      </main>
      <SiteFooter />
    </>
  )
}
```

- [ ] **Step 3: Create app/blog/[slug]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POST } from '@/lib/hygraph/queries'
import type { BlogPostResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { MarkdownRenderer } from '@/components/blog/markdown-renderer'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

function extractHeadings(markdown: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Array<{ id: string; text: string; level: number }> = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    headings.push({ id, text, level })
  }

  return headings
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<BlogPostResponse>(
    GET_BLOG_POST,
    { slug },
    isDraft
  )

  if (!data.blogPost) {
    return { title: 'Not Found' }
  }

  return {
    title: data.blogPost.seoTitle || data.blogPost.title,
    description: data.blogPost.seoDescription || data.blogPost.excerpt,
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<BlogPostResponse>(
    GET_BLOG_POST,
    { slug },
    isDraft
  )

  if (!data.blogPost) {
    notFound()
  }

  const post = data.blogPost
  const toc = extractHeadings(post.body)

  return (
    <BlogLayout toc={toc} isDraft={isDraft}>
      <header className="mb-8">
        <p className="text-xs text-[#999] mb-3">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span aria-hidden="true"> · </span>
          <span>{post.category}</span>
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#111] mb-4">
          {post.title}
        </h1>
        <p className="text-base text-[#555] leading-relaxed">{post.excerpt}</p>
      </header>

      {post.coverImage && (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="w-full rounded-lg mb-10"
        />
      )}

      <div className="prose-custom">
        <MarkdownRenderer>{post.body}</MarkdownRenderer>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-12 pt-6 border-t border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="text-xs text-[#555] hover:text-[#111] bg-[#f5f5f5] hover:bg-[#eee] px-2.5 py-1 rounded-full transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}
    </BlogLayout>
  )
}
```

- [ ] **Step 4: Create app/blog/category/[category]/page.tsx**

```tsx
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS_BY_CATEGORY } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const POSTS_PER_PAGE = 9

interface CategoryPageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const data = await fetchHygraph<BlogPostsResponse>(
    GET_BLOG_POSTS_BY_CATEGORY,
    { category, first: POSTS_PER_PAGE, skip }
  )

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            {category}
          </h1>
          <p className="text-[#555]">
            {data.blogPostsConnection.aggregate.count} post
            {data.blogPostsConnection.aggregate.count !== 1 ? 's' : ''}
          </p>
        </div>
        <BlogCategoryFilter currentCategory={category} />
        <BlogList
          posts={data.blogPosts}
          emptyMessage={`No posts in ${category} yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/category/${encodeURIComponent(category)}`}
        />
      </main>
      <SiteFooter />
    </>
  )
}
```

- [ ] **Step 5: Create app/blog/tag/[tag]/page.tsx**

```tsx
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POSTS_BY_TAG } from '@/lib/hygraph/queries'
import type { BlogPostsResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const POSTS_PER_PAGE = 9

interface TagPageProps {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function BlogTagPage({
  params,
  searchParams,
}: TagPageProps) {
  const { tag } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * POSTS_PER_PAGE

  const data = await fetchHygraph<BlogPostsResponse>(GET_BLOG_POSTS_BY_TAG, {
    tag,
    first: POSTS_PER_PAGE,
    skip,
  })

  const totalPages = Math.ceil(
    data.blogPostsConnection.aggregate.count / POSTS_PER_PAGE
  )

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            #{tag}
          </h1>
          <p className="text-[#555]">
            {data.blogPostsConnection.aggregate.count} post
            {data.blogPostsConnection.aggregate.count !== 1 ? 's' : ''} tagged
            &ldquo;{tag}&rdquo;
          </p>
        </div>
        <BlogList
          posts={data.blogPosts}
          emptyMessage={`No posts tagged "${tag}" yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/blog/tag/${encodeURIComponent(tag)}`}
        />
      </main>
      <SiteFooter />
    </>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/blog/
git commit -m "feat: add blog section pages — listing, post, category, tag

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Create research section pages

**Files:**
- Create: `app/research/layout.tsx`
- Create: `app/research/page.tsx`
- Create: `app/research/[slug]/page.tsx`
- Create: `app/research/authors/[author]/page.tsx`

- [ ] **Step 1: Create app/research/layout.tsx**

```tsx
export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create app/research/page.tsx**

```tsx
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPERS } from '@/lib/hygraph/queries'
import type { ResearchPapersResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const PAPERS_PER_PAGE = 9

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const skip = (page - 1) * PAPERS_PER_PAGE

  const data = await fetchHygraph<ResearchPapersResponse>(
    GET_RESEARCH_PAPERS,
    {
      first: PAPERS_PER_PAGE,
      skip,
    }
  )

  const totalPages = Math.ceil(
    data.researchPapersConnection.aggregate.count / PAPERS_PER_PAGE
  )

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            Research
          </h1>
          <p className="text-[#555]">
            Papers, technical deep-dives, and research findings.
          </p>
        </div>
        <BlogList
          papers={data.researchPapers}
          emptyMessage="No papers published yet."
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/research"
        />
      </main>
      <SiteFooter />
    </>
  )
}
```

- [ ] **Step 3: Create app/research/[slug]/page.tsx**

```tsx
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPER } from '@/lib/hygraph/queries'
import type { ResearchPaperResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { MarkdownRenderer } from '@/components/blog/markdown-renderer'
import { ResearchAuthorList } from '@/components/blog/research-author-list'

interface ResearchPaperPageProps {
  params: Promise<{ slug: string }>
}

function extractHeadings(markdown: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Array<{ id: string; text: string; level: number }> = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    headings.push({ id, text, level })
  }

  return headings
}

export async function generateMetadata({ params }: ResearchPaperPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<ResearchPaperResponse>(
    GET_RESEARCH_PAPER,
    { slug },
    isDraft
  )

  if (!data.researchPaper) {
    return { title: 'Not Found' }
  }

  return {
    title: data.researchPaper.seoTitle || data.researchPaper.title,
    description:
      data.researchPaper.seoDescription || data.researchPaper.abstract,
  }
}

export default async function ResearchPaperPage({
  params,
}: ResearchPaperPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<ResearchPaperResponse>(
    GET_RESEARCH_PAPER,
    { slug },
    isDraft
  )

  if (!data.researchPaper) {
    notFound()
  }

  const paper = data.researchPaper
  const toc = extractHeadings(paper.body)

  return (
    <BlogLayout toc={toc} isDraft={isDraft}>
      <header className="mb-10">
        <p className="text-xs text-[#999] mb-3">
          <time dateTime={paper.publishedAt}>
            {new Date(paper.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#111] mb-4">
          {paper.title}
        </h1>
        <ResearchAuthorList authors={paper.authors} />

        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 font-mono text-xs text-[#8B7355] hover:text-[#6b5740] underline underline-offset-2"
          >
            DOI: {paper.doi}
          </a>
        )}
      </header>

      <div className="bg-[#f5f5f5] border-l-[3px] border-l-[#8B7355] p-6 rounded-r-lg mb-10">
        <h2 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">
          Abstract
        </h2>
        <p className="text-sm text-[#555] leading-relaxed">{paper.abstract}</p>
      </div>

      {paper.coverImage && (
        <img
          src={paper.coverImage.url}
          alt={paper.title}
          className="w-full rounded-lg mb-10"
        />
      )}

      <div className="prose-custom">
        <MarkdownRenderer>{paper.body}</MarkdownRenderer>
      </div>
    </BlogLayout>
  )
}
```

- [ ] **Step 4: Create app/research/authors/[author]/page.tsx**

```tsx
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_RESEARCH_PAPERS_BY_AUTHOR } from '@/lib/hygraph/queries'
import type { ResearchPapersResponse } from '@/lib/hygraph/types'
import { BlogList, Pagination } from '@/components/blog/blog-list'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

const PAPERS_PER_PAGE = 9

interface AuthorPageProps {
  params: Promise<{ author: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ResearchAuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const { author } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10))
  const skip = (page - 1) * PAPERS_PER_PAGE

  const data = await fetchHygraph<ResearchPapersResponse>(
    GET_RESEARCH_PAPERS_BY_AUTHOR,
    {
      author,
      first: PAPERS_PER_PAGE,
      skip,
    }
  )

  const totalPages = Math.ceil(
    data.researchPapersConnection.aggregate.count / PAPERS_PER_PAGE
  )

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-[-0.03em] text-[#111] mb-2">
            {author}
          </h1>
          <p className="text-[#555]">
            {data.researchPapersConnection.aggregate.count} paper
            {data.researchPapersConnection.aggregate.count !== 1 ? 's' : ''} by{' '}
            {author}
          </p>
        </div>
        <BlogList
          papers={data.researchPapers}
          emptyMessage={`No papers by ${author} yet.`}
        />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/research/authors/${encodeURIComponent(author)}`}
        />
      </main>
      <SiteFooter />
    </>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/research/
git commit -m "feat: add research section pages — listing, paper, author filter

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Update navbar with Blog and Research links

**Files:**
- Modify: `components/navbar.tsx`

- [ ] **Step 1: Add Blog and Research links to navbar**

Read `components/navbar.tsx`, then replace the nav links section.

Old:
```tsx
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
```

New:
```tsx
          <div className="flex items-center gap-8">
            <Link
              href="/blog"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Blog
            </Link>
            <Link
              href="/research"
              className="text-xs text-[#555] hover:text-[#111] transition-colors duration-200"
            >
              Research
            </Link>
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
```

- [ ] **Step 2: Commit**

```bash
git add components/navbar.tsx
git commit -m "feat: add Blog and Research links to navbar

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Final verification and build check

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/jdbohrman/www.beaglabs.com && npx tsc --noEmit 2>&1 | head -50
```

Expected: No new TypeScript errors. Any pre-existing errors from `ignoreBuildErrors: true` are acceptable.

- [ ] **Step 2: Run the build**

```bash
cd /Users/jdbohrman/www.beaglabs.com && npm run build 2>&1 | tail -30
```

Expected: Build succeeds. Note that Hygraph pages will show warnings/errors about missing env vars during build if `.env.local` isn't set up — this is expected and will resolve once env vars are configured.

- [ ] **Step 3: Verify file structure**

Run:
```bash
cd /Users/jdbohrman/www.beaglabs.com && find app/blog app/research app/api lib/hygraph components/blog -type f | sort
```

Expected output:
```
app/api/disable-draft/route.ts
app/api/draft/route.ts
app/api/revalidate/route.ts
app/blog/[slug]/page.tsx
app/blog/category/[category]/page.tsx
app/blog/layout.tsx
app/blog/page.tsx
app/blog/tag/[tag]/page.tsx
app/research/[slug]/page.tsx
app/research/authors/[author]/page.tsx
app/research/layout.tsx
app/research/page.tsx
components/blog/blog-card.tsx
components/blog/blog-category-filter.tsx
components/blog/blog-layout.tsx
components/blog/blog-list.tsx
components/blog/draft-banner.tsx
components/blog/markdown-renderer.tsx
components/blog/math-styles.tsx
components/blog/research-author-list.tsx
components/blog/research-card.tsx
components/blog/table-of-contents.tsx
lib/hygraph/client.ts
lib/hygraph/queries.ts
lib/hygraph/types.ts
```

- [ ] **Step 4: Final commit (if any changes from build fixes)**

```bash
git status
```

If there are uncommitted changes, commit them:

```bash
git add -A
git commit -m "chore: build verification fixes

Co-Authored-By: Claude <noreply@anthropic.com>"
```
