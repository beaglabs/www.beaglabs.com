import type { Recipe } from '../types'

export const simToReal: Recipe = {
  id: 'sim-to-real',
  title: 'Sim-to-Real Transfer',
  part: 'robotics',
  order: 4,
  purpose:
    'Train robot policies in simulation and transfer them to real hardware, leveraging simulation data abundance while overcoming the domain gap between simulated and real environments.',
  usedBy: ['Domain Randomization', 'Sim-to-real RL (OpenAI Dactyl)', 'Isaac Gym training'],
  coreIdea:
    'Sim-to-real transfer trains large quantities of experience in simulation (where data is cheap and fast) and then adapts the policy for real-world deployment. The key technique is domain randomization: systematically randomizing simulation parameters (mass, friction, lighting, textures) so the policy learns to generalize across the sim-to-real gap rather than overfitting to specific simulation values. More advanced methods use system identification (matching sim parameters to real observations) or domain adaptation (learning invariant features).',
  pipeline: [
    'Build a high-fidelity simulation environment of the target real system',
    'Define randomization ranges for key physical parameters',
    'Train policy in simulation with randomized parameters each episode',
    'Optionally add visual randomization (textures, lighting, camera noise)',
    'Deploy trained policy on real system',
    'Collect real-world rollouts, compare to simulation performance',
    'Adjust randomization range or perform system identification',
    'Optionally fine-tune on real data',
  ],
  advantages: [
    'Millions of training steps in hours instead of months',
    'Safe exploration — no hardware damage risk',
    'Covers edge cases that are rare or dangerous in reality',
  ],
  disadvantages: [
    'Domain gap limits final performance',
    'Randomization must cover the right parameters',
    'Simulation fidelity is expensive to build',
  ],
  worksBestFor: [
    'Any robot learning task where simulation is available',
    'Manipulation and locomotion tasks',
    'Deploying RL policies on real hardware',
  ],
  keyPapers: [
    {
      title: 'Learning Dexterous In-Hand Manipulation (OpenAI Dactyl)',
      url: 'https://arxiv.org/abs/1808.00177',
      authors: 'OpenAI',
      year: 2018,
    },
    {
      title: 'Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World',
      url: 'https://arxiv.org/abs/1703.06907',
      authors: 'Tobin et al. (OpenAI)',
      year: 2017,
    },
    {
      title: 'Sim-to-Real Transfer in Deep Reinforcement Learning',
      url: 'https://arxiv.org/abs/2310.01234',
      authors: 'Various (Survey)',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Medium — 1–8 GPUs for 1–7 days in simulation; real-world deployment cost varies',
  openSource: [
    'Isaac Gym (https://github.com/NVIDIA-Omniverse/IsaacGymEnvs)',
    'MuJoCo (https://github.com/deepmind/mujoco)',
    'SAPIEN (https://github.com/haosulab/SAPIEN)',
  ],
  commonMistakes: [
    'Over-randomizing — policy learns random behavior instead of the task',
    'Not randomizing the right parameters (visual ≠ physical)',
    'Assuming the sim perfectly models the real system',
  ],
  variants: [
    'System identification (calibrate simulation to match real observations)',
    'Domain adaptation (learn features invariant to the sim/real domain)',
    'Progressive net (learn residual on real data after sim pre-training)',
  ],
  futureDirections:
    'Foundational sim-to-real: a single large-scale simulation training run that produces policies capable of zero-shot deployment on diverse real robot platforms without per-platform fine-tuning.',
}
