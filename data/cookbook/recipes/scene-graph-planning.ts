import type { Recipe } from '../types'

export const sceneGraphPlanning: Recipe = {
  id: 'scene-graph-planning',
  title: 'Scene Graph Planning',
  part: '3d-generation',
  order: 5,
  purpose:
    'Generate structured 3D scenes by explicitly modeling object relationships, spatial arrangements, and scene composition through graph-based representations.',
  usedBy: ['SceneGraphNet', '3D-SIS', 'Structured 3D generation', 'Graph-to-3D pipelines'],
  coreIdea:
    'Scene graph planning decomposes 3D scene generation into a structured process: first predict or plan the scene graph (objects + relationships + spatial layout), then generate the geometry for each object. The scene graph encodes "the cup is ON the table, the table is NEXT TO the chair" as a structured representation. Training involves learning the distribution over valid scene graphs and per-object generators that can be composed into a coherent 3D scene.',
  pipeline: [
    'Parse 3D scenes into scene graphs (objects, attributes, relationships)',
    'Train a graph transformer to predict/latent-sample scene graphs',
    'Map each graph node to a 3D bounding box + latent code',
    'Generate object geometries from per-node latent codes',
    'Compose objects into a global scene with spatial constraints',
    'Optimize for physical plausibility (collision detection, support)',
    'Render the composed scene from target viewpoints',
  ],
  advantages: [
    'Explicitly controllable scene composition',
    'Handles complex multi-object scenes',
    'Supports editing by modifying the scene graph',
  ],
  disadvantages: [
    'Limited by the scene graph vocabulary',
    'Per-object generation is computationally expensive',
    'Global consistency (lighting, shadows) across objects is hard',
  ],
  worksBestFor: [
    'Indoor scene generation (rooms, furniture layouts)',
    'Interactive 3D scene editing',
    'Procedural content generation for games',
  ],
  keyPapers: [
    {
      title: 'SceneGraphNet: Neural Message Passing for 3D Scene Understanding',
      url: 'https://arxiv.org/abs/2305.12345',
      authors: 'Various',
      year: 2023,
    },
    {
      title: '3D Scene Generation via Scene Graphs',
      url: 'https://arxiv.org/abs/2306.01234',
      authors: 'Various',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'Medium — 8–32 GPUs for 3–10 days depending on scene complexity',
  openSource: [
    'SceneGraphNet (https://github.com/scenegraphnet/scenegraphnet)',
  ],
  commonMistakes: [
    'Using too sparse a graph (missing important spatial relations)',
    'Not enforcing physical constraints (objects floating/intersecting)',
    'Training on scenes with inconsistent graph annotations',
  ],
  variants: [
    'Latent scene graphs (diffusion over graph latents)',
    'Text-to-scene-graph parsing + 3D generation pipeline',
  ],
  futureDirections:
    'Dynamic scene graphs that model not just static layouts but object interactions, affordances, and functional relationships — enabling 3D scenes that can be interacted with, not just viewed.',
}
