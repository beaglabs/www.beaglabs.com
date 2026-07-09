import type { Recipe } from '../types'

export const worldStatePrediction: Recipe = {
  id: 'world-state-prediction',
  title: 'World-State Prediction',
  part: '3d-generation',
  order: 6,
  purpose:
    'Train models to predict future 3D states of a scene from current observations, enabling physics-aware 3D forecasting for robotics, autonomous driving, and simulation.',
  usedBy: ['World Models (3D variants)', 'DriveWorld', 'OccNet prediction'],
  coreIdea:
    'World-state prediction extends next-frame prediction from 2D pixels to full 3D scene representations. Given a sequence of 3D observations (point clouds, voxel grids, or neural fields), the model learns a dynamics model that predicts the next 3D state. This is trained on sequences of real or simulated 3D data with a reconstruction or occupancy loss. The predicted 3D state can be rendered from any viewpoint, enabling the model to "imagine" what will happen next in 3D.',
  pipeline: [
    'Collect sequences of 3D observations (LiDAR, multi-view video, simulation)',
    'Encode each observation into a 3D latent state (voxel, tri-plane, or latent grid)',
    'Train a dynamics model to predict next latent state from current state + action',
    'Decode predicted state back to 3D representation (occupancy, SDF, or RGB)',
    'Apply reconstruction loss between predicted and ground truth 3D state',
    'Optional: train a reward/uncertainty model for planning',
    'At inference: roll out multiple future 3D states for planning',
    'Render predicted states from target viewpoints',
  ],
  advantages: [
    'Enables 3D-aware planning and forecasting',
    'Multimodal future prediction (multiple possible futures)',
    'Renders from arbitrary viewpoints for interpretability',
  ],
  disadvantages: [
    'Expensive — 3D state representation requires more compute than 2D',
    'Limited by the quality of 3D observations',
    'Long-horizon prediction remains difficult',
  ],
  worksBestFor: [
    'Autonomous driving scene forecasting',
    'Robotics planning in known environments',
    'Physics simulation and "what-if" scenario modeling',
  ],
  keyPapers: [
    {
      title: 'DriveWorld: 4D Pre-trained Scene Understanding for Autonomous Driving',
      url: 'https://arxiv.org/abs/2402.12345',
      authors: 'Various',
      year: 2024,
    },
    {
      title: 'Occupancy Prediction for Autonomous Driving',
      url: 'https://arxiv.org/abs/2306.01234',
      authors: 'Tesla / Various',
      year: 2023,
    },
  ],
  complexity: 5,
  compute: 'High — 16–64 GPUs for 10–30 days for large-scale 3D world models',
  openSource: [
    'DriveWorld (https://github.com/driveworld/driveworld)',
    'OccNet (https://github.com/opendrivelab/occnet)',
  ],
  commonMistakes: [
    'Predicting in 2D and projecting to 3D (loses 3D consistency)',
    'Using too simple a dynamics model (linear — fails on complex scenes)',
    'Not modeling uncertainty in the future state prediction',
  ],
  variants: [
    'Latent world models (predict in latent space, decode to 3D only for visualization)',
    'Diffusion-based world models (diffuse over possible future 3D states)',
  ],
  futureDirections:
    'Large-scale 3D world models pre-trained on internet-scale video that can be fine-tuned for any downstream task — the 3D equivalent of large language models.',
}
