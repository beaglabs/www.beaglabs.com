/**
 * Every page hero's field: Papyrus drafting paper with the B_ mark's ribbon sweeping across it, four lanes
 * (tangerine, coral, marigold, blush) with ink keylines. It paints its own ground, so the hero's background
 * colour underneath doesn't matter. The lanes draw on once, then breathe (styles in app/globals.css).
 */
const LANES = ['var(--ribbon-tangerine)', 'var(--ribbon-coral)', 'var(--ribbon-marigold)', 'var(--ribbon-blush)']

// Enters at the top, past the headline column, falls behind the right-hand panel and leaves bottom right, so it
// never runs under hero text. Each lane shifts right and up so the band keeps its width on the steep part.
const sweep = (i: number) => {
  const x = 640 + i * 44, y = -80 - i * 10
  return `M ${x} ${y} C ${x + 170} ${y + 220}, ${x + 360} ${y + 170}, ${x + 520} ${y + 380} S ${x + 760} ${y + 760}, ${x + 1000} ${y + 800}`
}

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-paper absolute inset-0 z-10 overflow-hidden">
      <svg className="hero-ribbon absolute inset-0 h-full w-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
        {LANES.map((_, i) => <path key={`k${i}`} className="hero-lane" style={{ animationDelay: `${i * 0.12}s` }} d={sweep(i)} fill="none" stroke="var(--ink)" strokeWidth={54} />)}
        {LANES.map((color, i) => <path key={`c${i}`} className="hero-lane" style={{ animationDelay: `${i * 0.12}s` }} d={sweep(i)} fill="none" stroke={color} strokeWidth={40} />)}
      </svg>
    </div>
  )
}
