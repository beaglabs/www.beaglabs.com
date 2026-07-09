import type { Recipe } from '../types'

export const processSupervision: Recipe = {
  id: 'process-supervision',
  title: 'Process Supervision',
  part: 'language-models',
  order: 7,
  purpose:
    'Provide fine-grained reward signals at each reasoning step rather than only at the final answer, improving training signal density and reducing reward hacking in multi-step tasks.',
  usedBy: ['OpenAI o-series', 'Math-Shepherd', 'Step-level verifiers'],
  coreIdea:
    'Instead of rewarding only the final outcome (outcome supervision), process supervision assigns a reward to each intermediate reasoning step. A process reward model (PRM) is trained to evaluate whether each step is correct given the preceding context. This provides a dense training signal that helps the policy learn correct intermediate reasoning, even when the final answer is wrong (and vice versa).',
  pipeline: [
    'Collect step-by-step reasoning traces for training tasks',
    'Annotate each step as correct/incorrect or with a continuous score',
    'Train process reward model (PRM) on step-level annotations',
    'Policy generates multi-step reasoning for a batch of problems',
    'PRM scores each intermediate step',
    'Compute per-step advantages from PRM scores',
    'Policy gradient update using step-level rewards',
    'Optionally use PRM for test-time search (beam search over steps)',
    'Repeat',
  ],
  advantages: [
    'Denser reward signal improves learning efficiency',
    'Reduces reward hacking — hard to game 10 step-level rewards',
    'Enables test-time search (PRM-guided beam search over reasoning paths)',
    'Better generalization to out-of-distribution problems',
  ],
  disadvantages: [
    'Step-level annotation is expensive (human or strong model)',
    'PRM training is more complex than outcome reward modeling',
    'Defining "steps" is task-dependent and not always natural',
  ],
  worksBestFor: [
    'Mathematical reasoning (multi-step proofs)',
    'Code generation (step-by-step debugging)',
    'Scientific reasoning chains',
  ],
  keyPapers: [
    {
      title: 'Let\'s Verify Step by Step',
      url: 'https://arxiv.org/abs/2305.20050',
      authors: 'OpenAI',
      year: 2023,
    },
    {
      title: 'Math-Shepherd: Verify and Reinforce LLMs Step-by-Step',
      url: 'https://arxiv.org/abs/2312.08935',
      authors: 'Wang et al.',
      year: 2023,
    },
    {
      title: 'Process Reward Model for Mathematical Reasoning',
      url: 'https://arxiv.org/abs/2402.00175',
      authors: 'Luo et al.',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'Medium-High — 16–64 GPUs for 4–10 days including PRM training and policy RL',
  openSource: [
    'Math-Shepherd (https://github.com/RLHFlow/Math-Shepherd)',
    'OpenRLHF (https://github.com/OpenRLHF/OpenRLHF)',
  ],
  commonMistakes: [
    'Using a PRM trained on one domain for another domain without adaptation',
    'Defining steps too coarsely (no benefit over outcome supervision) or too finely (annotation noise)',
    'Not calibrating PRM scores — they can be overconfident on incorrect steps',
  ],
  variants: [
    'Automatic process supervision (using a strong model as the step annotator instead of humans)',
    'Automatic curriculum process supervision (adaptive step granularity based on difficulty)',
  ],
  futureDirections:
    'Unsupervised process supervision where the model self-consistency across multiple rollouts serves as the process reward signal, eliminating the need for annotated step data.',
}
