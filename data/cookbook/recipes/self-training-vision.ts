import type { Recipe } from '../types'

export const selfTrainingVision: Recipe = {
  id: 'self-training-vision',
  title: 'Self-Training for Vision',
  part: 'vision',
  order: 7,
  purpose:
    'Improve vision models iteratively by generating pseudo-labels or synthetic training examples and retraining on the augmented dataset, reducing reliance on human annotation.',
  usedBy: ['Noisy Student (EfficientNet)', 'Self-training for detection', 'DINO self-distillation'],
  coreIdea:
    'Self-training in vision follows a teacher-student loop: a teacher model generates pseudo-labels on unlabeled data, and a student is trained on the combined labeled + pseudo-labeled data. The student then becomes the teacher for the next iteration. This can be combined with data augmentation, noise injection, and consistency regularization. Modern approaches like DINO and DINOv2 use self-distillation with careful augmentation strategies to learn visual features without any labels.',
  pipeline: [
    'Train initial teacher on labeled data (or use a pre-trained backbone)',
    'Teacher generates pseudo-labels for unlabeled dataset',
    'Apply confidence filtering to keep high-quality pseudo-labels',
    'Train student on labeled + pseudo-labeled data with strong augmentations',
    'Student becomes the new teacher',
    'Repeat for multiple generations',
    'Evaluate on target benchmarks',
  ],
  advantages: [
    'Leverages large amounts of unlabeled or synthetic data',
    'Iterative improvement without new human labels',
    'Works across classification, detection, and segmentation',
  ],
  disadvantages: [
    'Pseudo-label noise amplifies across iterations',
    'Requires careful confidence threshold tuning',
    'Expensive — requires multiple full training runs',
  ],
  worksBestFor: [
    'Semi-supervised vision tasks with abundant unlabeled data',
    'Domain adaptation (labeled source, unlabeled target)',
    'Pre-training vision backbones',
  ],
  keyPapers: [
    {
      title: 'Self-Training with Noisy Student Improves ImageNet Classification',
      url: 'https://arxiv.org/abs/1911.04252',
      authors: 'Xie et al. (Google)',
      year: 2019,
    },
    {
      title: 'DINOv2: Learning Robust Visual Features without Supervision',
      url: 'https://arxiv.org/abs/2304.07193',
      authors: 'Meta AI',
      year: 2023,
    },
    {
      title: 'STAC: Self-Training for Object Detection',
      url: 'https://arxiv.org/abs/2005.01557',
      authors: 'Sohn et al.',
      year: 2020,
    },
  ],
  complexity: 3,
  compute: 'Medium — 2–3x the cost of a single supervised training run; 4–32 GPUs for 3–10 days',
  openSource: [
    'DINO (https://github.com/facebookresearch/dino)',
    'SEER (https://github.com/facebookresearch/vissl)',
  ],
  commonMistakes: [
    'Using a teacher that is too weak (low-quality pseudo-labels)',
    'Not filtering pseudo-labels by confidence',
    'Applying identical augmentations to teacher and student',
  ],
  variants: [
    'Noisy Student Training (inject noise during student training for robustness)',
    'DINO (self-distillation with no labels, using CLS token)',
    'Consistency-based self-training (enforce prediction consistency under augmentations)',
  ],
  futureDirections:
    'Vision self-training that incorporates generative models: a diffusion model generates synthetic training images with perfect labels, which are then used to train vision encoders in an endless data flywheel.',
}
