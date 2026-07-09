import type { Recipe } from '../types'

export const speechTokenModels: Recipe = {
  id: 'speech-token-models',
  title: 'Speech Token Models',
  part: 'speech',
  order: 1,
  purpose:
    'Learn discrete or continuous speech representations from raw audio through self-supervised training, providing high-quality tokenization for downstream speech generation and understanding.',
  usedBy: ['HuBERT', 'wav2vec 2.0', 'EnCodec', 'DAC (Descript Audio Codec)'],
  coreIdea:
    'Speech token models convert raw audio waveforms into discrete tokens (for language-model-style processing) or continuous representations (for feature extraction). The training is self-supervised: HuBERT uses a clustering objective where the model predicts masked audio regions; wav2vec 2.0 uses contrastive prediction over latent speech representations; EnCodec and DAC are neural audio codecs trained with reconstruction loss and perceptual losses. The resulting tokens can be used for speech synthesis (as inputs to a codec LM), speech recognition, or emotion/speaker analysis.',
  pipeline: [
    'Collect large corpus of unlabeled speech audio',
    'Extract acoustic features (log-mel spectrograms, raw waveforms)',
    'Train self-supervised encoder via contrastive or masked prediction',
    'Optional: quantize encoder outputs to discrete tokens (RVQ, k-means)',
    'For neural codecs: add adversarial and perceptual reconstruction losses',
    'Evaluate on downstream tasks (ASR, speaker ID, speech resynthesis)',
  ],
  advantages: [
    'Learns from unlabeled speech data at scale',
    'Encoder representations are useful for many downstream tasks',
    'Neural codecs achieve high compression (1.5-12 kbps) with good quality',
  ],
  disadvantages: [
    'Performance degrades on noisy or accented speech',
    'High compute cost especially for codec training',
    'Self-supervised representations can miss phonetic detail',
  ],
  worksBestFor: [
    'Speech representation learning for ASR',
    'Neural audio compression for streaming',
    'Tokenization for speech language models',
  ],
  keyPapers: [
    {
      title: 'HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction of Hidden Units',
      url: 'https://arxiv.org/abs/2106.07447',
      authors: 'Hsu et al. (Meta AI)',
      year: 2021,
    },
    {
      title: 'wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations',
      url: 'https://arxiv.org/abs/2006.11477',
      authors: 'Baevski et al. (Meta AI)',
      year: 2020,
    },
    {
      title: 'EnCodec: High Fidelity Neural Audio Compression',
      url: 'https://arxiv.org/abs/2210.13438',
      authors: 'Défossez et al. (Meta AI)',
      year: 2022,
    },
    {
      title: 'DAC: Descript Audio Codec',
      url: 'https://arxiv.org/abs/2402.12345',
      authors: 'Kumar et al. (Descript)',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'High — 16–64 GPUs for 5–21 days for large-scale (HuBERT Large, EnCodec)',
  openSource: [
    'Fairseq (https://github.com/facebookresearch/fairseq)',
    'EnCodec (https://github.com/facebookresearch/encodec)',
    'DAC (https://github.com/descriptinc/descript-audio-codec)',
  ],
  commonMistakes: [
    'Not using enough audio data (HuBERT needs 10k+ hours)',
    'Using a single quantization level when RVQ with multiple levels is better',
    'Neglecting audio preprocessing (sample rate, normalization)',
  ],
  variants: [
    'WavLM (HuBERT with utterance-level training)',
    'SpeechTokenizer (hierarchical semantic + acoustic tokens)',
  ],
  futureDirections:
    'Universal audio tokenizer that handles speech, music, and environmental sounds with a single model, enabling cross-modal audio generation from text or video inputs.',
}
