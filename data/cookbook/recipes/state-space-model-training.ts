import type { Recipe } from '../types'

export const stateSpaceModelTraining: Recipe = {
  id: 'state-space-model-training',
  title: 'State-Space Model Training',
  part: 'language-models',
  order: 11,
  purpose:
    'Train linear-complexity sequence models using state-space architectures (Mamba, S4, S5) that match Transformer quality with sub-quadratic scaling to long sequences.',
  usedBy: ['Mamba', 'Jamba (AI21)', 'Cadence (NVIDIA)', 'StripedHyena', 'Nemotron-SS (NVIDIA)'],
  coreIdea:
    'State-space models (SSMs) replace attention with a structured linear recurrence that can be computed efficiently as a convolution (for training) or recurrence (for generation). The Mamba architecture introduces selective state-spaces that allow the model to focus on relevant context while maintaining O(n) complexity. Training requires careful initialization of the state matrices and stabilization of the recurrence. The convolution mode enables parallel training across sequence length, while the recurrent mode enables efficient generation.',
  pipeline: [
    'Initialize structured state matrices (HiPPO, S4D, or random)',
    'Discretize continuous-time SSM parameters (ZOH or bilinear)',
    'Forward pass in convolution mode for parallel training',
    'Apply selective mechanism (input-dependent state transitions)',
    'Compute loss and gradients through the convolution kernel',
    'Optional: stabilize with gradient clipping on state matrices',
    'Generate in recurrent mode (linear time, constant memory)',
    'Repeat',
  ],
  advantages: [
    'Linear scaling with sequence length (vs quadratic for attention)',
    'Constant memory during generation',
    'Comparable quality to Transformers on language modeling',
    'Superior on very long sequences (>16K tokens)',
  ],
  disadvantages: [
    'Slower at short sequence lengths (convolution overhead)',
    'Less hardware-efficient than optimized attention (FlashAttention)',
    'Fewer production-ready implementations than Transformers',
    'More sensitive to initialization than Transformers',
  ],
  worksBestFor: [
    'Long-document modeling (legal, medical, code repositories)',
    'Real-time generation (speech, streaming)',
    'Mobile and edge deployment (small memory footprint)',
  ],
  keyPapers: [
    {
      title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
      url: 'https://arxiv.org/abs/2312.00752',
      authors: 'Gu & Dao',
      year: 2023,
    },
    {
      title: 'Efficiently Modeling Long Sequences with Structured State Spaces',
      url: 'https://arxiv.org/abs/2111.00396',
      authors: 'Gu et al.',
      year: 2021,
    },
    {
      title: 'Jamba: A Hybrid Transformer-Mamba Language Model',
      url: 'https://arxiv.org/abs/2403.19887',
      authors: 'AI21 Labs',
      year: 2024,
    },
    {
      title: 'Nemotron-4 340B Technical Report',
      url: 'https://arxiv.org/abs/2406.11704',
      authors: 'NVIDIA Research',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'Medium — similar to Transformer training for equivalent model size; 8–64 GPUs for 5–14 days',
  openSource: [
    'Mamba (https://github.com/state-spaces/mamba)',
    'Cadence (https://github.com/NVIDIA/cadence)',
  ],
  commonMistakes: [
    'Poor initialization causing training instability in early steps',
    'Using low precision (FP16) without loss scaling on state matrix gradients',
    'Not tuning the discretization step size for the specific task',
  ],
  variants: [
    'Hybrid SSM-Attention (Mamba-2, Jamba — interleaved SSM and attention layers)',
    'Multi-scan SSM (bidirectional for encoder tasks)',
    'Gated SSM (additional gating mechanisms for expressivity)',
  ],
  futureDirections:
    'Megascale SSM training with expert parallelism and mixture-of-experts routing, enabling trillion-parameter state-space models that maintain linear complexity.',
}
