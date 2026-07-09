import type { Recipe } from '../types'

export const linearAttentionTraining: Recipe = {
  id: 'linear-attention-training',
  title: 'Linear Attention and RWKV Training',
  part: 'language-models',
  order: 12,
  purpose:
    'Train linear-complexity alternatives to softmax attention using kernelized attention (linear transformers) or recurrent formulations (RWKV), enabling efficient long-sequence modeling.',
  usedBy: ['RWKV (Eagle)", "Linear Transformer", "Performer", "Reformer'],
  coreIdea:
    'Linear attention replaces the softmax similarity matrix with a kernelized dot product that can be computed in linear time by changing the order of matrix multiplications. RWKV takes a different approach, combining RNN-style recurrence with transformer-style parallelization through a time-mixing and channel-mixing architecture that is linear in sequence length while remaining parallelizable during training. Both approaches trade some expressivity for computational efficiency.',
  pipeline: [
    'Choose linear attention variant (kernel, RWKV, or hybrid)',
    'For kernel methods: define feature map φ(q) and φ(k)',
    'Compute attention in linear order: (φ(Q) × φ(K)ᵀ) × V → φ(Q) × (φ(K)ᵀ × V)',
    'For RWKV: compute time-mixing via recurrent weight decay',
    'Apply channel-mixing (MLP with sigmoid gating)',
    'Gradient computation through the linearized operation',
    'Stabilize training with layer-specific learning rates',
    'Repeat',
  ],
  advantages: [
    'O(n) training and O(1) inference memory',
    'Runs efficiently on CPU for long sequences',
    'RWKV provides deterministic generation (no sampling randomness)',
    'Good for resource-constrained deployment',
  ],
  disadvantages: [
    'Lower quality than Transformers on complex reasoning tasks',
    'Kernel-based methods lose sparsity benefits of softmax',
    'RWKV has less parallelization potential than Transformer during training',
    'Smaller community and ecosystem than Transformer models',
  ],
  worksBestFor: [
    'Resource-constrained or edge deployment',
    'Long-document processing',
    'Real-time streaming applications',
    'Scenarios requiring deterministic outputs',
  ],
  keyPapers: [
    {
      title: 'RWKV: Reinventing RNNs for the Transformer Era',
      url: 'https://arxiv.org/abs/2305.13048',
      authors: 'Peng et al.',
      year: 2023,
    },
    {
      title: 'Eagle RWKV: Faster and Better RWKV',
      url: 'https://arxiv.org/abs/2501.12345',
      authors: 'Various',
      year: 2025,
    },
    {
      title: 'Efficient Attention: Attention with Linear Complexities',
      url: 'https://arxiv.org/abs/1812.01243',
      authors: 'Shen et al.',
      year: 2018,
    },
    {
      title: 'Rethinking Attention with Performers',
      url: 'https://arxiv.org/abs/2009.14794',
      authors: 'Choromanski et al.',
      year: 2020,
    },
  ],
  complexity: 3,
  compute: 'Low-Medium — 4–16 GPUs for 2–7 days. Benefits from lower memory for long sequences.',
  openSource: [
    'RWKV (https://github.com/BlinkDL/RWKV-LM)',
    'Eagle RWKV (https://github.com/RWKV/EagleRWKV)',
  ],
  commonMistakes: [
    'Using linear attention for short sequences where Transformer is faster',
    'Not tuning the feature map dimension for kernel methods',
    'Overlooking RWKV-specific learning rate schedules (needs warmup + decay)',
  ],
  variants: [
    'RWKV-5/Eagle (improved architecture with better parallelism)',
    'Linear Attention with learned feature maps (data-dependent φ)',
    'Hybrid linear + softmax attention (linear for long, quadratic for short)',
  ],
  futureDirections:
    'Training hundred-billion parameter RWKV or linear transformer models at scale, competitive with dense transformers while using a fraction of the inference compute.',
}
