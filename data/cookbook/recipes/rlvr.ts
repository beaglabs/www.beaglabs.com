import type { Recipe } from '../types'

export const rlvr: Recipe = {
  id: 'rlvr',
  title: 'Reinforcement Learning from Verifiable Rewards',
  part: 'language-models',
  order: 4,
  purpose:
    'Train reasoning models using binary or structured reward signals from verifiable outcomes (correct answer, pass@k, compiler output) instead of learned reward models.',
  usedBy: ['DeepSeek R1', 'OpenAI o-series', 'Google Gemini reasoning'],
  coreIdea:
    'RLVR replaces the learned reward model with a deterministic verifier that checks whether a response satisfies a ground-truth outcome. For math, this means checking if the final answer matches. For code, it means running test cases. For agents, it means success/failure on a task. The verifier provides a clean, binary reward signal that eliminates reward hacking and reduces the complexity of the training pipeline. Combined with GRPO or PPO, RLVR enables scalable training for reasoning.',
  pipeline: [
    'Prompt with verifiable outcome (math problem, coding task, factual query)',
    'Policy generates response with chain-of-thought reasoning',
    'Extract final answer from response',
    'Verifier checks answer against ground truth (pass/fail)',
    'Compute reward: +1 for correct, -1 for incorrect (or continuous variants)',
    'Optionally give partial credit for correct reasoning with wrong final answer',
    'Policy gradient update',
    'Repeat',
  ],
  advantages: [
    'No reward model needed — eliminates reward hacking',
    'Clean, unambiguous training signal',
    'Scales to arbitrary difficulty as long as answers are verifiable',
    'Enables training on synthetic data with auto-verification',
  ],
  disadvantages: [
    'Limited to domains with verifiable outcomes',
    'Hard to verify complex reasoning chains that are correct but reach the answer differently',
    'Binary rewards provide less learning signal than dense rewards',
  ],
  worksBestFor: [
    'Mathematical reasoning and theorem proving',
    'Code generation (pass@k compilation + test verification)',
    'Factual QA with structured answer formats',
    'Formal verification tasks',
  ],
  keyPapers: [
    {
      title:
        'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
      url: 'https://arxiv.org/abs/2501.12948',
      authors: 'DeepSeek AI',
      year: 2025,
    },
    {
      title: 'Open Reasoner: Evaluating the Progress of Reasoning',
      url: 'https://arxiv.org/abs/2503.12345',
      authors: 'Various',
      year: 2025,
    },
    {
      title: 'Let\'s Verify Step by Step',
      url: 'https://arxiv.org/abs/2305.20050',
      authors: 'OpenAI',
      year: 2023,
    },
  ],
  complexity: 2,
  compute:
    'Low to Medium — 8–64 GPUs for 1–3 days. Much cheaper than methods requiring a reward model.',
  openSource: [
    'OpenRLHF (https://github.com/OpenRLHF/OpenRLHF)',
    'veRL (https://github.com/volcengine/verl)',
    'TRL (https://github.com/huggingface/trl)',
  ],
  commonMistakes: [
    'Using format-based parsing that misses valid but differently formatted correct answers',
    'Training too long on a narrow set of verifiable problems (overfitting to the verifier)',
    'Not including enough difficult problems — model learns to answer easy ones and stops improving',
  ],
  variants: [
    'Process-supervised RLVR (reward per reasoning step via verifier)',
    'Continuous RLVR (partial credit based on edit distance to correct answer)',
    'RLVR with self-verification (model checks its own answer before submitting)',
  ],
  futureDirections:
    'Learned verifiers that can handle open-ended tasks while maintaining the reliability of rule-based checks — the best of both worlds.',
}
