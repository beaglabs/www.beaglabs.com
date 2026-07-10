import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { MermaidBlockRenderer } from './mermaid-block'

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as React.ReactElement).props.children)
  }
  return ''
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="mt-14 mb-6 text-[34px] font-extrabold tracking-[-0.045em] text-[#111]"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="mt-12 mb-4 text-[28px] font-extrabold tracking-[-0.04em] text-[#111]"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mt-10 mb-3 text-[22px] font-bold tracking-[-0.03em] text-[#111]"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-5 text-[16px] leading-[1.82] text-[#333]" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-bold text-[#FF5F1F] underline underline-offset-2 transition-colors hover:text-[#d44d12]"
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
          className="rounded border-2 border-[#111] bg-[#fafaf9] px-1.5 py-0.5 font-mono text-sm text-[#555]"
          {...props}
        >
          {children}
        </code>
      )
    }
    const language = className?.replace('language-', '') || ''
    if (language === 'mermaid') {
      return (
        <div className="mermaid-render-wrapper">
          <MermaidBlockRenderer block={{ diagram: extractText(children), label: null }} />
        </div>
      )
    }
    return (
      <code
        className={`block overflow-x-auto rounded-[20px] border-[3px] border-[#111] bg-[#fafaf9] p-5 font-mono text-sm text-[#333] shadow-[4px_4px_0px_0px_#111] ${className || ''}`}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => {
    if (
      children &&
      typeof children === 'object' &&
      'props' in children &&
      (children as React.ReactElement).props?.className === 'mermaid-render-wrapper'
    ) {
      return <>{children}</>
    }
    return <pre className="mb-5">{children}</pre>
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-6 border-l-[3px] border-l-[#FF5F1F] pl-5 italic text-[#555]"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-5 list-disc space-y-2 pl-6 text-[#333]" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="mb-5 list-decimal space-y-2 pl-6 text-[#333]"
      {...props}
    >
      {children}
    </ol>
  ),
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      className="my-8 w-full rounded-[24px] border-[3px] border-[#111] shadow-[6px_6px_0px_0px_#111]"
      {...props}
    />
  ),
}

interface MarkdownRendererProps {
  children: string
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <ReactMarkdown components={components}>
      {children}
    </ReactMarkdown>
  )
}
