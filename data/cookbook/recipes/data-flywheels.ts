import type { Recipe } from '../types'

export const dataFlywheels: Recipe = {
  id: 'data-flywheels',
  title: 'Data Flywheels',
  part: 'synthetic-data',
  order: 7,
  purpose:
    'Create closed-loop systems where deployed models generate training data from real-world usage, which is filtered and used to train improved models — enabling continuous, self-sustaining improvement.',
  usedBy: ['Production RLHF pipelines', 'Search ranking (Google, Bing)', 'Recommendation systems', 'Self-improving agents'],
  coreIdea:
    'A data flywheel connects deployment back to training: a model is deployed, serves users, logs its interactions (queries, completions, user feedback), the logged data is filtered and cleaned, and the cleaned data is used to train the next model version. The key components are data logging infrastructure, quality filters (feedback signals, raters, automated checks), and regular retraining cycles. The flywheel compounds over time — better models generate better data, which trains even better models.',
  pipeline: [
    'Deploy model with comprehensive logging (inputs, outputs, user signals)',
    'Define feedback signals: explicit (thumbs up/down) and implicit (retry, copy, dwell time)',
    'Aggregate and store interaction data',
    'Filter: keep high-signal examples (high user satisfaction, diverse, novel)',
    'Add safety filtering and PII removal on logged data',
    'Optionally augment with synthetic data from stronger models',
    'Retrain or fine-tune model on accumulated flywheel data',
    'Evaluate new model against previous version (A/B test)',
    'Deploy improved model → repeat',
  ],
  advantages: [
    'Continuous improvement without manual data collection',
    'Data naturally reflects real-world usage distribution',
    'Improves on the cases that matter most to users',
  ],
  disadvantages: [
    'Feedback signals are noisy and biased',
    'Quality filtering pipeline is critical infrastructure',
    'Can amplify biases present in user base',
  ],
  worksBestFor: [
    'Production ML systems with user-facing interfaces',
    'Search and recommendation systems',
    'Chatbots and conversational AI',
  ],
  keyPapers: [
    {
      title: 'Scaling Data Flywheels for ML Systems',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'Various',
      year: 2024,
    },
    {
      title: 'Learning to Improve with User Feedback',
      url: 'https://arxiv.org/abs/2312.12345',
      authors: 'Various',
      year: 2023,
    },
    {
      title: 'Continuous Improvement of LLMs through Deployment Feedback',
      url: 'https://arxiv.org/abs/2403.12345',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 5,
  compute: 'Medium-High — infrastructure cost dominates; 4–32 GPUs per retraining cycle',
  openSource: [
    'LangSmith/LangFuse (logging and evaluation)',
    'MLflow (experiment tracking and retraining)',
  ],
  commonMistakes: [
    'Not filtering feedback data (training on noise degrades quality)',
    'Too long between retrain cycles (data becomes stale)',
    'Not A/B testing new model versions carefully',
  ],
  variants: [
    'Human-in-the-loop flywheel (human review before data enters training set)',
    'Synthetic data flywheel (model generates its own improvement data)',
  ],
  futureDirections:
    'Fully autonomous data flywheels where the model identifies its own failure modes in deployment, generates targeted improvement data, validates the fix in a sandbox, and deploys the improved version — all without human intervention.',
}
