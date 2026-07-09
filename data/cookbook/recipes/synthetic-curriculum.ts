import type { Recipe } from '../types'

export const syntheticCurriculum: Recipe = {
  id: 'synthetic-curriculum',
  title: 'Synthetic Curriculum',
  part: 'language-models',
  order: 9,
  purpose:
    'Generate training data with progressive difficulty, enabling models to learn complex capabilities by starting with easy examples and gradually increasing challenge.',
  usedBy: ['Phi series (Microsoft)', 'Code generation models', 'Math LMs'],
  coreIdea:
    'Instead of training on a static dataset, synthetic curriculum dynamically generates examples at increasing difficulty levels. Early examples teach basic patterns (format, simple reasoning), while later examples require composition of multiple skills. The difficulty can be controlled by prompt complexity, required reasoning steps, or the number of concepts that must be combined. This mirrors how human learning progresses from simple to complex.',
  pipeline: [
    'Define difficulty dimensions (reasoning steps, concept count, abstraction level)',
    'Generate seed examples at each difficulty level',
    'Train model on easiest level until proficiency threshold',
    'Advance to next difficulty level, mixing in some easy examples',
    'Generate harder examples using the current model (if verifiable)',
    'Continue until model reaches target capability',
    'Final fine-tuning on mixed difficulty distribution',
  ],
  advantages: [
    'Faster convergence than uniform difficulty training',
    'Reduces early overfitting on hard examples the model cannot solve',
    'Produces more robust models that generalize across difficulty levels',
    'Works particularly well for code and math',
  ],
  disadvantages: [
    'Requires reliable difficulty estimation for each example',
    'Curriculum pacing is a sensitive hyperparameter',
    'Difficult to design curricula for open-ended tasks',
  ],
  worksBestFor: [
    'Mathematical reasoning (hierarchical problem difficulty)',
    'Code generation (syntax → single function → multi-file projects)',
    'Reading comprehension (short passages → long documents)',
  ],
  keyPapers: [
    {
      title: 'Textbooks Are All You Need',
      url: 'https://arxiv.org/abs/2306.11644',
      authors: 'Gunasekar et al. (Microsoft)',
      year: 2023,
    },
    {
      title: 'Phi-2: The Surprising Power of Small Language Models',
      url: 'https://arxiv.org/abs/2401.00001',
      authors: 'Microsoft Research',
      year: 2024,
    },
    {
      title: 'Curriculum Learning for Language Modeling',
      url: 'https://arxiv.org/abs/2305.14610',
      authors: 'Various',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Medium — requires multiple training rounds; 8–32 GPUs for 3–7 days total',
  openSource: [
    'Axolotl (https://github.com/axolotl-ai-cloud/axolotl)',
    'LMFlow (https://github.com/OptimalScale/LMFlow)',
  ],
  commonMistakes: [
    'Advancing difficulty too fast — model plateaus or regresses',
    'Not maintaining enough easy examples in the mix (catastrophic forgetting)',
    'Using a single difficulty metric when multiple skills are needed',
  ],
  variants: [
    'Automatic curriculum learning (model\'s loss determines when to advance)',
    'Self-paced learning (model selects its own difficulty level)',
    'Transfer curriculum (learn simple skills first, then compose)',
  ],
  futureDirections:
    'Online curriculum adaptation where the difficulty is adjusted in real-time based on the model\'s current performance on a validation set, creating an optimal learning trajectory.',
}
