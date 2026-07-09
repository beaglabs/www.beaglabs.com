import type { Recipe } from '../types'

export const multiViewDiffusion: Recipe = {
  id: 'multi-view-diffusion',
  title: 'Multi-View Diffusion',
  part: '3d-generation',
  order: 1,
  purpose:
    'Train a diffusion model to generate multiple consistent views of a 3D object from a single input image or text prompt, enabling 3D asset creation without explicit 3D supervision.',
  usedBy: ['Zero-1-to-3', 'MVDream', 'CAT3D', 'Stable Zero123'],
  coreIdea:
    'Multi-view diffusion extends standard image diffusion to generate several images of the same object from different camera viewpoints, with cross-view consistency. The model conditions on a reference image and relative camera pose, and generates N views simultaneously using cross-attention between views. Training requires either multi-view renderings of 3D assets or video frames (where consecutive frames approximate multi-view). The generated views can then be fed into a 3D reconstruction method (NeRF, Gaussian Splatting) for full 3D asset creation.',
  pipeline: [
    'Collect multi-view renderings of 3D objects from objaverse or similar',
    'Prepare camera parameters (extrinsics, intrinsics) for each view',
    'Train diffusion model conditioned on reference image + relative camera pose',
    'Add cross-view attention layers for multi-view consistency',
    'Optional: fine-tune on video data for better generalizability',
    'At inference: input reference image, specify desired views',
    'Generate N consistent views via the diffusion model',
    'Reconstruct 3D (NeRF, Gaussian Splatting) from generated views',
  ],
  advantages: [
    'Produces 3D-consistent multi-view outputs',
    'Works from a single image or text prompt',
    'No explicit 3D supervision needed during training',
    'Compatible with existing 3D reconstruction pipelines',
  ],
  disadvantages: [
    'Requires large datasets of multi-view renderings',
    'Cross-view consistency is not always perfect',
    'Camera pose estimation is an additional engineering challenge',
  ],
  worksBestFor: [
    'Single-image to 3D asset generation',
    'Text-to-3D generation (via text-to-image models)',
    'View synthesis for 3D reconstruction',
  ],
  keyPapers: [
    {
      title: 'Zero-1-to-3: Zero-shot One Image to 3D Object',
      url: 'https://arxiv.org/abs/2303.11328',
      authors: 'Liu et al.',
      year: 2023,
    },
    {
      title: 'MVDream: Multi-View Diffusion for 3D Generation',
      url: 'https://arxiv.org/abs/2308.16512',
      authors: 'Shi et al.',
      year: 2023,
    },
    {
      title: 'CAT3D: Create Anything in 3D',
      url: 'https://arxiv.org/abs/2405.12345',
      authors: 'Meta AI',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'High — 16–64 GPUs for 7–21 days for full model training',
  openSource: [
    'Zero-1-to-3 (https://github.com/cvlab-columbia/zero123)',
    'MVDream (https://github.com/bytedance/mvdream)',
    'Stable Zero123 (https://github.com/Stability-AI/generative-models)',
  ],
  commonMistakes: [
    'Not enough camera pose diversity in training data',
    'Training without cross-view attention (views are inconsistent)',
    'Using too few views for reconstruction (3 views minimum, 6+ recommended)',
  ],
  variants: [
    'Score Distillation Sampling (SDS) — use pretrained multi-view diffusion as 3D prior',
    'Video-based multi-view (fine-tune on video to learn view consistency)',
  ],
  futureDirections:
    'Real-time multi-view generation that can produce hundreds of consistent views from a single input, enabling instant 3D reconstruction for AR/VR and gaming applications.',
}
