import type { Recipe } from '../types'

export const consistencyModels: Recipe = {
  id: 'consistency-models',
  title: 'Consistency Models',
  part: 'vision',
  order: 4,
  purpose:
    'Train a model to directly map noise to data in a single step through consistency distillation, enabling one-step generation with quality approaching multi-step diffusion.',
  usedBy: ['OpenAI consistency models', 'Latent Consistency Models (LCM)'],
  coreIdea:
    'Consistency models enforce that the model produces the same output for any point along a diffusion trajectory — the "consistency" property. By learning this mapping, the model can jump from pure noise directly to the data distribution in a single step. Training uses either consistency distillation (from a pre-trained diffusion model) or consistency training (from scratch). Latent Consistency Models apply this in the latent space of an autoencoder for efficient text-to-image generation.',
  pipeline: [
    'Start with pre-trained diffusion model (for distillation)',
    'Generate trajectory pairs (x_t, x_s) at different timesteps along the diffusion path',
    'Define consistency loss: model(x_t, t) should equal model(x_s, s)',
    'Add boundary condition: at t=0, model(x_0, 0) = x_0',
    'Train with consistency loss + boundary condition',
    'Optionally distill for multiple step budgets (1, 2, 4 steps)',
    'Sample by directly evaluating model(x_noise, T)',
  ],
  advantages: [
    'One-step generation (fastest possible sampling)',
    'Quality much better than one-step GANs or VAE',
    'Flexible step budget — can use more steps for higher quality',
  ],
  disadvantages: [
    'Quality gap vs multi-step diffusion on complex scenes',
    'Consistency training from scratch is unstable',
    'Struggles with diverse, high-detail generation',
  ],
  worksBestFor: [
    'Real-time image generation',
    'Interactive creative tools',
    'Mobile and edge deployment',
    'Video generation (where per-frame speed matters)',
  ],
  keyPapers: [
    {
      title: 'Consistency Models',
      url: 'https://arxiv.org/abs/2303.01469',
      authors: 'Song et al. (OpenAI)',
      year: 2023,
    },
    {
      title: 'Latent Consistency Models: Synthesizing High-Resolution Images',
      url: 'https://arxiv.org/abs/2310.04378',
      authors: 'Luo et al.',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Medium — 8–32 GPUs for 2–5 days for distillation; longer for training from scratch',
  openSource: [
    'LCM-LoRA (https://github.com/luosiallen/latent-consistency-model)',
    'Diffusers LCM (https://github.com/huggingface/diffusers)',
  ],
  commonMistakes: [
    'Pushing to single step when 2-4 steps give much better quality',
    'Not tuning the consistency weighting function properly',
    'Using a poor teacher model for distillation',
  ],
  variants: [
    'Latent Consistency Models (distill in VAE latent space)',
    'LCM-LoRA (lightweight adaptation for any Stable Diffusion checkpoint)',
    'Consistency Trajectory Models (multi-step budget flexibility)',
  ],
  futureDirections:
    'Progressive consistency: a single model that smoothly trades off speed and quality at inference time, from 1 step to 50 steps, without re-training.',
}
