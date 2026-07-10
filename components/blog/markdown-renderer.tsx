import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Components } from 'react-markdown'

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
    return (
      <code
        className={`block overflow-x-auto rounded-[20px] border-[3px] border-[#111] bg-[#fafaf9] p-5 font-mono text-sm text-[#333] shadow-[4px_4px_0px_0px_#111] ${className || ''}`}
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
  table: ({ children, ...props }) => (
    <div className="mb-6 overflow-x-auto rounded-[20px] border-[3px] border-[#111] shadow-[4px_4px_0px_0px_#111]">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b-[3px] border-[#111] bg-[#FF5F1F] px-4 py-3 text-left font-bold text-[#111]"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border-b border-[rgba(17,17,17,0.12)] px-4 py-3 text-[#333]"
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
