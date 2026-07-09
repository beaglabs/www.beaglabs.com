import type { Recipe } from '../types'

export const rectifiedFlow: Recipe = {
  id: 'rectified-flow',
  title: 'Rectified Flow',
  part: 'vision',
  order: 3,
  purpose:
    'Straighten the probability flow ODE trajectories through a reflow procedure, enabling high-quality generation in very few (2-10) sampling steps.',
  usedBy: ['Stable Diffusion 3', 'InstaFlow', 'Consistency trajectory models'],
  coreIdea:
    'Rectified flow is a two-step process. First, train a flow matching model on the standard linear interpolation paths. Second, use the learned model to generate new data-noise pairs and train a new model to match the straighter trajectories implied by the first model. This "reflow" procedure straightens the ODE paths, allowing coarse numerical solvers (2-10 steps) to produce high-quality samples. Multiple reflow rounds can be applied.',
  pipeline: [
    'Train initial flow matching model (standard CFM)',
    'Sample noise x₀, generate x₁ via ODE solver through first model',
    'Pair (x₀, x₁) as new training data',
    'Train second flow matching model on these straighter paths',
    'Optional: repeat reflow for further straightening',
    'Sample using 2-10 Euler steps through the rectified model',
    'Evaluate quality vs step count',
  ],
  advantages: [
    '2-10 step sampling with quality approaching 50-step diffusion',
    'Simple idea that works across modalities',
    'Each reflow round progressively straightens paths',
    'Compatible with any flow matching backbone',
  ],
  disadvantages: [
    'Requires training the model multiple times (reflow rounds)',
    'Reflow can introduce slight quality degradation if overdone',
    'Initial model must be trained before reflow can begin',
  ],
  worksBestFor: [
    'Fast sampling applications (real-time generation)',
    'Latency-sensitive deployment scenarios',
    'Mobile and edge image generation',
  ],
  keyPapers: [
    {
      title: 'Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow',
      url: 'https://arxiv.org/abs/2209.03003',
      authors: 'Liu et al.',
      year: 2022,
    },
    {
      title: 'InstaFlow: One Step is Enough for High-Quality Diffusion',
      url: 'https://arxiv.org/abs/2309.06380',
      authors: 'Liu et al.',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Medium — reflow costs roughly 0.5x to 1x the original training run; 8–64 GPUs for 2–7 days per round',
  openSource: [
    'Rectified Flow (https://github.com/gnobitab/Flow-Matching)',
    'Diffusers (https://github.com/huggingface/diffusers)',
  ],
  commonMistakes: [
    'Applying too many reflow rounds (diminishing returns after 2-3)',
    'Not using enough ODE steps in the reflow data generation',
    'Reflowing with a model that is not yet converged',
  ],
  variants: [
    'Recursive Rectified Flow (chain multiple reflows)',
    'Latent Rectified Flow (reflow in the latent space of an autoencoder)',
  ],
  futureDirections:
    'Single-step rectified flow through progressive distillation of the reflowed model, achieving GAN-level speed with diffusion-level quality.',
}
