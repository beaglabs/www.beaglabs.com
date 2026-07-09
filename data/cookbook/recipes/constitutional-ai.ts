import type { Recipe } from '../types'

export const constitutionalAi: Recipe = {
  id: 'constitutional-ai',
  title: 'Constitutional AI',
  part: 'language-models',
  order: 6,
  purpose:
    'Train language models to self-critique and revise their own outputs according to a written constitution, reducing harmful outputs without extensive human preference labeling.',
  usedBy: ['Anthropic Claude', 'Safety-aligned open-source models'],
  coreIdea:
    'Constitutional AI replaces much of the human feedback in RLHF with a written set of principles (the "constitution"). The model first generates responses, then critiques its own outputs according to the constitution, and finally revises them. This self-supervision loop produces a dataset of (original → revised) pairs for supervised learning, followed by a standard RLHF stage using a reward model trained on constitution-grounded preferences.',
  pipeline: [
    'Draft a constitution (principles for harmlessness, helpfulness, etc.)',
    'Model generates responses to harmful or edge-case prompts',
    'Model critiques its own response using the constitution',
    'Model revises the response based on its critique',
    'Collect (original, critique, revision) triples as training data',
    'Supervised fine-tuning on revision pairs',
    'Train reward model on constitution-guided preferences',
    'RLHF stage using the constitutionally-grounded reward model',
    'Repeat',
  ],
  advantages: [
    'Reduces reliance on expensive human preference labeling',
    'Scalable — the constitution can be extended to new principles without new data',
    'Produces models that can explain their reasoning (via the critique step)',
    'More consistent than human-labeled preferences',
  ],
  disadvantages: [
    'Constitution quality is critical — poorly written principles produce poor alignment',
    'Models can learn to generate safe-sounding but evasive responses',
    'Requires careful prompt engineering for the critique and revision steps',
  ],
  worksBestFor: [
    'Safety and harmlessness alignment',
    'Content moderation training',
    'Reducing reliance on human annotation',
  ],
  keyPapers: [
    {
      title: 'Constitutional AI: Harmlessness from AI Feedback',
      url: 'https://arxiv.org/abs/2212.08073',
      authors: 'Bai et al. (Anthropic)',
      year: 2022,
    },
    {
      title: 'Self-Critiquing Models for Assisting Human Evaluators',
      url: 'https://arxiv.org/abs/2305.14610',
      authors: 'Anthropic',
      year: 2023,
    },
  ],
  complexity: 3,
  compute: 'Medium — 8–32 GPUs for 3–7 days depending on model size and constitution rounds',
  openSource: [
    'TRL Constitutional AI (https://github.com/huggingface/trl)',
    'Axolotl (https://github.com/axolotl-ai-cloud/axolotl)',
  ],
  commonMistakes: [
    'Writing a constitution that is too vague or contradictory',
    'Not iterating on the constitution based on observed failure modes',
    'Using the same constitution for critique and revision without temperature variation',
  ],
  variants: [
    'RL from AI Feedback (RLAIF) — using an LLM as the preference judge instead of a constitution',
    'Self-Play Constitutional AI — iterative improvement of both the model and constitution',
  ],
  futureDirections:
    'Dynamically updated constitutions that evolve based on deployment feedback, and multi-language constitutions that account for cultural differences in safety preferences.',
}
