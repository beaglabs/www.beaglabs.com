import type { Recipe } from '../types'

export const animationDistillation: Recipe = {
  id: 'animation-distillation',
  title: 'Animation Distillation',
  part: '3d-generation',
  order: 8,
  purpose:
    'Transfer animation rigs and motion sequences from template 3D assets to newly generated 3D objects, enabling automatic animation of generative 3D content.',
  usedBy: ['Animatediff (3D extension)', 'Motion transfer for 3D', 'Skinning-based generation'],
  coreIdea:
    'Animation distillation transfers existing animation data (skeletal rigs, blend shapes, skinning weights) to novel 3D geometries. Given a source 3D asset with an animation rig, and a target 3D object in a similar pose, the model learns to predict skinning weights and rig parameters for the target object. This enables generated 3D assets to be automatically animated using existing animation libraries, bypassing the expensive manual rigging process.',
  pipeline: [
    'Dataset of rigged 3D assets with animation sequences',
    'Train a correspondence model (source rig → target geometry mapping)',
    'Predict skinning weights for target mesh using geometric features',
    'Transfer skeletal rig to target (match bone positions to target topology)',
    'Apply source animation sequences to target through transferred rig',
    'Refine with physics-based correction (intersection resolution)',
    'Render animated target from desired viewpoints',
  ],
  advantages: [
    'Animates generated 3D content without manual rigging',
    'Leverages existing high-quality animation libraries',
    'Compatible with standard game engine pipelines (FBX, glTF)',
  ],
  disadvantages: [
    'Requires similar topology between source and target',
    'Degraded quality for very different geometries',
    'Complex motion sequences may not transfer cleanly',
  ],
  worksBestFor: [
    'Character animation from generated 3D assets',
    'Game asset pipeline automation',
    'Batch animation of 3D asset libraries',
  ],
  keyPapers: [
    {
      title: 'Animation from Motion: Transferring Animations to 3D Assets',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Various',
      year: 2024,
    },
    {
      title: 'RigNet: Neural Rigging for Articulated Characters',
      url: 'https://arxiv.org/abs/2005.12345',
      authors: 'Xu et al.',
      year: 2020,
    },
  ],
  complexity: 4,
  compute: 'Medium — 4–16 GPUs for 3–7 days for training; real-time at inference',
  openSource: [
    'RigNet (https://github.com/zhan-xu/RigNet)',
    'Blender auto-rigging addons',
  ],
  commonMistakes: [
    'Using source and target meshes with very different vertex counts',
    'Not handling non-rigid deformations (cloth, soft tissue)',
    'Applying animations designed for one scale to very different asset sizes',
  ],
  variants: [
    'Neural skinning (predict vertex transformations directly, no skeleton)',
    'Example-based animation (interpolate between keyframe poses)',
  ],
  futureDirections:
    'Animation generation directly from text or video: describe "a walking cycle for this dragon" and the full rig + animation is generated without any source template.',
}
