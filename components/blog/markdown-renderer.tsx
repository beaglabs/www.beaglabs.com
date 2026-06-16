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

/**
 * Hygraph's Rich Text → Markdown converter escapes backslashes and underscores
 * inside text nodes (\\ → \\\\, _ → \\_). Undo this inside LaTeX math blocks
 * so KaTeX receives correct syntax.
 */
function unescapeMath(markdown: string): string {
  // Hygraph's markdown converter escapes \ and _ inside text.
  // Undo this inside $...$ and $$...$$ math blocks so KaTeX gets clean LaTeX.
  // NOTE: In replace() CALLBACK returns, $ has NO special meaning.
  //       In replace() STRING replacements, $$ = literal $.
  const fixMath = (math: string) =>
    math.replace(/\\\\/g, '\\').replace(/\\_/g, '_')

  return markdown
    .replace(/\$\$([\s\S]*?)\$\$/g, (_: string, math: string) =>
      '$$' + fixMath(math) + '$$'
    )
    .replace(/\$([^$\n]+?)\$/g, (_: string, math: string) =>
      '$' + fixMath(math) + '$'
    )
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  const fixed = unescapeMath(children)
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {fixed}
    </ReactMarkdown>
  )
}
