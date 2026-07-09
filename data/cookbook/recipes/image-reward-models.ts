import type { Recipe } from '../types'

export const imageRewardModels: Recipe = {
  id: 'image-reward-models',
  title: 'Image Reward Models',
  part: 'vision',
  order: 6,
  purpose:
    'Train scoring models that evaluate image quality, aesthetics, and prompt alignment, enabling automated evaluation and reward signals for vision model fine-tuning.',
  usedBy: ['PickScore', 'ImageReward', 'HPS (Human Preference Score) v2'],
  coreIdea:
    'Image reward models are trained on human preference judgments (image A vs B given a prompt) to predict which image a human would prefer. They typically use a vision-language backbone (CLIP, BLIP) with a lightweight scoring head. The reward model outputs a scalar score for any image-prompt pair, serving as a proxy for human judgment. These scores are used for model evaluation, prompt engineering, and as reward signals in RL-based fine-tuning.',
  pipeline: [
    'Collect diverse prompts and generate image pairs',
    'Collect human judgments (which image is better? why?)',
    'Load vision-language backbone (CLIP-ViT or similar)',
    'Add a scoring head (MLP or linear projection)',
    'Train on preference pairs using a Bradley-Terry loss',
    'Optional: add fine-grained attributes (quality, alignment, aesthetics)',
    'Evaluate on held-out preference judgments',
    'Deploy as reward model for evaluation or RL training',
  ],
  advantages: [
    'Enables automated evaluation at scale',
    'Provides a smooth reward signal for RL fine-tuning',
    'Can predict multiple quality dimensions',
  ],
  disadvantages: [
    'Bias inherits from the preference data collector',
    'Generalizes poorly to out-of-distribution prompts/styles',
    'Can be gamed by adversarial image features',
  ],
  worksBestFor: [
    'Automated evaluation of generated images',
    'Reward signal for diffusion RL fine-tuning',
    'Filtering and ranking image generation outputs',
  ],
  keyPapers: [
    {
      title: 'ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation',
      url: 'https://arxiv.org/abs/2304.05977',
      authors: 'Xu et al.',
      year: 2023,
    },
    {
      title: 'PickScore: Human Preference Scoring for Text-to-Image Generation',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Kirstain et al.',
      year: 2024,
    },
    {
      title: 'Human Preference Score v2: A Better Benchmark for Image Generation',
      url: 'https://arxiv.org/abs/2310.01467',
      authors: 'Wu et al.',
      year: 2023,
    },
  ],
  complexity: 2,
  compute: 'Low — 1–8 GPUs for 1–3 days for typical model sizes (CLIP-L or ViT-L backbone)',
  openSource: [
    'ImageReward (https://github.com/THUDM/ImageReward)',
    'PickScore (https://github.com/yuvalala1/pickscore)',
    'HPS v2 (https://github.com/tgxs002/HPSv2)',
  ],
  commonMistakes: [
    'Training on too few prompt-image pairs (underfitting preferences)',
    'Using the reward model on prompts very different from training distribution',
    'Not normalizing scores across different prompt types',
  ],
  variants: [
    'Multi-aspect reward models (separate heads for aesthetics, alignment, artifacts)',
    'Video reward models (temporal consistency scoring)',
  ],
  futureDirections:
    'Reward models that produce fine-grained pixel-level feedback, identifying exactly which regions of an image are problematic, enabling targeted improvement.',
}
