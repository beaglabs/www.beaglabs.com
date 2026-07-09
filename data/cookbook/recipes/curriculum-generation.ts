import type { Recipe } from '../types'

export const curriculumGeneration: Recipe = {
  id: 'curriculum-generation',
  title: 'Curriculum Generation',
  part: 'synthetic-data',
  order: 6,
  purpose:
    'Generate synthetic training data at graduated difficulty levels that automatically adjusts to the model current capability, enabling continuous improvement through optimal challenge.',
  usedBy: ['Phi-3 curriculum (Microsoft)', 'Self-play curriculum', 'Automatic curriculum RL'],
  coreIdea:
    'Curriculum generation creates training examples at multiple difficulty levels and presents them to the model in an order that maximizes learning efficiency. The difficulty of a synthetic example can be controlled by prompt complexity, required reasoning depth, number of constraints, or length of the required response. The curriculum can be static (pre-generated at fixed levels) or dynamic (generated based on the model current performance). Dynamic curriculum uses a zone of proximal development approach: generate examples the model can almost solve but not quite.',
  pipeline: [
    'Define difficulty dimensions and levels (1-10 scale)',
    'Generate synthetic data at each difficulty level',
    'Evaluate current model on each level to find frontier difficulty',
    'Generate more training data at the frontier and adjacent levels',
    'Train on mixed difficulty data (mostly frontier, some easier, some harder)',
    'Re-evaluate to find new frontier',
    'Repeat until target capability is reached',
  ],
  advantages: [
    'More efficient than uniform-difficulty training',
    'Prevents overfitting on easy examples early',
    'Ensures the model is always challenged at the right level',
  ],
  disadvantages: [
    'Difficulty estimation is not always accurate',
    'Generating data at the right level requires iteration',
    'Curriculum pacing is an additional hyperparameter to tune',
  ],
  worksBestFor: [
    'Pre-training small models (Phi-3 approach)',
    'Reasoning capability improvement',
    'Domain-specific capability building',
  ],
  keyPapers: [
    {
      title: 'Textbooks Are All You Need (Phi-1)',
      url: 'https://arxiv.org/abs/2306.11644',
      authors: 'Gunasekar et al. (Microsoft)',
      year: 2023,
    },
    {
      title: 'Phi-3 Technical Report: A Highly Capable Language Model',
      url: 'https://arxiv.org/abs/2404.14219',
      authors: 'Microsoft Research',
      year: 2024,
    },
    {
      title: 'Automatic Curriculum Learning for Language Model Training',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Medium — 4–16 GPUs for 3–10 days; generation cost is significant',
  openSource: [
    'Phi-3 training recipe (Microsoft)',
    'Axolotl (https://github.com/axolotl-ai-cloud/axolotl)',
  ],
  commonMistakes: [
    'Frontier difficulty estimated incorrectly (too easy or too hard)',
    'Not enough data at the frontier level',
    'Ignoring forgetting — need to mix in easier examples',
  ],
  variants: [
    'Automatic curriculum (model loss determines difficulty progression)',
    'Self-play curriculum (model competes with previous versions)',
  ],
  futureDirections:
    'On-the-fly curriculum generation where a small orchestrator model monitors training loss and generates precisely the data the main model needs at each step — optimal learning trajectory without pre-planned curriculum.',
}
