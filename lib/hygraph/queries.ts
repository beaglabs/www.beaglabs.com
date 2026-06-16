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
  body {
    markdown
  }
  mathBlocks {
    label
    latex
  }
  mermaidBlocks {
    label
    diagram
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
  doi
`

const RESEARCH_PAPER_FULL_FIELDS = `
  ${RESEARCH_PAPER_CARD_FIELDS}
  body {
    markdown
  }
  mathBlocks {
    label
    latex
  }
  mermaidBlocks {
    label
    diagram
  }
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
