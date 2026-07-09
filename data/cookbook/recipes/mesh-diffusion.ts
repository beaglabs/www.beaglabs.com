import type { Recipe } from '../types'

export const meshDiffusion: Recipe = {
  id: 'mesh-diffusion',
  title: 'Mesh Diffusion',
  part: '3d-generation',
  order: 3,
  purpose:
    'Train diffusion models that directly generate 3D mesh structures (vertices, faces, topology) rather than 2D representations, producing ready-to-use 3D assets.',
  usedBy: ['MeshGPT', 'PolyGen', 'MeshDiffusion', 'XNOR'],
  coreIdea:
    'Mesh diffusion operates directly on 3D mesh representations instead of generating 2D views for reconstruction. The training pipeline involves encoding meshes into a structured representation (vertex sequences, triangle sets, or latent codes), then learning the diffusion process on this representation. MeshGPT uses a transformer to autoregressively generate vertex positions and face connectivity. PolyGen generates meshes by first predicting vertex positions, then predicting the face topology. This produces watertight, production-ready meshes without post-processing.',
  pipeline: [
    'Dataset of high-quality 3D meshes (Objaverse, ShapeNet, etc.)',
    'Normalize meshes: consistent orientation, scale, and vertex order',
    'Encode meshes into a token sequence (vertices + connectivity)',
    'Train a transformer or diffusion model on mesh token sequences',
    'Apply vertex position quantization for discrete tokenization',
    'Optional: train a separate connectivity decoder',
    'At inference: denoise or autoregressively generate mesh tokens',
    'Decode tokens back to vertex positions and triangle connectivity',
    'Apply post-processing (subdivision, smoothing)',
  ],
  advantages: [
    'Directly produces 3D meshes, not implicit representations',
    'Quality improves with more training data and compute',
    'Can generate watertight, manifold meshes',
  ],
  disadvantages: [
    'Fixed vertex count limits geometric complexity',
    'Mesh tokenization is lossy (quantization artifacts)',
    'Requires large datasets of clean 3D meshes',
    'More computationally expensive than implicit methods',
  ],
  worksBestFor: [
    'Game and AR/VR asset generation',
    '3D modeling assistance and auto-completion',
    'Shape interpolation and editing',
  ],
  keyPapers: [
    {
      title: 'MeshGPT: Generating Triangle Meshes with Decoder-Only Transformers',
      url: 'https://arxiv.org/abs/2311.15475',
      authors: 'Siddiqui et al.',
      year: 2023,
    },
    {
      title: 'PolyGen: An Autoregressive Generative Model of 3D Meshes',
      url: 'https://arxiv.org/abs/2102.06120',
      authors: 'Nash et al. (DeepMind)',
      year: 2021,
    },
    {
      title: 'MeshDiffusion: Score-Based Generative 3D Mesh Modeling',
      url: 'https://arxiv.org/abs/2306.01234',
      authors: 'Liu et al.',
      year: 2023,
    },
  ],
  complexity: 5,
  compute: 'High — 16–64 GPUs for 7–21 days',
  openSource: [
    'MeshGPT (https://github.com/lucidrains/meshgpt-pytorch)',
    'PolyGen (https://github.com/deepmind/deepmind-research/tree/master/polygen)',
  ],
  commonMistakes: [
    'Using too coarse vertex quantization (visible faceting artifacts)',
    'Training on poorly cleaned mesh data (non-manifold geometry)',
    'Not handling topological degeneracies in training data',
  ],
  variants: [
    'Octree-based mesh generation (variable resolution)',
    'Latent mesh diffusion (diffuse in a compressed latent space)',
    'Text-conditional mesh generation (via CLIP or similar text encoder)',
  ],
  futureDirections:
    'Unified mesh generation that simultaneously predicts geometry, topology, texture coordinates, and materials in a single diffusion or autoregressive model, producing game-ready assets directly.',
}
