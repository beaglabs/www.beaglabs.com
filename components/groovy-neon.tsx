/**
 * A word as tangerine neon tubing on the ink slab of a hero headline: a monoline script with a cream-hot core inside
 * an orange glass wall. The glow hums, and each letter flickers now and then, out of step with the others.
 * Styles live in app/globals.css (`.groovy-neon`). Screen readers get the plain word.
 */
export function GroovyNeon({ text }: { text: string }) {
  return (
    <span className="groovy-neon" aria-label={text}>
      {Array.from(text).map((letter, index) => (
        <span key={index} aria-hidden="true" className="groovy-neon-letter" style={{ animationDelay: `${index * -0.4}s, ${index * -1.9}s` }}>
          {letter}
        </span>
      ))}
    </span>
  )
}
