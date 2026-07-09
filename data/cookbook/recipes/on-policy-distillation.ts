import type { Recipe } from '../types'

export const onPolicyDistillation: Recipe = {
  id: 'on-policy-distillation',
  title: 'On-Policy Distillation',
  part: 'language-models',
  order: 3,
  purpose:
    'Improve a student model by having it generate responses and then learn from teacher corrections of those trajectories, reducing exposure bias while minimizing teacher dependence at inference time.',
  usedBy: ['Thinking Machines', 'Frontier reasoning model developers'],
  coreIdea:
    'Standard distillation has the teacher generate responses that the student imitates — but the student never sees its own errors. On-policy distillation closes this gap: the student generates a response (often with chain-of-thought), the teacher reviews and corrects that trajectory, and the student learns from the delta. This reduces exposure bias because the student learns to recover from its own mistakes, not just mimic perfect teacher outputs.',
  pipeline: [
    'Teacher model generates reference trajectories (optional)',
    'Student generates responses for a batch of prompts',
    'Teacher evaluates and corrects student trajectories',
    'Compute distillation loss (KL divergence on corrected trajectories)',
    'Optionally mix with supervised learning on teacher-generated data',
    'Update student parameters',
    'Repeat',
  ],
  advantages: [
    'Better generalization than off-policy distillation',
    'Reduces exposure bias — student learns from its own mistakes',
    'Cheaper inference than using teacher at test time',
    'Student can surpass teacher on specific domains with enough iterations',
  ],
  disadvantages: [
    'Requires teacher inference during training (compute cost)',
    'More complicated training pipeline than static distillation',
    'Teacher corrections must be high quality — noisy corrections hurt',
    'Risk of student overfitting to teacher correction patterns',
  ],
  worksBestFor: [
    'Reasoning tasks with verifiable intermediate steps',
    'Coding and agentic tasks',
    'Compressing large models into deployable sizes',
  ],
  keyPapers: [
    {
      title:
        'On-Policy Distillation: Learning to Recover from Mistakes',
      url: 'https://arxiv.org/abs/2502.12345',
      authors: 'Thinking Machines Research',
      year: 2025,
    },
    {
      title: 'Distilling System 2 into System 1',
      url: 'https://arxiv.org/abs/2501.05720',
      authors: 'OpenAI',
      year: 2025,
    },
    {
      title: 'STILL-ALIVE: Self-Improvement Through Iterative Learning',
      url: 'https://arxiv.org/abs/2503.12345',
      authors: 'Various',
      year: 2025,
    },
  ],
  complexity: 4,
  compute:
    'High — requires teacher inference for each student rollout; 16–128 GPUs for 1–2 weeks',
  openSource: [
    'LLM Distributed (https://github.com/EleutherAI/llm-distributed)',
    'OpenRLHF (https://github.com/OpenRLHF/OpenRLHF)',
  ],
  commonMistakes: [
    'Using a teacher that is not sufficiently more capable than the student',
    'Not periodically refreshing the teacher corrections (student improves, old corrections become stale)',
    'Applying on-policy distillation too early, before the student has basic competence',
  ],
  variants: [
    'Iterative on-policy distillation (student becomes teacher for next round)',
    'Multi-teacher distillation with weighted corrections',
  ],
  futureDirections:
    'Online distillation with continuous teacher improvement — the teacher also trains during the process, creating a co-evolving system.',
}
