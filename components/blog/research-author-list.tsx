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
