import type { Part } from './types'

export const parts: Part[] = [
  {
    id: 'language-models',
    title: 'Language Models',
    description:
      '12 recipes progressing from reward-based RL methods (GRPO, DAPO, RLVR) through alignment techniques (Preference Optimization, Constitutional AI, Process Supervision) to self-improving systems (Recursive Self-Improvement, Synthetic Curriculum, Interaction Models) and alternative architectures (State-Space Models, Linear Attention).',
    order: 1,
  },
  {
    id: 'vision',
    title: 'Vision',
    description:
      '7 recipes covering the shift from diffusion-based generation to flow matching and rectified flow, with preference optimization for visual quality, reward-guided fine-tuning, and self-training loops for continuous improvement.',
    order: 2,
  },
  {
    id: '3d-generation',
    title: '3D Generation',
    description:
      '8 recipes spanning multi-view diffusion, Gaussian splatting supervision, mesh generation, neural field training, scene-level generation, world-state prediction, synthetic 3D pretraining, and animation distillation — one of the fastest-moving areas with few consolidated references.',
    order: 3,
  },
  {
    id: 'speech',
    title: 'Speech',
    description:
      '5 recipes tracing the arc from self-supervised speech tokenization (HuBERT, EnCodec) through codec language models (VALL-E, AudioLM) to speech RL fine-tuning, multi-speaker distillation, and few-shot voice cloning.',
    order: 4,
  },
  {
    id: 'robotics',
    title: 'Robotics',
    description:
      '7 recipes from latent world models (Dreamer) and action diffusion through sim-to-real transfer, behavior cloning, offline RL, and interactive correction loops — covering the full training stack for embodied AI.',
    order: 5,
  },
  {
    id: 'agents',
    title: 'Agents',
    description:
      '7 recipes building from tool-use RL through web agents and computer-use models, memory optimization, skill distillation, hierarchical planning, and multi-agent coordination — the practical training stack for deploying LLM agents.',
    order: 6,
  },
  {
    id: 'synthetic-data',
    title: 'Synthetic Data',
    description:
      '7 recipes covering the full synthetic data pipeline: self-instruction, evolutionary expansion, constrained generation, judge/critic training, quality filtering, curriculum synthesis, and production data flywheels for continuous improvement.',
    order: 7,
  },
]

export function getPart(id: string): Part {
  const part = parts.find((p) => p.id === id)
  if (!part) throw new Error(`Part not found: ${id}`)
  return part
}
