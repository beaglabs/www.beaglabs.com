import type { Recipe } from '../types'

export const proceduralSupervision: Recipe = {
  id: 'procedural-supervision',
  title: 'Procedural Supervision',
  part: '3d-generation',
  order: 7,
  purpose:
    'Use procedurally generated 3D data with perfect ground truth labels to supervise 3D vision models, bypassing the need for expensive real-world 3D annotation.',
  usedBy: ['Objaverse-XL training', '3D foundation models', 'CLIP for 3D'],
  coreIdea:
    'Procedural supervision generates synthetic 3D training data using rendering engines or procedural generation, providing perfect labels (depth, normals, segmentation, correspondences) at no human cost. The training pipeline renders large volumes of synthetic 3D scenes with varied geometry, materials, and lighting, then uses the automatically-generated labels to supervise 3D backbone networks. Models pretrained this way transfer surprisingly well to real-world 3D tasks.',
  pipeline: [
    'Design procedural scene generation pipeline (randomized layouts, objects, materials)',
    'Render multi-view images from synthetic 3D scenes',
    'Extract perfect ground truth: depth maps, normal maps, segmentation masks',
    'Train 3D feature backbone on rendered data with supervision',
    'Optionally train multi-view consistency objectives',
    'Fine-tune on real 3D data if available (domain adaptation)',
    'Evaluate on real-world 3D benchmarks',
  ],
  advantages: [
    'Perfect labels at zero human annotation cost',
    'Unlimited training data (scale to billions of examples)',
    'Controllable distribution (balance rare cases)',
    'Improves real-world performance through domain randomization',
  ],
  disadvantages: [
    'Sim-to-real gap: synthetic data has visual domain differences',
    'Procedural generation pipeline is engineering-intensive',
    'Cannot capture real-world corner cases that were not programmed',
  ],
  worksBestFor: [
    'Pre-training 3D foundation models',
    'Depth and normal estimation',
    'Multi-view correspondence learning',
    'Any task with a well-defined rendering pipeline',
  ],
  keyPapers: [
    {
      title: 'Objaverse: A Universe of Annotated 3D Objects',
      url: 'https://arxiv.org/abs/2212.08051',
      authors: 'Deitke et al.',
      year: 2022,
    },
    {
      title: 'Objaverse-XL: A Universe of 10M+ 3D Objects',
      url: 'https://arxiv.org/abs/2307.05663',
      authors: 'Deitke et al.',
      year: 2023,
    },
    {
      title: '3D Foundation Models: Pre-training for 3D Vision',
      url: 'https://arxiv.org/abs/2401.01234',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'Medium-High — rendering pipeline + training; 8–64 GPUs for 5–21 days',
  openSource: [
    'Objaverse (https://github.com/allenai/objaverse-xl)',
    'BlenderProc (https://github.com/DLR-RM/BlenderProc)',
  ],
  commonMistakes: [
    'Not randomizing lighting, textures, and camera positions enough',
    'Using a fixed synthetic distribution that does not match real-world priors',
    'Over-training on synthetic data (overfitting to render artifacts)',
  ],
  variants: [
    'Domain randomization (vary rendering parameters to bridge sim-to-real)',
    'Mixed reality data (composite rendered objects into real backgrounds)',
  ],
  futureDirections:
    'Generative procedural supervision where a diffusion model creates infinite diverse training scenes dynamically, adapting the synthetic data distribution to the model\'s current failure modes.',
}
