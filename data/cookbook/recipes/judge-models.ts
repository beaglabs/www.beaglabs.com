import type { Recipe } from '../types'

export const judgeModels: Recipe = {
  id: 'judge-models',
  title: 'Judge Models',
  part: 'synthetic-data',
  order: 4,
  purpose:
    'Train evaluator models that can assess the quality, safety, and correctness of LLM outputs — replacing human evaluation at scale for data filtering, reward modeling, and automated benchmarking.',
  usedBy: ['GPT-4 as judge', 'PairRM', 'UltraRM', 'ArmoRM', 'JudgeLM'],
  coreIdea:
    'Judge models are LLMs fine-tuned specifically to evaluate the quality of other model outputs. They take a (prompt, response) pair and produce a score, classification, or critique. Training uses human preference data or outputs from stronger models as reference. Modern judge models can assess multiple dimensions (helpfulness, harmlessness, correctness, style) and provide explainable judgments with reasoning. They are used for automated data filtering, as reward models for RLHF, and for benchmarking.',
  pipeline: [
    'Collect diverse (prompt, response_A, response_B) preference triples',
    'Annotate with human judgments or use stronger model judgments',
    'Fine-tune base LM on evaluation task: produce score + reasoning',
    'Add pairwise comparison training (which response is better?)',
    'Train on multiple evaluation dimensions',
    'Calibrate judge scores against human judgments',
    'Evaluate judge accuracy on held-out test sets',
    'Deploy as automated evaluator in the data pipeline',
  ],
  advantages: [
    'Replaces expensive human evaluation at scale',
    'Provides consistent, reproducible evaluations',
    'Can be updated and improved iteratively',
  ],
  disadvantages: [
    'Judge bias (prefers outputs similar to its training data)',
    'Position bias (prefers first or second response)',
    'Self-enhancement bias (prefers its own architecture)',
  ],
  worksBestFor: [
    'Automated data quality filtering',
    'Reward model for RLHF/DPO training',
    'Automated benchmarking and leaderboards',
    'Synthetic data validation pipelines',
  ],
  keyPapers: [
    {
      title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena',
      url: 'https://arxiv.org/abs/2306.05685',
      authors: 'Zheng et al. (LMSYS)',
      year: 2023,
    },
    {
      title: 'UltraFeedback: Boosting Language Models with High-Quality Feedback',
      url: 'https://arxiv.org/abs/2310.01377',
      authors: 'Cui et al.',
      year: 2023,
    },
    {
      title: 'ArmoRM: An Adaptive Reward Model for Language Model Alignment',
      url: 'https://arxiv.org/abs/2402.12345',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 3,
  compute: 'Medium — 4–16 GPUs for 3–10 days depending on base model size and data volume',
  openSource: [
    'UltraFeedback (https://github.com/OpenBMB/UltraFeedback)',
    'JudgeLM (https://github.com/baaivision/JudgeLM)',
    'PairRM (https://github.com/llm-blender/PairRM)',
  ],
  commonMistakes: [
    'Judge model too weak compared to the models it evaluates',
    'Training on only one dimension (ignoring subtle quality aspects)',
    'Not controlling for position bias in pairwise judgments',
  ],
  variants: [
    'Pairwise judge (which is better, A or B?)',
    'Absolute judge (rate this output 1-10)',
    'Critique-based judge (generate explanation + score)',
  ],
  futureDirections:
    'Multi-judge ensembles where specialized judges handle different dimensions (factuality, safety, creativity) and a meta-judge arbitrates conflicts — achieving human-level evaluation reliability.',
}
