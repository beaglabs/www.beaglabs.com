import type { Recipe } from '../types'

export const evolInstruct: Recipe = {
  id: 'evol-instruct',
  title: 'Evol-Instruct',
  part: 'synthetic-data',
  order: 2,
  purpose:
    'Evolve simple seed instructions into increasingly complex and diverse training examples through automatic rewriting operations — making instruction-tuned models more capable on hard tasks.',
  usedBy: ['WizardLM', 'Evol-Instruct pipeline (Microsoft)', 'OpenOrca dataset'],
  coreIdea:
    'Evol-Instruct starts with a set of basic instructions and uses a language model to apply evolution operations that increase complexity: add constraints, deepen reasoning requirements, convolve multiple tasks, or increase input complexity. Each evolved instruction is validated (does the model still produce a reasonable response?) before being added to the training set. The evolved dataset contains examples at multiple difficulty levels, teaching the model to handle both simple and complex instructions.',
  pipeline: [
    'Collect seed instructions (simple, single-step tasks)',
    'Define evolution operations: add constraints, deepen, convolve, complicate input',
    'For each seed, prompt LM to apply one or more evolution operations',
    'Validate the evolved instruction (is it solvable? is it harder?)',
    'Generate response for the evolved instruction using a capable LM',
    'Add evolved (instruction, response) pairs to training set',
    'Optionally evolve further from newly created examples',
    'Train model on the mixture of original and evolved data',
  ],
  advantages: [
    'Produces training data at diverse difficulty levels',
    'Automatically creates hard examples that challenge the model',
    'Addresses the easy data saturation problem in instruction tuning',
  ],
  disadvantages: [
    'Evolved instructions can become impossible or contradictory',
    'Evolution prompt engineering is critical to quality',
    'Validation step is not perfect — some bad examples slip through',
  ],
  worksBestFor: [
    'Improving reasoning and complex instruction following',
    'Multi-step task completion training',
    'Creating challenging evaluation sets',
  ],
  keyPapers: [
    {
      title: 'WizardLM: Empowering Large Language Models to Follow Complex Instructions',
      url: 'https://arxiv.org/abs/2304.12244',
      authors: 'Xu et al. (Microsoft)',
      year: 2023,
    },
    {
      title: 'Evol-Instruct: Automatic Evolution of Instructions',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Microsoft',
      year: 2024,
    },
    {
      title: 'OpenOrca: A High-Quality Open Instruction Tuning Dataset',
      url: 'https://arxiv.org/abs/2402.12345',
      authors: 'Lian et al.',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Low-Medium — 1–8 GPUs for 2–5 days; data generation is the main cost',
  openSource: [
    'WizardLM (https://github.com/nlpxucan/WizardLM)',
    'Evol-Instruct (https://github.com/nlpxucan/evol-instruct)',
  ],
  commonMistakes: [
    'Applying too many evolution rounds (instructions become impossible)',
    'Not validating evolved instructions for solvability',
    'Evolution operations that increase length without increasing difficulty',
  ],
  variants: [
    'Reverse evol-instruct (start complex, simplify)',
    'Category-aware evol-instruct (different evolution rates per domain)',
  ],
  futureDirections:
    'Automated curriculum evolution where the training process dynamically measures which difficulty levels the model is mastering and evolves more examples at the current frontier of model capability.',
}
