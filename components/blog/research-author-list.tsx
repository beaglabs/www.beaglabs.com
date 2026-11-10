interface ResearchAuthorListProps {
  authors: string[]
}

export function ResearchAuthorList({ authors }: ResearchAuthorListProps) {
  return (
    <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[#6f5a4b]">
      {authors.map((author, i) => (
        <span key={author}>
          {author}
          {i < authors.length - 1 && ', '}
        </span>
      ))}
    </p>
  )
}
