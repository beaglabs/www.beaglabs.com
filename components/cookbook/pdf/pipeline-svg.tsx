interface PipelineSvgProps {
  steps: string[]
}

export function PipelineSvg({ steps }: PipelineSvgProps) {
  const boxW = 130
  const boxH = 36
  const gap = 36
  const arrowGap = 16
  const totalW = steps.length * boxW + (steps.length - 1) * gap
  const totalH = boxH + 12
  const margin = 4

  return (
    <svg
      width={totalW + margin * 2}
      height={totalH + margin * 2}
      viewBox={`0 0 ${totalW + margin * 2} ${totalH + margin * 2}`}
      style={{ maxWidth: '100%', display: 'block' }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#111111" />
        </marker>
      </defs>

      {steps.map((step, i) => {
        const x = margin + i * (boxW + gap)
        const y = margin
        return (
          <g key={step}>
            <rect
              x={x}
              y={y}
              width={boxW}
              height={boxH}
              fill="#FAFAF9"
              stroke="#111111"
              strokeWidth={2}
              rx={0}
            />
            <text
              x={x + boxW / 2}
              y={y + boxH / 2}
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#111111"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9,
                fontWeight: 500,
              }}
            >
              {step}
            </text>

            {i < steps.length - 1 && (
              <line
                x1={x + boxW}
                y1={y + boxH / 2}
                x2={x + boxW + gap}
                y2={y + boxH / 2}
                stroke="#111111"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}
