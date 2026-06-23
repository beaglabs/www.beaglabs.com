import type { TableBlock } from '@/lib/hygraph/types'

interface TableBlockProps {
  block: TableBlock
}

function parseJSONArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    // not used
  }
  return []
}

function parseJSONMatrix(value: string): string[][] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map((row: unknown) =>
        Array.isArray(row) ? row.map(String) : [String(row)]
      )
    }
  } catch {
    // not used
  }
  return []
}

export function TableBlockRenderer({ block }: TableBlockProps) {
  const headers = parseJSONArray(block.headers)
  const rows = parseJSONMatrix(block.rows)

  const maxCols = Math.max(
    headers.length,
    ...rows.map((r) => r.length)
  )

  return (
    <figure className="my-8">
      <div className="overflow-x-auto rounded-lg border border-[rgba(0,0,0,0.06)]">
        <table className="w-full text-sm border-collapse">
          {headers.length > 0 && (
            <thead>
              <tr className="bg-[#fafafa]">
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#555] uppercase tracking-wider border-b-2 border-b-[#8B7355]/20"
                  >
                    {h}
                  </th>
                ))}
                {Array.from({ length: maxCols - headers.length }).map(
                  (_, i) => (
                    <th
                      key={`empty-${i}`}
                      className="px-4 py-3 border-b-2 border-b-[#8B7355]/20"
                    />
                  )
                )}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={maxCols || 1}
                  className="px-4 py-8 text-center text-[#999]"
                >
                  No data
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={
                    ri % 2 === 0
                      ? 'bg-white'
                      : 'bg-[#f9f8f7]'
                  }
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-2.5 text-[#333] border-t border-[rgba(0,0,0,0.04)]"
                    >
                      {cell}
                    </td>
                  ))}
                  {Array.from({ length: maxCols - row.length }).map(
                    (_, i) => (
                      <td
                        key={`empty-${i}`}
                        className="px-4 py-2.5 border-t border-[rgba(0,0,0,0.04)]"
                      />
                    )
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {block.label && (
        <figcaption className="text-center text-xs text-[#999] mt-2 font-mono">
          {block.label}
        </figcaption>
      )}
    </figure>
  )
}