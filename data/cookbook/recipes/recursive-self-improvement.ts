import type { Recipe } from '../types'

export const recursiveSelfImprovement: Recipe = {
  id: 'recursive-self-improvement',
  title: 'Recursive Self-Improvement',
  part: 'language-models',
  order: 8,
  purpose:
    'Enable a model to generate its own training data, filter it, and retrain on it in iterative cycles, bootstrapping capability without external supervision.',
  usedBy: ['DeepSeek R1-Zero', 'Self-Rewarding models', 'STaR'],
  coreIdea:
    'In recursive self-improvement, the model generates candidate solutions or reasoning traces, filters them using a reward signal or self-consistency check, and retrains on the filtered outputs. Each iteration produces a slightly better model, which generates better data for the next round. Key variants include STaR (bootstrapped reasoning), Self-Rewarding (model judges its own outputs), and ReST (iterative self-training with rejection sampling).',
  pipeline: [
    'Current model generates N completions per prompt',
    'Score/filter completions using reward model or verifier',
    'Keep only high-quality completions as training data',
    'Fine-tune model on filtered self-generated data',
    'New model replaces old model',
    'Repeat for M iterations',
    'Evaluate on held-out benchmarks each round',
  ],
  advantages: [
    'Scales with compute rather than human data collection',
    'Can discover novel solution strategies not in the training data',
    'Theoretical path to superhuman performance on narrow domains',
  ],
  disadvantages: [
    'Risk of mode collapse — model reinforces its own biases',
    'Quality of the filter/reward is the bottleneck',
    'Diminishing returns after several iterations without diversity injection',
  ],
  worksBestFor: [
    'Reasoning tasks with verifiable outcomes',
    'Code generation (test-based filtering)',
    'Narrow domains with clear success criteria',
  ],
  keyPapers: [
    {
      title: 'STaR: Bootstrapping Reasoning With Reasoning',
      url: 'https://arxiv.org/abs/2203.14465',
      authors: 'Zelikman et al.',
      year: 2022,
    },
    {
      title: 'Self-Rewarding Language Models',
      url: 'https://arxiv.org/abs/2401.10020',
      authors: 'Yuan et al.',
      year: 2024,
    },
    {
      title: 'ReST: Reinforcement from Self-Training',
      url: 'https://arxiv.org/abs/2308.08998',
      authors: 'Gulcehre et al.',
      year: 2023,
    },
    {
      title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL',
      url: 'https://arxiv.org/abs/2501.12948',
      authors: 'DeepSeek AI',
      year: 2025,
    },
  ],
  complexity: 3,
  compute: 'Medium — each iteration costs roughly the same as one SFT run; 5-10 iterations typical',
  openSource: [
    'STaR (https://github.com/ezelikman/STaR)',
    'TRL (https://github.com/huggingface/trl)',
    'veRL (https://github.com/volcengine/verl)',
  ],
  commonMistakes: [
    'Filter too loose — model learns from its own errors and degrades',
    'Not enough diversity in prompts — model overfits to narrow distribution',
    'Stopping too early — improvements compound across iterations',
  ],
  variants: [
    'STaR (rationale generation + answer filtering)',
    'Self-Rewarding (model generates and judges its own outputs)',
    'ReST (expectation-maximization style self-training)',
    'Self-Play (model competes against previous versions)',
  ],
  futureDirections:
    'Continuous self-improvement during deployment where the model trains on real user interactions filtered by verified outcomes, creating a perpetual improvement loop.',
}
