import type { Recipe } from '../types'

export const codecLanguageModels: Recipe = {
  id: 'codec-language-models',
  title: 'Codec Language Models',
  part: 'speech',
  order: 2,
  purpose:
    'Generate speech by training language models on discrete audio tokens from neural codecs, enabling text-to-speech, voice cloning, and speech-to-speech translation with natural prosody.',
  usedBy: ['VALL-E', 'AudioLM', 'USM (Google)', 'SoundStorm'],
  coreIdea:
    'Codec language models treat audio as a language: the speech signal is first encoded into discrete tokens by a neural audio codec (EnCodec, DAC), then a language model (decoder-only transformer) is trained to predict these tokens autoregressively. VALL-E uses a phoneme-conditioned autoregressive model to generate codec tokens from text. AudioLM extends this to generate audio from a short prompt (continuation). SoundStorm adds parallel decoding for speed. The key insight is that language model scaling laws apply to audio tokens just as they do to text.',
  pipeline: [
    'Pre-train or load a neural audio codec (EnCodec, DAC)',
    'Encode large corpus of speech into discrete codec tokens',
    'Train a decoder-only transformer on audio token sequences',
    'Condition on text (phonemes) for controllable TTS',
    'Use KV-caching for autoregressive generation at inference',
    'Encode generated tokens back to waveform via codec decoder',
    'Optional: apply voice cloning by conditioning on speaker embedding',
  ],
  advantages: [
    'Highly natural prosody and expressiveness',
    'Scales with compute (larger models = better speech)',
    'Handles multiple tasks in one model (TTS, voice cloning, continuation)',
  ],
  disadvantages: [
    'Autoregressive generation is slow (needs real-time mitigation)',
    'Codec artifacts can be audible at low bitrates',
    'Requires large amounts of speech data (10k+ hours)',
  ],
  worksBestFor: [
    'Text-to-speech with natural prosody',
    'Voice cloning from short samples',
    'Speech-to-speech translation',
    'Music generation (AudioLM, MusicLM)',
  ],
  keyPapers: [
    {
      title: 'VALL-E: Neural Codec Language Models for Text-to-Speech Synthesis',
      url: 'https://arxiv.org/abs/2301.02111',
      authors: 'Wang et al. (Microsoft)',
      year: 2023,
    },
    {
      title: 'AudioLM: A Language Modeling Approach to Audio Generation',
      url: 'https://arxiv.org/abs/2209.03143',
      authors: 'Google',
      year: 2022,
    },
    {
      title: 'SoundStorm: Efficient Parallel Audio Generation',
      url: 'https://arxiv.org/abs/2305.09636',
      authors: 'Google',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'High — 16–128 GPUs for 7–30 days for production-scale models',
  openSource: [
    'VALL-E (https://github.com/microsoft/vall-e)',
    'AudioLM (https://github.com/google-research/audiolm)',
  ],
  commonMistakes: [
    'Using codec tokens that are too coarse (audible artifacts)',
    'Not phoneme-aligning text and audio for TTS conditioning',
    'Generating with too much sampling temperature (garbled audio)',
  ],
  variants: [
    'VALL-E-X (cross-lingual voice cloning)',
    'MusicLM (music generation from text)',
    'SoundStorm (non-autoregressive parallel decoding)',
  ],
  futureDirections:
    'Multi-stream codec LMs that generate speech, music, and sound effects simultaneously with text and video conditioning — a single "audio language model" for all audio generation.',
}
