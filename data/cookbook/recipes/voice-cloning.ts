import type { Recipe } from '../types'

export const voiceCloning: Recipe = {
  id: 'voice-cloning',
  title: 'Voice Cloning',
  part: 'speech',
  order: 5,
  purpose:
    'Replicate a target speaker\'s voice characteristics from a limited reference sample (few-shot or zero-shot), enabling personalized speech synthesis.',
  usedBy: ['VALL-E', 'Bark (Suno)', 'XTTS (Coqui)', 'OpenVoice'],
  coreIdea:
    'Voice cloning adapts a generic TTS model to a target speaker using minimal reference audio. Zero-shot methods (VALL-E, XTTS) use a speaker encoder that extracts a voice embedding from the reference and conditions the TTS model at inference without any fine-tuning. Few-shot methods use a short adaptation step (1-30 seconds of audio) to fine-tune a base model. The key challenges are maintaining naturalness while accurately reproducing the target voice, and preventing speaker leakage from the reference into the content.',
  pipeline: [
    'Pre-train a multi-speaker TTS model on diverse speech data',
    'Train a speaker encoder (ECAPA-TDNN, wav2vec-SV) to extract voice embeddings',
    'For zero-shot: condition the TTS model on the speaker embedding',
    'For few-shot: collect 1-30 seconds of target speaker audio',
    'Extract speaker embedding from reference audio',
    'Generate speech: text → TTS conditioned on target speaker embedding',
    'Optional: post-process with voice conversion for better similarity',
  ],
  advantages: [
    'Personalized speech from very limited reference data',
    'Zero-shot methods require no per-speaker training',
    'Improving rapidly with scale and better architectures',
  ],
  disadvantages: [
    'Speaker similarity degrades with very short (< 3s) reference audio',
    'Risk of misuse (voice spoofing, deepfake audio)',
    'Less natural than speaker-specific fine-tuned models',
  ],
  worksBestFor: [
    'Personalized voice assistants',
    'Audiobook narration in a specific voice',
    'Content creation and dubbing',
  ],
  keyPapers: [
    {
      title: 'VALL-E: Neural Codec Language Models for Text-to-Speech',
      url: 'https://arxiv.org/abs/2301.02111',
      authors: 'Wang et al. (Microsoft)',
      year: 2023,
    },
    {
      title: 'OpenVoice: Versatile Instant Voice Cloning',
      url: 'https://arxiv.org/abs/2312.01479',
      authors: 'Qin et al.',
      year: 2023,
    },
    {
      title: 'XTTS: Cross-Lingual Zero-Shot TTS',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Coqui AI',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Low-Medium — 1–8 GPUs for 1–7 days for training the base model; seconds for zero-shot inference',
  openSource: [
    'Coqui TTS (https://github.com/coqui-ai/TTS)',
    'XTTS (https://github.com/coqui-ai/TTS)',
    'OpenVoice (https://github.com/myshell-ai/OpenVoice)',
  ],
  commonMistakes: [
    'Using too little reference audio (< 3 seconds for good quality)',
    'Generating in a language/accent the base model was not trained on',
    'Not applying anti-spoofing safeguards in deployment',
  ],
  variants: [
    'Cross-lingual voice cloning (clone in one language, generate in another)',
    'Emotion-preserving voice cloning (clone voice + emotion from reference)',
  ],
  futureDirections:
    'Real-time voice cloning with emotional and prosodic control, where the cloned voice can laugh, whisper, shout, and convey nuanced emotions — indistinguishable from a real human recording.',
}
