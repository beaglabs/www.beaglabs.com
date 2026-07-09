import type { Recipe } from '../types'

export const constitutionalGeneration: Recipe = {
  id: 'constitutional-generation',
  title: 'Constitutional Generation',
  part: 'synthetic-data',
  order: 3,
  purpose:
    'Generate synthetic training data that respects predefined constraints and quality rubrics — ensuring generated examples meet safety, format, and content standards without manual review.',
  usedBy: ['Constitutional data generation', 'Synthetic data with rubrics', 'Guided generation pipelines'],
  coreIdea:
    'Constitutional generation produces synthetic data by following a written constitution or rubric that specifies constraints on the output. The rubric defines acceptable content, format requirements, safety boundaries, and quality criteria. The generating model receives the rubric as a system prompt when creating each example, and a judge model verifies compliance after generation. This produces training data that is safe, on-format, and high-quality without humans in the loop.',
  pipeline: [
    'Draft a constitution/rubric: content rules, format specs, safety constraints',
    'Define generation prompts that specify the desired data type',
    'Generate candidate examples using LM with rubric as system prompt',
    'Run judge model: does each example comply with the constitution?',
    'Filter: keep only constitution-compliant examples',
    'Optionally iterate (regenerate non-compliant examples with corrections)',
    'Quality sample the filtered dataset for human review',
    'Add to training set',
  ],
  advantages: [
    'Generates safe, on-specification data at scale',
    'Reduces manual data review costs',
    'Rubrics can be updated without regenerating all data',
  ],
  disadvantages: [
    'Constitution quality directly determines data quality',
    'Judge model must be at least as capable as the generator',
    'Overly restrictive constitutions reduce data diversity',
  ],
  worksBestFor: [
    'Safety-aligned instruction tuning data',
    'Format-specific data generation (JSON, structured outputs)',
    'Domain-constrained data (legal, medical, financial)',
  ],
  keyPapers: [
    {
      title: 'Constitutional AI: Harmlessness from AI Feedback',
      url: 'https://arxiv.org/abs/2212.08073',
      authors: 'Anthropic',
      year: 2022,
    },
    {
      title: 'Synthetic Data Generation with Rubrics',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 2,
  compute: 'Low — 1–8 GPUs for 1–3 days; inference cost dominates',
  openSource: [
    'Prompt engineering frameworks (LangChain, DSPy)',
  ],
  commonMistakes: [
    'Constitution too vague — judge cannot reliably assess compliance',
    'Constitution too specific — all generated data looks identical',
    'Judge model that is weaker than the generator (misses violations)',
  ],
  variants: [
    'Iterative constitutional generation (regenerate with feedback from judge)',
    'Multi-judge constitutional generation (ensemble of judge models)',
  ],
  futureDirections:
    'Self-amending constitutions that identify systematic violations and update the constitution dynamically to close gaps, producing a continuously improving data generation pipeline.',
}
