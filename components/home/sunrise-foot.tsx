/**
 * The home hero's foot, laid out like papyrus.beaglabs.com: the B_ mark's ribbon sweeping across the drafting grid
 * under the centred headline, with a persimmon sun and its construction lines rising behind it on the right.
 * Styles (draw-on, rise) live in app/globals.css under `.home-foot`.
 */
const LANES = ['var(--rust)', 'var(--ribbon-tangerine)', 'var(--ribbon-coral)', 'var(--ribbon-marigold)', 'var(--ribbon-blush)']
const RIBBON = 'M -80 250 C 180 250 320 120 520 150 C 700 178 760 300 930 300 C 1110 300 1180 190 1300 160 C 1400 135 1470 150 1560 150'

export function SunriseFoot() {
  return (
    <svg className="home-foot" viewBox="0 0 1460 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g className="home-foot-sun">
        <g fill="none" stroke="var(--rust)" strokeWidth="1.5" opacity=".7">
          <path d="M860 150 H1460 M1130 -60 V420" strokeDasharray="3 6" />
          <circle cx="1130" cy="150" r="185" />
          <circle cx="1130" cy="150" r="160" strokeDasharray="2 7" strokeLinecap="round" strokeWidth="2" />
          <path d="M992 46 A176 176 0 0 1 1094 -22" />
        </g>
        <g fill="none" stroke="var(--rust)" strokeWidth="2.5" strokeLinecap="square">
          <path d="M1010 365 H1250 M1010 353 V377 M1250 353 V377" />
          <path d="M1395 40 V250 M1383 40 H1407 M1383 250 H1407" />
          <path d="M770 60 h22 M781 49 v22 M1420 330 h22 M1431 319 v22 M300 40 h22 M311 29 v22" />
        </g>
        <circle cx="1130" cy="150" r="120" fill="var(--ribbon-tangerine)" stroke="var(--ink)" strokeWidth="5" />
      </g>
      <g className="home-foot-ribbon">
        {LANES.map((color, index) => (
          <g key={color} transform={`translate(${-18 * index} ${30 * index})`}>
            <path d={RIBBON} fill="none" stroke="var(--ink)" strokeWidth="34" strokeLinejoin="round" />
            <path d={RIBBON} fill="none" stroke={color} strokeWidth="29" strokeLinejoin="round" />
          </g>
        ))}
      </g>
    </svg>
  )
}

/** A small striped arc, the drafting-sheet accent Papyrus scatters where clouds would be. */
export function StripeArc({ className, width = 220 }: { className?: string; width?: number }) {
  return (
    <svg className={className} width={width} viewBox="0 0 220 120" aria-hidden="true">
      {LANES.map((color, index) => {
        const r = 100 - index * 15
        const d = `M${110 - r} 116 A${r} ${r} 0 0 1 ${110 + r} 116`
        return <g key={color}><path d={d} fill="none" stroke="var(--ink)" strokeWidth="15" /><path d={d} fill="none" stroke={color} strokeWidth="10.5" /></g>
      })}
    </svg>
  )
}
