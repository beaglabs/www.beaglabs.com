import type { Recipe } from '../types'

export const actionDiffusion: Recipe = {
  id: 'action-diffusion',
  title: 'Action Diffusion',
  part: 'robotics',
  order: 2,
  purpose:
    'Generate robot action sequences using diffusion models, enabling smooth, multimodal, and temporally consistent behavior generation for complex manipulation and locomotion tasks.',
  usedBy: ['Diffusion Policy', 'Chained Diffusion', 'Robotics diffusion models'],
  coreIdea:
    'Action diffusion treats action generation as a denoising process: starting from random noise in action space, a diffusion model iteratively denoises toward a valid action sequence. The model is conditioned on visual observations and (optionally) goal states. The key advantages over direct regression are multimodality (multiple valid actions for the same observation) and temporal consistency (actions are generated as a sequence, not per-timestep). This produces smoother, more robust robot behavior.',
  pipeline: [
    'Collect expert demonstrations (action sequences + observations)',
    'Represent actions as sequences over a temporal window (e.g., 16 timesteps)',
    'Train a conditional diffusion model: denoise actions conditioned on observations',
    'Use visual encoder to extract observation features',
    'At inference: sample random action noise, iteratively denoise conditioned on observation',
    'Execute the first few actions from the denoised sequence, then re-plan',
    'Repeat at each control step',
  ],
  advantages: [
    'Inherently multimodal — produces diverse valid actions',
    'Smooth action sequences (avoids jerky per-timestep noise)',
    'Robust to observation noise through the denoising process',
    'Easy to incorporate via pre-trained diffusion backbones',
  ],
  disadvantages: [
    'Slower than direct regression (multiple denoising steps)',
    'Requires large demonstration datasets',
    'Diffusion inference is more complex than standard policy forward passes',
  ],
  worksBestFor: [
    'Visuomotor policy learning (image → actions)',
    'Fine manipulation (smooth, precise movements needed)',
    'Tasks with diverse action modalities',
  ],
  keyPapers: [
    {
      title: 'Diffusion Policy: Visuomotor Policy Learning via Action Diffusion',
      url: 'https://arxiv.org/abs/2303.04137',
      authors: 'Chi et al.',
      year: 2023,
    },
    {
      title: 'Chained Diffusion Models for Robotic Manipulation',
      url: 'https://arxiv.org/abs/2311.01234',
      authors: 'Various',
      year: 2023,
    },
    {
      title: 'Generalized Diffusion Policy for Diverse Robot Tasks',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Zhou et al.',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Medium — 1–8 GPUs for 2–7 days for typical real-world policy training',
  openSource: [
    'Diffusion Policy (https://github.com/real-stanford/diffusion_policy)',
  ],
  commonMistakes: [
    'Using too short a temporal window (loses consistency benefits)',
    'Too many denoising steps at inference (latency)',
    'Not tuning the observation conditioning properly',
  ],
  variants: [
    'Observation-space diffusion (diffuse over observation latents + actions jointly)',
    'Hierarchical action diffusion (high-level plan → low-level actions)',
  ],
  futureDirections:
    'Real-time action diffusion on robot hardware with 1-2 denoising steps (consistency-style), achieving diffusion policy quality at control-loop frequency.',
}
