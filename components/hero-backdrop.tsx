/**
 * Every page hero's field, drawn like a 70s sunrise poster on Papyrus drafting paper: one persimmon sun with
 * registration rings and a crosshair, rising behind the right-hand column, and the B_ mark's ribbon (tangerine,
 * coral, marigold, blush, with ink keylines) flowing out from under it and off the bottom right. Everything sits
 * right of the headline column, so it never runs under hero text. It paints its own ground, so the hero's
 * background colour underneath doesn't matter. The sun rises and the lanes draw on once, then the scene breathes
 * (styles in app/globals.css).
 */
const LANES = ['var(--ribbon-tangerine)', 'var(--ribbon-coral)', 'var(--ribbon-marigold)', 'var(--ribbon-blush)']
const GAP = 40

// Comes in from the right edge just under the sun, bends down behind the panel, and leaves along the bottom.
const sweep = (i: number) => {
  const o = i * GAP
  return `M 1560 ${300 + o} C 1380 ${300 + o}, 1260 ${360 + o}, ${1160 - o * 0.3} ${520 + o * 0.7} S ${1010 - o * 0.6} ${860 + o * 0.2}, ${880 - o} ${980}`
}

const SUN = { x: 1250, y: 250, r: 112 }

export function HeroBackdrop() {
  const { x, y, r } = SUN
  return (
    <div aria-hidden="true" className="hero-paper absolute inset-0 z-10 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMaxYMin slice">
        <g className="hero-sun">
          <circle cx={x} cy={y} r={r + 46} fill="none" stroke="var(--rust)" strokeWidth={2} opacity={0.55} />
          <circle cx={x} cy={y} r={r + 24} fill="none" stroke="var(--rust)" strokeWidth={2.5} opacity={0.75} />
          <path d={`M ${x - r - 120} ${y} H ${x - r - 12} M ${x + r + 12} ${y} H ${x + r + 120} M ${x} ${y - r - 90} V ${y - r - 10}`} stroke="var(--rust)" strokeWidth={2.5} strokeDasharray="10 8" opacity={0.8} />
          <circle className="hero-sun-disc" cx={x} cy={y} r={r} fill="var(--ribbon-tangerine)" stroke="var(--ink)" strokeWidth={5} />
          <path d={`M ${x - r - 150} ${y - r - 30} h 34 m -17 -17 v 34`} stroke="var(--rust)" strokeWidth={4} strokeLinecap="round" className="hero-sparkle" />
        </g>
        <g className="hero-ribbon">
          {LANES.map((_, i) => <path key={`k${i}`} className="hero-lane" style={{ animationDelay: `${0.35 + i * 0.12}s` }} d={sweep(i)} fill="none" stroke="var(--ink)" strokeWidth={48} />)}
          {LANES.map((color, i) => <path key={`c${i}`} className="hero-lane" style={{ animationDelay: `${0.35 + i * 0.12}s` }} d={sweep(i)} fill="none" stroke={color} strokeWidth={35} />)}
        </g>
      </svg>
    </div>
  )
}
