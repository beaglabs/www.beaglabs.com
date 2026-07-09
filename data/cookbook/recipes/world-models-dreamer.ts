import type { Recipe } from '../types'

export const worldModelsDreamer: Recipe = {
  id: 'world-models-dreamer',
  title: 'World Models',
  part: 'robotics',
  order: 1,
  purpose:
    'Train a latent dynamics model of the environment that enables a policy to learn by "imagining" future trajectories through the learned world model, reducing real-world interaction.',
  usedBy: ['DreamerV3 (DeepMind)', 'DayDreamer', 'IRIS', 'TransDreamer'],
  coreIdea:
    'World models learn a compressed latent representation of the environment dynamics, then train a policy entirely within this latent space. DreamerV3 encodes observations into a compact latent state, predicts future latent states and rewards using a recurrent dynamics model, and trains an actor-critic policy on latent imaginary rollouts. Because the model "dreams" trajectories, the policy can learn from far more experience than was actually collected in the real environment. This dramatically improves sample efficiency.',
  pipeline: [
    'Collect initial experience from environment (random or safe policy)',
    'Train RSSM (Recurrent State-Space Model): encode observations → latent states',
    'Train dynamics predictor: predict next latent state from current state + action',
    'Train reward predictor: predict reward from latent state',
    'Sample imaginary trajectories from the world model (no environment)',
    'Train actor-critic policy on imagined latent trajectories',
    'Deploy policy in real environment, collect new experience',
    'Update world model with new real experience',
    'Repeat',
  ],
  advantages: [
    'Extremely sample efficient — learns from 1% of the data model-free methods need',
    'Learns a compact representation of environment dynamics',
    'Policy training is fast (no environment latency)',
    'Works with sparse rewards due to dense imagined training',
  ],
  disadvantages: [
    'World model errors compound during long-horizon imagination',
    'Requires careful tuning of the latent dynamics model',
    'Limited to environments that can be accurately modeled',
  ],
  worksBestFor: [
    'Continuous control tasks',
    'Environments with expensive or slow real-world interaction',
    'Tasks requiring long-horizon planning',
    'Real-world robotics (sample efficiency matters)',
  ],
  keyPapers: [
    {
      title: 'Dream to Control: Learning Behaviors by Latent Imagination',
      url: 'https://arxiv.org/abs/1912.01603',
      authors: 'Hafner et al. (DeepMind)',
      year: 2019,
    },
    {
      title: 'Mastering Diverse Domains through World Models (DreamerV3)',
      url: 'https://arxiv.org/abs/2301.04104',
      authors: 'Hafner et al. (DeepMind)',
      year: 2023,
    },
    {
      title: 'DayDreamer: World Models for Physical Robot Learning',
      url: 'https://arxiv.org/abs/2206.14176',
      authors: 'Wu et al.',
      year: 2022,
    },
  ],
  complexity: 4,
  compute: 'Medium — 1–8 GPUs for 2–7 days for typical benchmarks; scales with environment complexity',
  openSource: [
    'DreamerV3 (https://github.com/danijar/dreamerv3)',
    'Dreamer (https://github.com/google-research/dreamer)',
  ],
  commonMistakes: [
    'Using a world model that is too small to capture environment dynamics',
    'Not training the world model long enough before policy training',
    'Imagining trajectories that are too short (policy does not learn planning)',
  ],
  variants: [
    'TransDreamer (transformer-based world model for better long-horizon prediction)',
    'IRIS (discrete autoencoder + transformer world model for Atari)',
    'DayDreamer (on-robot world model training for real-world robotics)',
  ],
  futureDirections:
    'Large-scale pre-trained world models that capture general physics and dynamics from internet video, enabling zero-shot planning in novel environments without any environment interaction.',
}
