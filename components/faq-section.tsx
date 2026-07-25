const faqs = [
  {
    question: "What is Beag Labs?",
    answer:
      "Beag Labs is an AI services company that builds and deploys custom small language models for regulated, data-sensitive organizations. We handle everything — data pipeline engineering, model development, ONNX export, and deployment on your infrastructure. You own the trained model weights and your data never leaves your environment.",
  },
  {
    question: "How does your engagement model work?",
    answer:
      "We start by understanding your data, infrastructure, and the tasks you want to automate. We design a solution, build a custom model using frontier models to accelerate labeling, and deploy it on your infrastructure — cloud, on-prem, or air-gapped. After deployment, we monitor performance and retrain as your data evolves.",
  },
  {
    question: "Can you deploy on-premises or in air-gapped environments?",
    answer:
      "Yes. Every model we build is exported as ONNX and deployed on infrastructure you control — cloud, on-premises, or fully air-gapped. There are no runtime API calls back to us. Your inference data never leaves your environment, and you own the model weights outright.",
  },
  {
    question: "Do you train on our data or share it with third parties?",
    answer:
      "No. We never train foundation models on your data, and your data never leaves your environment during inference. The custom models we build for you are yours alone — not absorbed into a shared model. Data connectors operate within your environment, and we never touch your production data.",
  },
  {
    question: "What types of models do you build?",
    answer:
      "We build compact classification, extraction, and relevance models for regulated industries: compliance (NIST 800-53 control classification), security (CVE, OWASP, MITRE ATT&CK mapping), legal (e-discovery, contract clause extraction), and healthcare (clinical document triage, adverse event classification). Each model is typically 500M to 5B parameters.",
  },
  {
    question: "How is Beag Labs different from calling an LLM API like OpenAI or Anthropic?",
    answer:
      "API providers charge per-token for every inference, your data passes through their servers, and you're locked into their platform. We build a compact model you own and deploy on your own hardware — no per-token costs, no data exposure, no vendor lock-in. At scale it can be up to 13x cheaper than per-token API pricing.",
  },
  {
    question: "How long does it take to get a deployed model?",
    answer:
      "From our first conversation to a deployed model typically takes under two weeks. We use frontier models to accelerate the labeling pipeline, then fine-tune and export as ONNX for deployment on your infrastructure. Ongoing support keeps the model accurate as your data evolves.",
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
              Common questions about custom AI deployment.
            </h2>
          </div>
          <div>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[#404040] font-medium">
              Everything you need to know about how Beag Labs builds, deploys,
              and maintains small models for regulated and data-sensitive
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
