import type { Recipe } from '../types'

export const dapo: Recipe = {
  id: 'dapo',
  title: 'Decoupled Clip and Dynamic Sampling Policy Optimization',
  part: 'language-models',
  order: 2,
  purpose:
    'Address GRPO stability and efficiency issues by decoupling the clipping mechanism and dynamically filtering samples that contribute noise to the policy gradient.',
  usedBy: ['ByteDance (seed1.5-vl)', 'Large-scale reasoning systems'],
  coreIdea:
    'DAPO improves on GRPO with two key modifications. First, it decouples the clipping of positive and negative advantages so that positive updates are not constrained by the same clip threshold as negative ones — allowing the model to reinforce good responses more aggressively. Second, it dynamically filters out samples with very low probability under the current policy (outdated samples) and samples where the reward signal is ambiguous, reducing gradient noise.',
  pipeline: [
    'Policy generates G responses per prompt',
    'Reward model scores each response',
    'Filter out low-probability and ambiguous-reward samples',
    'Compute group-relative advantages on remaining samples',
    'Apply decoupled clipping: positive advantages clipped at different epsilon',
    'Policy gradient step with adaptive KL penalty',
    'Adjust group size adaptively based on filter rate',
    'Repeat',
  ],
  advantages: [
    'More stable training than GRPO by removing noisy gradient contributions',
    'Decoupled clipping allows faster learning from positive examples',
    'Adaptive batch sizing reduces wasted computation on low-quality samples',
    'Better sample efficiency than vanilla GRPO',
  ],
  disadvantages: [
    'More hyperparameters than GRPO (two clip epsilons, filter thresholds)',
    'Filtering can discard hard but informative examples if thresholds are wrong',
    'Requires careful tuning of the adaptive group size mechanism',
  ],
  worksBestFor: [
    'Large-scale RL training (1000+ GPU hours)',
    'Vision-language reasoning tasks',
    'Settings where GRPO shows training instability',
  ],
  keyPapers: [
    {
      title:
        'DAPO: An Open-Source Framework for Distributed Large-Scale Reinforcement Learning',
      url: 'https://arxiv.org/abs/2504.05766',
      authors: 'ByteDance Seed Team',
      year: 2025,
    },
    {
      title: 'seed1.5-vl: Pioneering the Path to Multimodal Reasoning',
      url: 'https://arxiv.org/abs/2505.11897',
      authors: 'ByteDance Seed Team',
      year: 2025,
    },
  ],
  complexity: 4,
  compute:
    'Medium — 8–64 H100 GPUs for 2–5 days (longer due to sample filtering overhead)',
  openSource: [
    'veRL (https://github.com/volcengine/verl)',
    'OpenRLHF (https://github.com/OpenRLHF/OpenRLHF)',
  ],
  commonMistakes: [
    'Setting the clip threshold for positive advantages too high (reward hacking)',
    'Over-filtering: discarding > 50% of samples reduces effective batch size too much',
    'Not annealing the filter rate as training converges',
  ],
  variants: [
    'Soft filtering (weighting samples by quality instead of binary discard)',
    'DAPO with length reward shaping for concise reasoning',
  ],
  futureDirections:
    'Learn-to-filter: train a separate gating network to decide which samples to keep, rather than using hand-crafted heuristics.',
}
