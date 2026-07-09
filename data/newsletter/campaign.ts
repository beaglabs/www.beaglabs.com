export const CAMPAIGN = {
  onboarding: {
    name: 'Onboarding Drip',
    goal: 'Schedule a demo → https://cal.com/lemoncake/meet-the-founder',
    trigger: 'newsletter_subscriber = true',
    emails: [
      {
        day: 0,
        subject: 'Your ML Cookbook + Where to Start',
        template: 'drip-day0',
        preheader: '52 recipes. 7 domains. One decision tree to find your first recipe.',
      },
      {
        day: 2,
        subject: 'The Smallest Models Are Getting Weirdly Good',
        template: 'drip-day2',
        preheader: 'GRPO changed who can train frontier models. Here is the story.',
      },
      {
        day: 4,
        subject: 'The Death of RLHF?',
        template: 'drip-day4',
        preheader: 'PPO vs GRPO vs DAPO vs RLVR — a one-chart comparison of every RLHF alternative.',
      },
      {
        day: 6,
        subject: 'Why Everyone Suddenly Cares About Synthetic Data',
        template: 'drip-day6',
        preheader: 'Self-Instruct, Evol-Instruct, Data Flywheels — how frontier labs generate infinite training data.',
      },
      {
        day: 9,
        subject: "Reasoning Isn't Magic",
        template: 'drip-day9',
        preheader: 'Process supervision vs outcome supervision — the mechanism behind reasoning models.',
      },
      {
        day: 12,
        subject: 'How Frontier Labs Actually Compress Huge Models',
        template: 'drip-day12',
        preheader: 'On-policy distillation — how frontier labs compress 1.8T parameters into models that run on your laptop.',
      },
      {
        day: 16,
        subject: 'The Rise of Tiny Frontier Models',
        template: 'drip-day16',
        preheader: 'Phi-4, Gemma 3, Qwen 2.5 — tiny models that beat giants.',
      },
      {
        day: 20,
        subject: 'Can a 7B Model Beat a 70B Model?',
        template: 'drip-day20',
        preheader: 'Data quality + training recipe + evaluation — the formula for small models that outperform giants.',
      },
    ],
  },

  series: [
    {
      name: 'Recipe Breakdown',
      frequency: 'Every Tuesday',
      template: 'series-weekly-recipe',
      description: 'One Cookbook recipe. One implementation. Pipeline diagram, compute, and key details.',
    },
    {
      name: 'Small Model Spotlight',
      frequency: 'Every Thursday',
      template: 'series-small-model-spotlight',
      description: 'Profile of one 1B-27B model: training recipe, benchmarks, and practical takeaways.',
    },
    {
      name: 'Research Translation',
      frequency: 'Every Friday',
      template: 'series-research-translation',
      description: 'One paper translated into practical engineering guidance. Intuition, implementation, and Beag Labs take.',
    },
    {
      name: "This Week's Training Trick",
      frequency: 'Every Monday',
      template: 'series-training-trick',
      description: '~5 minute read. One tiny tweak that can save hours of training.',
    },
    {
      name: 'Build in Public',
      frequency: 'Every other Wednesday',
      template: 'series-build-in-public',
      description: 'Real experiments: what we tried, what failed, what we learned.',
    },
  ],
} as const
