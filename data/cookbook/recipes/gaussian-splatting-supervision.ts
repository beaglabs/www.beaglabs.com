import type { Recipe } from '../types'

export const gaussianSplattingSupervision: Recipe = {
  id: 'gaussian-splatting-supervision',
  title: 'Gaussian Splatting Supervision',
  part: '3d-generation',
  order: 2,
  purpose:
    'Train 3D Gaussian Splatting representations from multi-view images or video, optimizing the position, covariance, color, and opacity of Gaussian primitives to reconstruct a 3D scene.',
  usedBy: ['3D Gaussian Splatting (Kerbl et al.)', 'SplaTAM', 'Nerfstudio GS pipelines'],
  coreIdea:
    '3D Gaussian Splatting represents a scene as a collection of anisotropic 3D Gaussians, each defined by a position, covariance matrix, color (with spherical harmonics for view-dependence), and opacity. Training optimizes these parameters through differentiable rendering: Gaussians are projected to the image plane, rasterized, and compared to training views using photometric loss. Adaptive density control splits and clones Gaussians where reconstruction error is high, and prunes near-transparent ones.',
  pipeline: [
    'Initialize point cloud from SfM (Structure from Motion) or random',
    'Initialize Gaussians at each point with isotropic covariance',
    'For each training view: project Gaussians to camera plane',
    'Rasterize projected Gaussians with alpha-compositing (front-to-back sort)',
    'Compute photometric loss against ground truth view',
    'Backpropagate through all Gaussian parameters',
    'Adaptive density control: split high-error Gaussians, prune low-opacity',
    'Optional: periodic resetting of near-transparent Gaussians',
    'Repeat for 30k-300k iterations',
  ],
  advantages: [
    'Real-time rendering (>100 FPS at 1080p)',
    'Fast training (minutes to hours, vs days for NeRF)',
    'Excellent visual quality with sharp details',
  ],
  disadvantages: [
    'High memory usage (millions of Gaussians at full quality)',
    'Requires good initial point cloud (SfM) for best results',
    'Less compact than NeRF (larger storage footprint)',
  ],
  worksBestFor: [
    'Novel view synthesis from multi-view photos',
    'Real-time 3D scene rendering',
    '3D reconstruction from video',
    'Digital twins and scene scanning',
  ],
  keyPapers: [
    {
      title: '3D Gaussian Splatting for Real-Time Radiance Field Rendering',
      url: 'https://arxiv.org/abs/2308.04079',
      authors: 'Kerbl et al.',
      year: 2023,
    },
    {
      title: 'Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis',
      url: 'https://arxiv.org/abs/2308.09713',
      authors: 'Luiten et al.',
      year: 2023,
    },
    {
      title: 'DrivingGaussian: Composite Gaussian Splatting for Autonomous Driving',
      url: 'https://arxiv.org/abs/2312.07900',
      authors: 'Zhou et al.',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Low-Medium — 1–4 GPUs for 15 minutes to 2 hours per scene',
  openSource: [
    '3D Gaussian Splatting (https://github.com/graphdeco-inria/gaussian-splatting)',
    'Nerfstudio GS (https://github.com/nerfstudio-project/gsplat)',
    'SplaTAM (https://github.com/spla-tam/SplaTAM)',
  ],
  commonMistakes: [
    'Using too few training views (< 20 leads to poor reconstruction)',
    'Not tuning the adaptive density control thresholds',
    'Neglecting spherical harmonics for view-dependent effects',
  ],
  variants: [
    'Dynamic Gaussian Splatting (4D Gaussians for video/scene flow)',
    'Semantic Gaussian Splatting (add semantic features to each Gaussian)',
    'Compressed Gaussian Splatting (vector quantization for smaller storage)',
  ],
  futureDirections:
    'Feed-forward Gaussian Splatting prediction directly from a single image or video, eliminating per-scene optimization entirely and enabling real-time 3D reconstruction.',
}
