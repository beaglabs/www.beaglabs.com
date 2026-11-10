/**
 * A word in tangerine neon for the ink slab of a hero headline: a cream core in an orange glow that breathes, with
 * each letter bobbing a beat after the one before.
 * Styles live in app/globals.css (`.groovy-neon`). Screen readers get the plain word.
 */
export function GroovyNeon({ text }: { text: string }) {
  return (
    <span className="groovy-neon" aria-label={text}>
      {Array.from(text).map((letter, index) => (
        <span key={index} aria-hidden="true" className="groovy-neon-letter" style={{ animationDelay: `${index * -0.35}s, ${index * -0.18}s` }}>
          {letter}
        </span>
      ))}
    </span>
  )
}
