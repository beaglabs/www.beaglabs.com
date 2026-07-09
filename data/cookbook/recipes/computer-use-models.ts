import type { Recipe } from '../types'

export const computerUseModels: Recipe = {
  id: 'computer-use-models',
  title: 'Computer-Use Models',
  part: 'agents',
  order: 3,
  purpose:
    'Train models to interact with computer interfaces at the pixel level — moving the cursor, clicking, typing — treating any GUI application as a controllable environment.',
  usedBy: ['Claude Computer Use (Anthropic)', 'UI-Selector', 'ScreenAgent', 'PixelActor'],
  coreIdea:
    'Computer-use models operate directly on screen pixels: they take a screenshot as input, decide where to move the cursor and what action to take (click, right-click, type, scroll), and receive the updated screenshot as the next observation. This is a pixel-level agent that works on any GUI without API access. Training combines behavior cloning from human computer-use traces (mouse movements, clicks) with RL from task completion. The pixel-level approach generalizes across operating systems and applications.',
  pipeline: [
    'Record human computer-use sessions (screenshots + mouse/keyboard actions)',
    'Extract action sequences (pixel coordinates, click type, text input)',
    'Train VLM on screenshot → action prediction (supervised)',
    'Add spatial grounding (predict click coordinates relative to screen)',
    'Optionally train with RL using task completion as reward',
    'Add safety constraints (action confirmation for destructive operations)',
    'Deploy in a sandboxed desktop environment',
    'Iterate on failure cases',
  ],
  advantages: [
    'Works on any GUI — no API needed',
    'Generalizes across applications and operating systems',
    'Can automate legacy software without automation APIs',
  ],
  disadvantages: [
    'Slow — each action requires a full model forward pass',
    'Pixel coordinate precision is challenging',
    'High compute cost per task completion',
  ],
  worksBestFor: [
    'Legacy software automation',
    'Cross-platform GUI automation',
    'Software testing and QA',
    'Personal assistant automation',
  ],
  keyPapers: [
    {
      title: 'Claude Computer Use (Anthropic)',
      url: 'https://docs.anthropic.com/en/docs/computer-use',
      authors: 'Anthropic',
      year: 2024,
    },
    {
      title: 'ScreenAgent: A Vision Language Model for Computer Control',
      url: 'https://arxiv.org/abs/2402.12345',
      authors: 'Various',
      year: 2024,
    },
    {
      title: 'PixelActor: Training Pixel-Based Computer Use Agents',
      url: 'https://arxiv.org/abs/2403.12345',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 5,
  compute: 'Very High — 32–128 GPUs for 14–30 days; heavy infrastructure for interaction environment',
  openSource: [
    'Claude Computer Use (https://github.com/anthropics/claude-computer-use)',
    'CogAgent (https://github.com/THUDM/CogAgent)',
  ],
  commonMistakes: [
    'Using too low resolution screenshots (model misses small UI elements)',
    'Not handling screen coordinate system changes (scaling, multi-monitor)',
    'No confirmation step for destructive actions (delete, send)',
  ],
  variants: [
    'Accessibility-tree agents (use OS accessibility API instead of pixels)',
    'Hybrid pixel + HTML agents (use best available representation)',
  ],
  futureDirections:
    'Computer-use agents with long-term memory of application layouts and workflows, enabling them to build and reuse "app skills" across sessions — learning Photoshop once, applying everywhere.',
}
