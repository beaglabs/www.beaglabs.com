import type { Recipe } from '../types'

export const behaviorCloning: Recipe = {
  id: 'behavior-cloning',
  title: 'Behavior Cloning',
  part: 'robotics',
  order: 5,
  purpose:
    'Learn robot control policies by directly imitating expert demonstrations, treating the problem as supervised learning: map observations to actions.',
  usedBy: ['ALOHA (Mobile ALOHA)', 'RT-2 (Google)', 'Imitation learning pipelines'],
  coreIdea:
    'Behavior cloning frames robot learning as a supervised problem: given a dataset of expert demonstrations (observation → action pairs), train a neural network to predict the expert action from the observation. While conceptually simple, practical BC requires addressing distribution shift (the policy encounters states not in the training data), action stochasticity, and demonstration quality. Modern BC for robotics uses large vision-language backbones (RT-2), diffusion-based action prediction, and data augmentation to handle multimodal action distributions.',
  pipeline: [
    'Collect expert demonstrations via teleoperation or kinesthetic teaching',
    'Preprocess observations (images, proprioception, to a standardized format)',
    'Train a neural network to predict expert action from observation',
    'Use data augmentation (random crops, color jitter) for robustness',
    'Optionally use action chunking (predict N actions per observation window)',
    'Deploy policy, observe states where it fails',
    'Data augmentation during deployment (DAgger-like)',
  ],
  advantages: [
    'Simple supervised learning — no reward design',
    'Fast to train compared to RL methods',
    'Safe (imitates expert behavior, avoids random exploration)',
  ],
  disadvantages: [
    'Distribution shift at test time (states not seen in training)',
    'Quality limited by demonstration quality',
    'Cannot exceed expert performance (unlike RL)',
  ],
  worksBestFor: [
    'Small-scale, short-horizon manipulation tasks',
    'Tasks with good demonstration coverage',
    'Starting point before RL fine-tuning',
  ],
  keyPapers: [
    {
      title: 'Mobile ALOHA: Learning Bimanual Mobile Manipulation',
      url: 'https://arxiv.org/abs/2306.09332',
      authors: 'Fu et al.',
      year: 2023,
    },
    {
      title: 'RT-2: Vision-Language-Action Models for Web-Scale Robot Control',
      url: 'https://arxiv.org/abs/2307.15818',
      authors: 'Zitkovich et al. (Google DeepMind)',
      year: 2023,
    },
    {
      title: 'A Survey of Imitation Learning for Robotics',
      url: 'https://arxiv.org/abs/2201.01234',
      authors: 'Various',
      year: 2022,
    },
  ],
  complexity: 2,
  compute: 'Low-Medium — 1–8 GPUs for 1–4 days depending on model and dataset size',
  openSource: [
    'Mobile ALOHA (https://github.com/MarkFzp/mobile-aloha)',
    'RLbench (https://github.com/stepjam/RLBench)',
  ],
  commonMistakes: [
    'Training on too few demonstrations (does not cover state space)',
    'Not using any noise injection or augmentation (brittle policy)',
    'Using deterministic action prediction for inherently multimodal tasks',
  ],
  variants: [
    'DAgger (Dataset Aggregation — collect new demos at states visited by current policy)',
    'Visual behavior cloning (image → actions with vision backbone)',
    'Diffusion behavior cloning (diffusion over action sequences)',
  ],
  futureDirections:
    'Internet-scale behavior cloning where robot policies are pre-trained on human video datasets showing diverse manipulation, enabling zero-shot generalization to new tasks and objects.',
}
