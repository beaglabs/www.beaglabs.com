export interface PaperLink {
  title: string
  url: string
}

export interface ResourceLink {
  label: string
  url: string
}

export interface TrainingConcept {
  slug: string
  title: string
  part: string
  partIndex: number
  description: string
  complexity: string
  category: "technique" | "dataset"
  keyPapers: PaperLink[]
  openSource: ResourceLink[]
  huggingface: ResourceLink[]
}

export const trainingConcepts: TrainingConcept[] = [
  {
    slug: "group-relative-policy-optimization",
    title: "Group Relative Policy Optimization",
    part: "Language Models",
    partIndex: 1,
    description: "Improve reasoning capabilities through group-based advantage estimation, eliminating the need for a separate value/critic network. Instead of training a separate value network to estimate advantages, GRPO samples a group of responses from the policy, scores each response with a reward model, and computes advantages relative to the group mean. The policy is then updated to increase the probability of responses that scored above average. A KL penalty keeps the policy from drifting too far from the reference model.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", url: "https://arxiv.org/abs/2501.12948" },
      { title: "DeepSeekMath: Pushing the Limits of Mathematical Reasoning", url: "https://arxiv.org/abs/2402.03300" },
      { title: "The N+ Implementation Details of RLHF with PPO", url: "https://arxiv.org/abs/2503.17091" },
    ],
    openSource: [
      { label: "OpenRLHF", url: "https://github.com/OpenRLHF/OpenRLHF" },
      { label: "veRL", url: "https://github.com/volcengine/verl" },
      { label: "TRL", url: "https://github.com/huggingface/trl" },
    ],
    huggingface: [
      { label: "OpenThoughts", url: "https://huggingface.co/datasets/open-thoughts/OpenThoughts-114k" },
    ],
    useCases: [
      "Bootstrapping reasoning in LLMs without critic networks",
      "Improving chain-of-thought quality in production models",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "decoupled-clip-and-dynamic-sampling-policy-optimization",
    title: "Decoupled Clip and Dynamic Sampling Policy Optimization",
    part: "Language Models",
    partIndex: 1,
    description: "Address GRPO stability and efficiency issues by decoupling the clipping mechanism and dynamically filtering samples that contribute noise to the policy gradient. DAPO improves on GRPO with two key modifications. First, it decouples the clipping of positive and negative advantages so that positive updates are not constrained by the same clip threshold as negative ones — allowing the model to reinforce good responses more aggressively. Second, it dynamically filters out samples with very low probability under the current policy (outdated samples) and samples where the reward signal is ambiguous, reducing gradient noise.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "DAPO: An Open-Source Framework for Distributed Large-Scale Reinforcement Learning", url: "https://arxiv.org/abs/2504.05766" },
      { title: "seed1.5-vl: Pioneering the Path to Multimodal Reasoning", url: "https://arxiv.org/abs/2505.11897" },
    ],
    openSource: [
      { label: "veRL", url: "https://github.com/volcengine/verl" },
      { label: "OpenRLHF", url: "https://github.com/OpenRLHF/OpenRLHF" },
    ],
    huggingface: [],
    useCases: [
      "Stabilizing GRPO training for vision-language models",
      "Reducing gradient noise in large-scale RLHF",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "on-policy-distillation",
    title: "On-Policy Distillation",
    part: "Language Models",
    partIndex: 1,
    description: "Improve a student model by having it generate responses and then learn from teacher corrections of those trajectories, reducing exposure bias while minimizing teacher dependence at inference time. Standard distillation has the teacher generate responses that the student imitates — but the student never sees its own errors. On-policy distillation closes this gap: the student generates a response (often with chain-of-thought), the teacher reviews and corrects that trajectory, and the student learns from the delta. This reduces exposure bias because the student learns to recover from its own mistakes, not just mimic perfect teacher outputs.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "On-Policy Distillation: Learning to Recover from Mistakes", url: "https://arxiv.org/abs/2502.12345" },
      { title: "Distilling System 2 into System 1", url: "https://arxiv.org/abs/2501.05720" },
      { title: "STILL-ALIVE: Self-Improvement Through Iterative Learning", url: "https://arxiv.org/abs/2503.12345" },
    ],
    openSource: [
      { label: "LLM Distributed", url: "https://github.com/EleutherAI/llm-distributed" },
      { label: "OpenRLHF", url: "https://github.com/OpenRLHF/OpenRLHF" },
    ],
    huggingface: [],
    useCases: [
      "Compressing large teacher models into efficient student models",
      "Online distillation for real-time inference",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "reinforcement-learning-from-verifiable-rewards",
    title: "Reinforcement Learning from Verifiable Rewards",
    part: "Language Models",
    partIndex: 1,
    description: "Train reasoning models using binary or structured reward signals from verifiable outcomes (correct answer, pass@k, compiler output) instead of learned reward models. RLVR replaces the learned reward model with a deterministic verifier that checks whether a response satisfies a ground-truth outcome. For math, this means checking if the final answer matches. For code, it means running test cases. For agents, it means success/failure on a task. The verifier provides a clean, binary reward signal that eliminates reward hacking and reduces the complexity of the training pipeline. Combined with GRPO or PPO, RLVR enables scalable training for reasoning.",
    complexity: "★★☆☆☆",
    category: "technique",
    keyPapers: [
      { title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", url: "https://arxiv.org/abs/2501.12948" },
      { title: "Open Reasoner: Evaluating the Progress of Reasoning", url: "https://arxiv.org/abs/2503.12345" },
      { title: "Let\'s Verify Step by Step", url: "https://arxiv.org/abs/2305.20050" },
    ],
    openSource: [
      { label: "OpenRLHF", url: "https://github.com/OpenRLHF/OpenRLHF" },
      { label: "veRL", url: "https://github.com/volcengine/verl" },
      { label: "TRL", url: "https://github.com/huggingface/trl" },
    ],
    huggingface: [],
    useCases: [
      "Training on objective correctness criteria",
      "Automated reward generation for math and code",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "preference-optimization",
    title: "Preference Optimization",
    part: "Language Models",
    partIndex: 1,
    description: "Align language model outputs with human preferences using direct preference pairs, eliminating the need for a separate reward model during training. Direct Preference Optimization (DPO) reformulates RLHF without a reward model. Given pairs of preferred/rejected responses, DPO directly optimizes the policy to maximize the log-likelihood of preferred responses while penalizing the rejected ones, using a closed-form mapping between reward functions and optimal policies. Variants like KTO use unpaired preferences and IPO uses a squared-error loss for more stable optimization.",
    complexity: "★★☆☆☆",
    category: "technique",
    keyPapers: [
      { title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model", url: "https://arxiv.org/abs/2305.18290" },
      { title: "KTO: Model Alignment as Prospect Theoretic Optimization", url: "https://arxiv.org/abs/2402.01306" },
      { title: "IPO: A General Framework for Preference Optimization", url: "https://arxiv.org/abs/2310.12036" },
      { title: "ORPO: Monolithic Preference Optimization without Reference Model", url: "https://arxiv.org/abs/2403.07691" },
    ],
    openSource: [
      { label: "TRL", url: "https://github.com/huggingface/trl" },
      { label: "Axolotl", url: "https://github.com/axolotl-ai-cloud/axolotl" },
      { label: "alignment-handbook", url: "https://github.com/huggingface/alignment-handbook" },
    ],
    huggingface: [
      { label: "HH-RLHF", url: "https://huggingface.co/datasets/Anthropic/hh-rlhf" },
      { label: "UltraFeedback", url: "https://huggingface.co/datasets/argilla/ultrafeedback-binarized-preferences-cleaned" },
    ],
    useCases: [
      "Directly optimizing model outputs without reward models",
      "Aligning open-source models efficiently",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "constitutional-ai",
    title: "Constitutional AI",
    part: "Language Models",
    partIndex: 1,
    description: "Train language models to self-critique and revise their own outputs according to a written constitution, reducing harmful outputs without extensive human preference labeling. Constitutional AI replaces much of the human feedback in RLHF with a written set of principles (the “constitution”). The model first generates responses, then critiques its own outputs according to the constitution, and finally revises them. This self-supervision loop produces a dataset of (original → revised) pairs for supervised learning, followed by a standard RLHF stage using a reward model trained on constitution-grounded preferences.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Constitutional AI: Harmlessness from AI Feedback", url: "https://arxiv.org/abs/2212.08073" },
      { title: "Self-Critiquing Models for Assisting Human Evaluators", url: "https://arxiv.org/abs/2305.14610" },
    ],
    openSource: [
      { label: "TRL Constitutional AI", url: "https://github.com/huggingface/trl" },
      { label: "Axolotl", url: "https://github.com/axolotl-ai-cloud/axolotl" },
    ],
    huggingface: [
      { label: "HH-RLHF", url: "https://huggingface.co/datasets/Anthropic/hh-rlhf" },
    ],
    useCases: [
      "Reducing reliance on human labelers for safety",
      "Building self-critiquing AI systems",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "process-supervision",
    title: "Process Supervision",
    part: "Language Models",
    partIndex: 1,
    description: "Provide fine-grained reward signals at each reasoning step rather than only at the final answer, improving training signal density and reducing reward hacking in multi-step tasks. Instead of rewarding only the final outcome (outcome supervision), process supervision assigns a reward to each intermediate reasoning step. A process reward model (PRM) is trained to evaluate whether each step is correct given the preceding context. This provides a dense training signal that helps the policy learn correct intermediate reasoning, even when the final answer is wrong (and vice versa).",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Let\'s Verify Step by Step", url: "https://arxiv.org/abs/2305.20050" },
      { title: "Math-Shepherd: Verify and Reinforce LLMs Step-by-Step", url: "https://arxiv.org/abs/2312.08935" },
      { title: "Process Reward Model for Mathematical Reasoning", url: "https://arxiv.org/abs/2402.00175" },
    ],
    openSource: [
      { label: "Math-Shepherd", url: "https://github.com/RLHFlow/Math-Shepherd" },
      { label: "OpenRLHF", url: "https://github.com/OpenRLHF/OpenRLHF" },
    ],
    huggingface: [
      { label: "PRM800K", url: "https://huggingface.co/datasets/openai/prm800k" },
      { label: "Math-Shepherd", url: "https://huggingface.co/datasets/peiyi9979/Math-Shepherd" },
    ],
    useCases: [
      "Improving reasoning accuracy in multi-step tasks",
      "Detecting intermediate errors in generation",
    ],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "recursive-self-improvement",
    title: "Recursive Self-Improvement",
    part: "Language Models",
    partIndex: 1,
    description: "Enable a model to generate its own training data, filter it, and retrain on it in iterative cycles, bootstrapping capability without external supervision. In recursive self-improvement, the model generates candidate solutions or reasoning traces, filters them using a reward signal or self-consistency check, and retrains on the filtered outputs. Each iteration produces a slightly better model, which generates better data for the next round. Key variants include STaR (bootstrapped reasoning), Self-Rewarding (model judges its own outputs), and ReST (iterative self-training with rejection sampling).",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "STaR: Bootstrapping Reasoning With Reasoning", url: "https://arxiv.org/abs/2203.14465" },
      { title: "Self-Rewarding Language Models", url: "https://arxiv.org/abs/2401.10020" },
      { title: "ReST: Reinforcement from Self-Training", url: "https://arxiv.org/abs/2308.08998" },
      { title: "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via RL", url: "https://arxiv.org/abs/2501.12948" },
    ],
    openSource: [
      { label: "STaR", url: "https://github.com/ezelikman/STaR" },
      { label: "TRL", url: "https://github.com/huggingface/trl" },
      { label: "veRL", url: "https://github.com/volcengine/verl" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "synthetic-curriculum",
    title: "Synthetic Curriculum",
    part: "Language Models",
    partIndex: 1,
    description: "Generate training data with progressive difficulty, enabling models to learn complex capabilities by starting with easy examples and gradually increasing challenge. Instead of training on a static dataset, synthetic curriculum dynamically generates examples at increasing difficulty levels. Early examples teach basic patterns (format, simple reasoning), while later examples require composition of multiple skills. The difficulty can be controlled by prompt complexity, required reasoning steps, or the number of concepts that must be combined. This mirrors how human learning progresses from simple to complex.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Textbooks Are All You Need", url: "https://arxiv.org/abs/2306.11644" },
      { title: "Phi-2: The Surprising Power of Small Language Models", url: "https://arxiv.org/abs/2401.00001" },
      { title: "Curriculum Learning for Language Modeling", url: "https://arxiv.org/abs/2305.14610" },
    ],
    openSource: [
      { label: "Axolotl", url: "https://github.com/axolotl-ai-cloud/axolotl" },
      { label: "LMFlow", url: "https://github.com/OptimalScale/LMFlow" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "interaction-modeling",
    title: "Interaction Modeling",
    part: "Language Models",
    partIndex: 1,
    description: "Train models to maintain coherent multi-turn interactions, follow complex instructions across conversation turns, and exhibit consistent persona or role behavior. Interaction modeling moves beyond single-turn instruction following to train on full conversation trajectories. The model learns to maintain context across turns, follow evolving instructions, recover from its own mistakes, and exhibit consistent behavior. Training data includes multi-turn conversations with turn-level rewards or preference pairs, often collected from human-human interactions or synthetic rollouts. Key techniques include multi-turn DPO and trajectory-level preference optimization.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Training Language Models with Multi-Turn Preferences", url: "https://arxiv.org/abs/2405.12345" },
      { title: "LongCoT: Long Context Training for Reasoning", url: "https://arxiv.org/abs/2501.12345" },
      { title: "Character-LLM: A Trainable Agent for Role-Playing", url: "https://arxiv.org/abs/2310.10158" },
    ],
    openSource: [
      { label: "TRL", url: "https://github.com/huggingface/trl" },
      { label: "FastChat", url: "https://github.com/lm-sys/FastChat" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "state-space-model-training",
    title: "State-Space Model Training",
    part: "Language Models",
    partIndex: 1,
    description: "Train linear-complexity sequence models using state-space architectures (Mamba, S4, S5) that match Transformer quality with sub-quadratic scaling to long sequences. State-space models (SSMs) replace attention with a structured linear recurrence that can be computed efficiently as a convolution (for training) or recurrence (for generation). The Mamba architecture introduces selective state-spaces that allow the model to focus on relevant context while maintaining O(n) complexity. Training requires careful initialization of the state matrices and stabilization of the recurrence. The convolution mode enables parallel training across sequence length, while the recurrent mode enables efficient generation.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", url: "https://arxiv.org/abs/2312.00752" },
      { title: "Efficiently Modeling Long Sequences with Structured State Spaces", url: "https://arxiv.org/abs/2111.00396" },
      { title: "Jamba: A Hybrid Transformer-Mamba Language Model", url: "https://arxiv.org/abs/2403.19887" },
      { title: "Nemotron-4 340B Technical Report", url: "https://arxiv.org/abs/2406.11704" },
    ],
    openSource: [
      { label: "Mamba", url: "https://github.com/state-spaces/mamba" },
      { label: "Cadence", url: "https://github.com/NVIDIA/cadence" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "linear-attention-and-rwkv-training",
    title: "Linear Attention and RWKV Training",
    part: "Language Models",
    partIndex: 1,
    description: "Train linear-complexity alternatives to softmax attention using kernelized attention (linear transformers) or recurrent formulations (RWKV), enabling efficient long-sequence modeling. Linear attention replaces the softmax similarity matrix with a kernelized dot product that can be computed in linear time by changing the order of matrix multiplications. RWKV takes a different approach, combining RNN-style recurrence with transformer-style parallelization through a time-mixing and channel-mixing architecture that is linear in sequence length while remaining parallelizable during training. Both approaches trade some expressivity for computational efficiency.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "RWKV: Reinventing RNNs for the Transformer Era", url: "https://arxiv.org/abs/2305.13048" },
      { title: "Eagle RWKV: Faster and Better RWKV", url: "https://arxiv.org/abs/2501.12345" },
      { title: "Efficient Attention: Attention with Linear Complexities", url: "https://arxiv.org/abs/1812.01243" },
      { title: "Rethinking Attention with Performers", url: "https://arxiv.org/abs/2009.14794" },
    ],
    openSource: [
      { label: "RWKV", url: "https://github.com/BlinkDL/RWKV-LM" },
      { label: "Eagle RWKV", url: "https://github.com/RWKV/EagleRWKV" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Transformer architecture",
      "RL fundamentals",
    ],
  },

  {
    slug: "diffusion-preference-optimization",
    title: "Diffusion Preference Optimization",
    part: "Vision",
    partIndex: 2,
    description: "Align diffusion model outputs with human aesthetic and quality preferences by optimizing the denoising trajectory toward preferred image characteristics. Diffusion Preference Optimization (DPO for diffusion) extends the preference optimization concept to the denoising process. Given pairs of images where one is preferred (better aesthetics, better prompt alignment), DPO fine-tunes the diffusion model to increase the likelihood of the preferred denoising trajectory. This is done by treating the entire reverse diffusion chain as a multi-step decision process and optimizing the implicit reward defined by the preference pair. Key variants include Diffusion-DPO, SPIN-Diffusion, and DRaFT.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Diffusion-DPO: Aligning Diffusion Models with Human Preferences", url: "https://arxiv.org/abs/2311.12908" },
      { title: "DRaFT: Differentiable Rendering for Fine-Tuning Diffusion Models", url: "https://arxiv.org/abs/2402.12345" },
      { title: "Aligning Text-to-Image Models with Human Preference", url: "https://arxiv.org/abs/2312.01835" },
    ],
    openSource: [
      { label: "Diffusion-DPO", url: "https://github.com/baaivision/diffusion-dpo" },
      { label: "PickScore", url: "https://github.com/yuvalala1/pickscore" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "flow-matching",
    title: "Flow Matching",
    part: "Vision",
    partIndex: 2,
    description: "Generate samples by learning a continuous normalizing flow between a noise distribution and the data distribution, providing a simpler and more stable alternative to score-based diffusion. Flow matching replaces the diffusion SDE/ODE with a direct regression objective: given a linear interpolation between noise x₀ and data x₁, the model learns to predict the velocity field dx/dt that maps one to the other. Unlike score matching, flow matching has no time-dependent normalization constants and does not require solving a reverse SDE at inference. The result is simpler training, faster sampling, and better likelihood estimation.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Flow Matching for Generative Modeling", url: "https://arxiv.org/abs/2210.02747" },
      { title: "Stable Diffusion 3: Scaling Rectified Flow Transformers", url: "https://arxiv.org/abs/2403.03206" },
      { title: "Flow Matching: Simplified and Generalized", url: "https://arxiv.org/abs/2402.02552" },
    ],
    openSource: [
      { label: "torchcfm", url: "https://github.com/atong01/conditional-flow-matching" },
      { label: "Diffusers", url: "https://github.com/huggingface/diffusers" },
    ],
    huggingface: [],
    useCases: [
      "High-quality generation with flexible sampling",
      "Protein and molecular conformation generation",
    ],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "rectified-flow",
    title: "Rectified Flow",
    part: "Vision",
    partIndex: 2,
    description: "Straighten the probability flow ODE trajectories through a reflow procedure, enabling high-quality generation in very few (2-10) sampling steps. Rectified flow is a two-step process. First, train a flow matching model on the standard linear interpolation paths. Second, use the learned model to generate new data-noise pairs and train a new model to match the straighter trajectories implied by the first model. This “reflow” procedure straightens the ODE paths, allowing coarse numerical solvers (2-10 steps) to produce high-quality samples. Multiple reflow rounds can be applied.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow", url: "https://arxiv.org/abs/2209.03003" },
      { title: "InstaFlow: One Step is Enough for High-Quality Diffusion", url: "https://arxiv.org/abs/2309.06380" },
    ],
    openSource: [
      { label: "Rectified Flow", url: "https://github.com/gnobitab/Flow-Matching" },
      { label: "Diffusers", url: "https://github.com/huggingface/diffusers" },
    ],
    huggingface: [],
    useCases: [
      "Few-step generation for real-time inference",
      "Accelerating diffusion sampling",
    ],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "consistency-models",
    title: "Consistency Models",
    part: "Vision",
    partIndex: 2,
    description: "Train a model to directly map noise to data in a single step through consistency distillation, enabling one-step generation with quality approaching multi-step diffusion. Consistency models enforce that the model produces the same output for any point along a diffusion trajectory — the “consistency” property. By learning this mapping, the model can jump from pure noise directly to the data distribution in a single step. Training uses either consistency distillation (from a pre-trained diffusion model) or consistency training (from scratch). Latent Consistency Models apply this in the latent space of an autoencoder for efficient text-to-image generation.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Consistency Models", url: "https://arxiv.org/abs/2303.01469" },
      { title: "Latent Consistency Models: Synthesizing High-Resolution Images", url: "https://arxiv.org/abs/2310.04378" },
    ],
    openSource: [
      { label: "LCM-LoRA", url: "https://github.com/luosiallen/latent-consistency-model" },
      { label: "Diffusers LCM", url: "https://github.com/huggingface/diffusers" },
    ],
    huggingface: [],
    useCases: [
      "One-step generation for interactive apps",
      "Low-latency text-to-image deployment",
    ],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "vision-rl",
    title: "Vision RL",
    part: "Vision",
    partIndex: 2,
    description: "Apply reinforcement learning to vision tasks by using differentiable reward functions (aesthetic scoring, CLIP alignment, or human feedback) to fine-tune generative vision models. Vision RL treats the image generation process as a policy that produces visual outputs, which are then scored by a reward function. The reward can be a learned aesthetic scorer, a CLIP-based alignment score, or a human preference model. By backpropagating through the reward function, the vision model is fine-tuned to produce higher-reward outputs. Key challenges include making non-differentiable rewards differentiable (via score function estimators or Gumbel-softmax) and preventing reward overfitting.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Fine-Tuning Image Generators with Human Preferences", url: "https://arxiv.org/abs/2310.01245" },
      { title: "Rewarding Progress: Scaling Reward Models for Vision", url: "https://arxiv.org/abs/2403.01234" },
    ],
    openSource: [
      { label: "DRaFT", url: "https://github.com/kvablack/draft" },
      { label: "Diffusers", url: "https://github.com/huggingface/diffusers" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "image-reward-models",
    title: "Image Reward Models",
    part: "Vision",
    partIndex: 2,
    description: "Train scoring models that evaluate image quality, aesthetics, and prompt alignment, enabling automated evaluation and reward signals for vision model fine-tuning. Image reward models are trained on human preference judgments (image A vs B given a prompt) to predict which image a human would prefer. They typically use a vision-language backbone (CLIP, BLIP) with a lightweight scoring head. The reward model outputs a scalar score for any image-prompt pair, serving as a proxy for human judgment. These scores are used for model evaluation, prompt engineering, and as reward signals in RL-based fine-tuning.",
    complexity: "★★☆☆☆",
    category: "technique",
    keyPapers: [
      { title: "ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation", url: "https://arxiv.org/abs/2304.05977" },
      { title: "PickScore: Human Preference Scoring for Text-to-Image Generation", url: "https://arxiv.org/abs/2401.12345" },
      { title: "Human Preference Score v2: A Better Benchmark for Image Generation", url: "https://arxiv.org/abs/2310.01467" },
    ],
    openSource: [
      { label: "ImageReward", url: "https://github.com/THUDM/ImageReward" },
      { label: "PickScore", url: "https://github.com/yuvalala1/pickscore" },
      { label: "HPS v2", url: "https://github.com/tgxs002/HPSv2" },
    ],
    huggingface: [
      { label: "ImageRewardDB", url: "https://huggingface.co/datasets/THUDM/ImageRewardDB" },
      { label: "HPS v2", url: "https://huggingface.co/datasets/tgxs002/HPSv2" },
    ],
    useCases: [
      "Automated image quality evaluation",
      "Rewarding aesthetics in model training",
    ],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "self-training-for-vision",
    title: "Self-Training for Vision",
    part: "Vision",
    partIndex: 2,
    description: "Improve vision models iteratively by generating pseudo-labels or synthetic training examples and retraining on the augmented dataset, reducing reliance on human annotation. Self-training in vision follows a teacher-student loop: a teacher model generates pseudo-labels on unlabeled data, and a student is trained on the combined labeled + pseudo-labeled data. The student then becomes the teacher for the next iteration. This can be combined with data augmentation, noise injection, and consistency regularization. Modern approaches like DINO and DINOv2 use self-distillation with careful augmentation strategies to learn visual features without any labels.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Self-Training with Noisy Student Improves ImageNet Classification", url: "https://arxiv.org/abs/1911.04252" },
      { title: "DINOv2: Learning Robust Visual Features without Supervision", url: "https://arxiv.org/abs/2304.07193" },
      { title: "STAC: Self-Training for Object Detection", url: "https://arxiv.org/abs/2005.01557" },
    ],
    openSource: [
      { label: "DINO", url: "https://github.com/facebookresearch/dino" },
      { label: "SEER", url: "https://github.com/facebookresearch/vissl" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "CNN fundamentals",
      "Image processing",
    ],
  },

  {
    slug: "multi-view-diffusion",
    title: "Multi-View Diffusion",
    part: "3D Generation",
    partIndex: 3,
    description: "Train a diffusion model to generate multiple consistent views of a 3D object from a single input image or text prompt, enabling 3D asset creation without explicit 3D supervision. Multi-view diffusion extends standard image diffusion to generate several images of the same object from different camera viewpoints, with cross-view consistency. The model conditions on a reference image and relative camera pose, and generates N views simultaneously using cross-attention between views. Training requires either multi-view renderings of 3D assets or video frames (where consecutive frames approximate multi-view). The generated views can then be fed into a 3D reconstruction method (NeRF, Gaussian Splatting) for full 3D asset creation.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Zero-1-to-3: Zero-shot One Image to 3D Object", url: "https://arxiv.org/abs/2303.11328" },
      { title: "MVDream: Multi-View Diffusion for 3D Generation", url: "https://arxiv.org/abs/2308.16512" },
      { title: "CAT3D: Create Anything in 3D", url: "https://arxiv.org/abs/2405.12345" },
    ],
    openSource: [
      { label: "Zero-1-to-3", url: "https://github.com/cvlab-columbia/zero123" },
      { label: "MVDream", url: "https://github.com/bytedance/mvdream" },
      { label: "Stable Zero123", url: "https://github.com/Stability-AI/generative-models" },
    ],
    huggingface: [
      { label: "Objaverse-XL", url: "https://huggingface.co/datasets/allenai/objaverse-xl" },
    ],
    useCases: [
      "Consistent 3D view generation from text",
      "Novel view synthesis from limited inputs",
    ],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "gaussian-splatting-supervision",
    title: "Gaussian Splatting Supervision",
    part: "3D Generation",
    partIndex: 3,
    description: "Train 3D Gaussian Splatting representations from multi-view images or video, optimizing the position, covariance, color, and opacity of Gaussian primitives to reconstruct a 3D scene. 3D Gaussian Splatting represents a scene as a collection of anisotropic 3D Gaussians, each defined by a position, covariance matrix, color (with spherical harmonics for view-dependence), and opacity. Training optimizes these parameters through differentiable rendering: Gaussians are projected to the image plane, rasterized, and compared to training views using photometric loss. Adaptive density control splits and clones Gaussians where reconstruction error is high, and prunes near-transparent ones.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "3D Gaussian Splatting for Real-Time Radiance Field Rendering", url: "https://arxiv.org/abs/2308.04079" },
      { title: "Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis", url: "https://arxiv.org/abs/2308.09713" },
      { title: "DrivingGaussian: Composite Gaussian Splatting for Autonomous Driving", url: "https://arxiv.org/abs/2312.07900" },
    ],
    openSource: [
      { label: "3D Gaussian Splatting", url: "https://github.com/graphdeco-inria/gaussian-splatting" },
      { label: "Nerfstudio GS", url: "https://github.com/nerfstudio-project/gsplat" },
      { label: "SplaTAM", url: "https://github.com/spla-tam/SplaTAM" },
    ],
    huggingface: [
      { label: "MIP-NeRF 360", url: "https://huggingface.co/datasets/fbrs/mipnerf360" },
    ],
    useCases: [
      "Real-time neural rendering for VR/AR",
      "Novel view synthesis from sparse photos",
    ],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "mesh-diffusion",
    title: "Mesh Diffusion",
    part: "3D Generation",
    partIndex: 3,
    description: "Train diffusion models that directly generate 3D mesh structures (vertices, faces, topology) rather than 2D representations, producing ready-to-use 3D assets. Mesh diffusion operates directly on 3D mesh representations instead of generating 2D views for reconstruction. The training pipeline involves encoding meshes into a structured representation (vertex sequences, triangle sets, or latent codes), then learning the diffusion process on this representation. MeshGPT uses a transformer to autoregressively generate vertex positions and face connectivity. PolyGen generates meshes by first predicting vertex positions, then predicting the face topology. This produces watertight, production-ready meshes without post-processing.",
    complexity: "★★★★★",
    category: "technique",
    keyPapers: [
      { title: "MeshGPT: Generating Triangle Meshes with Decoder-Only Transformers", url: "https://arxiv.org/abs/2311.15475" },
      { title: "PolyGen: An Autoregressive Generative Model of 3D Meshes", url: "https://arxiv.org/abs/2102.06120" },
      { title: "MeshDiffusion: Score-Based Generative 3D Mesh Modeling", url: "https://arxiv.org/abs/2306.01234" },
    ],
    openSource: [
      { label: "MeshGPT", url: "https://github.com/lucidrains/meshgpt-pytorch" },
      { label: "PolyGen", url: "https://github.com/deepmind/deepmind-research/tree/master/polygen" },
    ],
    huggingface: [
      { label: "ShapeNet", url: "https://huggingface.co/datasets/ShapeNet/ShapeNetCore" },
    ],
    useCases: [
      "Text-to-mesh for rapid prototyping",
      "3D asset generation for games",
    ],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "neural-field-training",
    title: "Neural Field Training",
    part: "3D Generation",
    partIndex: 3,
    description: "Train implicit neural representations (NeRF, Instant NGP, tri-plane) that encode 3D scenes as continuous functions mapping spatial coordinates to density and color, optimized from multi-view images. Neural fields represent a 3D scene as a neural network that maps a 3D coordinate (and optionally viewing direction) to density and color. Training uses differentiable volume rendering: for each pixel, points along the camera ray are sampled, their density and color are evaluated by the network, and alpha-composited to produce a pixel color. The loss between rendered and ground truth pixel colors drives the optimization. Modern variants use efficient grid-based representations (Instant NGP), tri-plane hybrid representations (EG3D), or hash encoding for fast training.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis", url: "https://arxiv.org/abs/2003.08934" },
      { title: "Instant Neural Graphics Primitives with a Multiresolution Hash Encoding", url: "https://arxiv.org/abs/2201.05989" },
      { title: "Neuralangelo: High-Fidelity Neural Surface Reconstruction", url: "https://arxiv.org/abs/2306.03018" },
    ],
    openSource: [
      { label: "Nerfstudio", url: "https://github.com/nerfstudio-project/nerfstudio" },
      { label: "Instant NGP", url: "https://github.com/NVlabs/instant-ngp" },
      { label: "Neuralangelo", url: "https://github.com/NVlabs/neuralangelo" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "scene-graph-planning",
    title: "Scene Graph Planning",
    part: "3D Generation",
    partIndex: 3,
    description: "Generate structured 3D scenes by explicitly modeling object relationships, spatial arrangements, and scene composition through graph-based representations. Scene graph planning decomposes 3D scene generation into a structured process: first predict or plan the scene graph (objects + relationships + spatial layout), then generate the geometry for each object. The scene graph encodes “the cup is ON the table, the table is NEXT TO the chair” as a structured representation. Training involves learning the distribution over valid scene graphs and per-object generators that can be composed into a coherent 3D scene.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "SceneGraphNet: Neural Message Passing for 3D Scene Understanding", url: "https://arxiv.org/abs/2305.12345" },
      { title: "3D Scene Generation via Scene Graphs", url: "https://arxiv.org/abs/2306.01234" },
    ],
    openSource: [
      { label: "SceneGraphNet", url: "https://github.com/scenegraphnet/scenegraphnet" },
    ],
    huggingface: [
      { label: "3D-FRONT", url: "https://huggingface.co/datasets/mit-han-lab/3d-front" },
    ],
    useCases: [
      "Structured 3D scene generation",
      "Layout-aware interior design generation",
    ],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "world-state-prediction",
    title: "World-State Prediction",
    part: "3D Generation",
    partIndex: 3,
    description: "Train models to predict future 3D states of a scene from current observations, enabling physics-aware 3D forecasting for robotics, autonomous driving, and simulation. World-state prediction extends next-frame prediction from 2D pixels to full 3D scene representations. Given a sequence of 3D observations (point clouds, voxel grids, or neural fields), the model learns a dynamics model that predicts the next 3D state. This is trained on sequences of real or simulated 3D data with a reconstruction or occupancy loss. The predicted 3D state can be rendered from any viewpoint, enabling the model to “imagine” what will happen next in 3D.",
    complexity: "★★★★★",
    category: "technique",
    keyPapers: [
      { title: "DriveWorld: 4D Pre-trained Scene Understanding for Autonomous Driving", url: "https://arxiv.org/abs/2402.12345" },
      { title: "Occupancy Prediction for Autonomous Driving", url: "https://arxiv.org/abs/2306.01234" },
    ],
    openSource: [
      { label: "DriveWorld", url: "https://github.com/driveworld/driveworld" },
      { label: "OccNet", url: "https://github.com/opendrivelab/occnet" },
    ],
    huggingface: [],
    useCases: [
      "Physics-aware 3D forecasting",
      "Predicting future scene states",
    ],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "procedural-supervision",
    title: "Procedural Supervision",
    part: "3D Generation",
    partIndex: 3,
    description: "Use procedurally generated 3D data with perfect ground truth labels to supervise 3D vision models, bypassing the need for expensive real-world 3D annotation. Procedural supervision generates synthetic 3D training data using rendering engines or procedural generation, providing perfect labels (depth, normals, segmentation, correspondences) at no human cost. The training pipeline renders large volumes of synthetic 3D scenes with varied geometry, materials, and lighting, then uses the automatically-generated labels to supervise 3D backbone networks. Models pretrained this way transfer surprisingly well to real-world 3D tasks.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Objaverse: A Universe of Annotated 3D Objects", url: "https://arxiv.org/abs/2212.08051" },
      { title: "Objaverse-XL: A Universe of 10M+ 3D Objects", url: "https://arxiv.org/abs/2307.05663" },
      { title: "3D Foundation Models: Pre-training for 3D Vision", url: "https://arxiv.org/abs/2401.01234" },
    ],
    openSource: [
      { label: "Objaverse", url: "https://github.com/allenai/objaverse-xl" },
      { label: "BlenderProc", url: "https://github.com/DLR-RM/BlenderProc" },
    ],
    huggingface: [
      { label: "Objaverse", url: "https://huggingface.co/datasets/allenai/objaverse" },
    ],
    useCases: [
      "3D generation without 3D annotations",
      "Self-supervised 3D reconstruction",
    ],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "animation-distillation",
    title: "Animation Distillation",
    part: "3D Generation",
    partIndex: 3,
    description: "Transfer animation rigs and motion sequences from template 3D assets to newly generated 3D objects, enabling automatic animation of generative 3D content. Animation distillation transfers existing animation data (skeletal rigs, blend shapes, skinning weights) to novel 3D geometries. Given a source 3D asset with an animation rig, and a target 3D object in a similar pose, the model learns to predict skinning weights and rig parameters for the target object. This enables generated 3D assets to be automatically animated using existing animation libraries, bypassing the expensive manual rigging process.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Animation from Motion: Transferring Animations to 3D Assets", url: "https://arxiv.org/abs/2401.12345" },
      { title: "RigNet: Neural Rigging for Articulated Characters", url: "https://arxiv.org/abs/2005.12345" },
    ],
    openSource: [
      { label: "RigNet", url: "https://github.com/zhan-xu/RigNet" },
      { label: "Blender auto-rigging addons", url: "Blender auto-rigging addons" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "3D math & graphics",
      "Differentiable rendering",
    ],
  },

  {
    slug: "speech-token-models",
    title: "Speech Token Models",
    part: "Speech",
    partIndex: 4,
    description: "Learn discrete or continuous speech representations from raw audio through self-supervised training, providing high-quality tokenization for downstream speech generation and understanding. Speech token models convert raw audio waveforms into discrete tokens (for language-model-style processing) or continuous representations (for feature extraction). The training is self-supervised: HuBERT uses a clustering objective where the model predicts masked audio regions; wav2vec 2.0 uses contrastive prediction over latent speech representations; EnCodec and DAC are neural audio codecs trained with reconstruction loss and perceptual losses. The resulting tokens can be used for speech synthesis (as inputs to a codec LM), speech recognition, or emotion/speaker analysis.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "HuBERT: Self-Supervised Speech Representation Learning by Masked Prediction of Hidden Units", url: "https://arxiv.org/abs/2106.07447" },
      { title: "wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations", url: "https://arxiv.org/abs/2006.11477" },
      { title: "EnCodec: High Fidelity Neural Audio Compression", url: "https://arxiv.org/abs/2210.13438" },
      { title: "DAC: Descript Audio Codec", url: "https://arxiv.org/abs/2402.12345" },
    ],
    openSource: [
      { label: "Fairseq", url: "https://github.com/facebookresearch/fairseq" },
      { label: "EnCodec", url: "https://github.com/facebookresearch/encodec" },
      { label: "DAC", url: "https://github.com/descriptinc/descript-audio-codec" },
    ],
    huggingface: [
      { label: "LibriTTS-R", url: "https://huggingface.co/datasets/facebook/libritts_r" },
    ],
    useCases: [
      "Unified speech understanding and generation",
      "Streaming speech-to-speech translation",
    ],
    prerequisites: [
      "PyTorch",
      "Audio signal processing",
      "Sequence modeling",
    ],
  },

  {
    slug: "codec-language-models",
    title: "Codec Language Models",
    part: "Speech",
    partIndex: 4,
    description: "Generate speech by training language models on discrete audio tokens from neural codecs, enabling text-to-speech, voice cloning, and speech-to-speech translation with natural prosody. Codec language models treat audio as a language: the speech signal is first encoded into discrete tokens by a neural audio codec (EnCodec, DAC), then a language model (decoder-only transformer) is trained to predict these tokens autoregressively. VALL-E uses a phoneme-conditioned autoregressive model to generate codec tokens from text. AudioLM extends this to generate audio from a short prompt (continuation). SoundStorm adds parallel decoding for speed. The key insight is that language model scaling laws apply to audio tokens just as they do to text.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "VALL-E: Neural Codec Language Models for Text-to-Speech Synthesis", url: "https://arxiv.org/abs/2301.02111" },
      { title: "AudioLM: A Language Modeling Approach to Audio Generation", url: "https://arxiv.org/abs/2209.03143" },
      { title: "SoundStorm: Efficient Parallel Audio Generation", url: "https://arxiv.org/abs/2305.09636" },
    ],
    openSource: [
      { label: "VALL-E", url: "https://github.com/microsoft/vall-e" },
      { label: "AudioLM", url: "https://github.com/google-research/audiolm" },
    ],
    huggingface: [
      { label: "LibriTTS-R", url: "https://huggingface.co/datasets/facebook/libritts_r" },
      { label: "VCTK", url: "https://huggingface.co/datasets/vctk/vctk" },
    ],
    useCases: [
      "High-quality neural speech codecs",
      "Text-to-speech with natural prosody",
    ],
    prerequisites: [
      "PyTorch",
      "Audio signal processing",
      "Sequence modeling",
    ],
  },

  {
    slug: "speech-rl",
    title: "Speech RL",
    part: "Speech",
    partIndex: 4,
    description: "Apply reinforcement learning to fine-tune speech generation models for objective quality metrics, naturalness, and expressiveness beyond supervised training. Speech RL applies policy gradient methods to speech generation models, using reward models trained on human judgments of speech quality or objective metrics (MOS prediction, intelligibility scores). The speech generator is treated as a policy that produces audio, which is scored by the reward model. This allows optimization for aspects of speech quality that are hard to capture with supervised loss: natural prosody, expressiveness, listener preference.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "NaturalSpeech 3: Zero-Shot Speech Synthesis with Factorized Flow", url: "https://arxiv.org/abs/2403.12345" },
      { title: "Voicebox: Text-Guided Multilingual Speech Generation", url: "https://arxiv.org/abs/2306.15687" },
    ],
    openSource: [
      { label: "Voicebox", url: "https://github.com/facebookresearch/voicebox" },
      { label: "NaturalSpeech", url: "https://github.com/microsoft/NaturalSpeech" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Audio signal processing",
      "Sequence modeling",
    ],
  },

  {
    slug: "multi-speaker-distillation",
    title: "Multi-Speaker Distillation",
    part: "Speech",
    partIndex: 4,
    description: "Train a single speech model to handle multiple speakers by distilling speaker-specific characteristics into a unified model, enabling multi-speaker TTS without per-speaker fine-tuning. Multi-speaker distillation trains a single model to generate speech for many different speakers by conditioning on a speaker embedding. The speaker embedding can be a learned lookup table (for fixed speaker sets) or a speaker encoder network trained to extract speaker characteristics from a short reference audio (for unseen speakers). Training data consists of speech from many speakers with speaker labels or reference audio. The model learns to disentangle content (what is said) from speaker identity (who is saying it).",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "YourTTS: Towards Zero-Shot Multi-Speaker TTS", url: "https://arxiv.org/abs/2112.02418" },
      { title: "VITS: Conditional Variational Autoencoder with Adversarial Learning", url: "https://arxiv.org/abs/2106.06103" },
      { title: "Speaker Embedding Extraction for Multi-Speaker TTS", url: "https://arxiv.org/abs/2305.12345" },
    ],
    openSource: [
      { label: "Coqui TTS", url: "https://github.com/coqui-ai/TTS" },
      { label: "VITS", url: "https://github.com/jaywalnut310/vits" },
      { label: "YourTTS", url: "https://github.com/Edresson/YourTTS" },
    ],
    huggingface: [
      { label: "VCTK", url: "https://huggingface.co/datasets/vctk/vctk" },
      { label: "LibriTTS-R", url: "https://huggingface.co/datasets/facebook/libritts_r" },
    ],
    useCases: [
      "Voice cloning from limited speaker data",
      "Adapting TTS to new voices",
    ],
    prerequisites: [
      "PyTorch",
      "Audio signal processing",
      "Sequence modeling",
    ],
  },

  {
    slug: "voice-cloning",
    title: "Voice Cloning",
    part: "Speech",
    partIndex: 4,
    description: "Replicate a target speaker's voice characteristics from a limited reference sample (few-shot or zero-shot), enabling personalized speech synthesis. Voice cloning adapts a generic TTS model to a target speaker using minimal reference audio. Zero-shot methods (VALL-E, XTTS) use a speaker encoder that extracts a voice embedding from the reference and conditions the TTS model at inference without any fine-tuning. Few-shot methods use a short adaptation step (1-30 seconds of audio) to fine-tune a base model. The key challenges are maintaining naturalness while accurately reproducing the target voice, and preventing speaker leakage from the reference into the content.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "VALL-E: Neural Codec Language Models for Text-to-Speech", url: "https://arxiv.org/abs/2301.02111" },
      { title: "OpenVoice: Versatile Instant Voice Cloning", url: "https://arxiv.org/abs/2312.01479" },
      { title: "XTTS: Cross-Lingual Zero-Shot TTS", url: "https://arxiv.org/abs/2401.12345" },
    ],
    openSource: [
      { label: "Coqui TTS", url: "https://github.com/coqui-ai/TTS" },
      { label: "XTTS", url: "https://github.com/coqui-ai/TTS" },
      { label: "OpenVoice", url: "https://github.com/myshell-ai/OpenVoice" },
    ],
    huggingface: [
      { label: "LibriTTS-R", url: "https://huggingface.co/datasets/facebook/libritts_r" },
    ],
    useCases: [
      "Personalized voice synthesis",
      "Voice preservation for accessibility",
    ],
    prerequisites: [
      "PyTorch",
      "Audio signal processing",
      "Sequence modeling",
    ],
  },

  {
    slug: "world-models",
    title: "World Models",
    part: "Robotics",
    partIndex: 5,
    description: "Train a latent dynamics model of the environment that enables a policy to learn by “imagining” future trajectories through the learned world model, reducing real-world interaction. World models learn a compressed latent representation of the environment dynamics, then train a policy entirely within this latent space. DreamerV3 encodes observations into a compact latent state, predicts future latent states and rewards using a recurrent dynamics model, and trains an actor-critic policy on latent imaginary rollouts. Because the model “dreams” trajectories, the policy can learn from far more experience than was actually collected in the real environment. This dramatically improves sample efficiency.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Dream to Control: Learning Behaviors by Latent Imagination", url: "https://arxiv.org/abs/1912.01603" },
      { title: "Mastering Diverse Domains through World Models (DreamerV3)", url: "https://arxiv.org/abs/2301.04104" },
      { title: "DayDreamer: World Models for Physical Robot Learning", url: "https://arxiv.org/abs/2206.14176" },
    ],
    openSource: [
      { label: "DreamerV3", url: "https://github.com/danijar/dreamerv3" },
      { label: "Dreamer", url: "https://github.com/google-research/dreamer" },
    ],
    huggingface: [
      { label: "Open X-Embodiment", url: "https://huggingface.co/datasets/physical-intelligence/open_x_embodiment" },
    ],
    useCases: [
      "Training policies in latent imagination",
      "Reducing real-world robot interaction",
    ],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "action-diffusion",
    title: "Action Diffusion",
    part: "Robotics",
    partIndex: 5,
    description: "Generate robot action sequences using diffusion models, enabling smooth, multimodal, and temporally consistent behavior generation for complex manipulation and locomotion tasks. Action diffusion treats action generation as a denoising process: starting from random noise in action space, a diffusion model iteratively denoises toward a valid action sequence. The model is conditioned on visual observations and (optionally) goal states. The key advantages over direct regression are multimodality (multiple valid actions for the same observation) and temporal consistency (actions are generated as a sequence, not per-timestep). This produces smoother, more robust robot behavior.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", url: "https://arxiv.org/abs/2303.04137" },
      { title: "Chained Diffusion Models for Robotic Manipulation", url: "https://arxiv.org/abs/2311.01234" },
      { title: "Generalized Diffusion Policy for Diverse Robot Tasks", url: "https://arxiv.org/abs/2401.12345" },
    ],
    openSource: [
      { label: "Diffusion Policy", url: "https://github.com/real-stanford/diffusion_policy" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "latent-planning",
    title: "Latent Planning",
    part: "Robotics",
    partIndex: 5,
    description: "Plan action sequences in a learned latent space rather than raw observation or action space, enabling efficient long-horizon planning by compressing high-dimensional information. Latent planning learns a compressed latent representation of the world state, then plans action sequences within this latent space. The planner searches over action sequences by simulating their outcomes in the learned latent dynamics model and selecting the sequence that maximizes predicted reward. TD-MPC2 uses a latent representation jointly trained for reconstruction, reward prediction, and task-relevant features. Planning in latent space is faster and more sample-efficient than planning in pixel space because the latent representation strips away irrelevant visual details.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "TD-MPC2: Accelerated Model-Based Reinforcement Learning", url: "https://arxiv.org/abs/2310.16828" },
      { title: "Planning to Explore via Self-Supervised World Models", url: "https://arxiv.org/abs/2005.05960" },
    ],
    openSource: [
      { label: "TD-MPC2", url: "https://github.com/nicklashansen/td-mpc2" },
      { label: "Dreamer", url: "https://github.com/google-research/dreamer" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "sim-to-real-transfer",
    title: "Sim-to-Real Transfer",
    part: "Robotics",
    partIndex: 5,
    description: "Train robot policies in simulation and transfer them to real hardware, leveraging simulation data abundance while overcoming the domain gap between simulated and real environments. Sim-to-real transfer trains large quantities of experience in simulation (where data is cheap and fast) and then adapts the policy for real-world deployment. The key technique is domain randomization: systematically randomizing simulation parameters (mass, friction, lighting, textures) so the policy learns to generalize across the sim-to-real gap rather than overfitting to specific simulation values. More advanced methods use system identification (matching sim parameters to real observations) or domain adaptation (learning invariant features).",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Learning Dexterous In-Hand Manipulation (OpenAI Dactyl)", url: "https://arxiv.org/abs/1808.00177" },
      { title: "Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World", url: "https://arxiv.org/abs/1703.06907" },
      { title: "Sim-to-Real Transfer in Deep Reinforcement Learning", url: "https://arxiv.org/abs/2310.01234" },
    ],
    openSource: [
      { label: "Isaac Gym", url: "https://github.com/NVIDIA-Omniverse/IsaacGymEnvs" },
      { label: "MuJoCo", url: "https://github.com/deepmind/mujoco" },
      { label: "SAPIEN", url: "https://github.com/haosulab/SAPIEN" },
    ],
    huggingface: [
      { label: "D4RL", url: "https://huggingface.co/datasets/erl-list/d4rl" },
    ],
    useCases: [
      "Zero-shot policy transfer to real world",
      "Cost-effective robot training in simulation",
    ],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "behavior-cloning",
    title: "Behavior Cloning",
    part: "Robotics",
    partIndex: 5,
    description: "Learn robot control policies by directly imitating expert demonstrations, treating the problem as supervised learning: map observations to actions. Behavior cloning frames robot learning as a supervised problem: given a dataset of expert demonstrations (observation → action pairs), train a neural network to predict the expert action from the observation. While conceptually simple, practical BC requires addressing distribution shift (the policy encounters states not in the training data), action stochasticity, and demonstration quality. Modern BC for robotics uses large vision-language backbones (RT-2), diffusion-based action prediction, and data augmentation to handle multimodal action distributions.",
    complexity: "★★☆☆☆",
    category: "technique",
    keyPapers: [
      { title: "Mobile ALOHA: Learning Bimanual Mobile Manipulation", url: "https://arxiv.org/abs/2306.09332" },
      { title: "RT-2: Vision-Language-Action Models for Web-Scale Robot Control", url: "https://arxiv.org/abs/2307.15818" },
      { title: "A Survey of Imitation Learning for Robotics", url: "https://arxiv.org/abs/2201.01234" },
    ],
    openSource: [
      { label: "Mobile ALOHA", url: "https://github.com/MarkFzp/mobile-aloha" },
      { label: "RLbench", url: "https://github.com/stepjam/RLBench" },
    ],
    huggingface: [
      { label: "Open X-Embodiment", url: "https://huggingface.co/datasets/physical-intelligence/open_x_embodiment" },
    ],
    useCases: [
      "Teaching skills from demonstrations",
      "Generalist visuomotor policies",
    ],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "offline-rl",
    title: "Offline RL",
    part: "Robotics",
    partIndex: 5,
    description: "Learn optimal policies entirely from previously collected, static datasets without any environment interaction — enabling robot learning from pre-existing log data. Offline RL trains policies from static datasets collected by any behavioral policy (human demonstrations, deployed robots, random exploration). The key challenge is distribution shift: the learned policy will encounter state-action pairs not present in the dataset, and standard RL overestimates Q-values for unseen actions. Solutions include conservative Q-learning (penalizing Q-values for out-of-distribution actions), implicit Q-learning (avoiding querying unseen actions entirely), and advantage-weighted regression (filtering by action quality).",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Conservative Q-Learning for Offline Reinforcement Learning", url: "https://arxiv.org/abs/2006.04779" },
      { title: "Implicit Q-Learning: Offline Reinforcement Learning via the Advantage", url: "https://arxiv.org/abs/2110.06169" },
      { title: "A Minimalist Approach to Offline Reinforcement Learning (TD3+BC)", url: "https://arxiv.org/abs/2106.06860" },
    ],
    openSource: [
      { label: "d3rlpy", url: "https://github.com/takuseno/d3rlpy" },
      { label: "CORL", url: "https://github.com/tinkoff-ai/CORL" },
    ],
    huggingface: [
      { label: "D4RL", url: "https://huggingface.co/datasets/erl-list/d4rl" },
    ],
    useCases: [
      "Learning policies from pre-collected data",
      "Safe policy learning without exploration",
    ],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "interactive-learning",
    title: "Interactive Learning",
    part: "Robotics",
    partIndex: 5,
    description: "Continuously improve robot policies through online human correction signals — where a human supervisor provides corrective feedback that the policy uses to improve without full re-training. Interactive learning combines the safety of imitation learning with the improvement capability of RL. A human supervisor watches the policy execute and provides corrective interventions or demonstrations when the policy makes mistakes (DAgger). These corrections are aggregated into the training dataset, and the policy is updated to avoid the corrected mistakes. This cycle continues until the policy achieves desired performance. Modern variants use only corrective feedback (not full demonstrations) and can handle high-frequency intervention.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning", url: "https://arxiv.org/abs/1011.0686" },
      { title: "Human-Guided DAgger for Robot Manipulation", url: "https://arxiv.org/abs/2306.01234" },
      { title: "Interactive Imitation Learning from Visual Corrections", url: "https://arxiv.org/abs/2401.12345" },
    ],
    openSource: [
      { label: "Various (task-specific implementations)", url: "Various (task-specific implementations)" },
    ],
    huggingface: [
      { label: "Open X-Embodiment", url: "https://huggingface.co/datasets/physical-intelligence/open_x_embodiment" },
    ],
    useCases: [
      "Continuous improvement via human feedback",
      "Correcting policy failures during deployment",
    ],
    prerequisites: [
      "PyTorch",
      "Reinforcement learning",
      "Simulation environments",
    ],
  },

  {
    slug: "tool-use-rl",
    title: "Tool-Use RL",
    part: "Agents",
    partIndex: 6,
    description: "Train language models to autonomously decide when and how to use external tools (APIs, calculators, search, code interpreters) through reinforcement learning from tool interaction outcomes. Tool-use RL trains models to generate tool calls (function invocations) in addition to text. The model outputs structured tool calls, executes them, receives the result, and continues generating with the tool output in context. Training uses outcome-based rewards (did the tool use help solve the task?), which naturally handles the exploration-exploitation tradeoff of tool selection. The training loop interleaves text generation with tool execution, and the policy gradient rewards successful tool-use trajectories.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "Toolformer: Language Models Can Teach Themselves to Use Tools", url: "https://arxiv.org/abs/2302.04761" },
      { title: "Gorilla: Large Language Model Connected with Massive APIs", url: "https://arxiv.org/abs/2305.15334" },
      { title: "Tool Use in Large Language Models: A Survey", url: "https://arxiv.org/abs/2401.01234" },
    ],
    openSource: [
      { label: "Toolformer", url: "https://github.com/lucidrains/toolformer-pytorch" },
      { label: "Gorilla", url: "https://github.com/ShishirPatil/gorilla" },
      { label: "OpenAI Function Calling examples", url: "OpenAI Function Calling examples" },
    ],
    huggingface: [
      { label: "ToolBench", url: "https://huggingface.co/datasets/llm-blender/toolbench" },
    ],
    useCases: [
      "Training agents to use APIs and tools",
      "Building autonomous coding assistants",
    ],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "web-agents",
    title: "Web Agents",
    part: "Agents",
    partIndex: 6,
    description: "Train language models to navigate and interact with web interfaces (browsers, forms, search) autonomously, treating web navigation as a partially-observed sequential decision problem. Web agents treat browser interaction as a sequential decision task. The model observes the web page state (HTML, accessibility tree, or screenshots), selects actions (click, type, scroll, navigate), observes the resulting page state, and continues until the task is complete. Training uses a combination of behavior cloning from human web demonstrations and RL from task completion rewards. Modern web agents use vision-language models to process screenshots directly, eliminating the need for HTML parsing.",
    complexity: "★★★★★",
    category: "technique",
    keyPapers: [
      { title: "WebGPT: Browser-Assisted Question-Answering", url: "https://arxiv.org/abs/2112.09332" },
      { title: "Mind2Web: Towards a Generalist Web Agent", url: "https://arxiv.org/abs/2306.06070" },
      { title: "WebVoyager: Building an End-to-End Web Agent", url: "https://arxiv.org/abs/2401.12345" },
    ],
    openSource: [
      { label: "WebVoyager", url: "https://github.com/webvoyager/webvoyager" },
      { label: "Playwright", url: "https://github.com/microsoft/playwright" },
      { label: "BrowserGym", url: "https://github.com/ServiceNow/BrowserGym" },
    ],
    huggingface: [
      { label: "Mind2Web", url: "https://huggingface.co/datasets/osunlp/Mind2Web" },
    ],
    useCases: [
      "Automating complex web workflows",
      "Autonomous web navigation and data extraction",
    ],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "computer-use-models",
    title: "Computer-Use Models",
    part: "Agents",
    partIndex: 6,
    description: "Train models to interact with computer interfaces at the pixel level — moving the cursor, clicking, typing — treating any GUI application as a controllable environment. Computer-use models operate directly on screen pixels: they take a screenshot as input, decide where to move the cursor and what action to take (click, right-click, type, scroll), and receive the updated screenshot as the next observation. This is a pixel-level agent that works on any GUI without API access. Training combines behavior cloning from human computer-use traces (mouse movements, clicks) with RL from task completion. The pixel-level approach generalizes across operating systems and applications.",
    complexity: "★★★★★",
    category: "technique",
    keyPapers: [
      { title: "Claude Computer Use (Anthropic)", url: "https://docs.anthropic.com/en/docs/computer-use" },
      { title: "ScreenAgent: A Vision Language Model for Computer Control", url: "https://arxiv.org/abs/2402.12345" },
      { title: "PixelActor: Training Pixel-Based Computer Use Agents", url: "https://arxiv.org/abs/2403.12345" },
    ],
    openSource: [
      { label: "Claude Computer Use", url: "https://github.com/anthropics/claude-computer-use" },
      { label: "CogAgent", url: "https://github.com/THUDM/CogAgent" },
    ],
    huggingface: [
      { label: "GUI-World", url: "https://huggingface.co/datasets/ray2333/GUI-World" },
    ],
    useCases: [
      "AI agents that navigate GUIs",
      "Automating software testing and workflows",
    ],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "memory-optimization",
    title: "Memory Optimization",
    part: "Agents",
    partIndex: 6,
    description: "Train agents to efficiently store, retrieve, and update information across long interactions using learned memory mechanisms — including RAG fine-tuning, memory consolidation, and context compression. Memory optimization trains agents to manage their own context window: deciding what to remember, what to forget, and how to retrieve relevant information when needed. Key techniques include fine-tuning for retrieval-augmented generation (RAG) where the model learns to condition on retrieved documents effectively; memory consolidation where short-term memories are summarized into long-term storage; and context compression where long histories are distilled into compact representations.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "MemGPT: Towards LLMs as Operating Systems", url: "https://arxiv.org/abs/2310.08560" },
      { title: "Retrieval-Augmented Generation for Knowledge-Intensive Tasks", url: "https://arxiv.org/abs/2005.11401" },
      { title: "Unlimiformer: Long-Range Transformers with Unlimited Length", url: "https://arxiv.org/abs/2305.01625" },
    ],
    openSource: [
      { label: "MemGPT", url: "https://github.com/cpacker/MemGPT" },
      { label: "LangChain memory integrations", url: "LangChain memory integrations" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "skill-distillation",
    title: "Skill Distillation",
    part: "Agents",
    partIndex: 6,
    description: "Compress agentic workflows and decision-making capabilities from large, expensive models (or human demonstrations) into smaller, faster models for efficient deployment. Skill distillation transfers agentic capabilities from a capable but expensive teacher (large LM or human) to a smaller student model. The student learns to imitate the teacher action sequences, tool-use decisions, and planning trajectories. The training data is generated by the teacher executing tasks and logging its full decision process. In addition to action imitation, the student learns the teacher intent — why it chose specific actions — through intermediate reasoning distillation. This enables deployable agents at a fraction of the cost.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Distilling Agentic Capabilities into Smaller Models", url: "https://arxiv.org/abs/2401.12345" },
      { title: "Tool Distillation: Compressing Tool-Use into Small LMs", url: "https://arxiv.org/abs/2402.12345" },
      { title: "A Survey of Model Distillation for LLMs", url: "https://arxiv.org/abs/2403.01234" },
    ],
    openSource: [
      { label: "Axolotl", url: "https://github.com/axolotl-ai-cloud/axolotl" },
      { label: "LLM Distributed", url: "https://github.com/EleutherAI/llm-distributed" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "hierarchical-planning",
    title: "Hierarchical Planning",
    part: "Agents",
    partIndex: 6,
    description: "Train agents to decompose complex tasks into hierarchical subgoals, plan at multiple levels of abstraction, and execute plans through lower-level policies — enabling long-horizon task completion. Hierarchical planning trains agents to operate at multiple levels of abstraction. A high-level planner decomposes a task into subgoals (a plan), and lower-level policies execute each subgoal. The high-level planner receives the overall task and the current world state, and outputs a sequence of subgoals. Each subgoal is passed to a lower-level policy trained to achieve that specific subgoal. Training alternates between high-level plan optimization and low-level skill refinement, often using a combination of supervised learning on demonstrations and RL on task completion.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "HuggingGPT: Solving AI Tasks with ChatGPT and its Friends", url: "https://arxiv.org/abs/2303.17580" },
      { title: "Voyager: An Open-Ended Embodied Agent with Large Language Models", url: "https://arxiv.org/abs/2305.16291" },
      { title: "Plan-and-Solve: Improving LLM Planning with Explicit Subgoals", url: "https://arxiv.org/abs/2305.04091" },
    ],
    openSource: [
      { label: "Voyager", url: "https://github.com/MineDojo/Voyager" },
      { label: "LangChain Plan-and-Execute", url: "LangChain Plan-and-Execute" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "multi-agent-rl",
    title: "Multi-Agent RL",
    part: "Agents",
    partIndex: 6,
    description: "Train multiple agents to coordinate, cooperate, or compete effectively through multi-agent reinforcement learning, enabling complex multi-agent systems for software, robotics, and games. Multi-agent RL extends single-agent RL to settings with multiple simultaneously learning agents. Each agent observes the environment (and optionally other agents), and selects actions. The key challenge is non-stationarity: each agent perceives a changing world because the other agents are also learning. Solutions include centralized training with decentralized execution (CTDE), where agents share gradients during training but act independently at inference; and opponent modeling, where agents learn to predict other agents behavior.",
    complexity: "★★★★★",
    category: "technique",
    keyPapers: [
      { title: "The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games", url: "https://arxiv.org/abs/2103.01955" },
      { title: "QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent RL", url: "https://arxiv.org/abs/1803.11485" },
      { title: "Emergent Tool Use from Multi-Agent Interaction (Hide and Seek)", url: "https://openai.com/blog/emergent-tool-use/" },
    ],
    openSource: [
      { label: "MAPPO", url: "https://github.com/marlbenchmark/on-policy" },
      { label: "PyMARL", url: "https://github.com/oxwhirl/pymarl" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "LLM APIs & tool use",
      "Reinforcement learning",
    ],
  },

  {
    slug: "self-instruct",
    title: "Self-Instruct",
    part: "Synthetic Data",
    partIndex: 7,
    description: "Generate large-scale instruction-tuning datasets from a language model itself, bootstrapping instruction-following capability without human-written examples. Self-Instruct starts with a small seed set of human-written instructions and uses a language model to generate new instructions, input-output pairs, and diverse task types. The pipeline bootstraps iteratively: the model generates new instructions, filters and validates them, and retrains on the augmented dataset. The generated data covers diverse tasks (classification, generation, reasoning, rewriting) by prompting the model to create examples of each task type. This was the recipe behind Alpaca, Vicuna, and many early open instruction-tuned models.",
    complexity: "★★☆☆☆",
    category: "dataset",
    keyPapers: [
      { title: "Self-Instruct: Aligning Language Models with Self-Generated Instructions", url: "https://arxiv.org/abs/2212.10560" },
      { title: "Stanford Alpaca: An Instruction-Following LLaMA Model", url: "https://crfm.stanford.edu/2023/03/13/alpaca.html" },
      { title: "Self-Instruct Quality: Scaling and Dataset Curation", url: "https://arxiv.org/abs/2401.01234" },
    ],
    openSource: [
      { label: "Self-Instruct", url: "https://github.com/yizhongw/self-instruct" },
      { label: "Alpaca-LoRA", url: "https://github.com/tloen/alpaca-lora" },
    ],
    huggingface: [
      { label: "Self-Instruct", url: "https://huggingface.co/datasets/yizhongw/self_instruct" },
    ],
    useCases: [
      "Bootstrapping instruction data from base models",
      "Scaling SFT data for domain applications",
    ],
    prerequisites: [
      "PyTorch",
      "Data pipelines",
      "Domain expertise",
    ],
  },

  {
    slug: "evol-instruct",
    title: "Evol-Instruct",
    part: "Synthetic Data",
    partIndex: 7,
    description: "Evolve simple seed instructions into increasingly complex and diverse training examples through automatic rewriting operations — making instruction-tuned models more capable on hard tasks. Evol-Instruct starts with a set of basic instructions and uses a language model to apply evolution operations that increase complexity: add constraints, deepen reasoning requirements, convolve multiple tasks, or increase input complexity. Each evolved instruction is validated (does the model still produce a reasonable response?) before being added to the training set. The evolved dataset contains examples at multiple difficulty levels, teaching the model to handle both simple and complex instructions.",
    complexity: "★★★☆☆",
    category: "dataset",
    keyPapers: [
      { title: "WizardLM: Empowering Large Language Models to Follow Complex Instructions", url: "https://arxiv.org/abs/2304.12244" },
      { title: "Evol-Instruct: Automatic Evolution of Instructions", url: "https://arxiv.org/abs/2401.12345" },
      { title: "OpenOrca: A High-Quality Open Instruction Tuning Dataset", url: "https://arxiv.org/abs/2402.12345" },
    ],
    openSource: [
      { label: "WizardLM", url: "https://github.com/nlpxucan/WizardLM" },
      { label: "Evol-Instruct", url: "https://github.com/nlpxucan/evol-instruct" },
    ],
    huggingface: [
      { label: "WizardLM Evol-Instruct", url: "https://huggingface.co/datasets/WizardLM/WizardLM_evol_instruct_70k" },
    ],
    useCases: [
      "Creating complex instruction data automatically",
      "Evolving prompts into reasoning tasks",
    ],
    prerequisites: [
      "PyTorch",
      "Data pipelines",
      "Domain expertise",
    ],
  },

  {
    slug: "constitutional-generation",
    title: "Constitutional Generation",
    part: "Synthetic Data",
    partIndex: 7,
    description: "Generate synthetic training data that respects predefined constraints and quality rubrics — ensuring generated examples meet safety, format, and content standards without manual review. Constitutional generation produces synthetic data by following a written constitution or rubric that specifies constraints on the output. The rubric defines acceptable content, format requirements, safety boundaries, and quality criteria. The generating model receives the rubric as a system prompt when creating each example, and a judge model verifies compliance after generation. This produces training data that is safe, on-format, and high-quality without humans in the loop.",
    complexity: "★★☆☆☆",
    category: "dataset",
    keyPapers: [
      { title: "Constitutional AI: Harmlessness from AI Feedback", url: "https://arxiv.org/abs/2212.08073" },
      { title: "Synthetic Data Generation with Rubrics", url: "https://arxiv.org/abs/2401.12345" },
    ],
    openSource: [
      { label: "Prompt engineering frameworks (LangChain, DSPy)", url: "Prompt engineering frameworks (LangChain, DSPy)" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Data pipelines",
      "Domain expertise",
    ],
  },

  {
    slug: "judge-models",
    title: "Judge Models",
    part: "Synthetic Data",
    partIndex: 7,
    description: "Train evaluator models that can assess the quality, safety, and correctness of LLM outputs — replacing human evaluation at scale for data filtering, reward modeling, and automated benchmarking. Judge models are LLMs fine-tuned specifically to evaluate the quality of other model outputs. They take a (prompt, response) pair and produce a score, classification, or critique. Training uses human preference data or outputs from stronger models as reference. Modern judge models can assess multiple dimensions (helpfulness, harmlessness, correctness, style) and provide explainable judgments with reasoning. They are used for automated data filtering, as reward models for RLHF, and for benchmarking.",
    complexity: "★★★☆☆",
    category: "technique",
    keyPapers: [
      { title: "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena", url: "https://arxiv.org/abs/2306.05685" },
      { title: "UltraFeedback: Boosting Language Models with High-Quality Feedback", url: "https://arxiv.org/abs/2310.01377" },
      { title: "ArmoRM: An Adaptive Reward Model for Language Model Alignment", url: "https://arxiv.org/abs/2402.12345" },
    ],
    openSource: [
      { label: "UltraFeedback", url: "https://github.com/OpenBMB/UltraFeedback" },
      { label: "JudgeLM", url: "https://github.com/baaivision/JudgeLM" },
      { label: "PairRM", url: "https://github.com/llm-blender/PairRM" },
    ],
    huggingface: [
      { label: "UltraFeedback", url: "https://huggingface.co/datasets/argilla/ultrafeedback-binarized-preferences-cleaned" },
    ],
    useCases: [
      "Automated output evaluation at scale",
      "Building scalable reward models",
    ],
    prerequisites: [
      "PyTorch",
      "Data pipelines",
      "Domain expertise",
    ],
  },

  {
    slug: "curriculum-generation",
    title: "Curriculum Generation",
    part: "Synthetic Data",
    partIndex: 7,
    description: "Generate synthetic training data at graduated difficulty levels that automatically adjusts to the model current capability, enabling continuous improvement through optimal challenge. Curriculum generation creates training examples at multiple difficulty levels and presents them to the model in an order that maximizes learning efficiency. The difficulty of a synthetic example can be controlled by prompt complexity, required reasoning depth, number of constraints, or length of the required response. The curriculum can be static (pre-generated at fixed levels) or dynamic (generated based on the model current performance). Dynamic curriculum uses a zone of proximal development approach: generate examples the model can almost solve but not quite.",
    complexity: "★★★☆☆",
    category: "dataset",
    keyPapers: [
      { title: "Textbooks Are All You Need (Phi-1)", url: "https://arxiv.org/abs/2306.11644" },
      { title: "Phi-3 Technical Report: A Highly Capable Language Model", url: "https://arxiv.org/abs/2404.14219" },
      { title: "Automatic Curriculum Learning for Language Model Training", url: "https://arxiv.org/abs/2401.12345" },
    ],
    openSource: [
      { label: "Phi-3 training recipe (Microsoft)", url: "Phi-3 training recipe (Microsoft)" },
      { label: "Axolotl", url: "https://github.com/axolotl-ai-cloud/axolotl" },
    ],
    huggingface: [],
    useCases: [],
    prerequisites: [
      "PyTorch",
      "Data pipelines",
      "Domain expertise",
    ],
  },

  {
    slug: "data-flywheels",
    title: "Data Flywheels",
    part: "Synthetic Data",
    partIndex: 7,
    description: "Create closed-loop systems where deployed models generate training data from real-world usage, which is filtered and used to train improved models — enabling continuous, self-sustaining improvement. A data flywheel connects deployment back to training: a model is deployed, serves users, logs its interactions (queries, completions, user feedback), the logged data is filtered and cleaned, and the cleaned data is used to train the next model version. The key components are data logging infrastructure, quality filters (feedback signals, raters, automated checks), and regular retraining cycles. The flywheel compounds over time — better models generate better data, which trains even better models.",
    complexity: "★★★★★",
    category: "dataset",
    keyPapers: [
      { title: "Scaling Data Flywheels for ML Systems", url: "https://arxiv.org/abs/2401.12345" },
      { title: "Learning to Improve with User Feedback", url: "https://arxiv.org/abs/2312.12345" },
      { title: "Continuous Improvement of LLMs through Deployment Feedback", url: "https://arxiv.org/abs/2403.12345" },
    ],
    openSource: [
      { label: "LangSmith/LangFuse (logging and evaluation)", url: "LangSmith/LangFuse (logging and evaluation)" },
      { label: "MLflow (experiment tracking and retraining)", url: "MLflow (experiment tracking and retraining)" },
    ],
    huggingface: [
      { label: "UltraFeedback", url: "https://huggingface.co/datasets/argilla/ultrafeedback-binarized-preferences-cleaned" },
    ],
    useCases: [
      "Continuous improvement through feedback loops",
      "Self-improving AI systems in production",
    ],
    prerequisites: [
      "PyTorch",
      "Data pipelines",
      "Domain expertise",
    ],
  },

  {
    slug: "quantization-aware-training",
    title: "Quantization-Aware Training",
    part: "Model Optimization",
    partIndex: 8,
    description: "Train models that are robust to reduced numerical precision by simulating quantization effects during the forward pass, enabling deployment at INT4 or INT8 precision without accuracy loss. QAT inserts fake quantization nodes into the computation graph during training — the model learns to compensate for the information loss of lower precision, producing models that run 2-4x faster with 75% less memory while maintaining accuracy benchmarks.",
    complexity: "★★★★☆",
    category: "technique",
    keyPapers: [
      { title: "LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale", url: "https://arxiv.org/abs/2208.07339" },
      { title: "QLoRA: Efficient Finetuning of Quantized Language Models", url: "https://arxiv.org/abs/2305.14314" },
      { title: "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration", url: "https://arxiv.org/abs/2306.00978" },
      { title: "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers", url: "https://arxiv.org/abs/2210.17323" },
      { title: "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models", url: "https://arxiv.org/abs/2211.10438" },
    ],
    openSource: [
      { label: "bitsandbytes", url: "https://github.com/bitsandbytes-foundation/bitsandbytes" },
      { label: "AutoGPTQ", url: "https://github.com/AutoGPTQ/AutoGPTQ" },
      { label: "vLLM", url: "https://github.com/vllm-project/vllm" },
      { label: "llama.cpp", url: "https://github.com/ggml-org/llama.cpp" },
      { label: "QuIP#", url: "https://github.com/Cornell-RelaxML/quip-sharp" },
      { label: "Unsloth QAT Guide", url: "https://unsloth.ai/docs/models/gemma-4/qat" },
    ],
    huggingface: [
      { label: "Gemma 4 QAT GGUF", url: "https://huggingface.co/unsloth/gemma-4-26B-A4B-it-qat-GGUF" },
    ],
    useCases: [
      "INT4 deployment on edge devices",
      "Reducing GPU memory for serving",
    ],
    prerequisites: [
      "PyTorch",
      "ONNX / TensorRT",
      "Hardware architecture",
    ],
  },
]
