/**
 * A word in pastel neon for the ink slab of a hero headline: each letter cycles through the pastel tubes (pink, sky,
 * mint, butter, lavender) a beat after the one before, so the colour rolls across the word while the letters bob.
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
