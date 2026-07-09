import type { Recipe } from '../types'

export const speechRL: Recipe = {
  id: 'speech-rl',
  title: 'Speech RL',
  part: 'speech',
  order: 3,
  purpose:
    'Apply reinforcement learning to fine-tune speech generation models for objective quality metrics, naturalness, and expressiveness beyond supervised training.',
  usedBy: ['NaturalSpeech 3 RL', 'Voicebox alignment', 'VALL-E RL fine-tuning'],
  coreIdea:
    'Speech RL applies policy gradient methods to speech generation models, using reward models trained on human judgments of speech quality or objective metrics (MOS prediction, intelligibility scores). The speech generator is treated as a policy that produces audio, which is scored by the reward model. This allows optimization for aspects of speech quality that are hard to capture with supervised loss: natural prosody, expressiveness, listener preference.',
  pipeline: [
    'Train or load a speech quality reward model (MOS predictor, preference model)',
    'Generate speech samples from the current policy (TTS or codec LM)',
    'Score each sample using the reward model',
    'Compute policy gradient with KL regularization against base model',
    'Update speech generation parameters',
    'Evaluate on objective metrics + human listening tests',
    'Iterate',
  ],
  advantages: [
    'Directly optimizes for human-perceived quality',
    'Can correct artifacts that supervised losses miss',
    'Adaptable to specific deployment requirements',
  ],
  disadvantages: [
    'Reward model quality is the bottleneck',
    'Risk of over-optimizing the reward at the cost of naturalness',
    'Human evaluation is expensive and slow for iteration',
  ],
  worksBestFor: [
    'Improving naturalness and expressiveness of TTS',
    'Reducing audible artifacts in codec-based synthesis',
    'Adapting speech models to specific acoustic environments',
  ],
  keyPapers: [
    {
      title: 'NaturalSpeech 3: Zero-Shot Speech Synthesis with Factorized Flow',
      url: 'https://arxiv.org/abs/2403.12345',
      authors: 'Microsoft',
      year: 2024,
    },
    {
      title: 'Voicebox: Text-Guided Multilingual Speech Generation',
      url: 'https://arxiv.org/abs/2306.15687',
      authors: 'Meta AI',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'Medium-High — 8–32 GPUs for 3–10 days including reward model training',
  openSource: [
    'Voicebox (https://github.com/facebookresearch/voicebox)',
    'NaturalSpeech (https://github.com/microsoft/NaturalSpeech)',
  ],
  commonMistakes: [
    'Using a MOS prediction model that does not correlate with human judgment',
    'Applying RL too early (before SFT convergence)',
    'Not preserving speaker identity during RL optimization',
  ],
  variants: [
    'Preference-based speech RL (human preference pairs for speech)',
    'Adversarial RL for speech (discriminator as reward)',
  ],
  futureDirections:
    'Multimodal speech RL that jointly optimizes for intelligibility, naturalness, emotion expressiveness, and speaker similarity using a multi-task reward model.',
}
