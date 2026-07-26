'use client'

import Image from 'next/image'

const LABS = [
  { name: 'OpenAI', domain: 'openai.com' },
  { name: 'Anthropic', domain: 'anthropic.com' },
  { name: 'Google DeepMind', domain: 'deepmind.google' },
  { name: 'Meta AI', domain: 'ai.meta.com' },
  { name: 'Mistral AI', domain: 'mistral.ai' },
  { name: 'xAI', domain: 'x.ai' },
  { name: 'Cohere', domain: 'cohere.com' },
  { name: 'Together AI', domain: 'together.ai' },
  { name: 'NVIDIA', domain: 'nvidia.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Allen AI', domain: 'allenai.org' },
  { name: 'Stability AI', domain: 'stability.ai' },
  { name: 'Qwen', domain: 'qwenlm.ai' },
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Amazon', domain: 'amazon.science' },
  { name: 'Hugging Face', domain: 'huggingface.co' },
]

export function LabLogoMarquee() {
  const logos = LABS.map((lab) => ({
    src: `https://img.logo.dev/${lab.domain}?size=64&format=webp&retina=true&token=pk_PJhuwvcfSPKKCJJxJcElsQ`,
    alt: lab.name,
    href: `https://${lab.domain}`,
  }))

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-[#FAFAF9] to-transparent z-10" />
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-[#FAFAF9] to-transparent z-10" />
      <div className="flex animate-marquee whitespace-nowrap">
        {[...logos, ...logos].map((logo, idx) => (
          <a
            key={idx}
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-6 flex-shrink-0"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={64}
              height={64}
              unoptimized
              className="h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}