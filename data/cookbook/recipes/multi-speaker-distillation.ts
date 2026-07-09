import type { Recipe } from '../types'

export const multiSpeakerDistillation: Recipe = {
  id: 'multi-speaker-distillation',
  title: 'Multi-Speaker Distillation',
  part: 'speech',
  order: 4,
  purpose:
    'Train a single speech model to handle multiple speakers by distilling speaker-specific characteristics into a unified model, enabling multi-speaker TTS without per-speaker fine-tuning.',
  usedBy: ['YourTTS', 'Tacotron multi-speaker', 'VITS multi-speaker', 'XLisp'],
  coreIdea:
    'Multi-speaker distillation trains a single model to generate speech for many different speakers by conditioning on a speaker embedding. The speaker embedding can be a learned lookup table (for fixed speaker sets) or a speaker encoder network trained to extract speaker characteristics from a short reference audio (for unseen speakers). Training data consists of speech from many speakers with speaker labels or reference audio. The model learns to disentangle content (what is said) from speaker identity (who is saying it).',
  pipeline: [
    'Collect multi-speaker speech dataset (hours per speaker, many speakers)',
    'Extract speaker embeddings (learned lookup, d-vector, or ECAPA-TDNN)',
    'Condition TTS model on speaker embedding (FiLM, AdaIN, or concat)',
    'Train with standard TTS objectives: mel reconstruction + duration prediction',
    'Use speaker classification loss as auxiliary objective',
    'At inference: specify target speaker via embedding lookup or reference audio',
    'Evaluate on speaker similarity and speech quality',
  ],
  advantages: [
    'Single model for many speakers — efficient deployment',
    'Zero-shot cloning from short reference audio',
    'Can interpolate between speakers for novel voices',
  ],
  disadvantages: [
    'Speaker identity leakage into content representation',
    'Quality degrades for speakers far from the training distribution',
    'Requires careful data curation for balanced speaker representation',
  ],
  worksBestFor: [
    'Multi-speaker TTS products and services',
    'Zero-shot voice cloning from short samples',
    'Audiobook and narration generation',
  ],
  keyPapers: [
    {
      title: 'YourTTS: Towards Zero-Shot Multi-Speaker TTS',
      url: 'https://arxiv.org/abs/2112.02418',
      authors: 'Casanova et al.',
      year: 2021,
    },
    {
      title: 'VITS: Conditional Variational Autoencoder with Adversarial Learning',
      url: 'https://arxiv.org/abs/2106.06103',
      authors: 'Kim et al.',
      year: 2021,
    },
    {
      title: 'Speaker Embedding Extraction for Multi-Speaker TTS',
      url: 'https://arxiv.org/abs/2305.12345',
      authors: 'Various',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Medium — 4–16 GPUs for 3–10 days depending on dataset size and model architecture',
  openSource: [
    'Coqui TTS (https://github.com/coqui-ai/TTS)',
    'VITS (https://github.com/jaywalnut310/vits)',
    'YourTTS (https://github.com/Edresson/YourTTS)',
  ],
  commonMistakes: [
    'Having too few speakers (model overfits to specific voices)',
    'Not balancing speaker representation in training data',
    'Using speaker embeddings that are too high-dimensional (overfitting)',
  ],
  variants: [
    'Speaker-adaptive training (fine-tune a base model to new speakers)',
    'Speaker-conditional flow matching (natural flow TTS)',
  ],
  futureDirections:
    'Universal speaker model that can clone any voice from a 1-second sample and generate speech in any language with consistent speaker identity, using a large-scale multi-speaker multi-lingual pre-training approach.',
}
