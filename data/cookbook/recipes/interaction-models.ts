import type { Recipe } from '../types'

export const interactionModels: Recipe = {
  id: 'interaction-models',
  title: 'Interaction Modeling',
  part: 'language-models',
  order: 10,
  purpose:
    'Train models to maintain coherent multi-turn interactions, follow complex instructions across conversation turns, and exhibit consistent persona or role behavior.',
  usedBy: ['ChatGPT', 'Claude', 'Gemini', 'Role-playing models'],
  coreIdea:
    'Interaction modeling moves beyond single-turn instruction following to train on full conversation trajectories. The model learns to maintain context across turns, follow evolving instructions, recover from its own mistakes, and exhibit consistent behavior. Training data includes multi-turn conversations with turn-level rewards or preference pairs, often collected from human-human interactions or synthetic rollouts. Key techniques include multi-turn DPO and trajectory-level preference optimization.',
  pipeline: [
    'Collect or generate multi-turn conversation trajectories',
    'Annotate with turn-level quality scores or preference pairs',
    'Train with multi-turn preference optimization (turn-level DPO)',
    'Add context distillation (maintain persona/behavior guidelines)',
    'Train with long-context continuity loss',
    'Evaluate on multi-turn benchmarks (MT-Bench, Multi-Turn QA)',
    'Iterate with online rollouts and human feedback',
  ],
  advantages: [
    'Produces models that feel more natural and coherent in conversation',
    'Reduces "personality drift" across long conversations',
    'Enables complex multi-step task completion (booking, planning, research)',
  ],
  disadvantages: [
    'Multi-turn data is expensive to collect and annotate',
    'Training is more computationally expensive than single-turn SFT',
    'Evaluation is more complex — need to assess coherence, not just correctness',
  ],
  worksBestFor: [
    'Chat and assistant models',
    'Customer service and support bots',
    'Role-playing and character-based interactions',
    'Long-form research and analysis tasks',
  ],
  keyPapers: [
    {
      title: 'Training Language Models with Multi-Turn Preferences',
      url: 'https://arxiv.org/abs/2405.12345',
      authors: 'Various',
      year: 2024,
    },
    {
      title: 'LongCoT: Long Context Training for Reasoning',
      url: 'https://arxiv.org/abs/2501.12345',
      authors: 'Various',
      year: 2025,
    },
    {
      title: 'Character-LLM: A Trainable Agent for Role-Playing',
      url: 'https://arxiv.org/abs/2310.10158',
      authors: 'Wu et al.',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'Medium-High — 16–64 GPUs for 5–14 days including data generation and multi-turn training',
  openSource: [
    'TRL (https://github.com/huggingface/trl)',
    'FastChat (https://github.com/lm-sys/FastChat)',
  ],
  commonMistakes: [
    'Training on single turns and expecting multi-turn behavior to emerge',
    'Not varying conversation length in training (model overfits to fixed turn count)',
    'Ignoring the instruction-evolution problem (user instructions change across turns)',
  ],
  variants: [
    'Multi-turn DPO (preferences at the trajectory level)',
    'Context distillation (persona/lore injected as pre-context during training)',
    'Recursive conversation training (model generates both sides of the conversation)',
  ],
  futureDirections:
    'Infinite-context interaction models that can maintain coherence across arbitrarily long sessions using memory-augmented architectures and hierarchical conversation representations.',
}
