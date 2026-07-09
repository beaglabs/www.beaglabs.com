import type { Recipe } from '../types'

export const memoryOptimization: Recipe = {
  id: 'memory-optimization',
  title: 'Memory Optimization',
  part: 'agents',
  order: 4,
  purpose:
    'Train agents to efficiently store, retrieve, and update information across long interactions using learned memory mechanisms — including RAG fine-tuning, memory consolidation, and context compression.',
  usedBy: ['MemGPT (MemWalker)', 'RAG fine-tuned LMs', 'Memory-augmented agents'],
  coreIdea:
    'Memory optimization trains agents to manage their own context window: deciding what to remember, what to forget, and how to retrieve relevant information when needed. Key techniques include fine-tuning for retrieval-augmented generation (RAG) where the model learns to condition on retrieved documents effectively; memory consolidation where short-term memories are summarized into long-term storage; and context compression where long histories are distilled into compact representations.',
  pipeline: [
    'Define memory types (working memory, episodic memory, semantic memory)',
    'Collect agent interaction traces with memory retrieval events',
    'Train memory encoder: convert experiences into storable representations',
    'Train retrieval module: query → relevant memory ranking',
    'Fine-tune agent to condition on retrieved memories effectively',
    'Train memory consolidation: summarize recent history into long-term storage',
    'Add memory management actions (save, retrieve, forget, consolidate)',
    'Evaluate on long-horizon agent tasks',
  ],
  advantages: [
    'Enables agents to maintain coherence over extremely long interactions',
    'Reduces context window pressure',
    'Learns what information is worth remembering',
  ],
  disadvantages: [
    'Memory systems add latency to each agent step',
    'Consolidation can lose important details',
    'Retrieval quality is a bottleneck',
  ],
  worksBestFor: [
    'Long-running agent sessions (hours or days)',
    'Personal assistants that build user models over time',
    'Research agents conducting multi-day investigations',
  ],
  keyPapers: [
    {
      title: 'MemGPT: Towards LLMs as Operating Systems',
      url: 'https://arxiv.org/abs/2310.08560',
      authors: 'Packer et al.',
      year: 2023,
    },
    {
      title: 'Retrieval-Augmented Generation for Knowledge-Intensive Tasks',
      url: 'https://arxiv.org/abs/2005.11401',
      authors: 'Lewis et al.',
      year: 2020,
    },
    {
      title: 'Unlimiformer: Long-Range Transformers with Unlimited Length',
      url: 'https://arxiv.org/abs/2305.01625',
      authors: 'Bertsch et al.',
      year: 2023,
    },
  ],
  complexity: 4,
  compute: 'Medium — 4–16 GPUs for 3–10 days depending on memory architecture',
  openSource: [
    'MemGPT (https://github.com/cpacker/MemGPT)',
    'LangChain memory integrations',
  ],
  commonMistakes: [
    'Storing too much — retrieval quality degrades with dense memory stores',
    'Not training the retrieval module jointly with the agent',
    'Consolidating too aggressively — losing important episodic details',
  ],
  variants: [
    'Hierarchical memory (short-term → episodic → semantic consolidation)',
    'Compressive memory (train a smaller model to compress experiences)',
  ],
  futureDirections:
    'Agents with infinite context windows achieved through learned compression, where the model itself decides at each token whether to store, retrieve, or discard information — transparent and inspectable.',
}
