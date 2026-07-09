import type { Recipe } from '../types'

export const latentPlanning: Recipe = {
  id: 'latent-planning',
  title: 'Latent Planning',
  part: 'robotics',
  order: 3,
  purpose:
    'Plan action sequences in a learned latent space rather than raw observation or action space, enabling efficient long-horizon planning by compressing high-dimensional information.',
  usedBy: ['TD-MPC2', 'Plan2Explore', 'TAP (Task and Motion Planning in latent)'],
  coreIdea:
    'Latent planning learns a compressed latent representation of the world state, then plans action sequences within this latent space. The planner searches over action sequences by simulating their outcomes in the learned latent dynamics model and selecting the sequence that maximizes predicted reward. TD-MPC2 uses a latent representation jointly trained for reconstruction, reward prediction, and task-relevant features. Planning in latent space is faster and more sample-efficient than planning in pixel space because the latent representation strips away irrelevant visual details.',
  pipeline: [
    'Train latent encoder: observation → latent state (encoder + learned dynamics)',
    'Train latent dynamics model: predict next latent state given action',
    'Train latent reward/value predictor',
    'At inference: sample candidate action sequences',
    'For each sequence, roll out the dynamics model in latent space',
    'Compute cumulative predicted reward for each sequence',
    'Select the highest-reward action sequence',
    'Execute first action, re-plan at next timestep (MPC)',
  ],
  advantages: [
    'Sample efficient — learns from 0.1-1M environment steps',
    'Long-horizon planning capability',
    'Faster than planning in pixel space',
    'Handles high-dimensional observations (images, point clouds)',
  ],
  disadvantages: [
    'Planning horizon limited by dynamics model accuracy',
    'Latent representation may discard task-relevant details',
    'MPC planning adds inference-time compute',
  ],
  worksBestFor: [
    'Visual control tasks with high-dimensional observations',
    'Long-horizon manipulation tasks',
    'Tasks where reward is sparse (planning compensates)',
  ],
  keyPapers: [
    {
      title: 'TD-MPC2: Accelerated Model-Based Reinforcement Learning',
      url: 'https://arxiv.org/abs/2310.16828',
      authors: 'Hansen et al.',
      year: 2023,
    },
    {
      title: 'Planning to Explore via Self-Supervised World Models',
      url: 'https://arxiv.org/abs/2005.05960',
      authors: 'Sekar et al.',
      year: 2020,
    },
  ],
  complexity: 4,
  compute: 'Medium — 1–4 GPUs for 2–7 days for visual control benchmarks',
  openSource: [
    'TD-MPC2 (https://github.com/nicklashansen/td-mpc2)',
    'Dreamer (https://github.com/google-research/dreamer)',
  ],
  commonMistakes: [
    'Planning horizon too short (myopic behavior)',
    'Not using a sufficiently expressive latent representation',
    'Too few planning candidates — misses good sequences',
  ],
  variants: [
    'Hierarchical latent planning (plan in abstract latent, refine in detail)',
    'Goal-conditioned latent planning (plan paths to goal states)',
  ],
  futureDirections:
    'Pre-trained latent planning modules from internet video that provide a "universal latent dynamics" for any task, enabling zero-shot planning in novel environments.',
}
