import type { Recipe } from '../types'

export const toolUseRL: Recipe = {
  id: 'tool-use-rl',
  title: 'Tool-Use RL',
  part: 'agents',
  order: 1,
  purpose:
    'Train language models to autonomously decide when and how to use external tools (APIs, calculators, search, code interpreters) through reinforcement learning from tool interaction outcomes.',
  usedBy: ['GPT-4 with tools', 'Claude Tool Use', 'Gemini Function Calling', 'Toolformer'],
  coreIdea:
    'Tool-use RL trains models to generate tool calls (function invocations) in addition to text. The model outputs structured tool calls, executes them, receives the result, and continues generating with the tool output in context. Training uses outcome-based rewards (did the tool use help solve the task?), which naturally handles the exploration-exploitation tradeoff of tool selection. The training loop interleaves text generation with tool execution, and the policy gradient rewards successful tool-use trajectories.',
  pipeline: [
    'Define tool API schemas (function name, parameters, return types)',
    'Collect or generate tasks requiring tool use (math, search, code execution)',
    'Train initial tool-use behavior via supervised fine-tuning on demonstrations',
    'Sample tool-using rollouts from the policy',
    'Execute tool calls in a sandboxed environment',
    'Score trajectories: did tool use lead to correct final answer?',
    'Compute policy gradient with tool-specific reward shaping',
    'Optionally add safety constraints (tool call budget, restricted APIs)',
    'Iterate with online tool interaction',
  ],
  advantages: [
    'Model learns when to use each tool, not just how',
    'Can discover novel tool-use strategies not in demonstrations',
    'Generalizes to new tools with similar schemas',
  ],
  disadvantages: [
    'Sandboxed tool execution is complex infrastructure',
    'Long latency — each tool call blocks generation',
    'Hard to credit-assign across multiple tool calls',
  ],
  worksBestFor: [
    'Math and calculation (calculator tool)',
    'Information retrieval (search, database queries)',
    'Code generation and execution (interpreter tool)',
    'API orchestration and automation',
  ],
  keyPapers: [
    {
      title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
      url: 'https://arxiv.org/abs/2302.04761',
      authors: 'Schick et al. (Meta AI)',
      year: 2023,
    },
    {
      title: 'Gorilla: Large Language Model Connected with Massive APIs',
      url: 'https://arxiv.org/abs/2305.15334',
      authors: 'Patil et al.',
      year: 2023,
    },
    {
      title: 'Tool Use in Large Language Models: A Survey',
      url: 'https://arxiv.org/abs/2401.01234',
      authors: 'Various',
      year: 2024,
    },
  ],
  complexity: 4,
  compute: 'Medium-High — 8–32 GPUs for 5–14 days including tool execution infrastructure',
  openSource: [
    'Toolformer (https://github.com/lucidrains/toolformer-pytorch)',
    'Gorilla (https://github.com/ShishirPatil/gorilla)',
    'OpenAI Function Calling examples',
  ],
  commonMistakes: [
    'Sandbox not properly isolated (tool execution security)',
    'Reward shaping that over-penalizes tool calls (model stops using tools)',
    'Not handling tool execution errors gracefully during training',
  ],
  variants: [
    'Tool-augmented language models (always call tools, no RL — simpler)',
    'Self-instruct for tools (model generates its own tool-use demonstrations)',
  ],
  futureDirections:
    'Meta-tool-use: models that can create and register new tools on the fly by writing code, testing it, and incorporating it into their tool set during a single session.',
}
