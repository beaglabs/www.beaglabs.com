import type { Recipe } from '../types'

export const visionRL: Recipe = {
  id: 'vision-rl',
  title: 'Vision RL',
  part: 'vision',
  order: 5,
  purpose:
    'Apply reinforcement learning to vision tasks by using differentiable reward functions (aesthetic scoring, CLIP alignment, or human feedback) to fine-tune generative vision models.',
  usedBy: ['DALL-E RL fine-tuning', 'Imagen reward training', 'Aesthetic fine-tuning pipelines'],
  coreIdea:
    'Vision RL treats the image generation process as a policy that produces visual outputs, which are then scored by a reward function. The reward can be a learned aesthetic scorer, a CLIP-based alignment score, or a human preference model. By backpropagating through the reward function, the vision model is fine-tuned to produce higher-reward outputs. Key challenges include making non-differentiable rewards differentiable (via score function estimators or Gumbel-softmax) and preventing reward overfitting.',
  pipeline: [
    'Define reward function (aesthetic scorer, CLIP score, human preference model)',
    'Generate batch of images from current vision policy',
    'Score each image using the reward function',
    'Compute policy gradient (REINFORCE or differentiable approximation)',
    'Add KL regularization against the base model',
    'Update vision model parameters',
    'Evaluate on diversity and quality metrics',
    'Iterate',
  ],
  advantages: [
    'Can optimize for arbitrary reward functions',
    'Directly improves human-judged quality',
    'Compatible with any generative vision architecture',
  ],
  disadvantages: [
    'Policy gradient methods have high variance',
    'Reward models can be hacked (over-optimization)',
    'Requires careful balancing of reward vs diversity',
  ],
  worksBestFor: [
    'Improving image aesthetics',
    'Fine-tuning for brand/style consistency',
    'Optimizing for specific metrics (CLIP score, FID)',
  ],
  keyPapers: [
    {
      title: 'Fine-Tuning Image Generators with Human Preferences',
      url: 'https://arxiv.org/abs/2310.01245',
      authors: 'Lee et al.',
      year: 2023,
    },
    {
      title: 'Rewarding Progress: Scaling Reward Models for Vision',
      url: 'https://arxiv.org/abs/2403.01234',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'Medium — 8–32 GPUs for 2–7 days depending on reward model and generator size',
  openSource: [
    'DRaFT (https://github.com/kvablack/draft)',
    'Diffusers (https://github.com/huggingface/diffusers)',
  ],
  commonMistakes: [
    'Over-optimizing the reward at the cost of diversity',
    'Using a reward model that is not calibrated for the target domain',
    'Applying too strong KL regularization (no improvement)',
  ],
  variants: [
    'Reward-guided diffusion (guidance-scale style reward conditioning)',
    'Reinforcement fine-tuning with human feedback for vision',
  ],
  futureDirections:
    'Multi-objective vision RL where diverse reward functions (aesthetics, safety, brand consistency, text alignment) are optimized simultaneously using preference-based multi-objective RL.',
}
