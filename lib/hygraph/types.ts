export interface MathBlock {
  label?: string | null
  latex: string
}

export interface MermaidBlock {
  label?: string | null
  diagram: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: { markdown: string }
  mathBlocks: MathBlock[]
  mermaidBlocks: MermaidBlock[]
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
  body: { markdown: string }
  mathBlocks: MathBlock[]
  mermaidBlocks: MermaidBlock[]
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
