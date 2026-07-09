import type { Recipe } from '../types'

export const selfInstruct: Recipe = {
  id: 'self-instruct',
  title: 'Self-Instruct',
  part: 'synthetic-data',
  order: 1,
  purpose:
    'Generate large-scale instruction-tuning datasets from a language model itself, bootstrapping instruction-following capability without human-written examples.',
  usedBy: ['Self-Instruct (seed instruction tuning)', 'Alpaca (Stanford)', 'Instruction-tuned open models'],
  coreIdea:
    'Self-Instruct starts with a small seed set of human-written instructions and uses a language model to generate new instructions, input-output pairs, and diverse task types. The pipeline bootstraps iteratively: the model generates new instructions, filters and validates them, and retrains on the augmented dataset. The generated data covers diverse tasks (classification, generation, reasoning, rewriting) by prompting the model to create examples of each task type. This was the recipe behind Alpaca, Vicuna, and many early open instruction-tuned models.',
  pipeline: [
    'Write 100-500 seed instructions covering diverse task types',
    'For each instruction, prompt LM to generate a response',
    'Use the LM to generate new instructions (in-context from seed set)',
    'Classify generated instructions by task type',
    'Filter: remove duplicates, low-quality, or invalid outputs',
    'Add input-output pairs for each valid instruction',
    'Collect all valid (instruction, input, output) triples',
    'Fine-tune base LM on the collected dataset',
    'Optionally iterate: new model generates better data for next round',
  ],
  advantages: [
    'Generates unlimited instruction data at minimal cost',
    'Covers diverse tasks and domains',
    'Bootstraps instruction following without human annotation',
  ],
  disadvantages: [
    'Quality ceiling limited by the generating model',
    'Dataset diversity can plateau without prompt engineering',
    'Risk of generating factually incorrect or toxic content',
  ],
  worksBestFor: [
    'Jump-starting instruction-tuning for new base models',
    'Creating diverse evaluation benchmarks',
    'Domain-specific instruction data generation',
  ],
  keyPapers: [
    {
      title: 'Self-Instruct: Aligning Language Models with Self-Generated Instructions',
      url: 'https://arxiv.org/abs/2212.10560',
      authors: 'Wang et al.',
      year: 2022,
    },
    {
      title: 'Stanford Alpaca: An Instruction-Following LLaMA Model',
      url: 'https://crfm.stanford.edu/2023/03/13/alpaca.html',
      authors: 'Taori et al.',
      year: 2023,
    },
    {
      title: 'Self-Instruct Quality: Scaling and Dataset Curation',
      url: 'https://arxiv.org/abs/2401.01234',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 2,
  compute: 'Low — 1–8 GPUs for 1–3 days; data generation cost equivalent to inference',
  openSource: [
    'Self-Instruct (https://github.com/yizhongw/self-instruct)',
    'Alpaca-LoRA (https://github.com/tloen/alpaca-lora)',
  ],
  commonMistakes: [
    'Seed set too narrow (generated data lacks diversity)',
    'Not filtering generated instructions (quality issues compound)',
    'Using the same model for generation and training (feedback loops)',
  ],
  variants: [
    'Cross-model self-instruct (generate with strong model, train on weaker one)',
    'Iterative self-instruct (improving model generates better data)',
  ],
  futureDirections:
    'Self-instruct at scale using frontier models (Claude, GPT-4) as generators, producing millions of high-quality instruction examples that are then distilled into smaller open models — the recipe behind many of today best open instruction-tuned models.',
}
