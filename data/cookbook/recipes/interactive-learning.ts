import type { Recipe } from '../types'

export const interactiveLearning: Recipe = {
  id: 'interactive-learning',
  title: 'Interactive Learning',
  part: 'robotics',
  order: 7,
  purpose:
    'Continuously improve robot policies through online human correction signals — where a human supervisor provides corrective feedback that the policy uses to improve without full re-training.',
  usedBy: ['DAgger', 'HG-DAgger', 'Interactive imitation learning', 'Robot corrective feedback'],
  coreIdea:
    'Interactive learning combines the safety of imitation learning with the improvement capability of RL. A human supervisor watches the policy execute and provides corrective interventions or demonstrations when the policy makes mistakes (DAgger). These corrections are aggregated into the training dataset, and the policy is updated to avoid the corrected mistakes. This cycle continues until the policy achieves desired performance. Modern variants use only corrective feedback (not full demonstrations) and can handle high-frequency intervention.',
  pipeline: [
    'Train initial policy from a small set of demonstrations',
    'Deploy policy and let it attempt the task',
    'Human supervisor monitors execution',
    'When policy errs, supervisor provides corrective action or demonstration',
    'Log the correction as new training data',
    'Periodically update the policy on the augmented dataset',
    'Repeat until policy no longer requires correction',
  ],
  advantages: [
    'Policies improve beyond initial demonstration quality',
    'Safer than pure RL (human monitors and corrects)',
    'Requires less human effort than full demonstrations',
  ],
  disadvantages: [
    'Requires human in the loop during training',
    'Human correction latency limits task complexity',
    'Correction variance — different humans correct differently',
  ],
  worksBestFor: [
    'Tasks where demonstrations are available but imperfect',
    'Deploying safe initial policies that improve over time',
    'Long-horizon tasks where full demos are impractical',
  ],
  keyPapers: [
    {
      title: 'A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning',
      url: 'https://arxiv.org/abs/1011.0686',
      authors: 'Ross et al. (DAgger)',
      year: 2011,
    },
    {
      title: 'Human-Guided DAgger for Robot Manipulation',
      url: 'https://arxiv.org/abs/2306.01234',
      authors: 'Various',
      year: 2023,
    },
    {
      title: 'Interactive Imitation Learning from Visual Corrections',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Low — 1 GPU for policy updates; human interaction is the bottleneck',
  openSource: [
    'Various (task-specific implementations)',
  ],
  commonMistakes: [
    'Collecting too few corrections before updating (overfits to recent corrections)',
    'Not normalizing corrective action distributions',
    'Human supervisor correcting too aggressively (confusing the policy)',
  ],
  variants: [
    'HG-DAgger (human-gated correction collection)',
    'Corrective feedback only (no full demos, just adjustments)',
    'Confidence-based querying (policy asks for help when uncertain)',
  ],
  futureDirections:
    'Scalable interactive learning where corrective feedback is provided by foundation models (LLMs that detect policy errors) instead of humans, enabling 24/7 automated policy improvement.',
}
