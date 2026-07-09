import type { Recipe } from '../types'

export const multiAgentRL: Recipe = {
  id: 'multi-agent-rl',
  title: 'Multi-Agent RL',
  part: 'agents',
  order: 7,
  purpose:
    'Train multiple agents to coordinate, cooperate, or compete effectively through multi-agent reinforcement learning, enabling complex multi-agent systems for software, robotics, and games.',
  usedBy: ['OpenAI Five', 'AlphaStar', 'SMAC (StarCraft) MARL', 'Agent coordination research'],
  coreIdea:
    'Multi-agent RL extends single-agent RL to settings with multiple simultaneously learning agents. Each agent observes the environment (and optionally other agents), and selects actions. The key challenge is non-stationarity: each agent perceives a changing world because the other agents are also learning. Solutions include centralized training with decentralized execution (CTDE), where agents share gradients during training but act independently at inference; and opponent modeling, where agents learn to predict other agents behavior.',
  pipeline: [
    'Define agent roles, observation spaces, action spaces',
    'Choose training paradigm: CTDE, independent learning, or shared parameters',
    'Initialize agent policies (shared or separate networks)',
    'Each step: agents observe state, sample actions from policies',
    'Execute joint action, receive individual or shared rewards',
    'Store transitions in (potentially shared) replay buffer',
    'Update policies using MARL algorithm (MAPPO, QMIX, VDN)',
    'Evaluate coordination metrics',
    'Repeat for thousands to millions of episodes',
  ],
  advantages: [
    'Can solve tasks requiring coordination (no single agent suffices)',
    'Emergent behaviors from competitive training',
    'Parallelized exploration across agents',
  ],
  disadvantages: [
    'Non-stationarity makes training unstable',
    'Credit assignment is hard (which agent caused the reward?)',
    'Exponential blowup in joint action space',
  ],
  worksBestFor: [
    'Multi-agent software systems (dev teams of agents)',
    'Game AI and simulation (StarCraft, DOTA, hide-and-seek)',
    'Robotics swarm coordination',
  ],
  keyPapers: [
    {
      title: 'The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games',
      url: 'https://arxiv.org/abs/2103.01955',
      authors: 'Yu et al. (MAPPO)',
      year: 2021,
    },
    {
      title: 'QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent RL',
      url: 'https://arxiv.org/abs/1803.11485',
      authors: 'Rashid et al.',
      year: 2018,
    },
    {
      title: 'Emergent Tool Use from Multi-Agent Interaction (Hide and Seek)',
      url: 'https://openai.com/blog/emergent-tool-use/',
      authors: 'OpenAI',
      year: 2019,
    },
  ],
  complexity: 5,
  compute: 'High — 16–128 GPUs for 14–60 days for large-scale MARL training',
  openSource: [
    'MAPPO (https://github.com/marlbenchmark/on-policy)',
    'PyMARL (https://github.com/oxwhirl/pymarl)',
  ],
  commonMistakes: [
    'Using independent learning without CTDE (extreme non-stationarity)',
    'Not sharing rewards in cooperative settings (agents become selfish)',
    'Too many agents for the environment capacity',
  ],
  variants: [
    'Fully decentralized (each agent learns independently)',
    'CTDE (centralized training, decentralized execution)',
    'Shared parameters (all agents use same policy network)',
    'Mixed cooperative-competitive (some agents cooperate, others compete)',
  ],
  futureDirections:
    'Foundation model-powered MARL where LLM-based agents negotiate, plan, and coordinate using natural language, enabling complex multi-agent software engineering and scientific research teams.',
}
