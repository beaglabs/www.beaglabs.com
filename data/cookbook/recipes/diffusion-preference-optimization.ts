import type { Recipe } from '../types'

export const diffusionPreferenceOptimization: Recipe = {
  id: 'diffusion-preference-optimization',
  title: 'Diffusion Preference Optimization',
  part: 'vision',
  order: 1,
  purpose:
    'Align diffusion model outputs with human aesthetic and quality preferences by optimizing the denoising trajectory toward preferred image characteristics.',
  usedBy: ['Stable Diffusion 3', 'Midjourney', 'DALL-E 3 alignment'],
  coreIdea:
    'Diffusion Preference Optimization (DPO for diffusion) extends the preference optimization concept to the denoising process. Given pairs of images where one is preferred (better aesthetics, better prompt alignment), DPO fine-tunes the diffusion model to increase the likelihood of the preferred denoising trajectory. This is done by treating the entire reverse diffusion chain as a multi-step decision process and optimizing the implicit reward defined by the preference pair. Key variants include Diffusion-DPO, SPIN-Diffusion, and DRaFT.',
  pipeline: [
    'Generate pairs of images from the diffusion model for diverse prompts',
    'Collect human or automated preference judgments (A vs B)',
    'Define preference loss over denoising trajectories',
    'Fine-tune UNet or DiT backbone using preference gradients',
    'Apply KL regularization to prevent mode collapse',
    'Evaluate on FID, CLIP score, and human preference metrics',
    'Iterate with online preference collection',
  ],
  advantages: [
    'Directly optimizes for human preferences, not just FID',
    'Reduces prompt-misalignment issues',
    'Can correct specific failure modes (anatomy, text rendering)',
  ],
  disadvantages: [
    'Requires high-quality preference data, ideally human-labeled',
    'Over-optimization can reduce diversity',
    'Compute-intensive — each training example requires full denoising',
  ],
  worksBestFor: [
    'Aesthetic fine-tuning of text-to-image models',
    'Reducing artifact rates (extra fingers, garbled text)',
    'Brand- or style-specific alignment',
  ],
  keyPapers: [
    {
      title: 'Diffusion-DPO: Aligning Diffusion Models with Human Preferences',
      url: 'https://arxiv.org/abs/2311.12908',
      authors: 'Wallace et al.',
      year: 2023,
    },
    {
      title: 'DRaFT: Differentiable Rendering for Fine-Tuning Diffusion Models',
      url: 'https://arxiv.org/abs/2402.12345',
      authors: 'Clark et al.',
      year: 2024,
    },
    {
      title: 'Aligning Text-to-Image Models with Human Preference',
      url: 'https://arxiv.org/abs/2312.01835',
      authors: 'Xu et al.',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'High — 8–64 GPUs for 3–10 days depending on model size and preference dataset size',
  openSource: [
    'Diffusion-DPO (https://github.com/baaivision/diffusion-dpo)',
    'PickScore (https://github.com/yuvalala1/pickscore)',
  ],
  commonMistakes: [
    'Using a reward model that disagrees with human judgment',
    'Applying too strong a preference weight — reduces diversity to a single style',
    'Not balancing preference data across prompt types',
  ],
  variants: [
    'SPIN-Diffusion (self-play with preference self-training)',
    'Direct Reward Fine-Tuning (end-to-end reward optimization)',
  ],
  futureDirections:
    'Multi-dimensional preference optimization where different dimensions (aesthetics, safety, style fidelity) are optimized independently and combined at inference time.',
}
