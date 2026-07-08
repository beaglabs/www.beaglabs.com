import Link from "next/link"

export function FinalCTASection() {
  return (
    <section className="border-t-[3px] border-[#111] bg-[#111] text-white px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <span className="nb-label mb-5 inline-block bg-[#FF5F1F] text-[#111] border-[#FF5F1F] shadow-[3px_3px_0px_0px_#FF5F1F]/20">
            Get Started
          </span>
          <h2 className="mb-4 max-w-[720px] text-[42px] font-extrabold leading-[0.96] tracking-[-0.05em] text-white lg:text-[56px]">
            Train your first classification model.
          </h2>
          <p className="max-w-[560px] text-[18px] leading-[1.65] text-[#C9C9C9] font-medium">
            Upload your data. We&rsquo;ll label it, train a classification or
            extraction model, and show you the accuracy — all before you pay a
            cent.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-start gap-4 lg:justify-end">
          <Link
            href="/models"
            className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
          >
            See the models <span className="text-lg">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
