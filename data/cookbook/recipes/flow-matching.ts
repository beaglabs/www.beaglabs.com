import type { Recipe } from '../types'

export const flowMatching: Recipe = {
  id: 'flow-matching',
  title: 'Flow Matching',
  part: 'vision',
  order: 2,
  purpose:
    'Generate samples by learning a continuous normalizing flow between a noise distribution and the data distribution, providing a simpler and more stable alternative to score-based diffusion.',
  usedBy: ['Stable Diffusion 3', 'Flux (Black Forest Labs)', 'Sora', 'Rectified Flow models'],
  coreIdea:
    'Flow matching replaces the diffusion SDE/ODE with a direct regression objective: given a linear interpolation between noise x₀ and data x₁, the model learns to predict the velocity field dx/dt that maps one to the other. Unlike score matching, flow matching has no time-dependent normalization constants and does not require solving a reverse SDE at inference. The result is simpler training, faster sampling, and better likelihood estimation.',
  pipeline: [
    'Sample data point x₁ from the dataset',
    'Sample noise x₀ from a prior distribution (Gaussian)',
    'Sample timestep t uniformly from [0, 1]',
    'Compute interpolated point x_t = (1-t)x₀ + tx₁',
    'Target velocity v_t = x₁ - x₀ (the straight-line direction)',
    'Train model to predict v_t given x_t and t',
    'Optional: reflow step to straighten trajectories',
    'Sample by integrating the predicted velocity field from t=0 to t=1',
  ],
  advantages: [
    'Simpler training objective than score-matching — no score-normalization',
    'Deterministic ODE sampling (no SDE discretization error)',
    'Straight trajectories enable fewer sampling steps (2-10 steps)',
    'Better likelihood estimation than diffusion models',
  ],
  disadvantages: [
    'Requires an ODE solver at inference (though efficient ones exist)',
    'Reflow (trajectory straightening) adds complexity',
    'Less studied than diffusion for conditional generation tasks',
  ],
  worksBestFor: [
    'Text-to-image generation (Stable Diffusion 3, Flux)',
    'Text-to-video (Sora-scale flow matching)',
    'High-speed sampling applications',
  ],
  keyPapers: [
    {
      title: 'Flow Matching for Generative Modeling',
      url: 'https://arxiv.org/abs/2210.02747',
      authors: 'Lipman et al.',
      year: 2022,
    },
    {
      title: 'Stable Diffusion 3: Scaling Rectified Flow Transformers',
      url: 'https://arxiv.org/abs/2403.03206',
      authors: 'Stability AI',
      year: 2024,
    },
    {
      title: 'Flow Matching: Simplified and Generalized',
      url: 'https://arxiv.org/abs/2402.02552',
      authors: 'Tong et al.',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Medium-High — similar to diffusion training; 16–128 GPUs for 5–14 days for full-scale models',
  openSource: [
    'torchcfm (https://github.com/atong01/conditional-flow-matching)',
    'Diffusers (https://github.com/huggingface/diffusers)',
  ],
  commonMistakes: [
    'Using too few sampling steps at inference (quality degrades with very coarse solvers)',
    'Not tuning the noise distribution variance',
    'Skipping the reflow step for high-quality generation',
  ],
  variants: [
    'Rectified Flow (reflow step to create straight trajectories)',
    'Conditional Flow Matching (CFM — conditions on labels or text)',
    'Discrete Flow Matching (for discrete data like text/tokens)',
  ],
  futureDirections:
    'Unified flow matching frameworks that handle images, video, 3D, and audio with the same architecture and training procedure — a single generative model for all modalities.',
}
