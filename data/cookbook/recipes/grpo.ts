import type { Recipe } from '../types'

export const grpo: Recipe = {
  id: 'grpo',
  title: 'Group Relative Policy Optimization',
  part: 'language-models',
  order: 1,
  purpose:
    'Improve reasoning capabilities through group-based advantage estimation, eliminating the need for a separate value/critic network.',
  usedBy: ['DeepSeek R1', 'DeepSeek R1-Zero', 'Frontier reasoning models'],
  coreIdea:
    'Instead of training a separate value network to estimate advantages, GRPO samples a group of responses from the policy, scores each response with a reward model, and computes advantages relative to the group mean. The policy is then updated to increase the probability of responses that scored above average. A KL penalty keeps the policy from drifting too far from the reference model.',
  pipeline: [
    'Policy generates G responses per prompt',
    'Reward model scores each response',
    'Compute group mean and std of rewards',
    'Normalize rewards to per-group advantages',
    'Policy gradient update weighted by advantages',
    'KL divergence penalty against reference model',
    'Repeat',
  ],
  advantages: [
    'No critic/value network needed — reduces memory and compute',
    'Lower variance than REINFORCE due to group-based baselining',
    'Naturally explores diverse responses via group sampling',
    'Simpler training pipeline than PPO',
  ],
  disadvantages: [
    'Requires large per-prompt batch sizes (G = 8–64) for stable advantages',
    'Reward model must be fast enough to score all responses in group',
    'Group size is a sensitive hyperparameter',
  ],
  worksBestFor: [
    'Multi-step reasoning (math, code, logic)',
    'Tasks with verifiable outcomes',
    'Scenarios where you have a good reward model',
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
      title: 'DeepSeekMath: Pushing the Limits of Mathematical Reasoning',
      url: 'https://arxiv.org/abs/2402.03300',
      authors: 'DeepSeek AI',
      year: 2024,
    },
    {
      title: 'The N+ Implementation Details of RLHF with PPO',
      url: 'https://arxiv.org/abs/2503.17091',
      authors: 'Huang et al.',
      year: 2025,
    },
  ],
  complexity: 3,
  compute:
    'Medium — 8–64 H100 GPUs for 1–3 days depending on model size and group size',
  openSource: [
    'OpenRLHF (https://github.com/OpenRLHF/OpenRLHF)',
    'veRL (https://github.com/volcengine/verl)',
    'TRL (https://github.com/huggingface/trl)',
  ],
  commonMistakes: [
    'Setting group size too small (G < 4) leads to high advantage variance',
    'Not normalizing rewards within each group (absolute rewards create bias)',
    'Over-weighting the KL penalty, preventing meaningful policy improvement',
  ],
  variants: ['DAPO (decoupled clip + dynamic sampling)', 'GRPO with length penalty for concise reasoning'],
  futureDirections:
    'Adaptive group sizing, heterogeneous group sampling (different model sizes in same group), and GRPO for multi-modal reasoning.',
}
