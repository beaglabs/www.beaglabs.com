import Link from "next/link"

export function AnnouncementBanner() {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] border-b-[3px] border-[#111] bg-[#111] text-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-3 px-6 py-2.5 text-center lg:px-9">
        <p className="text-[12px] leading-[1.5] text-[#C9C9C9]">
          Announcing Beag Labs Compliance SLMs: Small language models/LoRAs for
          NIST classification and beyond.{" "}
          <Link
            href="/models"
            className="font-extrabold text-[#FF5F1F] underline decoration-[#FF5F1F] decoration-2 underline-offset-3 transition-colors hover:text-[#FF7A1A]"
          >
            Early access available &rarr;
          </Link>
        </p>
      </div>
    </div>
  )
}
