const faqs = [
  {
    question: "What is Beag Labs?",
    answer:
      "Beag Labs is a small model foundry that builds domain-specific classification and extraction models trained on your proprietary data. Unlike frontier API providers, Beag Labs models are deployed on your own infrastructure — on-prem, air-gapped, or in your VPC — with no data leakage and no vendor lock-in. You own the trained model weights.",
  },
  {
    question: "What is a small model foundry?",
    answer:
      "A small model foundry is a platform that trains and deploys small language models (SLMs) — typically 500M to 5B parameters — specialized for a specific domain or task. Instead of sending data to a large general-purpose API, a foundry produces compact models you run on your own hardware. This cuts compute costs dramatically while matching or exceeding frontier-model accuracy on domain-specific tasks.",
  },
  {
    question: "Can I deploy Beag Labs models on-premises or air-gapped?",
    answer:
      "Yes. Every model Beag Labs trains is exported as ONNX and deployed on infrastructure you control — cloud, on-premises, or fully air-gapped environments. There are no runtime API calls to Beag Labs. Your inference data never leaves your environment, and you own the model weights outright.",
  },
  {
    question: "Does Beag Labs train on my data or share it with third parties?",
    answer:
      "No. Beag Labs never trains foundation models on your proprietary data, and your data never leaves your environment during inference. The custom models built for you are yours — not absorbed into a shared model. Data connectors (Gmail, GitHub, HubSpot, Notion, or CSV upload) operate within your environment.",
  },
  {
    question: "What types of models does Beag Labs build?",
    answer:
      "Beag Labs builds four domain model families: Compliance SLMs (NIST 800-53 control classification), Security SLMs (CVE, OWASP, MITRE ATT&CK mapping), Legal SLMs (e-discovery, contract clause extraction), and Healthcare SLMs (clinical document triage, adverse event classification). All models handle classification, extraction, and relevance tasks.",
  },
  {
    question: "How is Beag Labs different from calling an LLM API like OpenAI or Anthropic?",
    answer:
      "Frontier API providers charge per-token for every inference, expose your data to their servers, and lock you into their platform. Beag Labs trains a compact model you own and deploy on your own hardware, which can be up to 13x cheaper than per-token API pricing at scale. There are no API dependencies at runtime, no data leakage, and no vendor lock-in.",
  },
  {
    question: "How long does it take to build and deploy a custom model?",
    answer:
      "From raw data to a deployed model typically takes under 24 hours. The pipeline uses frontier models for intelligent auto-labeling, then surfaces only the 2-5% of edge cases for human review via a disagreement engine. After review, the model is fine-tuned and exported as ONNX for immediate deployment.",
  },
]

export function FaqSection() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block">FAQ</span>
            <h2 className="max-w-[460px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
              Common questions about domain-specific AI.
            </h2>
          </div>
          <div>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[#404040] font-medium">
              Everything you need to know about how Beag Labs trains, deploys,
              and secures small models for regulated and data-sensitive
              environments.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[900px] divide-y-[3px] divide-[#111] border-y-[3px] border-[#111]">
          {faqs.map((faq) => (
            <div key={faq.question} className="bg-white px-6 py-7 lg:px-8 lg:py-8">
              <h3 className="mb-3 text-[20px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#111] lg:text-[22px]">
                {faq.question}
              </h3>
              <p className="text-[15px] leading-[1.7] text-[#444] lg:text-[16px]">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
