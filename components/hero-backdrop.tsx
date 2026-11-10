/**
 * Every page hero's field: Papyrus drafting paper with the B_ mark's ribbon sweeping across it, four lanes
 * (tangerine, coral, marigold, blush) with ink keylines. It paints its own ground, so the hero's background
 * colour underneath doesn't matter. The lanes draw on once, then breathe (styles in app/globals.css).
 */
const LANES = ['var(--ribbon-tangerine)', 'var(--ribbon-coral)', 'var(--ribbon-marigold)', 'var(--ribbon-blush)']
const GAP = 46

const sweep = (y: number) => `M -120 ${y} C 240 ${y - 50}, 420 ${y + 280}, 760 ${y + 270} S 1180 ${y + 520}, 1580 ${y + 500}`

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-paper absolute inset-0 z-10 overflow-hidden">
      <svg className="hero-ribbon absolute inset-0 h-full w-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
        {LANES.map((_, i) => <path key={`k${i}`} className="hero-lane" style={{ animationDelay: `${i * 0.12}s` }} d={sweep(40 + i * GAP)} fill="none" stroke="var(--ink)" strokeWidth={54} />)}
        {LANES.map((color, i) => <path key={`c${i}`} className="hero-lane" style={{ animationDelay: `${i * 0.12}s` }} d={sweep(40 + i * GAP)} fill="none" stroke={color} strokeWidth={40} />)}
      </svg>
    </div>
  )
}
