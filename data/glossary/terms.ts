export interface GlossaryTerm {
  slug: string
  term: string
  category: 'Training' | 'Architecture' | 'Optimization' | 'Deployment' | 'Inference' | 'Evaluation'
  shortDefinition: string
  definition: string[]
  keyPoints: string[]
  relatedTerms: string[]
  exampleUseCase?: string
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'on-policy-distillation',
    term: 'On-Policy Distillation',
    category: 'Training',
    shortDefinition:
      'A knowledge distillation technique where the student model generates its own predictions and the teacher provides corrections on those predictions, reducing train-serve distribution mismatch.',
    definition: [
      'On-policy distillation is a knowledge distillation technique where the student model generates its own predictions and the teacher provides corrections on those predictions, as opposed to traditional off-policy distillation where the student learns from the teacher\'s fixed outputs. In standard (off-policy) distillation, the teacher produces a set of soft labels on the training data, and the student is trained to match those labels. The student never sees its own outputs during training, which means it may encounter a different distribution of inputs at inference time than it was trained on — a phenomenon known as train-serve distribution mismatch.',
      'On-policy distillation addresses this by having the student generate its own forward passes during training. The teacher then evaluates the student\'s outputs and provides soft-label corrections (typically using temperature scaling) on the student\'s own predictions. Because the student is trained on the distribution it actually produces, the resulting model is better aligned with its deployment behavior, leading to more robust and consistent performance.',
      'This approach is particularly valuable in sequence generation tasks such as machine translation, summarization, and speech recognition, where autoregressive decoding means the student\'s input distribution at inference depends on its own prior outputs. By training on-policy, the student learns to recover from its own mistakes rather than merely imitating the teacher\'s behavior on gold-standard inputs.',
    ],
    keyPoints: [
      'Student generates its own predictions; teacher provides corrections on those predictions',
      'Reduces train-serve distribution mismatch compared to off-policy distillation',
      'Teacher uses temperature scaling to produce soft labels on student forward passes',
      'Particularly effective for autoregressive sequence generation tasks',
      'Higher compute cost than off-policy distillation due to student inference during training',
    ],
    relatedTerms: ['knowledge-distillation', 'fine-tuning', 'peft', 'temperature-scaling'],
    exampleUseCase:
      'Distilling a large speech recognition teacher into a compact student model that will run on-device, where the student\'s own decoding errors during training teach it to self-correct.',
  },
  {
    slug: 'group-relative-policy-optimization',
    term: 'Group Relative Policy Optimization (GRPO)',
    category: 'Training',
    shortDefinition:
      'A reinforcement learning algorithm that simplifies PPO by eliminating the critic network, computing advantages relative to a group of sampled outputs per prompt.',
    definition: [
      'Group Relative Policy Optimization (GRPO) is a reinforcement learning algorithm introduced by DeepSeek that simplifies Proximal Policy Optimization (PPO) by eliminating the value (critic) network entirely. In standard PPO, a separate critic model estimates the value of each state to compute advantages, which requires maintaining and training an additional neural network alongside the policy. GRPO removes this requirement by using group statistics instead.',
      'For each prompt, GRPO samples a group of G outputs from the current policy. A reward model (or verifier) scores each output. The algorithm then normalizes the rewards using group statistics: the advantage for each output is computed as (reward − group_mean) / group_std. This group-relative baseline replaces the learned value function. The policy is then updated via a clipped policy gradient objective, with a KL divergence penalty keeping the policy close to a reference model.',
      'By removing the critic, GRPO reduces memory and compute by approximately 50% compared to PPO, since only one model (the policy) needs to be trained and stored in memory rather than two. GRPO has been used to train models such as DeepSeek-Math and DeepSeek-R1, demonstrating strong reasoning capabilities. The trade-off is that GRPO requires larger per-prompt batch sizes (typically G = 8–64 samples) to obtain stable group statistics.',
    ],
    keyPoints: [
      'Eliminates the critic/value network used in PPO, reducing memory and compute by ~50%',
      'Advantage = (reward − group_mean) / group_std, computed over G sampled outputs per prompt',
      'Uses a KL divergence penalty to keep the policy near the reference model',
      'Requires large per-prompt group sizes (8–64) for stable advantage estimates',
      'Used to train DeepSeek-Math and DeepSeek-R1',
    ],
    relatedTerms: ['ppo', 'rlhf', 'dpo'],
    exampleUseCase:
      'Training a reasoning model to solve math problems, where each correct answer receives a positive reward and GRPO identifies which of the sampled solutions outperform the group average.',
  },
  {
    slug: 'flow-matching',
    term: 'Flow Matching',
    category: 'Architecture',
    shortDefinition:
      'A generative modeling framework that learns a vector field transporting a simple prior to the target data distribution, offering more flexibility and faster sampling than diffusion.',
    definition: [
      'Flow Matching is a generative modeling framework that learns a time-dependent vector field capable of transporting a simple prior distribution (such as a standard Gaussian) to the target data distribution. The core idea is to define a continuous-time probability flow — a deterministic ordinary differential equation (ODE) — whose trajectories map samples from the prior to samples from the data distribution. Training involves regressing a neural network against the target vector field that defines this transport.',
      'Unlike diffusion models, which are restricted to noise-adding forward processes (and correspondingly noise-removing reverse processes), flow matching allows arbitrary transport paths between the prior and data distributions. This includes straight-line paths (optimal transport), which are more efficient to simulate and require fewer discretization steps. The greater flexibility in path design often translates to faster sampling — flow-matching models can generate high-quality samples in as few as 1–10 ODE steps compared to the hundreds of steps traditional diffusion models may require.',
      'Flow matching has been adopted across diverse domains including voice synthesis (e.g., voice cloning and text-to-speech), image generation, video generation, and protein structure prediction. It provides a unified mathematical framework that subsumes several prior approaches, including score-based diffusion and rectified flow, under a common training objective.',
    ],
    keyPoints: [
      'Learns a vector field (ODE) transporting a Gaussian prior to the data distribution',
      'Allows arbitrary transport paths, unlike diffusion\'s restriction to noise-adding processes',
      'Straight-line (optimal transport) paths enable much faster sampling (1–10 steps)',
      'Unifies score-based diffusion and rectified flow under a common framework',
      'Applied in voice synthesis, image/video generation, and protein structure prediction',
    ],
    relatedTerms: ['latent-space'],
    exampleUseCase:
      'Generating natural-sounding speech from text by learning a flow that transports Gaussian noise to the distribution of speech spectrogram features.',
  },
  {
    slug: 'world-models',
    term: 'World Models',
    category: 'Architecture',
    shortDefinition:
      'AI systems that learn internal representations of environment dynamics, enabling prediction and planning in latent space for dramatically improved sample efficiency.',
    definition: [
      'World Models are AI systems that learn an internal representation of environment dynamics, enabling them to predict future states given current states and actions. Rather than interacting directly with the raw environment — which can be slow, expensive, or dangerous — an agent can train and plan within the world model\'s learned latent space. This process is often referred to as \'dreaming,\' since the agent simulates experiences rather than collecting them from reality.',
      'A typical world model consists of three components: an encoder that maps raw observations into a compact latent representation, a dynamics model (or transition model) that predicts how the latent state evolves given actions, and a reward predictor that estimates the reward associated with latent states. Agents can then learn policies entirely within this learned simulation, generating large amounts of synthetic training data without additional environment interaction. The resulting policies are transferred to the real environment for evaluation and fine-tuning.',
      'The concept was pioneered by Ha and Schmidhuber (2018), who demonstrated that agents trained in a world model\'s latent space could play racing games and other environments with high sample efficiency. Modern architectures such as Dreamer and its successors extend this approach with recurrent state-space models, enabling long-horizon prediction and planning. World models are now central to model-based reinforcement learning, video game playing, robotics, and autonomous systems.',
    ],
    keyPoints: [
      'Learns environment dynamics in latent space, enabling prediction of future states',
      'Agents train and plan within the model (\'dreaming\') instead of the raw environment',
      'Dramatically improves sample efficiency for reinforcement learning',
      'Pioneered by Ha and Schmidhuber (2018); extended by Dreamer family of algorithms',
      'Core components: encoder, transition/dynamics model, and reward predictor',
    ],
    relatedTerms: ['latent-space', 'embedding'],
    exampleUseCase:
      'Training an autonomous driving policy in a learned world model that simulates traffic scenarios, reducing the need for millions of miles of real-world test driving.',
  },
  {
    slug: 'lora-low-rank-adaptation',
    term: 'LoRA (Low-Rank Adaptation)',
    category: 'Training',
    shortDefinition:
      'A parameter-efficient fine-tuning method that freezes the pre-trained model and injects trainable low-rank decomposition matrices into each layer.',
    definition: [
      'LoRA (Low-Rank Adaptation) is a parameter-efficient fine-tuning technique that adapts a pre-trained model to a new task by injecting trainable low-rank matrices into each layer while keeping the original model weights frozen. The key insight is that the weight updates during fine-tuning often reside in a low-dimensional subspace, so the update matrix ΔW can be approximated as the product of two smaller matrices: ΔW = B × A, where A is a d×r matrix and B is an r×d matrix, with the rank r being much smaller than the original dimension d.',
      'By constraining the update to a low-rank subspace, LoRA reduces the number of trainable parameters by orders of magnitude — often to less than 1% of the original model\'s parameters. This dramatically lowers memory requirements for optimizer states and gradients, enabling fine-tuning of large models on consumer-grade GPUs. The original frozen weights can be merged with the LoRA adapters for efficient inference, or kept separate to enable hot-swapping between multiple tasks.',
      'LoRA has become the de facto standard for parameter-efficient fine-tuning of large language models. It supports multi-tenant serving, where a single base model serves multiple tasks by loading different lightweight LoRA adapters. The rank r is the primary hyperparameter, with typical values ranging from 4 to 64; higher ranks provide more expressivity at the cost of more parameters.',
    ],
    keyPoints: [
      'Freezes pre-trained weights; injects trainable low-rank matrices (ΔW = B × A)',
      'Reduces trainable parameters to often <1% of the full model',
      'Enables fine-tuning of large models on consumer GPUs',
      'Adapters can be merged for inference or hot-swapped for multi-task serving',
      'Rank r (typically 4–64) is the primary hyperparameter controlling expressivity',
    ],
    relatedTerms: ['peft', 'fine-tuning', 'quantization', 'small-language-model'],
    exampleUseCase:
      'Fine-tuning a 7B-parameter language model for legal document classification using a LoRA adapter with rank 16, requiring only a few hundred megabytes of trainable parameters.',
  },
  {
    slug: 'onnx-open-neural-network-exchange',
    term: 'ONNX (Open Neural Network Exchange)',
    category: 'Deployment',
    shortDefinition:
      'An open format for representing machine learning models that enables interoperability between training and inference frameworks.',
    definition: [
      'ONNX (Open Neural Network Exchange) is an open standard format for representing machine learning models, designed to enable interoperability between different training and inference frameworks. A model trained in PyTorch, TensorFlow, or JAX can be exported to the ONNX format and then loaded by any ONNX-compatible runtime, decoupling the training framework from the deployment environment. This eliminates vendor lock-in and allows teams to choose the best inference engine for their hardware.',
      'The ONNX format defines a computation graph as a series of standardized operators (such as Conv, MatMul, Softmax) with defined inputs, outputs, and attributes. Each operator has a versioned specification, ensuring that the semantics of a model remain consistent across runtimes. The ONNX Runtime — Microsoft\'s cross-platform inference engine — provides hardware-accelerated execution on CPU, GPU, and specialized accelerators (NPUs, TPUs) through execution providers.',
      'ONNX is widely used in production deployment pipelines, particularly for edge and on-device inference where lightweight runtimes and hardware-specific optimizations are critical. Models can be further optimized through ONNX-specific graph transformations, operator fusion, and quantization to reduce model size and latency. The format supports both floating-point and quantized (INT8) models.',
    ],
    keyPoints: [
      'Open standard format decoupling training frameworks from inference runtimes',
      'Defines computation graphs using versioned, standardized operators',
      'ONNX Runtime provides hardware-accelerated execution across CPU, GPU, and NPUs',
      'Supports graph optimizations, operator fusion, and INT8 quantization',
      'Widely used for edge, on-device, and production inference deployment',
    ],
    relatedTerms: ['quantization', 'small-language-model', 'mixed-precision-training'],
    exampleUseCase:
      'Exporting a PyTorch-trained compliance classification model to ONNX for deployment in an air-gapped environment using ONNX Runtime on CPU.',
  },
  {
    slug: 'fine-tuning',
    term: 'Fine-Tuning',
    category: 'Training',
    shortDefinition:
      'The process of adapting a pre-trained model to a specific task or domain by continuing training on task-specific data.',
    definition: [
      'Fine-tuning is the process of taking a model that has been pre-trained on a large, general dataset and continuing its training on a smaller, task-specific dataset to adapt it to a particular task or domain. The pre-trained model already encodes general patterns and representations learned from broad data; fine-tuning adjusts these weights (or a subset of them) to specialize the model for the target task, typically requiring far less data and compute than training from scratch.',
      'Fine-tuning can be performed at different granularities. Full fine-tuning updates all parameters of the model, which provides maximum adaptability but is computationally expensive and risks catastrophic forgetting of the pre-trained knowledge. Parameter-efficient methods such as LoRA and adapter tuning update only a small fraction of parameters, preserving the base model\'s capabilities while still achieving strong task-specific performance.',
      'The fine-tuning recipe — including learning rate, number of epochs, batch size, and regularization — significantly impacts the result. Fine-tuning with too high a learning rate or too many epochs can destroy the useful representations learned during pre-training, a problem known as catastrophic forgetting. Common strategies include using a lower learning rate than pre-training, early stopping, and layer-wise learning rate decay.',
    ],
    keyPoints: [
      'Adapts a pre-trained model to a specific task using task-specific data',
      'Requires far less data and compute than training from scratch',
      'Full fine-tuning updates all parameters; PEFT methods update a small subset',
      'Risks catastrophic forgetting if the learning rate is too high or training is too long',
      'Common strategies: lower learning rate, early stopping, layer-wise LR decay',
    ],
    relatedTerms: ['supervised-fine-tuning', 'instruction-tuning', 'lora-low-rank-adaptation', 'peft'],
    exampleUseCase:
      'Taking a general-purpose language model and fine-tuning it on a corpus of medical records to create a model specialized for clinical text understanding.',
  },
  {
    slug: 'knowledge-distillation',
    term: 'Knowledge Distillation',
    category: 'Training',
    shortDefinition:
      'A model compression technique where a smaller student model learns to mimic the behavior of a larger, more capable teacher model.',
    definition: [
      'Knowledge Distillation is a model compression technique in which a smaller, more efficient \'student\' model is trained to mimic the behavior of a larger, more capable \'teacher\' model. The teacher\'s knowledge — encoded in its output probability distributions (soft labels) rather than just its final predictions (hard labels) — contains rich information about the relationships between classes. By learning from these soft labels, the student can achieve performance approaching the teacher despite having far fewer parameters.',
      'The standard distillation process involves applying a temperature parameter to the teacher\'s softmax function, which softens the output distribution and reveals more of the \'dark knowledge\' — the relative probabilities the teacher assigns to incorrect classes. The student is trained to match these softened distributions using a distillation loss (typically KL divergence), combined with a standard task loss on hard labels. The temperature controls how much emphasis is placed on the teacher\'s soft labels versus the ground-truth labels.',
      'Knowledge distillation is widely used to deploy large models in resource-constrained environments. A massive teacher model that requires expensive GPU inference can be distilled into a compact student that runs on edge devices or serves high-throughput inference at low latency. Variants include on-policy distillation (where the student generates its own inputs), feature-based distillation (matching intermediate representations), and multi-teacher distillation.',
    ],
    keyPoints: [
      'Student model learns from teacher\'s soft labels (softened probability distributions)',
      'Temperature parameter controls the softness of the teacher\'s output distribution',
      'Trained with a combination of distillation loss (KL divergence) and task loss',
      'Enables deployment of large model capabilities on resource-constrained hardware',
      'Variants include on-policy, feature-based, and multi-teacher distillation',
    ],
    relatedTerms: ['on-policy-distillation', 'fine-tuning', 'small-language-model'],
    exampleUseCase:
      'Distilling a 70B-parameter teacher model into a 7B-parameter student that retains 95% of the teacher\'s accuracy while running 10× faster at inference.',
  },
  {
    slug: 'rlhf',
    term: 'RLHF (Reinforcement Learning from Human Feedback)',
    category: 'Training',
    shortDefinition:
      'A technique that aligns language models with human preferences by training a reward model on human feedback and optimizing the policy via reinforcement learning.',
    definition: [
      'Reinforcement Learning from Human Feedback (RLHF) is a technique for aligning language model outputs with human preferences. The process operates in three stages: first, a model is supervised fine-tuned on demonstrations to produce an initial policy. Second, human annotators rank or rate pairs of model outputs, and this preference data is used to train a separate reward model that predicts which outputs humans would prefer. Third, the language model (policy) is optimized against the reward model using a reinforcement learning algorithm such as PPO.',
      'The reward model learns to assign scalar scores to model outputs based on human preference patterns. During RL optimization, the policy generates outputs, the reward model scores them, and the policy is updated to maximize the expected reward. A KL divergence penalty is typically applied to prevent the policy from drifting too far from the supervised fine-tuned model, which maintains output quality and prevents reward hacking — where the model exploits imperfections in the reward model to achieve high scores without genuinely satisfying human preferences.',
      'RLHF was instrumental in training models like InstructGPT and ChatGPT, transforming base language models into helpful, harmless, and honest assistants. While effective, RLHF is complex, expensive, and sensitive to the quality of human annotation. Alternative approaches such as Direct Preference Optimization (DPO) and Group Relative Policy Optimization (GRPO) have been developed to simplify or improve upon the RLHF pipeline.',
    ],
    keyPoints: [
      'Three stages: SFT, reward model training from human preferences, and RL optimization',
      'Reward model predicts human preference between pairs of model outputs',
      'KL penalty prevents the policy from drifting too far from the SFT model',
      'Used to train InstructGPT and ChatGPT; aligns models with human values',
      'Sensitive to annotation quality; vulnerable to reward hacking',
    ],
    relatedTerms: ['ppo', 'dpo', 'group-relative-policy-optimization', 'supervised-fine-tuning'],
    exampleUseCase:
      'Training a chatbot to produce helpful, harmless responses by collecting human ratings on model outputs and optimizing the policy to maximize predicted human preference.',
  },
  {
    slug: 'dpo',
    term: 'DPO (Direct Preference Optimization)',
    category: 'Training',
    shortDefinition:
      'A preference optimization method that directly optimizes the policy from preference data without training a separate reward model.',
    definition: [
      'Direct Preference Optimization (DPO) is a preference optimization method that simplifies RLHF by eliminating the reward model and the reinforcement learning loop entirely. Instead of training a separate reward model and then using RL to optimize the policy against it, DPO reparameterizes the reward function in terms of the policy itself, deriving a closed-form loss function that directly optimizes the policy from preference data.',
      'Given pairs of outputs where a human (or a stronger model) has indicated a preference, DPO trains the policy to increase the probability of the preferred output while decreasing the probability of the dispreferred output, relative to a reference model. The loss function includes a KL divergence term that keeps the policy close to the reference model, similar to the KL penalty in RLHF. This formulation is mathematically equivalent to optimizing a reward model and then doing RL, but in a single training stage.',
      'DPO is simpler, more stable, and cheaper than RLHF because it avoids the instabilities of RL training (such as reward hacking and value function estimation) and requires no separate reward model. However, it can be less effective than RLHF in scenarios that require online exploration or iterative improvement, since it learns only from a fixed preference dataset. DPO has become a popular alternative to RLHF for aligning open-source language models.',
    ],
    keyPoints: [
      'Eliminates the reward model and RL loop; optimizes directly from preference data',
      'Derives a closed-form loss using the policy itself as the reward function',
      'Includes a KL term keeping the policy close to the reference model',
      'Simpler, more stable, and cheaper than RLHF',
      'Less effective for online exploration; learns from fixed preference datasets',
    ],
    relatedTerms: ['rlhf', 'ppo', 'group-relative-policy-optimization'],
    exampleUseCase:
      'Aligning an open-source language model using a dataset of preferred vs. dispreferred response pairs, without the complexity of training a reward model and running PPO.',
  },
  {
    slug: 'ppo',
    term: 'PPO (Proximal Policy Optimization)',
    category: 'Training',
    shortDefinition:
      'A policy gradient RL algorithm that uses clipped surrogate objectives to ensure stable, conservative policy updates.',
    definition: [
      'Proximal Policy Optimization (PPO) is a policy gradient reinforcement learning algorithm designed to provide stable and reliable policy updates. PPO improves upon earlier policy gradient methods by constraining the size of each update, preventing the policy from changing too drastically in a single step — a common failure mode that leads to training instability. It has been the workhorse algorithm for RLHF in large language models.',
      'PPO achieves this stability through a clipped surrogate objective. For each update, PPO computes the ratio of the new policy\'s probability to the old policy\'s probability for each action. This ratio is clipped to a range [1−ε, 1+ε] (where ε is a hyperparameter, typically 0.1–0.2), ensuring that the policy does not move too far from its previous version in a single update. A separate value (critic) network estimates the value of each state to compute advantages, which reduce the variance of policy gradient estimates.',
      'In the context of RLHF for language models, PPO is used to optimize the language model policy against a learned reward model. The policy generates text, the reward model scores it, and PPO updates the policy to maximize reward. PPO requires maintaining four models in memory simultaneously: the policy, the reference model (for KL penalty), the reward model, and the value/critic model — making it memory-intensive. This limitation motivated the development of more efficient alternatives like GRPO.',
    ],
    keyPoints: [
      'Uses a clipped surrogate objective to limit policy update size',
      'Clip ratio constrained to [1−ε, 1+ε], with ε typically 0.1–0.2',
      'Requires a separate value (critic) network for advantage estimation',
      'In RLHF, maintains four models in memory: policy, reference, reward, critic',
      'Memory-intensive; motivated development of GRPO and DPO',
    ],
    relatedTerms: ['rlhf', 'dpo', 'group-relative-policy-optimization'],
    exampleUseCase:
      'Using PPO to optimize a language model\'s responses against a reward model that scores helpfulness, with the clip parameter preventing destructive large updates.',
  },
  {
    slug: 'small-language-model',
    term: 'Small Language Model (SLM)',
    category: 'Architecture',
    shortDefinition:
      'A language model with significantly fewer parameters than frontier models, optimized for efficiency, cost, and on-device deployment.',
    definition: [
      'A Small Language Model (SLM) is a language model with significantly fewer parameters than frontier-scale models — typically in the range of 1–8 billion parameters, though the boundary is not precisely defined. SLMs are designed to deliver strong performance on specific tasks while being small enough to run efficiently on consumer hardware, edge devices, or cost-effective cloud infrastructure. They trade the broad capability of large models for specialization, efficiency, and deployability.',
      'SLMs are typically created through a combination of techniques: training on high-quality, curated data; distillation from larger teacher models; and parameter-efficient fine-tuning for specific domains. A well-tuned SLM can match or exceed the performance of a general-purpose frontier model on domain-specific tasks (such as legal document classification or medical entity extraction) at a fraction of the inference cost. Their smaller size also enables lower latency, reduced memory footprint, and the ability to run offline or in air-gapped environments.',
      'The rise of SLMs reflects a shift from \'one large model for everything\' to \'many small models, each specialized.\' This paradigm is particularly attractive for enterprises that require data sovereignty, predictable costs, and domain-specific accuracy. SLMs can be deployed via formats like ONNX, further optimized with quantization, and served on commodity hardware without specialized accelerators.',
    ],
    keyPoints: [
      'Typically 1–8 billion parameters; optimized for efficiency and cost',
      'Created via curated training data, distillation, and domain-specific fine-tuning',
      'Can match frontier models on domain-specific tasks at a fraction of inference cost',
      'Enables on-device, edge, and air-gapped deployment',
      'Supports data sovereignty and predictable, low operational costs',
    ],
    relatedTerms: ['knowledge-distillation', 'quantization', 'lora-low-rank-adaptation', 'mixture-of-experts'],
    exampleUseCase:
      'Deploying a 3B-parameter SLM fine-tuned for compliance classification on a hospital\'s air-gapped server, achieving domain-specific accuracy without sending data to a cloud API.',
  },
  {
    slug: 'peft',
    term: 'PEFT (Parameter-Efficient Fine-Tuning)',
    category: 'Training',
    shortDefinition:
      'A family of techniques that fine-tunes a small subset of model parameters while freezing the rest, drastically reducing compute and memory requirements.',
    definition: [
      'Parameter-Efficient Fine-Tuning (PEFT) refers to a family of techniques that adapt a pre-trained model to a new task by updating only a small subset of parameters — or a small set of newly added parameters — while keeping the majority of the pre-trained weights frozen. The goal is to achieve performance comparable to full fine-tuning while training only a tiny fraction (often <1%) of the total parameters, dramatically reducing memory, compute, and storage costs.',
      'PEFT methods work on the principle that task-specific adaptation resides in a low-dimensional subspace of the full parameter space. Common approaches include LoRA (which injects low-rank update matrices), adapter modules (which add small bottleneck layers between existing layers), prefix tuning (which prepends learnable tokens to the input), and prompt tuning (which optimizes continuous prompt embeddings). Each method trades off expressivity, parameter count, and inference overhead differently.',
      'PEFT is particularly valuable for multi-tenant scenarios, where a single base model can serve many tasks by loading different lightweight adapters. It also enables fine-tuning of very large models on limited hardware, preserves the base model\'s general capabilities (reducing catastrophic forgetting), and allows efficient storage and versioning of task-specific adaptations. The trained adapters are typically tiny (megabytes rather than gigabytes), making them easy to distribute and deploy.',
    ],
    keyPoints: [
      'Updates <1% of parameters while freezing the pre-trained weights',
      'Includes LoRA, adapters, prefix tuning, and prompt tuning',
      'Enables multi-tenant serving with a single base model and swappable adapters',
      'Reduces memory, compute, and storage by orders of magnitude',
      'Preserves base model capabilities; reduces catastrophic forgetting',
    ],
    relatedTerms: ['lora-low-rank-adaptation', 'fine-tuning'],
    exampleUseCase:
      'Serving a single 13B-parameter base model with 20 different LoRA adapters for 20 different customers, each adapter being only 50MB and hot-swappable at inference.',
  },
  {
    slug: 'quantization',
    term: 'Quantization',
    category: 'Optimization',
    shortDefinition:
      'A technique that reduces the precision of model weights and activations (e.g., from FP32 to INT8) to decrease memory usage and accelerate inference.',
    definition: [
      'Quantization is a model optimization technique that reduces the numerical precision of a model\'s weights and activations, typically from 32-bit floating-point (FP32) to lower-precision formats such as 16-bit float (FP16/BF16), 8-bit integer (INT8), or even 4-bit representations. By representing each value with fewer bits, quantization reduces the model\'s memory footprint, lowers memory bandwidth requirements, and enables faster inference on hardware that supports low-precision arithmetic.',
      'Quantization can be applied post-training (Post-Training Quantization, PTQ) or during training (Quantization-Aware Training, QAT). PTQ is simpler — it calibrates the model on a small sample of data to determine the optimal scaling factors for each layer and then quantizes the weights. QAT simulates quantization during training, allowing the model to adapt to the reduced precision and typically achieving higher accuracy. The trade-off is between the simplicity of PTQ and the accuracy retention of QAT.',
      'Modern large language model inference heavily relies on quantization techniques such as GPTQ, AWQ, and bitsandbytes, which can quantize models to 4-bit or 8-bit with minimal accuracy loss. This enables running models that would otherwise exceed available memory — for example, a 7B-parameter model in FP32 requires ~28GB of memory, but in 4-bit quantization it fits in ~4GB, making it runnable on consumer GPUs.',
    ],
    keyPoints: [
      'Reduces precision from FP32 to FP16, INT8, or even 4-bit',
      'Decreases memory footprint, bandwidth, and inference latency',
      'Post-Training Quantization (PTQ) is simple; QAT achieves higher accuracy',
      'GPTQ, AWQ, and bitsandbytes enable 4-bit LLM inference with minimal loss',
      'A 7B model drops from ~28GB (FP32) to ~4GB (4-bit)',
    ],
    relatedTerms: ['lora-low-rank-adaptation', 'mixed-precision-training', 'onnx-open-neural-network-exchange'],
    exampleUseCase:
      'Quantizing a 13B-parameter model to 8-bit using GPTQ so it can be served on a single consumer GPU with 12GB of VRAM instead of requiring a data-center GPU.',
  },
  {
    slug: 'supervised-fine-tuning',
    term: 'Supervised Fine-Tuning (SFT)',
    category: 'Training',
    shortDefinition:
      'Fine-tuning a pre-trained model on labeled input-output pairs for a specific task, forming the first stage of alignment pipelines like RLHF.',
    definition: [
      'Supervised Fine-Tuning (SFT) is the process of fine-tuning a pre-trained model on a dataset of labeled input-output pairs to teach it a specific task or behavior. Unlike unsupervised pre-training, which learns general patterns from unlabelled text, SFT uses explicit supervision: for each input (e.g., a user question), the model is trained to produce the target output (e.g., the correct answer). This is typically done with standard cross-entropy loss on the target tokens.',
      'SFT is the foundational step in aligning language models for instruction-following. Before SFT, a base language model simply continues text given a prompt; after SFT, it learns to respond as an assistant. The quality and diversity of the SFT dataset heavily influence the model\'s behavior — high-quality demonstrations covering a wide range of tasks produce a model that generalizes well to new instructions. SFT is also the first stage in RLHF, providing the initial policy that is subsequently refined through preference optimization.',
      'A common practice in SFT for language models is to mask the loss on the prompt tokens and compute loss only on the response tokens, ensuring the model learns to generate good responses rather than memorize prompts. SFT can be performed with full parameter updates or with parameter-efficient methods like LoRA, depending on the available compute and the desired trade-off between adaptability and preserving the base model\'s knowledge.',
    ],
    keyPoints: [
      'Fine-tunes on labeled input-output pairs using cross-entropy loss',
      'Foundational step for instruction-following and the first stage of RLHF',
      'Dataset quality and diversity heavily influence generalization',
      'Loss is typically masked on prompt tokens; computed only on responses',
      'Can use full fine-tuning or PEFT methods like LoRA',
    ],
    relatedTerms: ['instruction-tuning', 'fine-tuning', 'rlhf', 'cross-entropy-loss'],
    exampleUseCase:
      'Fine-tuning a base language model on 50,000 high-quality question-answer pairs to teach it to respond as a helpful assistant before further alignment with RLHF.',
  },
  {
    slug: 'instruction-tuning',
    term: 'Instruction Tuning',
    category: 'Training',
    shortDefinition:
      'A form of fine-tuning that trains models to follow natural language instructions across diverse tasks, improving generalization and zero-shot capability.',
    definition: [
      'Instruction Tuning is a form of supervised fine-tuning that trains a language model to follow natural language instructions across a diverse range of tasks. Rather than fine-tuning on a single task, instruction tuning exposes the model to many tasks — each phrased as a natural language instruction (e.g., \'Summarize the following article\') with the expected output. This teaches the model the general skill of instruction-following rather than memorizing task-specific patterns.',
      'The key to effective instruction tuning is task diversity. By training on thousands of tasks spanning summarization, translation, question answering, code generation, and more — all expressed as instructions — the model learns to generalize to unseen tasks at inference time. This is what enables zero-shot and few-shot task performance: a model that has been instruction-tuned can follow a novel instruction it has never explicitly been trained on, because it has learned the meta-skill of mapping instructions to appropriate responses.',
      'Instruction tuning can use human-written demonstrations or synthetically generated instruction-response pairs (as in the Self-Instruct approach). It is closely related to and often used interchangeably with supervised fine-tuning, though instruction tuning specifically emphasizes multi-task diversity and generalization to novel instructions. It is a prerequisite for alignment methods like RLHF, which refine the model\'s instruction-following behavior based on human preferences.',
    ],
    keyPoints: [
      'Trains on diverse tasks expressed as natural language instructions',
      'Teaches the meta-skill of instruction-following, enabling zero-shot generalization',
      'Task diversity is critical; thousands of tasks spanning many domains',
      'Can use human demonstrations or synthetic (Self-Instruct) data',
      'Prerequisite for RLHF; closely related to supervised fine-tuning',
    ],
    relatedTerms: ['supervised-fine-tuning', 'fine-tuning', 'rlhf'],
    exampleUseCase:
      'Training a model on 1,000+ diverse instruction-output pairs (summarization, translation, coding, QA) so it can follow novel instructions at inference time without task-specific fine-tuning.',
  },
  {
    slug: 'chain-of-thought',
    term: 'Chain-of-Thought (CoT)',
    category: 'Inference',
    shortDefinition:
      'A prompting and training technique where models generate intermediate reasoning steps before producing a final answer.',
    definition: [
      'Chain-of-Thought (CoT) is a reasoning technique in which a language model generates intermediate reasoning steps before producing its final answer, rather than outputting the answer directly. By decomposing a complex problem into a sequence of simpler steps, the model can solve problems that require multi-step reasoning — such as math word problems, logical deduction, and code generation — more accurately than with direct answering.',
      'CoT can be elicited through prompting (e.g., appending \'Let\'s think step by step\' to the prompt) or instilled through training (by fine-tuning on data that includes reasoning traces). Prompting-based CoT requires no model modification but depends on the model\'s existing capability. Training-based CoT — where the model is fine-tuned or reinforced on data containing step-by-step reasoning — produces more reliable and consistent reasoning, as demonstrated by models like DeepSeek-R1 and OpenAI\'s o1.',
      'The effectiveness of CoT stems from giving the model more \'compute\' in the form of additional tokens to process each step of reasoning. Each generated token provides the model with additional context for subsequent tokens, effectively allowing it to perform intermediate computation in the output sequence. This is why CoT is especially beneficial for arithmetic and logical tasks where the model must manipulate information that doesn\'t fit in a single forward pass.',
    ],
    keyPoints: [
      'Model generates intermediate reasoning steps before the final answer',
      'Can be elicited via prompting (\'Let\'s think step by step\') or instilled via training',
      'Particularly effective for math, logic, and multi-step reasoning tasks',
      'Additional tokens provide implicit additional compute per problem',
      'Training-based CoT produces more reliable reasoning (e.g., DeepSeek-R1, o1)',
    ],
    relatedTerms: ['temperature-scaling', 'beam-search', 'rag'],
    exampleUseCase:
      'Prompting a model to solve a multi-step math problem by first writing out each calculation step before stating the final numerical answer.',
  },
  {
    slug: 'temperature-scaling',
    term: 'Temperature Scaling',
    category: 'Inference',
    shortDefinition:
      'A parameter that controls the randomness of model predictions by scaling logits before softmax, trading determinism for creativity.',
    definition: [
      'Temperature Scaling is a technique that controls the randomness or \'creativity\' of a language model\'s output by dividing the logits (pre-softmax scores) by a temperature parameter T before applying the softmax function. A temperature of 1.0 leaves the distribution unchanged. Temperatures below 1.0 (e.g., 0.2) sharpen the distribution, making the model more deterministic and likely to select high-probability tokens. Temperatures above 1.0 (e.g., 1.5) flatten the distribution, increasing randomness and diversity.',
      'Temperature is one of the most important inference-time hyperparameters. Low temperatures are suitable for tasks requiring precision and consistency, such as code generation, factual question answering, and data extraction — where the model should always select the most likely next token. High temperatures are useful for creative tasks like brainstorming, story generation, and poetry, where diversity and novelty are valued over precision.',
      'In the context of knowledge distillation, temperature scaling serves a different purpose: it softens the teacher\'s output distribution to reveal \'dark knowledge\' — the relative probabilities the teacher assigns to non-target classes. A higher temperature during distillation makes the student learn from the richer signal in the teacher\'s full distribution rather than just the top prediction. The temperature used during distillation training is typically compensated for by squaring the temperature factor in the loss function.',
    ],
    keyPoints: [
      'Divides logits by temperature T before softmax; T=1.0 is unchanged',
      'T<1.0 sharpens distribution (more deterministic); T>1.0 flattens it (more random)',
      'Low temperature for precision tasks; high temperature for creative tasks',
      'Also used in knowledge distillation to soften teacher distributions',
      'One of the most impactful inference-time hyperparameters',
    ],
    relatedTerms: ['chain-of-thought', 'beam-search', 'knowledge-distillation', 'cross-entropy-loss'],
    exampleUseCase:
      'Setting temperature to 0.1 for a code-generation model to ensure deterministic, high-probability outputs, versus 0.9 for a creative writing assistant.',
  },
  {
    slug: 'tokenization',
    term: 'Tokenization',
    category: 'Architecture',
    shortDefinition:
      'The process of breaking text into discrete units (tokens) that a model can process, bridging raw text and numerical representations.',
    definition: [
      'Tokenization is the process of breaking input text into discrete units called tokens, which serve as the fundamental input units for language models. Since neural networks operate on numerical data, text must be converted into a sequence of integer token IDs before processing. The tokenization scheme determines how text is segmented — into individual characters, whole words, or subword units — and directly affects the model\'s vocabulary size, sequence length, and ability to handle rare or unseen words.',
      'Modern language models predominantly use subword tokenization algorithms such as Byte-Pair Encoding (BPE), WordPiece, or SentencePiece. These algorithms learn a vocabulary of frequently occurring character sequences, balancing between character-level tokenization (which produces long sequences but handles any text) and word-level tokenization (which produces short sequences but has a large, open-ended vocabulary and cannot handle out-of-vocabulary words). Subword tokenization splits rare words into known subword units (e.g., \'unbelievable\' → \'un\', \'believ\', \'able\'), ensuring any text can be tokenized.',
      'The choice of tokenizer has significant practical implications. It determines the number of tokens per input (which affects compute cost, since attention is quadratic in sequence length), the model\'s multilingual capability (tokenizers trained primarily on English text may produce very long token sequences for other languages), and how the model handles numbers, code, and special characters. Tokenizer quality is a frequently overlooked factor in model performance.',
    ],
    keyPoints: [
      'Converts raw text into integer token IDs for neural network processing',
      'Modern models use subword algorithms: BPE, WordPiece, SentencePiece',
      'Subword tokenization handles rare/unseen words by splitting into known units',
      'Affects sequence length, compute cost, and multilingual capability',
      'Tokenizer quality is an often-overlooked factor in model performance',
    ],
    relatedTerms: ['embedding', 'transformer-architecture', 'attention-mechanism'],
    exampleUseCase:
      'Using a BPE tokenizer with a 50,000-token vocabulary to process multilingual customer support tickets, where rare words are split into subword units rather than mapped to an unknown token.',
  },
  {
    slug: 'attention-mechanism',
    term: 'Attention Mechanism',
    category: 'Architecture',
    shortDefinition:
      'A neural network component that computes weighted relationships between all positions in a sequence, enabling models to focus on relevant context.',
    definition: [
      'The Attention Mechanism is a neural network component that computes weighted relationships between all positions in a sequence, enabling a model to dynamically focus on the most relevant parts of its input when producing each output. Rather than processing a sequence position-by-position with fixed-size context (as in RNNs), attention allows every position to directly attend to every other position, capturing long-range dependencies without information degradation.',
      'The most common form is scaled dot-product attention. For each query vector, the mechanism computes dot products with all key vectors, scales by 1/√d_k, applies a softmax to obtain attention weights, and then computes a weighted sum of value vectors. Multi-head attention extends this by running multiple attention operations in parallel with different learned projections, allowing the model to attend to different types of relationships simultaneously (e.g., one head might focus on syntactic dependencies while another captures semantic similarity).',
      'Attention is the foundational component of the Transformer architecture, which replaced recurrence and convolution with self-attention as the primary mechanism for sequence processing. Its quadratic computational complexity with respect to sequence length (O(n²)) is a known limitation, motivating efficient attention variants such as sparse attention, linear attention, and flash attention that reduce this cost for long sequences.',
    ],
    keyPoints: [
      'Computes weighted relationships between all positions in a sequence',
      'Scaled dot-product: softmax(QK^T / √d_k) × V',
      'Multi-head attention captures different relationship types in parallel',
      'Foundational component of the Transformer architecture',
      'O(n²) complexity motivates efficient variants (sparse, linear, flash attention)',
    ],
    relatedTerms: ['transformer-architecture', 'embedding', 'tokenization'],
    exampleUseCase:
      'In machine translation, attention allows the decoder to focus on the most relevant source-language words when generating each target-language word, regardless of their position in the input.',
  },
  {
    slug: 'transformer-architecture',
    term: 'Transformer Architecture',
    category: 'Architecture',
    shortDefinition:
      'A neural network architecture based entirely on self-attention, replacing recurrence with parallel attention layers for superior sequence modeling.',
    definition: [
      'The Transformer is a neural network architecture introduced by Vaswani et al. (2017) that processes sequences using self-attention mechanisms rather than recurrence (RNNs) or convolution (CNNs). By replacing sequential processing with parallel attention operations, Transformers can process all positions in a sequence simultaneously, enabling significantly faster training and better utilization of modern parallel hardware (GPUs, TPUs). This architectural shift enabled the scaling that produced modern large language models.',
      'A standard Transformer consists of an encoder and a decoder, each built from stacked layers. Each layer contains a multi-head self-attention sub-layer and a position-wise feed-forward network. Layer normalization and residual connections are applied around each sub-layer. Since attention is permutation-invariant, positional encodings (sinusoidal or learned) are added to the input embeddings to inject information about token order. Decoder layers additionally include cross-attention to attend to the encoder\'s output.',
      'Modern language models use variations of the Transformer: encoder-only models (BERT) for understanding tasks, decoder-only models (GPT, Llama) for generation, and encoder-decoder models (T5, BART) for sequence-to-sequence tasks. The decoder-only architecture has become dominant for large language models due to its simplicity and effectiveness in autoregressive generation. Key innovations beyond the original Transformer include rotary positional embeddings (RoPE), grouped-query attention, and mixture-of-experts layers.',
    ],
    keyPoints: [
      'Introduced by Vaswani et al. (2017); replaces recurrence with self-attention',
      'Parallel processing enables faster training and better hardware utilization',
      'Core components: multi-head attention, feed-forward layers, residual connections, layer norm',
      'Variants: encoder-only (BERT), decoder-only (GPT/Llama), encoder-decoder (T5)',
      'Decoder-only is dominant for LLMs; innovations include RoPE, GQA, MoE',
    ],
    relatedTerms: ['attention-mechanism', 'tokenization', 'embedding', 'mixture-of-experts'],
    exampleUseCase:
      'A decoder-only Transformer with 96 layers and rotary positional embeddings, trained autoregressively on trillions of tokens to produce a large language model.',
  },
  {
    slug: 'batch-size',
    term: 'Batch Size',
    category: 'Training',
    shortDefinition:
      'The number of training examples processed in a single forward and backward pass, directly affecting memory usage, gradient quality, and training speed.',
    definition: [
      'Batch Size is the number of training examples processed together in a single forward and backward pass of a neural network. During each training step, the model computes predictions for all examples in the batch, calculates the average loss, and updates weights based on the averaged gradient. The batch size is one of the most important training hyperparameters, directly affecting memory usage, gradient estimation quality, and overall training throughput.',
      'Larger batch sizes produce gradient estimates that are closer to the true gradient (lower variance), leading to more stable and consistent weight updates. They also improve hardware utilization by keeping GPUs fully occupied with parallel computation. However, very large batch sizes can lead to poorer generalization (the \'generalization gap\'), require more memory, and may need learning rate scaling. Small batch sizes introduce more gradient noise, which can act as a form of regularization and improve generalization, but may underutilize hardware and slow training.',
      'When GPU memory is insufficient for a desired batch size, gradient accumulation can be used to simulate a larger effective batch size by accumulating gradients across multiple smaller mini-batches before applying a weight update. The choice of batch size is closely tied to the learning rate — the linear scaling rule suggests scaling the learning rate proportionally with batch size, though this relationship breaks down at very large batch sizes.',
    ],
    keyPoints: [
      'Number of examples per forward/backward pass; affects memory, gradient quality, speed',
      'Large batches: lower gradient variance, better hardware utilization, but risk generalization gap',
      'Small batches: more gradient noise (regularization), but slower and less hardware-efficient',
      'Closely tied to learning rate via the linear scaling rule',
      'Gradient accumulation can simulate larger batch sizes when memory is limited',
    ],
    relatedTerms: ['learning-rate', 'gradient-accumulation', 'hyperparameter-tuning'],
    exampleUseCase:
      'Using a batch size of 32 for fine-tuning a language model, balancing GPU memory utilization with gradient noise that aids generalization.',
  },
  {
    slug: 'learning-rate',
    term: 'Learning Rate',
    category: 'Training',
    shortDefinition:
      'A hyperparameter controlling the step size of weight updates during training, critically affecting convergence speed and final model quality.',
    definition: [
      'The Learning Rate is a hyperparameter that controls the magnitude of weight updates during training. At each step, the model\'s weights are adjusted in the direction of the negative gradient, scaled by the learning rate: w_new = w_old − learning_rate × gradient. The learning rate determines how large each step is — too high and the model may overshoot optimal solutions or diverge; too low and training becomes excessively slow or may get stuck in suboptimal local minima.',
      'Selecting an appropriate learning rate is one of the most critical decisions in training neural networks. A common practice is to use learning rate schedules that start with a higher rate for rapid initial progress, then decay over time for fine-grained convergence. Popular schedules include cosine annealing, step decay, and warmup (where the learning rate linearly increases from a small value at the start of training before following a decay schedule). Warmup is particularly important for Transformer training to stabilize early iterations.',
      'The learning rate is closely coupled with the batch size — larger batch sizes generally require larger learning rates (the linear scaling rule). Modern optimizers like Adam and AdamW adapt the effective learning rate per parameter based on gradient history, making them more robust to the choice of global learning rate than plain SGD. However, the base learning rate still needs careful tuning, and techniques like learning rate warmup, clipping, and cycling are commonly employed.',
    ],
    keyPoints: [
      'Controls the step size of weight updates: w_new = w_old − lr × gradient',
      'Too high: overshooting or divergence; too low: slow convergence or local minima',
      'Schedules (cosine, step decay, warmup) improve convergence',
      'Coupled with batch size via the linear scaling rule',
      'Adam/AdamW adapt per-parameter learning rates, improving robustness',
    ],
    relatedTerms: ['batch-size', 'gradient-accumulation', 'hyperparameter-tuning', 'backpropagation'],
    exampleUseCase:
      'Using a cosine annealing schedule with 2,000 warmup steps starting at 2e-5, decaying to 1e-6, for fine-tuning a language model.',
  },
  {
    slug: 'gradient-accumulation',
    term: 'Gradient Accumulation',
    category: 'Training',
    shortDefinition:
      'A technique that simulates larger batch sizes by accumulating gradients across multiple forward passes before applying a weight update.',
    definition: [
      'Gradient Accumulation is a technique that allows training with an effectively larger batch size than what fits in GPU memory. Instead of performing a weight update after each forward-backward pass, the method accumulates gradients over multiple smaller mini-batches (steps) and only applies the optimizer update after a specified number of accumulation steps. The effective batch size equals the mini-batch size multiplied by the number of accumulation steps.',
      'This is particularly valuable when training large models that consume significant GPU memory. For example, if a GPU can only fit a mini-batch of 4 examples but the desired effective batch size is 32, gradient accumulation over 8 steps achieves the same result: gradients from 8 mini-batches of 4 are summed (or averaged) before the optimizer updates the weights. Mathematically, this produces the same gradient estimate as a single batch of 32, assuming proper gradient scaling.',
      'While gradient accumulation solves the memory constraint, it does not improve training speed — the same number of forward and backward passes must be computed. The trade-off is between memory savings and wall-clock training time. Care must also be taken with gradient averaging (ensuring the loss is divided by the accumulation steps to maintain correct gradient magnitude) and with techniques that depend on batch-level statistics, such as batch normalization, which may behave differently under accumulation.',
    ],
    keyPoints: [
      'Accumulates gradients over N mini-batches before applying an update',
      'Effective batch size = mini-batch size × accumulation steps',
      'Solves GPU memory constraints without reducing effective batch size',
      'Does not improve training speed; same number of forward/backward passes',
      'Requires careful gradient scaling and interacts with batch normalization',
    ],
    relatedTerms: ['batch-size', 'learning-rate', 'backpropagation'],
    exampleUseCase:
      'Training a 13B-parameter model on a single 24GB GPU by using a mini-batch of 1 with 32 gradient accumulation steps, achieving an effective batch size of 32.',
  },
  {
    slug: 'mixed-precision-training',
    term: 'Mixed Precision Training',
    category: 'Optimization',
    shortDefinition:
      'A training technique that uses lower-precision formats (FP16/BF16) for computations while maintaining FP32 master weights for numerical stability.',
    definition: [
      'Mixed Precision Training is a technique that accelerates training and reduces memory usage by performing computations in lower-precision formats (typically FP16 or BF16) while maintaining a master copy of the weights in FP32 for numerical stability. The key insight is that most neural network computations do not require the full dynamic range of FP32, but gradient values can become small enough to underflow in FP16, leading to training instability.',
      'The standard mixed-precision approach uses three components: a master copy of weights in FP32, forward and backward computations in FP16/BF16, and a loss scaling factor that multiplies the loss before backpropagation to prevent gradient underflow. The scaled gradients are computed in FP16, then unscaled and used to update the FP32 master weights. BF16 (bfloat16) has become increasingly popular because it has the same dynamic range as FP32 (8 exponent bits) with reduced precision (7 mantissa bits), eliminating the need for loss scaling in many cases.',
      'Mixed precision can provide 2–3× speedup on modern GPUs with tensor cores (which are optimized for FP16/BF16 matrix multiplication) and reduce memory usage by approximately 50% for weights and activations. This enables training larger models or using larger batch sizes within the same memory budget. The technique is now standard practice in training large language models and is supported natively by frameworks like PyTorch (AMP) and TensorFlow.',
    ],
    keyPoints: [
      'Computes in FP16/BF16; maintains FP32 master weights for stability',
      'Loss scaling prevents gradient underflow in FP16',
      'BF16 eliminates loss scaling need (same exponent range as FP32)',
      'Provides 2–3× speedup on tensor-core GPUs; ~50% memory reduction',
      'Standard practice for LLM training; supported by PyTorch AMP and TensorFlow',
    ],
    relatedTerms: ['quantization', 'batch-size'],
    exampleUseCase:
      'Training a 7B-parameter model with BF16 mixed precision on an A100 GPU, achieving 2× faster training while maintaining numerical stability without loss scaling.',
  },
  {
    slug: 'overfitting',
    term: 'Overfitting',
    category: 'Evaluation',
    shortDefinition:
      'A phenomenon where a model learns to memorize training data patterns — including noise — rather than generalizable patterns, degrading performance on unseen data.',
    definition: [
      'Overfitting is a phenomenon in which a model learns to fit the training data too closely, capturing noise and idiosyncratic patterns that do not generalize to unseen data. An overfit model achieves high accuracy on the training set but poor accuracy on validation and test sets, indicating that it has memorized specific examples rather than learned the underlying data distribution. Overfitting is one of the most common failure modes in machine learning.',
      'Overfitting typically occurs when a model has too much capacity (too many parameters) relative to the amount of training data, when training continues for too many epochs, or when the training data is not representative of the deployment distribution. The model effectively \'memorizes\' the training examples, including their noise and outliers, rather than learning generalizable patterns. Symptoms include a training loss that continues to decrease while validation loss starts to increase — the point where validation loss begins to rise is the onset of overfitting.',
      'Common countermeasures include regularization techniques (L1/L2 weight decay, dropout), early stopping (halting training when validation performance degrades), data augmentation (increasing effective training set size), reducing model capacity, and cross-validation (to detect overfitting across different data splits). Monitoring the gap between training and validation metrics throughout training is essential for detecting and addressing overfitting before it significantly degrades model quality.',
    ],
    keyPoints: [
      'Model memorizes training data (including noise) instead of learning generalizable patterns',
      'Symptom: training loss decreases while validation loss increases',
      'Caused by excess model capacity, too many epochs, or unrepresentative data',
      'Countermeasures: regularization, early stopping, data augmentation, capacity reduction',
      'Monitor train-validation metric gap to detect onset',
    ],
    relatedTerms: ['regularization', 'dropout', 'early-stopping', 'weight-decay'],
    exampleUseCase:
      'A 100M-parameter model trained on only 1,000 examples achieves 99% training accuracy but 65% test accuracy — classic overfitting that requires more data or regularization.',
  },
  {
    slug: 'regularization',
    term: 'Regularization',
    category: 'Training',
    shortDefinition:
      'A set of techniques that constrain or penalize model complexity to prevent overfitting and improve generalization to unseen data.',
    definition: [
      'Regularization refers to a set of techniques designed to prevent overfitting by constraining or penalizing model complexity, encouraging the model to learn simpler, more generalizable patterns. Without regularization, models with sufficient capacity can fit the training data perfectly — including its noise — but fail to generalize. Regularization introduces a bias that trades a small amount of training performance for significantly improved performance on unseen data.',
      'The most common forms of regularization add penalty terms to the loss function. L1 regularization (Lasso) adds the absolute value of weights, encouraging sparsity (many weights become exactly zero). L2 regularization (Ridge, weight decay) adds the squared magnitude of weights, encouraging small but non-zero weights. Other regularization techniques include dropout (randomly deactivating neurons during training), early stopping (halting training before overfitting), data augmentation (artificially expanding the training set), and label smoothing (softening target distributions).',
      'The strength of regularization is controlled by a hyperparameter (often denoted λ or α) that balances the task loss against the regularization penalty. Too little regularization allows overfitting; too much causes underfitting (the model is too constrained to learn the data\'s patterns). The optimal regularization strength is typically found through hyperparameter tuning using validation data. For large language models, regularization strategies often combine weight decay, dropout, and data-level techniques like instruction diversity.',
    ],
    keyPoints: [
      'Constrains model complexity to prevent overfitting and improve generalization',
      'L1 (Lasso) induces sparsity; L2 (Ridge/weight decay) encourages small weights',
      'Other forms: dropout, early stopping, data augmentation, label smoothing',
      'Strength controlled by a hyperparameter (λ/α) tuned on validation data',
      'Too little → overfitting; too much → underfitting',
    ],
    relatedTerms: ['overfitting', 'dropout', 'weight-decay', 'early-stopping'],
    exampleUseCase:
      'Applying L2 weight decay with λ=0.01 and dropout with p=0.1 during fine-tuning to prevent a language model from overfitting to a small domain-specific dataset.',
  },
  {
    slug: 'mixture-of-experts',
    term: 'Mixture of Experts (MoE)',
    category: 'Architecture',
    shortDefinition:
      'An architecture that routes each input to a subset of specialized expert networks, increasing model capacity without proportional compute increase.',
    definition: [
      'Mixture of Experts (MoE) is a neural network architecture that increases model capacity without proportionally increasing computation by routing each input to a small subset of specialized \'expert\' sub-networks. An MoE layer contains multiple expert networks (e.g., 8, 16, or 64 feed-forward networks) and a gating/router network that determines which experts process each token. Only the selected experts are activated for a given input, so the total compute per token remains roughly constant while the total parameter count is much larger.',
      'For example, a model with 8 experts and top-2 routing has 8× the feed-forward parameters of a dense model but only uses 2 experts per token, so the per-token compute is only ~2× that of a single expert. This decoupling of parameters from compute allows MoE models to scale to very large parameter counts (hundreds of billions or trillions) while maintaining reasonable inference costs. The router is trained end-to-end alongside the experts, learning to specialize experts for different types of inputs or tasks.',
      'MoE introduces several challenges: load balancing (ensuring all experts receive roughly equal training signal, often addressed with auxiliary loss), routing instability, increased memory requirements (all expert parameters must be loaded even if only a subset is used per token), and communication overhead in distributed training. Despite these challenges, MoE has been adopted in major models including Mixtral, GPT-4, and DeepSeek-V3, and is a key technique for scaling model capacity efficiently.',
    ],
    keyPoints: [
      'Routes each input to a subset of expert networks via a learned gating/router',
      'Increases total parameters without proportional compute increase',
      'Top-k routing activates only k experts per token (e.g., top-2 of 8)',
      'Challenges: load balancing, routing stability, memory, distributed communication',
      'Used in Mixtral, GPT-4, and DeepSeek-V3 for efficient capacity scaling',
    ],
    relatedTerms: ['transformer-architecture', 'small-language-model'],
    exampleUseCase:
      'A model with 8 experts (47B total parameters) using top-2 routing, providing the capacity of a 47B model with the per-token compute cost of a ~12B dense model.',
  },
  {
    slug: 'rag',
    term: 'Retrieval-Augmented Generation (RAG)',
    category: 'Inference',
    shortDefinition:
      'A technique that augments model generation with relevant documents retrieved from an external knowledge source at inference time.',
    definition: [
      'Retrieval-Augmented Generation (RAG) is a technique that enhances a language model\'s output by retrieving relevant information from an external knowledge source at inference time, then conditioning the model\'s generation on the retrieved context. Rather than relying solely on knowledge encoded in the model\'s parameters, RAG dynamically accesses an external database or document store, allowing the model to cite up-to-date, domain-specific, or proprietary information without retraining.',
      'A typical RAG pipeline has three stages: retrieval, augmentation, and generation. First, the user\'s query is used to retrieve relevant documents from a vector database (using embedding similarity search) or a keyword-based index. Second, the retrieved documents are concatenated with the original query to form an augmented prompt. Third, the language model generates a response conditioned on this augmented context. The retrieval step uses an embedding model to convert text into dense vectors and a similarity metric (such as cosine similarity) to find the most relevant passages.',
      'RAG addresses several limitations of parametric knowledge: it enables access to information beyond the training cutoff, reduces hallucination by grounding responses in retrieved evidence, allows knowledge updates without retraining, and provides source attribution. However, RAG quality depends heavily on the retrieval component — if relevant documents are not retrieved, the model cannot use them. Challenges include retrieval precision, context window limitations, handling conflicting sources, and maintaining the vector index as the knowledge base evolves.',
    ],
    keyPoints: [
      'Retrieves relevant documents at inference time and conditions generation on them',
      'Pipeline: retrieve (embedding search) → augment (concatenate context) → generate',
      'Enables access to up-to-date, domain-specific, or proprietary knowledge without retraining',
      'Reduces hallucination by grounding responses in retrieved evidence',
      'Quality depends on retrieval precision; context window and index maintenance are challenges',
    ],
    relatedTerms: ['chain-of-thought', 'embedding', 'tokenization'],
    exampleUseCase:
      'A customer support chatbot that retrieves relevant product documentation and past ticket resolutions before generating a response, grounding its answers in verified information.',
  },
  {
    slug: 'beam-search',
    term: 'Beam Search',
    category: 'Inference',
    shortDefinition:
      'A decoding strategy that maintains multiple candidate sequences at each step, selecting the highest-probability complete output.',
    definition: [
      'Beam Search is a decoding strategy for autoregressive sequence generation that maintains a fixed number (the \'beam width\') of candidate sequences at each step, rather than greedily selecting the single most likely token. At each step, the algorithm expands each candidate by all possible next tokens, computes the cumulative probability of each extended sequence, and retains only the top-k candidates. This explores a broader portion of the output space than greedy decoding, typically producing higher-quality outputs.',
      'The beam width k controls the trade-off between search quality and computational cost. A beam width of 1 is equivalent to greedy decoding (always selecting the most probable token). Larger beam widths explore more possibilities but require k× more computation per step and more memory. Beam search is widely used in machine translation, summarization, and other tasks where output quality matters more than generation speed. However, it can produce generic or repetitive outputs, and the highest-probability sequence is not always the most desirable — particularly for open-ended generation.',
      'Beam search can be combined with length normalization (to avoid bias toward short sequences), diversity penalties (to reduce repetition among beam candidates), and temperature scaling (to control the sharpness of the probability distribution). For open-ended or creative generation tasks, sampling-based methods (top-k sampling, nucleus/top-p sampling) are often preferred over beam search, as they produce more diverse and natural-sounding outputs.',
    ],
    keyPoints: [
      'Maintains k candidate sequences (beam width) at each decoding step',
      'Beam width 1 = greedy decoding; larger k explores more but costs more compute',
      'Widely used for translation, summarization; can produce generic/repetitive text',
      'Length normalization and diversity penalties improve quality',
      'Sampling methods (top-k, nucleus) preferred for open-ended generation',
    ],
    relatedTerms: ['temperature-scaling', 'chain-of-thought'],
    exampleUseCase:
      'Using beam search with width 5 and length normalization for machine translation, exploring 5 candidate translations at each step and selecting the highest-probability complete sentence.',
  },
  {
    slug: 'dropout',
    term: 'Dropout',
    category: 'Training',
    shortDefinition:
      'A regularization technique that randomly deactivates a fraction of neurons during training, preventing co-adaptation and improving generalization.',
    definition: [
      'Dropout is a regularization technique that randomly deactivates (sets to zero) a fraction of neurons during each training step, forcing the network to learn redundant, robust representations rather than relying on specific neurons. The dropout rate p (typically 0.1–0.5) determines the fraction of activations zeroed out. During inference, all neurons are active and their outputs are scaled by (1−p) to compensate for the training-time dropout.',
      'By randomly dropping neurons, dropout prevents co-adaptation — a phenomenon where neurons become overly dependent on specific other neurons and fail to function independently. This effectively trains an ensemble of sub-networks (all possible dropout masks) within a single model, and the full model at inference can be viewed as an approximation of averaging over this ensemble. Dropout is conceptually similar to bagging in traditional machine learning.',
      'Dropout can be applied to different parts of the network: hidden layer activations (standard dropout), attention weights (attention dropout), or embeddings. While effective, dropout interacts with other techniques — it is generally not combined with batch normalization in the same layer, and its effect must be accounted for when using techniques like weight decay. For large language models, relatively low dropout rates (0.0–0.1) are typically used, as these models benefit more from the data and scale than from aggressive regularization.',
    ],
    keyPoints: [
      'Randomly zeroes a fraction p of activations during each training step',
      'Prevents neuron co-adaptation; trains an implicit ensemble of sub-networks',
      'At inference, all neurons active; outputs scaled by (1−p)',
      'Typical rates: 0.1–0.5; LLMs often use 0.0–0.1',
      'Interacts with batch normalization and weight decay; not always combinable',
    ],
    relatedTerms: ['regularization', 'overfitting'],
    exampleUseCase:
      'Applying dropout with p=0.1 to the feed-forward layers of a language model during fine-tuning to prevent overfitting on a small dataset of 5,000 examples.',
  },
  {
    slug: 'cross-entropy-loss',
    term: 'Cross-Entropy Loss',
    category: 'Training',
    shortDefinition:
      'A loss function measuring the difference between predicted probability distributions and true labels, standard for classification and language modeling.',
    definition: [
      'Cross-Entropy Loss is a loss function that measures the difference between a model\'s predicted probability distribution and the true distribution (typically a one-hot encoded label). For classification tasks, it quantifies how far the model\'s predicted probabilities are from the correct class. In language modeling, cross-entropy loss is computed at each token position: the model predicts a probability distribution over the vocabulary, and the loss measures how much probability the model assigned to the actual next token.',
      'Mathematically, cross-entropy loss for a single example is L = −Σ y_i log(p_i), where y_i is the true probability (1 for the correct class, 0 otherwise) and p_i is the model\'s predicted probability for class i. For language models, this simplifies to L = −log(p_correct_token), the negative log-likelihood of the correct next token. Minimizing cross-entropy loss is equivalent to maximum likelihood estimation — the model learns to assign high probability to the correct outputs.',
      'Cross-entropy loss is the standard loss function for training language models and classification networks. It is typically paired with the softmax function, which converts raw logits into a probability distribution. In knowledge distillation, a modified cross-entropy loss (using the teacher\'s softened distribution with temperature scaling) is used to transfer the teacher\'s \'dark knowledge.\' The gradient of cross-entropy with respect to the logits has a simple form (predicted − true), making it computationally efficient for backpropagation.',
    ],
    keyPoints: [
      'Measures difference between predicted and true probability distributions',
      'For language models: L = −log(p_correct_token) (negative log-likelihood)',
      'Equivalent to maximum likelihood estimation',
      'Paired with softmax; gradient w.r.t. logits is (predicted − true)',
      'Modified version used in knowledge distillation with temperature scaling',
    ],
    relatedTerms: ['backpropagation', 'temperature-scaling', 'knowledge-distillation'],
    exampleUseCase:
      'Training a language model where each token\'s loss is the negative log-probability the model assigns to the actual next token in the training sequence.',
  },
  {
    slug: 'backpropagation',
    term: 'Backpropagation',
    category: 'Training',
    shortDefinition:
      'The algorithm used to compute gradients of the loss with respect to all model weights by applying the chain rule backward through the network.',
    definition: [
      'Backpropagation (backprop) is the algorithm used to compute the gradients of a loss function with respect to all weights in a neural network, enabling weight updates via gradient descent. It works by applying the chain rule of calculus backward through the network: starting from the loss at the output, it computes gradients layer-by-layer from the last layer to the first, reusing intermediate computations from the forward pass to efficiently calculate all gradients in a single backward pass.',
      'The forward pass computes the model\'s output and stores intermediate activations. The backward pass then propagates the gradient of the loss backward through each layer: for each layer, it computes the gradient of the loss with respect to the layer\'s inputs (which becomes the input gradient for the previous layer) and the gradient with respect to the layer\'s weights (used for the weight update). This recursive application of the chain rule makes computing all gradients require only about twice the computation of a single forward pass, regardless of the number of parameters.',
      'Backpropagation is implemented automatically by deep learning frameworks (PyTorch autograd, TensorFlow GradientTape, JAX grad) through computational graphs. Each operation records its gradient computation, and the framework traverses the graph backward to accumulate gradients. Modern implementations handle complex architectures (skip connections, attention, custom layers) transparently. The computed gradients are then used by optimizers (SGD, Adam, AdamW) to update weights, with the learning rate controlling the step size.',
    ],
    keyPoints: [
      'Computes gradients of loss w.r.t. all weights via the chain rule, backward',
      'Reuses forward-pass intermediate activations for efficiency',
      'Single backward pass ≈ 2× forward pass cost, regardless of parameter count',
      'Automated by frameworks (PyTorch autograd, TF GradientTape, JAX grad)',
      'Gradients fed to optimizers (SGD, Adam, AdamW) for weight updates',
    ],
    relatedTerms: ['cross-entropy-loss', 'learning-rate', 'gradient-accumulation'],
    exampleUseCase:
      'During language model training, backpropagation computes gradients for all transformer layer weights in a single backward pass from the cross-entropy loss.',
  },
  {
    slug: 'hyperparameter-tuning',
    term: 'Hyperparameter Tuning',
    category: 'Optimization',
    shortDefinition:
      'The process of finding optimal hyperparameter values (learning rate, batch size, etc.) that maximize model performance on validation data.',
    definition: [
      'Hyperparameter Tuning is the process of searching for the optimal values of hyperparameters — configuration settings that are not learned during training but must be set before training begins. Unlike model parameters (weights), which are updated by the optimizer, hyperparameters control the training process itself and the model\'s architecture. Key hyperparameters include learning rate, batch size, number of layers, hidden dimension size, dropout rate, weight decay, and the number of training epochs.',
      'Hyperparameters significantly impact model performance — a poorly chosen learning rate can mean the difference between a model that trains successfully and one that never converges. Common tuning strategies include grid search (exhaustively evaluating all combinations of a predefined set of values), random search (sampling hyperparameter values from defined distributions), and Bayesian optimization (building a probabilistic model of the hyperparameter-performance relationship to guide the search). Random search is often more efficient than grid search because not all hyperparameters are equally important.',
      'Modern approaches also include population-based training (evolving hyperparameters during training), Hyperband (early termination of poorly performing configurations), and automated tools like Optuna and Ray Tune. Hyperparameter tuning is computationally expensive because each configuration requires a full (or partial) training run. Best practices include using validation data (never test data) for evaluation, starting with established recipes before tuning, and prioritizing the most impactful hyperparameters (learning rate, batch size, regularization strength) over less sensitive ones.',
    ],
    keyPoints: [
      'Finds optimal values for training-config settings (LR, batch size, epochs, etc.)',
      'Strategies: grid search, random search, Bayesian optimization, population-based',
      'Random search often more efficient than grid search',
      'Computationally expensive; each config requires a training run',
      'Prioritize impactful hyperparameters: learning rate, batch size, regularization',
    ],
    relatedTerms: ['learning-rate', 'batch-size', 'early-stopping'],
    exampleUseCase:
      'Running a Bayesian optimization search over learning rate (1e-5 to 5e-4) and weight decay (0.0 to 0.1) to find the configuration that maximizes validation accuracy for a fine-tuning run.',
  },
  {
    slug: 'early-stopping',
    term: 'Early Stopping',
    category: 'Training',
    shortDefinition:
      'A regularization technique that halts training when validation performance stops improving, preventing overfitting.',
    definition: [
      'Early Stopping is a regularization technique that halts training when the model\'s performance on a validation set stops improving, even if the training loss continues to decrease. The rationale is that after a certain point, continued training causes the model to fit noise and idiosyncrasies in the training data rather than learning generalizable patterns — i.e., overfitting. Early stopping prevents this by preserving the model at the point of best validation performance.',
      'The standard implementation monitors a validation metric (e.g., validation loss or accuracy) after each epoch. If the metric does not improve for a specified number of consecutive epochs (the \'patience\' parameter), training is stopped. The model weights from the epoch with the best validation metric are typically saved and used for deployment. Some implementations use a more nuanced criterion, such as requiring the validation loss to decrease by at least a minimum threshold (min_delta) to count as an improvement.',
      'Early stopping is computationally efficient — it avoids wasting compute on epochs that would only overfit — and acts as implicit regularization by limiting the effective number of training steps. It is one of the simplest and most effective regularization techniques, often used in combination with other methods like weight decay and dropout. The patience parameter trades off between training thoroughness (higher patience allows more epochs, potentially finding better solutions) and overfitting risk (lower patience stops sooner).',
    ],
    keyPoints: [
      'Halts training when validation performance stops improving',
      'Patience parameter: number of epochs to wait before stopping',
      'Saves model weights from the epoch with best validation metric',
      'Computationally efficient; acts as implicit regularization',
      'Often combined with weight decay and dropout',
    ],
    relatedTerms: ['overfitting', 'regularization', 'hyperparameter-tuning'],
    exampleUseCase:
      'Monitoring validation loss during fine-tuning with patience=3, stopping training if the loss doesn\'t improve for 3 consecutive epochs and saving the best checkpoint.',
  },
  {
    slug: 'weight-decay',
    term: 'Weight Decay',
    category: 'Training',
    shortDefinition:
      'An L2 regularization technique that penalizes large weights by adding their squared magnitude to the loss, encouraging simpler models.',
    definition: [
      'Weight Decay is an L2 regularization technique that penalizes large weight values by adding a term proportional to the squared magnitude of the weights to the loss function. The regularized loss becomes L_total = L_task + λ × Σ(w_i²), where λ is the weight decay coefficient. This encourages the optimizer to keep weights small, producing simpler models that are less likely to overfit to training data noise.',
      'By penalizing large weights, weight decay prevents any single weight from dominating the model\'s predictions, encouraging the model to distribute its reliance across many features rather than depending heavily on a few. This produces smoother decision boundaries and more robust generalization. In practice, weight decay is often implemented not by modifying the loss function but by directly shrinking weights at each update step: w_new = w_old × (1 − lr × λ) − lr × gradient. This is the implementation used by the AdamW optimizer, which decouples weight decay from the gradient-based update.',
      'The distinction between L2 regularization and weight decay matters for adaptive optimizers like Adam. In Adam, coupling weight decay to the gradient (as in L2 regularization) causes it to be scaled by the adaptive per-parameter learning rates, leading to uneven regularization. AdamW (Adam with decoupled Weight decay) addresses this by applying weight decay directly to the weights, independent of the gradient and adaptive learning rates. This decoupled form is the standard for training modern language models.',
    ],
    keyPoints: [
      'L2 regularization: adds λ × Σ(w_i²) to the loss',
      'Encourages small weights, smoother decision boundaries, better generalization',
      'Implemented as direct weight shrinking: w = w × (1 − lr × λ) − lr × grad',
      'AdamW decouples weight decay from adaptive learning rates (vs. L2 in Adam)',
      'Standard regularization for modern language model training',
    ],
    relatedTerms: ['regularization', 'overfitting', 'learning-rate'],
    exampleUseCase:
      'Using AdamW with weight decay λ=0.01 during language model pre-training to prevent overfitting and improve generalization across diverse downstream tasks.',
  },
  {
    slug: 'embedding',
    term: 'Embedding',
    category: 'Architecture',
    shortDefinition:
      'A learned dense vector representation of discrete tokens or entities that captures semantic relationships in continuous space.',
    definition: [
      'An Embedding is a learned dense vector representation that maps discrete entities — such as tokens, words, sentences, images, or graph nodes — into a continuous vector space where geometric proximity reflects semantic similarity. In language models, an embedding layer maps each token ID to a learned vector of fixed dimension (e.g., 768, 4096), transforming discrete symbolic input into the continuous numerical representation that neural networks process.',
      'The key property of embedding spaces is that they capture semantic relationships: entities with similar meanings are positioned close together in the space, and directions in the space can encode relationships (e.g., the classic word2vec result that vec(\'king\') − vec(\'man\') + vec(\'woman\') ≈ vec(\'queen\')). This structure emerges naturally from training objectives — language model embeddings learn from context prediction, while contrastive embeddings (like sentence transformers) learn from positive/negative pairs.',
      'Embeddings are used throughout modern AI systems: token embeddings at the input of language models, positional embeddings to encode token order, sentence/document embeddings for semantic search and RAG, image embeddings for visual similarity, and multimodal embeddings that align text and image spaces (as in CLIP). The quality of embeddings directly impacts downstream task performance, and embedding models are often evaluated on retrieval benchmarks, analogy tasks, and clustering quality.',
    ],
    keyPoints: [
      'Maps discrete entities (tokens, words, images) into continuous vector space',
      'Geometric proximity reflects semantic similarity',
      'Directions can encode relationships (e.g., king − man + woman ≈ queen)',
      'Used for: token input, positional encoding, semantic search, RAG, multimodal alignment',
      'Quality directly impacts downstream tasks; evaluated on retrieval and analogy benchmarks',
    ],
    relatedTerms: ['tokenization', 'attention-mechanism', 'transformer-architecture', 'latent-space'],
    exampleUseCase:
      'Using a sentence embedding model to convert customer support tickets into vectors, then finding similar past tickets via cosine similarity to suggest relevant resolutions.',
  },
  {
    slug: 'latent-space',
    term: 'Latent Space',
    category: 'Architecture',
    shortDefinition:
      'A learned lower-dimensional continuous representation that captures the essential structure of data, enabling efficient manipulation and generation.',
    definition: [
      'Latent Space (also called latent space or embedding space) is a learned, typically lower-dimensional continuous representation that captures the essential structure of complex data. Rather than operating on raw, high-dimensional data (e.g., pixels, audio samples, text tokens), models project data into a latent space where semantically meaningful variations are represented as directions and magnitudes. Points close together in latent space correspond to similar data points, and traversing the space produces smooth interpolations.',
      'Latent spaces are central to many model architectures. Autoencoders learn to compress data into a latent code and reconstruct it, with the latent space capturing the data\'s intrinsic structure. Variational autoencoders (VAEs) impose a probabilistic structure on the latent space, enabling generation of new samples by sampling from the prior. Diffusion and flow-matching models operate in latent space to generate images, audio, and other data. World models represent environment states in latent space for efficient prediction and planning.',
      'The dimensionality and structure of the latent space are critical design choices. Too few dimensions lose information (underfitting); too many fail to compress meaningfully and may overfit. Techniques like disentangled representations aim to make individual latent dimensions correspond to interpretable, independent factors of variation (e.g., pose, color, scale). Latent space arithmetic — combining and manipulating latent vectors — enables applications like image editing, style transfer, and controlled generation.',
    ],
    keyPoints: [
      'Lower-dimensional continuous representation capturing essential data structure',
      'Proximity reflects similarity; traversing produces smooth interpolations',
      'Central to autoencoders, VAEs, diffusion, flow matching, and world models',
      'Dimensionality is a critical design choice (too few: underfit; too many: overfit)',
      'Latent arithmetic enables controlled generation and editing',
    ],
    relatedTerms: ['embedding', 'world-models', 'flow-matching'],
    exampleUseCase:
      'A VAE that encodes face images into a 256-dimensional latent space, where moving along specific dimensions smoothly varies attributes like smile intensity or head pose.',
  },
]

export const glossaryCategories = [
  'Training',
  'Architecture',
  'Optimization',
  'Deployment',
  'Inference',
  'Evaluation',
] as const

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug)
}

export function getRelatedTerms(slugs: string[]): GlossaryTerm[] {
  return slugs
    .map((slug) => glossaryTerms.find((t) => t.slug === slug))
    .filter((t): t is GlossaryTerm => t !== undefined)
}
