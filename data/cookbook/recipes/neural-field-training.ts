import type { Recipe } from '../types'

export const neuralFieldTraining: Recipe = {
  id: 'neural-field-training',
  title: 'Neural Field Training',
  part: '3d-generation',
  order: 4,
  purpose:
    'Train implicit neural representations (NeRF, Instant NGP, tri-plane) that encode 3D scenes as continuous functions mapping spatial coordinates to density and color, optimized from multi-view images.',
  usedBy: ['NeRF', 'Instant NGP', 'Neuralangelo', 'Tri-plane (EG3D)'],
  coreIdea:
    'Neural fields represent a 3D scene as a neural network that maps a 3D coordinate (and optionally viewing direction) to density and color. Training uses differentiable volume rendering: for each pixel, points along the camera ray are sampled, their density and color are evaluated by the network, and alpha-composited to produce a pixel color. The loss between rendered and ground truth pixel colors drives the optimization. Modern variants use efficient grid-based representations (Instant NGP), tri-plane hybrid representations (EG3D), or hash encoding for fast training.',
  pipeline: [
    'Collect multi-view images with camera parameters',
    'For each pixel, sample 3D points along the camera ray',
    'Query the neural field (position → density, color)',
    'Volume render: alpha-composite the sampled points',
    'Compute photometric loss vs ground truth pixel',
    'Backpropagate through the volume rendering equation',
    'Optional: add regularization (TV loss, distortion loss)',
    'Train for typically 10k-100k iterations',
  ],
  advantages: [
    'Continuous representation (arbitrary resolution)',
    'Compact storage (a single MLP for an entire scene)',
    'Handles complex topology and transparent objects',
  ],
  disadvantages: [
    'Slow rendering (requires many network evaluations per pixel)',
    'Slow training (hours to days for complex scenes)',
    'Requires accurate camera parameters',
  ],
  worksBestFor: [
    'Novel view synthesis from photos',
    'Scene capture and reconstruction',
    '3D-aware image generation (EG3D)',
  ],
  keyPapers: [
    {
      title: 'NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis',
      url: 'https://arxiv.org/abs/2003.08934',
      authors: 'Mildenhall et al.',
      year: 2020,
    },
    {
      title: 'Instant Neural Graphics Primitives with a Multiresolution Hash Encoding',
      url: 'https://arxiv.org/abs/2201.05989',
      authors: 'Müller et al. (NVIDIA)',
      year: 2022,
    },
    {
      title: 'Neuralangelo: High-Fidelity Neural Surface Reconstruction',
      url: 'https://arxiv.org/abs/2306.03018',
      authors: 'Li et al. (NVIDIA)',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Low-Medium — 1–4 GPUs for 15 minutes (Instant NGP) to 24 hours (full NeRF)',
  openSource: [
    'Nerfstudio (https://github.com/nerfstudio-project/nerfstudio)',
    'Instant NGP (https://github.com/NVlabs/instant-ngp)',
    'Neuralangelo (https://github.com/NVlabs/neuralangelo)',
  ],
  commonMistakes: [
    'Inaccurate camera poses (biggest source of NeRF failure)',
    'Training with too few views (< 15 for complex scenes)',
    'Not using scene contraction for unbounded scenes',
  ],
  variants: [
    'Tri-plane / EG3D (hybrid explicit-implicit for 3D-aware GANs)',
    'Zip-NeRF (multi-scale hash grid for anti-aliasing)',
    'NeRF in the Wild (handles variable lighting and occluders)',
  ],
  futureDirections:
    'Neural fields that generalize across scenes: a single network pre-trained on thousands of scenes can reconstruct a new scene from just 1-3 views by inverting a small latent code.',
}
