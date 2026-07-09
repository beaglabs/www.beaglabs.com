import type { Recipe } from '../types'

export const preferenceOptimization: Recipe = {
  id: 'preference-optimization',
  title: 'Preference Optimization',
  part: 'language-models',
  order: 5,
  purpose:
    'Align language model outputs with human preferences using direct preference pairs, eliminating the need for a separate reward model during training.',
  usedBy: ['Anthropic Claude', 'HuggingFace Zephyr', 'Intel NeuralChat'],
  coreIdea:
    'Direct Preference Optimization (DPO) reformulates RLHF without a reward model. Given pairs of preferred/rejected responses, DPO directly optimizes the policy to maximize the log-likelihood of preferred responses while penalizing the rejected ones, using a closed-form mapping between reward functions and optimal policies. Variants like KTO use unpaired preferences and IPO uses a squared-error loss for more stable optimization.',
  pipeline: [
    'Collect preference pairs (chosen vs rejected responses)',
    'For each pair, compute log-probabilities under current and reference policy',
    'Compute DPO loss: prefer chosen, penalize rejected with KL constraint',
    'Add reference model KL penalty to prevent collapse',
    'Optional: iterate with online preference collection',
    'Evaluate on alignment benchmarks',
    'Repeat',
  ],
  advantages: [
    'No reward model training needed — simpler pipeline',
    'More stable than PPO with learned reward models',
    'Works with static preference datasets (offline)',
    'Multiple well-tested open-source implementations',
  ],
  disadvantages: [
    'Sensitive to preference data quality — garbage in, garbage out',
    'Can reduce diversity if over-optimized on narrow preferences',
    'Does not explore new behaviors the way online RL does',
  ],
  worksBestFor: [
    'Final alignment stage after supervised fine-tuning',
    'Style and tone control',
    'Safety and harmlessness training',
  ],
  keyPapers: [
    {
      title: 'Direct Preference Optimization: Your Language Model is Secretly a Reward Model',
      url: 'https://arxiv.org/abs/2305.18290',
      authors: 'Rafailov et al.',
      year: 2023,
    },
    {
      title: 'KTO: Model Alignment as Prospect Theoretic Optimization',
      url: 'https://arxiv.org/abs/2402.01306',
      authors: 'Ethayarajh et al.',
      year: 2024,
    },
    {
      title: 'IPO: A General Framework for Preference Optimization',
      url: 'https://arxiv.org/abs/2310.12036',
      authors: 'Azar et al.',
      year: 2023,
    },
    {
      title: 'ORPO: Monolithic Preference Optimization without Reference Model',
      url: 'https://arxiv.org/abs/2403.07691',
      authors: 'Hong et al.',
      year: 2024,
    },
  ],
  complexity: 2,
  compute: 'Low — 1–8 GPUs for 1–2 days for a 7B model with a few thousand preference pairs',
  openSource: [
    'TRL (https://github.com/huggingface/trl)',
    'Axolotl (https://github.com/axolotl-ai-cloud/axolotl)',
    'alignment-handbook (https://github.com/huggingface/alignment-handbook)',
  ],
  commonMistakes: [
    'Using the same data for SFT and DPO (model already prefers chosen responses)',
    'Not using a reference model or using one that is too weak',
    'Beta temperature too low — overfitting to preference data',
  ],
  variants: [
    'KTO (unpaired preferences, prospect theory loss)',
    'IPO (squared-error loss, more stable)',
    'ORPO (no reference model, combines SFT + preference in one step)',
    'SimPO (sequence-level likelihood as implicit reward)',
  ],
  futureDirections:
    'Online DPO where the model generates new responses and preferences are collected iteratively during training, blending the stability of DPO with the exploration of RL.',
}
