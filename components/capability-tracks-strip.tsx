const tracks = [
  "Synthetic data systems",
  "Forward deployed ML",
  "Evaluation protocols",
  "Robotics workflows",
]

export function CapabilityTracksStrip() {
  return (
    <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-8 lg:px-9">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
          Capability Tracks
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {tracks.map((track, index) => (
            <div
              key={track}
              className="border-t border-[rgba(0,0,0,0.12)] pt-3"
            >
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#7c7c7c]">
                {`Track ${String(index + 1).padStart(2, "0")}`}
              </div>
              <div className="mt-2 text-[18px] leading-[1.2] text-[#111]">
                {track}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
