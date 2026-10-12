import { BACKOFFICE_POST_SLUGS } from '@/lib/blog/backoffice-content'

const backofficeSlugs = JSON.stringify(BACKOFFICE_POST_SLUGS)

const BLOG_POST_CARD_FIELDS = `
  id
  slug
  title
  exerpt
  category
  tags
  publishedAt
  updatedAt
  coverImage {
    url
    width
    height
  }
`

const BLOG_POST_FULL_FIELDS = `
  ${BLOG_POST_CARD_FIELDS}
  body
  mathBlock {
    label
    latex
  }
  mermaidBlock {
    label
    diagram
  }
  tableBlock {
    label
    headers
    rows
  }
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
  updatedAt
  doi
  seoImage
`

const RESEARCH_PAPER_FULL_FIELDS = `
  ${RESEARCH_PAPER_CARD_FIELDS}
  body {
    markdown
  }
  mathBlock {
    label
    latex
  }
  mermaidBlock {
    label
    diagram
  }
  tableBlock {
    label
    headers
    rows
  }
  coverImage {
    url
    width
    height
  }
  seoTitle
  seoDescription
  seoImage
`

// --- Blog queries ---

export const GET_BLOG_POSTS = `
  query GetBlogPosts($first: Int!, $skip: Int!) {
    blogPosts(
      where: { slug_in: ${backofficeSlugs} }
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${BLOG_POST_CARD_FIELDS}
    }
    blogPostsConnection(where: { slug_in: ${backofficeSlugs} }) {
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
  query GetBlogPostsByCategory($category: Category!, $first: Int!, $skip: Int!) {
    blogPosts(
      where: { category: $category, slug_in: ${backofficeSlugs} }
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${BLOG_POST_CARD_FIELDS}
    }
    blogPostsConnection(where: { category: $category, slug_in: ${backofficeSlugs} }) {
      aggregate {
        count
      }
    }
  }
`

export const GET_BLOG_POSTS_BY_TAG = `
  query GetBlogPostsByTag($tag: String!, $first: Int!, $skip: Int!) {
    blogPosts(
      where: { tags_contains_some: [$tag], slug_in: ${backofficeSlugs} }
      first: $first
      skip: $skip
      orderBy: publishedAt_DESC
    ) {
      ${BLOG_POST_CARD_FIELDS}
    }
    blogPostsConnection(where: { tags_contains_some: [$tag], slug_in: ${backofficeSlugs} }) {
      aggregate {
        count
      }
    }
  }
`

export const GET_ALL_BLOG_CATEGORIES = `
  query GetAllBlogCategories {
    blogPosts(where: { slug_in: ${backofficeSlugs} }) {
      category
    }
  }
`

export const GET_ALL_BLOG_TAGS = `
  query GetAllBlogTags {
    blogPosts(where: { slug_in: ${backofficeSlugs} }) {
      tags
    }
  }
`

// --- Lightweight slug-only queries (sitemap, etc.) ---

export const GET_ALL_BLOG_SLUGS = `
  query GetAllBlogSlugs {
    blogPosts(where: { slug_in: ${backofficeSlugs} }, orderBy: publishedAt_DESC) {
      slug
      publishedAt
    }
  }
`

export const GET_ALL_RESEARCH_SLUGS = `
  query GetAllResearchSlugs {
    researchPapers(orderBy: publishedAt_DESC) {
      slug
      publishedAt
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
