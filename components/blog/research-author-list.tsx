import Link from 'next/link'

interface ResearchAuthorListProps {
  authors: string[]
}

export function ResearchAuthorList({ authors }: ResearchAuthorListProps) {
  return (
    <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#666]">
      {authors.map((author, i) => (
        <span key={author}>
          <Link
            href={`/research/authors/${encodeURIComponent(author)}`}
            className="transition-colors hover:text-[#111] hover:underline underline-offset-2"
          >
            {author}
          </Link>
          {i < authors.length - 1 && ', '}
        </span>
      ))}
    </p>
  )
}
