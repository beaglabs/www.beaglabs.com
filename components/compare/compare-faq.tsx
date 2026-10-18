import { company } from '@/data/company'

export const compareFaqs = [
  {
    question: 'Is this comparison independent?',
    answer:
      'No. Beag Labs makes Papyrus, the agentic ERP and one of the platforms compared. We disclose that on every comparison, label Papyrus cells as first-party, and apply the same evidence rules to every platform, including a fair account of where each alternative may fit better.',
  },
  {
    question: 'Did you test these products?',
    answer:
      'No. These comparisons are built from vendor documentation, official listings and public repositories. We have not run hands-on tests or benchmarks of the compared products, and we say so rather than imply otherwise.',
  },
  {
    question: 'What does Not documented mean?',
    answer:
      'We checked the official sources listed on the cell and found nothing either way. That is not evidence the capability is missing. We only mark a capability Not supported when an official source explicitly says so.',
  },
  {
    question: 'Why no scores or star ratings?',
    answer:
      'Scores would imply testing we have not done. Our evidence is documentation, usually one page per attribute, so we classify what is documented, partially supported, unsupported or undocumented, and state the limits of each source. Hands-on testing would be needed before rating quality.',
  },
  {
    question: 'What does Partially supported mean?',
    answer:
      'An official source documents the capability but states a limit, such as covering one surface, a subset of actions, or having an explicit exclusion. The cell spells out the limit and links to the source.',
  },
  {
    question: 'Where does each statement come from?',
    answer:
      'Every Verified or Not supported cell links to a record in the Claim Ledger with the source URL, where it appears on the page, the date it was checked, the wording we may use and what the source does not prove.',
  },
  {
    question: 'A vendor thinks something here is wrong. What happens?',
    answer: `Write to ${company.email}. We re-check the source, correct the cell and ledger record if needed, and update the verification date.`,
  },
] as const

export function CompareFaq() {
  return (
    <section aria-labelledby="compare-faq" className="mx-auto max-w-[1120px]">
      <h2 id="compare-faq" className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[36px]">Questions about this page</h2>
      <div className="mt-6 border-y-[3px] border-[#111]">
        {compareFaqs.map((faq, index) => (
          <details key={faq.question} className={`group px-1 py-4 ${index > 0 ? 'border-t border-[#bbb]' : ''}`}>
            <summary className="cursor-pointer list-none text-[16px] font-extrabold leading-snug marker:hidden">
              <span aria-hidden="true" className="mr-2 font-mono text-[#ff5f1f] group-open:hidden">+</span>
              <span aria-hidden="true" className="mr-2 hidden font-mono text-[#ff5f1f] group-open:inline">−</span>
              {faq.question}
            </summary>
            <p className="mt-3 max-w-[820px] pl-5 text-[14px] font-medium leading-[1.75] text-[#444]">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: compareFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}
