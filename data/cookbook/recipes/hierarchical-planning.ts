import type { Recipe } from '../types'

export const hierarchicalPlanning: Recipe = {
  id: 'hierarchical-planning',
  title: 'Hierarchical Planning',
  part: 'agents',
  order: 6,
  purpose:
    'Train agents to decompose complex tasks into hierarchical subgoals, plan at multiple levels of abstraction, and execute plans through lower-level policies — enabling long-horizon task completion.',
  usedBy: ['HuggingGPT (Transformers agent)', 'Voyager (MineDojo)', 'Plan-and-Execute agents'],
  coreIdea:
    'Hierarchical planning trains agents to operate at multiple levels of abstraction. A high-level planner decomposes a task into subgoals (a plan), and lower-level policies execute each subgoal. The high-level planner receives the overall task and the current world state, and outputs a sequence of subgoals. Each subgoal is passed to a lower-level policy trained to achieve that specific subgoal. Training alternates between high-level plan optimization and low-level skill refinement, often using a combination of supervised learning on demonstrations and RL on task completion.',
  pipeline: [
    'Define hierarchy levels (e.g., task → subtask → action)',
    'Collect demonstration data at each hierarchy level',
    'Train low-level policies for subgoal achievement (BC or RL)',
    'Train high-level planner: state → sequence of subgoals',
    'Joint training loop: planner proposes plan → low-level policies execute',
    'Evaluate overall task completion',
    'Backpropagate task outcome through the hierarchy',
    'Iterate: refine planner and low-level policies',
  ],
  advantages: [
    'Handles long-horizon tasks that flat policies cannot',
    'More interpretable — plans can be inspected at each level',
    'Skills are reusable across different tasks (composability)',
  ],
  disadvantages: [
    'Planning horizon is limited by the highest-level planner',
    'Error propagation: a bad plan fails even with good skills',
    'Training is more complex than flat policy training',
  ],
  worksBestFor: [
    'Long-horizon software engineering tasks',
    'Multi-step web research and data collection',
    'Robotics task and motion planning',
  ],
  keyPapers: [
    {
      title: 'HuggingGPT: Solving AI Tasks with ChatGPT and its Friends',
      url: 'https://arxiv.org/abs/2303.17580',
      authors: 'Shen et al.',
      year: 2023,
    },
    {
      title: 'Voyager: An Open-Ended Embodied Agent with Large Language Models',
      url: 'https://arxiv.org/abs/2305.16291',
      authors: 'Wang et al. (NVIDIA)',
      year: 2023,
    },
    {
      title: 'Plan-and-Solve: Improving LLM Planning with Explicit Subgoals',
      url: 'https://arxiv.org/abs/2305.04091',
      authors: 'Wang et al.',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'Medium — 4–16 GPUs for 5–14 days depending on hierarchy depth',
  openSource: [
    'Voyager (https://github.com/MineDojo/Voyager)',
    'LangChain Plan-and-Execute',
  ],
  commonMistakes: [
    'Too many hierarchy levels (latency and error propagation)',
    'Planner not aware of low-level policy capabilities (unachievable subgoals)',
    'Not providing enough feedback from low-level execution failures back to planner',
  ],
  variants: [
    'Dynamic hierarchical planning (hierarchy depth adapts to task complexity)',
    'Recursive planning (task → subtask → sub-subtask recursively)',
  ],
  futureDirections:
    'Meta-learned hierarchies where the agent discovers its own optimal hierarchy for each task domain, automatically identifying the right level of abstraction without human engineering.',
}
