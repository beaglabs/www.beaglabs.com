import type { Recipe } from '../types'

export const offlineRL: Recipe = {
  id: 'offline-rl',
  title: 'Offline RL',
  part: 'robotics',
  order: 6,
  purpose:
    'Learn optimal policies entirely from previously collected, static datasets without any environment interaction — enabling robot learning from pre-existing log data.',
  usedBy: ['Conservative Q-Learning (CQL)', 'IQL', 'EDAC', 'TD3+BC'],
  coreIdea:
    'Offline RL trains policies from static datasets collected by any behavioral policy (human demonstrations, deployed robots, random exploration). The key challenge is distribution shift: the learned policy will encounter state-action pairs not present in the dataset, and standard RL overestimates Q-values for unseen actions. Solutions include conservative Q-learning (penalizing Q-values for out-of-distribution actions), implicit Q-learning (avoiding querying unseen actions entirely), and advantage-weighted regression (filtering by action quality).',
  pipeline: [
    'Collect or load static dataset of (s, a, r, s\') transitions',
    'Initialize Q-network(s) and policy network',
    'At each training step: sample batch from dataset',
    'Compute Q-values with conservatism penalty (CQL) or implicit target (IQL)',
    'Update policy via advantage-weighted regression or DPG',
    'Apply regularization to keep policy close to data support',
    'Evaluate periodically (requires sim environment for evaluation)',
    'Deploy policy on real system',
  ],
  advantages: [
    'Uses existing data — no environment interaction needed during training',
    'Safe — no exploration of dangerous states during learning',
    'Can leverage terabytes of previously collected robot data',
  ],
  disadvantages: [
    'Distribution shift is a fundamental challenge',
    'Quality ceiling is limited by the dataset',
    'Evaluation requires a simulator or real deployment',
  ],
  worksBestFor: [
    'Robot learning from logged interaction data',
    'Domains where environment interaction is expensive or risky',
    'Pre-training a policy from diverse data before online fine-tuning',
  ],
  keyPapers: [
    {
      title: 'Conservative Q-Learning for Offline Reinforcement Learning',
      url: 'https://arxiv.org/abs/2006.04779',
      authors: 'Kumar et al.',
      year: 2020,
    },
    {
      title: 'Implicit Q-Learning: Offline Reinforcement Learning via the Advantage',
      url: 'https://arxiv.org/abs/2110.06169',
      authors: 'Kostrikov et al.',
      year: 2021,
    },
    {
      title: 'A Minimalist Approach to Offline Reinforcement Learning (TD3+BC)',
      url: 'https://arxiv.org/abs/2106.06860',
      authors: 'Fujimoto & Gu',
      year: 2021,
    },
  ],
  complexity: 4,
  compute: 'Medium — 1–4 GPUs for 1–5 days depending on dataset size',
  openSource: [
    'd3rlpy (https://github.com/takuseno/d3rlpy)',
    'CORL (https://github.com/tinkoff-ai/CORL)',
  ],
  commonMistakes: [
    'Using offline RL on data collected by a very different policy than the target',
    'Not tuning the conservatism penalty (CQL alpha is critical)',
    'Forgetting that evaluation still requires a simulator or real system',
  ],
  variants: [
    'Offline-to-online (pre-train offline, fine-tune with minimal online interaction)',
    'Decision Transformer (trajectory-level supervised offline RL)',
  ],
  futureDirections:
    'Large-scale offline RL datasets for robotics (like D4RL scaled 1000x) combined with foundation model backbones, enabling generalist robot policies that can be deployed zero-shot then fine-tuned with minimal online interaction.',
}
