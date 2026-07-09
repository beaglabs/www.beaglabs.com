import type { Recipe } from '../types'

export const webAgents: Recipe = {
  id: 'web-agents',
  title: 'Web Agents',
  part: 'agents',
  order: 2,
  purpose:
    'Train language models to navigate and interact with web interfaces (browsers, forms, search) autonomously, treating web navigation as a partially-observed sequential decision problem.',
  usedBy: ['WebGPT (OpenAI)', 'WebVoyager', 'Mind2Web', 'AgentQL'],
  coreIdea:
    'Web agents treat browser interaction as a sequential decision task. The model observes the web page state (HTML, accessibility tree, or screenshots), selects actions (click, type, scroll, navigate), observes the resulting page state, and continues until the task is complete. Training uses a combination of behavior cloning from human web demonstrations and RL from task completion rewards. Modern web agents use vision-language models to process screenshots directly, eliminating the need for HTML parsing.',
  pipeline: [
    'Collect or generate web navigation tasks with success criteria',
    'Record human demonstrations (action sequences + page states)',
    'Extract page state as HTML, accessibility tree, or screenshot',
    'Define action space (click element, type text, scroll, navigate)',
    'Train via behavior cloning on human demonstrations',
    'Optionally add RL with task completion as reward signal',
    'Deploy in a headless browser environment',
    'Monitor and collect failure cases for iterative improvement',
  ],
  advantages: [
    'Can automate any web-based workflow',
    'VLM-based agents work on any visual interface',
    'Improves with scale (more data, larger models)',
  ],
  disadvantages: [
    'Slow execution (each action requires model inference)',
    'Brittle to website layout changes',
    'Safety concerns (autonomous web navigation)',
  ],
  worksBestFor: [
    'Form filling and data entry automation',
    'Web research and information gathering',
    'E-commerce and booking automation',
  ],
  keyPapers: [
    {
      title: 'WebGPT: Browser-Assisted Question-Answering',
      url: 'https://arxiv.org/abs/2112.09332',
      authors: 'OpenAI',
      year: 2021,
    },
    {
      title: 'Mind2Web: Towards a Generalist Web Agent',
      url: 'https://arxiv.org/abs/2306.06070',
      authors: 'Deng et al.',
      year: 2023,
    },
    {
      title: 'WebVoyager: Building an End-to-End Web Agent',
      url: 'https://arxiv.org/abs/2401.12345',
      authors: 'He et al.',
      year: 2024,
    },
  ],
  complexity: 5,
  compute: 'High — 16–64 GPUs for 7–21 days; significant infrastructure for browser environment',
  openSource: [
    'WebVoyager (https://github.com/webvoyager/webvoyager)',
    'Playwright (https://github.com/microsoft/playwright)',
    'BrowserGym (https://github.com/ServiceNow/BrowserGym)',
  ],
  commonMistakes: [
    'Not handling dynamic content (loading spinners, AJAX updates)',
    'Using HTML-only representation (misses visual layout information)',
    'Task descriptions too vague for reliable success detection',
  ],
  variants: [
    'VLM-based web agents (screenshot → actions via vision)',
    'HTML-accessible tree agents (text-only for efficiency)',
  ],
  futureDirections:
    'Self-improving web agents that automatically recover from failures, learn from their mistakes across sessions, and build internal models of common website patterns.',
}
