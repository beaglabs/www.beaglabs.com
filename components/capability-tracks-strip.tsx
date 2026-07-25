const tracks = [
  "Custom classification models",
  "Structured extraction pipelines",
  "Legal · Healthcare · Finance · Defense",
  "Managed deployment & hosting",
]

export function CapabilityTracksStrip() {
  return (
    <section className="border-b-[3px] border-[#111] bg-[#FFF3E6] px-6 py-10 lg:px-9">
      <div className="mx-auto max-w-[1440px]">
        <span className="nb-label mb-6 inline-block bg-[#111] text-[#FFF3E6] border-[#111]">
          What We Build
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {tracks.map((track, index) => (
            <div
              key={track}
              className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0px_0px_#111]"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF5F1F]">
                Track {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-2 text-[18px] font-bold leading-[1.15] text-[#111]">
                {track}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
