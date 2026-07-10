# Training Plan: Jamba Hybrid SSM-Agent Model

**Goal**: Train a functional small AI model with autonomous computer use, advanced multi-agent workflows, 1M self-managed context, enterprise coding, and MCP support.

**Architecture**: Jamba2 hybrid Transformer-Mamba (26 Mamba + 2 Attention layers per 28-layer block, configurable ratio).

**Base model**: Jamba Reasoning 3B (Apache 2.0, 256K native context, up to 1M extended, already has GRPO post-training).

**Training framework**: VeRL (volcengine/verl) — the open-source GRPO framework used by DeepSeek, with Jamba support contributed by AI21.

**Training infra**: Rented GPUs (RunPod / Vast.ai / Lambda Labs).

**Estimated cost**: ~$3-5k (Jamba2 3B on 4× A100) or ~$12-18k (Jamba 1.5 Mini on 8× A100).

**Estimated timeline**: 3-6 days.

---

## Phase 0: Platform & Model Selection

### Why Jamba over alternatives

| Criterion | Jamba Reasoning 3B | RWKV-6 7B | Qwen3-8B | Tinker (Qwen3.5-9B) |
|---|---|---|---|---|
| **Hybrid SSM-Attention** | ✅ Native (26 Mamba + 2 Attn) | ❌ Pure SSM | ❌ Pure Attention | ❌ Pure Attention |
| **1M context** | ✅ Up to 1M supported | ✅ O(1) state | ❌ O(n²) KV cache | ❌ Max 64K |
| **Coding quality** | ✅ Competitive at 3B | ⚠️ Below transformer | ✅ Strong | ✅ Strong |
| **GRPO training support** | ✅ VeRL (contributed by AI21) | ⚠️ Custom framework | ✅ Tinker | ✅ Tinker |
| **Cost (train)** | ~$3-5k (rented GPUs) | ~$5-8k (rented GPUs) | ~$15k (Tinker) | ~$50-60k (Tinker) |
| **License** | Apache 2.0 | Apache 2.0 | Qwen License | Qwen License |
| **Model size** | 3B (phone/laptop) | 7B (GPU needed) | 8B (GPU needed) | 9B (GPU needed) |

### Available Jamba Models

| Model | Active Params | Total Params | Context | Architecture | Released |
|---|---|---|---|---|---|
| **Jamba2 3B** | 3B | 3B | 256K | Hybrid (no MoE) | Jan 2026 |
| **Jamba Reasoning 3B** | 3B | 3B | 256K (up to 1M) | Hybrid, GRPO post-trained | Oct 2025 |
| **Jamba 1.5 Mini** | 12B | 52B | 256K | Hybrid + MoE | Aug 2024 |
| **Jamba2 Mini** | TBD | TBD | 256K | Hybrid (Jamba2 gen) | Jan 2026 |

**Recommendation**: Start with **Jamba Reasoning 3B** — it's Apache 2.0, has 1M context capability, already has GRPO post-training we can build on, and is small enough to run on consumer devices. For the minimum viable training cost (~$3-5k), it's the best risk/reward. If coding quality is insufficient, scale up to **Jamba 1.5 Mini** (12B active).

---

## Phase 1: Infrastructure Setup

### Platform: VeRL + Rented GPUs

AI21 contributed Jamba hybrid-model support directly to VeRL (verl/volcengine), the same open-source GRPO framework used to train DeepSeek-R1. This gives us native GRPO with hybrid SSM-Attention models — no custom framework needed.

**Recommended GPU rental providers:**

| Provider | Jamba2 3B (4× A100 80GB) | Jamba 1.5 Mini (8× A100 80GB) |
|---|---|---|
| **RunPod** | ~$2.50/hr | ~$6.00/hr |
| **Vast.ai** | ~$1.80/hr | ~$4.50/hr |
| **Lambda Labs** | ~$3.20/hr | ~$8.00/hr |
| **Together AI** | Managed training API (check Jamba support status) | — |

**Environment setup:**
```bash
# Clone VeRL with Jamba support
git clone https://github.com/volcengine/verl
cd verl

# Install with hybrid model support
pip install -e .[jamba]  # AI21 contributed Jamba hybrid support

# Install Jamba dependencies
pip install mamba-ssm causal-conv1d>=1.2.0
pip install git+https://github.com/huggingface/transformers  # latest for Jamba2

# Verify Jamba support
python -c "from verl.utils.model import get_model; print('Jamba hybrid: OK')"
```

### Batch-Invariant Kernels

Since we control our own GPU environment (not using Tinker/vLLM), we can implement batch-invariant kernels directly. This ensures **0 KL divergence** between sampler and trainer.

**Concrete config for VeRL:**
- VeRL's rollout worker uses vLLM or HF generate — configure vLLM with deterministic mode
- Jamba's hybrid attention uses FlashAttention-2 — ensure consistent tile sizing
- For the Mamba scan: fix the chunk size regardless of batch dimension
- Set `deterministic: true` in the VeRL config

### LoRA Configuration

Based on Schulman's LoRA Without Regret findings, applied to Jamba's hybrid architecture:

| Parameter | Value | Rationale |
|---|---|---|
| **Rank** | 16 (SFT), 8 (RL) | RL teaches O(1) bits/episode → rank 1 suffices |
| **Target modules** | ALL linear layers in both Mamba and Attention blocks | `x_proj`, `in_proj`, `out_proj` (Mamba) + `q_proj`, `k_proj`, `v_proj`, `o_proj` (Attention) + `gate_proj`, `up_proj`, `down_proj` (MLP/MoE) |
| **Scaling α** | 32 | HF PEFT default, empirically optimal |
| **LoRA LR** | 10× FullFT LR | Stable across Llama, Qwen, confirmed by Schulman |
| **A/B LR ratio** | 1:1 | LoRA+ style separate LRs provide no benefit |
| **Init** | A: uniform 1/√d_in, B: zero | Standard, couldn't be improved |

**Jamba-specific LoRA target modules:**
```python
lora_config = LoraConfig(
    r=16,
    target_modules=[
        # Mamba layers
        "x_proj", "in_proj", "out_proj",
        # Attention layers  
        "q_proj", "k_proj", "v_proj", "o_proj",
        # MLP/MoE layers
        "gate_proj", "up_proj", "down_proj",
        # Embedding
        "embed_tokens",
    ],
    task_type="CAUSAL_LM",
    bias="none",
)
```

---

## Phase 2: Supervised Fine-Tuning on Jamba

### Data Construction

**Expert-Verified Pipeline** (from Bridgewater + Thinking Machines):

```
1. Collect N trajectories from teacher (frontier model, ~50K examples)
2. Train a quick rank-8 LoRA on this data (1-2 hours on 4× A100)
3. Run the LoRA model back on its own training data
4. Flag ALL examples where model prediction ≠ label
5. Send ONLY flagged examples to human expert (~5-10% of data)
6. Re-label and retrain
```

This catches ~30-40% of cheap labels as wrong while requiring minimal expert time.

### VeRL SFT Config

```yaml
# config/sft_jamba.yaml
model:
  name: ai21labs/AI21-Jamba-Reasoning-3B
  trust_remote_code: true
  
data:
  train_files: ./data/sft_mixed.parquet
  max_length: 32768  # 32K for SFT phase
  truncation: right

lora:
  rank: 16
  target_modules:
    - "x_proj"
    - "in_proj" 
    - "out_proj"
    - "q_proj"
    - "k_proj"
    - "v_proj"
    - "o_proj"
    - "gate_proj"
    - "up_proj"
    - "down_proj"
  lr: 2e-4  # 10× FullFT baseline of 2e-5

training:
  optimizer: adamw
  lr_schedule: constant
  batch_size: 32
  gradient_checkpointing: true
  mixed_precision: bf16
  total_steps: 2000
  warmup_steps: 0  # constant LR, no warmup (Schulman finding)

data_mix:  # Interleaved batching — 12.1% accuracy gain
  - task: code
    path: ./data/code_trajectories.parquet
    weight: 0.60
  - task: computer_use
    path: ./data/gui_tasks.parquet
    weight: 0.20
  - task: multi_agent
    path: ./data/multi_agent_logs.parquet
    weight: 0.10
  - task: mcp_tool_use
    path: ./data/mcp_demos.parquet
    weight: 0.10
```

**Interleaved batching** (round-robin per task, not fully mixed):
```python
# In the VeRL training loop:
tasks = ["code", "computer_use", "multi_agent", "mcp"]
for step in range(total_steps):
    for task in tasks:
        batch = dataloader[task].sample(batch_size=8)
        trainer.forward_backward(batch)
```

**Expected outcome**: SFT baseline ~60% on held-out task suite. ~2-4 hours on 4× A100.

---

## Phase 3: GRPO + On-Policy Distillation (VeRL Loop)

### Core Algorithm

VeRL natively supports GRPO. We extend it with On-Policy Distillation by adding a teacher logprob computation in the reward loop.

```
For each training step:
  1. Rollout G=8 trajectories from student (LoRA) model   [VeRL: ActorWorker]
  2. For each rollout:
     a. Compute environment rewards (code test pass, GUI success, etc.)
     b. Compute teacher logprobs on the full trajectory    [OPD addition]
     c. Token-level distillation advantage = -β·KL(π_θ || π_teacher)
  3. Group-level advantage = (reward - mean(rewards)) / std(rewards)  [GRPO]
  4. Final advantage = λ·GRPO_advantage + (1-λ)·OPD_advantage
  5. Optimize with CISPO (asymmetric clipping) loss
```

### VeRL GRPO Config

```yaml
# config/grpo_jamba.yaml
model:
  name: ai21labs/AI21-Jamba-Reasoning-3B
  trust_remote_code: true
  load_from: ./checkpoints/sft_phase  # Start from Phase 2 checkpoint

actor:
  lora:
    rank: 8
    target_modules:
      - "x_proj"  # Mamba
      - "in_proj"
      - "out_proj"
      - "q_proj"  # Attention
      - "k_proj"
      - "v_proj"
      - "o_proj"
      - "gate_proj"  # MLP/MoE
      - "up_proj"
      - "down_proj"
    lr: 2e-4
  model_path: ai21labs/AI21-Jamba-Reasoning-3B

ref:  # Reference model for KL penalty
  name: ai21labs/AI21-Jamba-Reasoning-3B  # Frozen base

teacher:  # OPD teacher
  name: ai21labs/AI21-Jamba-Reasoning-3B  # Or earlier checkpoint
  update_method: best_val_checkpoint
  update_interval: 20

algorithm:
  name: grpo  # VeRL's native GRPO
  group_size: 8
  temperature: 1.0
  
  # GRPO params
  kl_penalty_beta: 0.04
  clip_epsilon: 0.2
  
  # OPD extension
  on_policy_distillation: true
  lambda_grpo: 0.3  # 30% GRPO, 70% OPD
  teacher_logprobs_weight: 0.7
  
  # CISPO loss (replaces importance-sampling)
  loss_fn: cispo
  cispo_epsilon_pos: 0.2
  cispo_epsilon_neg: 0.3  # asymmetric

training:
  optimizer: adamw
  lr_schedule: constant
  mixed_precision: bf16
  gradient_checkpointing: true
  total_steps: 1700

rollout:
  max_length: 16384  # Curriculum varies; start here
  temperature: 1.0
  top_p: 0.9
  num_rollouts: 512  # 64 prompts × 8 samples
  batch_size: 64  # prompts per step

rewards:
  - name: code_pass_rate
    env: sandbox
    weight: 0.35
    backend: modal  # Or custom sandbox
  - name: gui_task_success
    env: os_world
    weight: 0.25
  - name: multi_agent_coordination
    env: multi_agent_sim
    weight: 0.15
  - name: mcp_tool_accuracy
    env: mcp_server
    weight: 0.10
  - name: context_retrieval
    env: needle_haystack
    weight: 0.10
    test_length: 256000  # 256K needle-in-haystack
  - name: kl_regularization
    env: kl_div
    weight: 0.05
```

### Curriculum Schedule

| Stage | Tokens/rollout | Data focus | Steps | Est. time (4× A100) |
|---|---|---|---|---|
| 1 | 2K | Single-step tool use, basic code | 200 | ~2h |
| 2 | 8K | Multi-step agent loops, computer use | 500 | ~8h |
| 3 | 32K | Multi-agent coordination, long-context QA | 500 | ~16h |
| 4 | 64K | Mixed tasks, longer rollouts | 300 | ~14h |
| 5 | 128K+ | Needle/haystack, agent memory at scale | 200 | ~16h |

**Total**: ~1,700 steps, ~56 hours on 4× A100 (~$100-180 in GPU rental).

### Running the Training

```bash
# Stage 1-2 (short context)
python -m verl.trainer.main \
    --config config/grpo_jamba.yaml \
    --rollout.max_length 2048 \
    --training.total_steps 200

# Promote OPD teacher if validation improves
python -m verl.worker.promote_teacher \
    --checkpoint ./checkpoints/step_200 \
    --condition val_accuracy_improved

# Stage 3 (mid context)
python -m verl.trainer.main \
    --config config/grpo_jamba.yaml \
    --rollout.max_length 32768 \
    --training.total_steps 500 \
    --load_from ./checkpoints/step_200

# Stage 4-5 (long context — may need to adjust batch size)
python -m verl.trainer.main \
    --config config/grpo_jamba.yaml \
    --rollout.max_length 131072 \
    --training.total_steps 500 \
    --training.batch_size 16 \  # fewer prompts at long context
    --load_from ./checkpoints/step_700
```

---

## Phase 4: Continual Learning & Behavior Recovery

### The Problem

After GRPO, Jamba may forget base capabilities (instruction following, formatting). AI21's own Jamba 1.5 paper confirms this: "post-training objectives are partly conflicting with long-context retention."

### Solution: OPD for Behavior Recovery

Same approach as the Thinking Machines personalization study:

```
Loop:
  1. Fine-tune on new domain data (SFT, 500 steps)
  2. On-policy distill from EARLIER checkpoint (the SFT checkpoint, before GRPO)
  3. Evaluate IF-eval; if recovered > threshold, advance to next domain
```

**VeRL implementation:**
```bash
# Recovery phase
python -m verl.trainer.main \
    --config config/recovery_jamba.yaml \
    --teacher.checkpoint ./checkpoints/sft_phase \  # Pre-GRPO checkpoint
    --algorithm.on_policy_distillation true \
    --algorithm.lambda_grpo 0.0 \  # Pure OPD, no GRPO
    --data.path ./data/tulu3_chat_prompts \
    --training.total_steps 100
```

**Expected result**: IF-eval recovers from ~60% → ~83%, knowledge retention stays at ~95%.

---

## Phase 5: 1M Context Extension

### Jamba's Native Advantage

Jamba's hybrid architecture handles long context natively:
- Mamba layers: O(n) memory, fixed-size state
- Attention layers (sparse, every 7th): provide recall for needle-in-haystack
- Total KV cache at 1M tokens: ~2-4 GB (vs ~80+ GB for pure transformer at 1M)

### Extension Pipeline

AI21's Jamba Reasoning 3B paper describes their long-context method:

1. **Position interpolation**: Scale RoPE frequencies for the attention layers (only 2 of 28 layers)
2. **Mamba state scaling**: Adjust the Mamba state initialization for longer sequences
3. **Mid-training on long documents**: Mix long docs into the GRPO curriculum (Stage 4-5 above)

```yaml
# config/long_context_extension.yaml
model:
  name: ./checkpoints/grpo_complete
  rope_scaling:
    type: linear
    factor: 4.0  # Extend from 256K → 1M
  mamba_state_scaling:
    enabled: true
    scaling_factor: 2.0

training:
  data_mix:
    - path: ./data/long_docs_mixed.parquet  # Books, code repos, agent logs
      weight: 0.7
      min_length: 65536
      max_length: 1048576
    - path: ./data/short_chat.parquet  # Mix to retain chat capability
      weight: 0.3
  total_steps: 500
  max_length: 1048576  # 1M context
  batch_size: 2  # Tiny batch at 1M context
  gradient_checkpointing: true
  mixed_precision: bf16
```

**Expected cost**: ~$500-800 on 8× A100 for 500 steps at 1M context.

---

## Cost & Timeline Summary

### Scenario A: Jamba Reasoning 3B (Recommended Start)

| Phase | Provider | GPUs | Wall Time | GPU Cost |
|---|---|---|---|---|
| SFT (Phase 2) | RunPod | 4× A100-80GB | 4h | ~$10 |
| GRPO+OPD (Phase 3) | RunPod | 4× A100-80GB | 2.5 days | ~$150 |
| Continual Learning (Phase 4) | RunPod | 4× A100-80GB | 4h | ~$10 |
| 1M Extension (Phase 5) | RunPod | 8× A100-80GB | 12h | ~$60 |
| **Total** | | | **~4 days** | **~$230** |
| + Buffer/experiments | | | +2 days | ~$120 |
| **Grand total** | | | **~6 days** | **~$350** |

### Scenario B: Jamba 1.5 Mini (12B active, better coding)

| Phase | Provider | GPUs | Wall Time | GPU Cost |
|---|---|---|---|---|
| SFT | RunPod | 8× A100-80GB | 8h | ~$48 |
| GRPO+OPD | RunPod | 8× A100-80GB | 4 days | ~$576 |
| Continual Learning | RunPod | 8× A100-80GB | 6h | ~$36 |
| 1M Extension | RunPod | 16× A100-80GB | 16h | ~$192 |
| **Total** | | | **~6 days** | **~$852** |

### Cost Comparison vs Alternatives

| Approach | Total Cost | Timeline | Coding Quality | 1M Context |
|---|---|---|---|---|
| **Jamba Reasoning 3B (self-hosted)** | **$350** | 6 days | Good for 3B | ✅ Native |
| Jamba 1.5 Mini (self-hosted) | $850 | 6 days | Better | ✅ Native |
| Qwen3-8B via Tinker | $50-60k | 5-7 days | Strong | ❌ Max 64K |
| RWKV-6 7B (self-hosted) | $2-3k | 7-10 days | Fair | ✅ Native |

Jamba Reasoning 3B is **140× cheaper** than the Tinker route with comparable or better 1M context handling.

---

## Expected Performance vs Claude Mythos

| Capability | Jamba Reasoning 3B | Jamba 1.5 Mini | Claude Mythos (reference) |
|---|---|---|---|
| **Computer use** | Good for simple tasks | Strong for most tasks | Frontier |
| **Multi-agent** | Good (256K context helps) | Strong | Frontier |
| **Coding (common patterns)** | 60-70% of Mythos | 75-85% of Mythos | 100% |
| **Coding (novel/arch)** | 40-50% of Mythos | 60-70% of Mythos | 100% |
| **1M context recall** | ~85% (native) | ~90% (native) | ~95% |
| **MCP support** | Full | Full | Full |
| **Inference speed** | 40 tok/s on laptop | Requires GPU | Cloud API only |
| **Local deployment** | ✅ Phone/laptop | ⚠️ 80GB GPU | ❌ |

Jamba Reasoning 3B won't beat Claude Mythos on novel coding, but for **agentic workflows** (computer use, multi-agent, long-context retrieval, MCP tool use) it's uniquely capable at its size. The 1M native context is something no comparably-sized transformer can match.

---

## Hyperparameter Reference Sheet

### Complete YAML

```yaml
# config/jamba_full.yaml
model:
  name: ai21labs/AI21-Jamba-Reasoning-3B
  trust_remote_code: true
  rope_scaling:
    type: linear
    factor: 4.0  # For 1M extension

lora:
  rank: 8  # 16 for SFT, 8 for RL
  alpha: 32
  target_modules:
    - "x_proj"    # Mamba
    - "in_proj"   # Mamba
    - "out_proj"  # Mamba
    - "q_proj"    # Attention
    - "k_proj"    # Attention
    - "v_proj"    # Attention
    - "o_proj"    # Attention
    - "gate_proj" # MLP/MoE
    - "up_proj"   # MLP/MoE
    - "down_proj" # MLP/MoE
  lr: 2e-4  # 10× FullFT baseline

training:
  optimizer: adamw
  lr_schedule: constant
  batch_size: 32  # Reduce for long context
  mixed_precision: bf16
  gradient_checkpointing: true

grpo:
  group_size: 8
  kl_penalty_beta: 0.04
  clip_epsilon: 0.2
  clip_epsilon_negative: 0.3  # Asymmetric

opd:
  teacher_update_interval: 20
  teacher_promote_on_val_improvement: true
  lambda_grpo: 0.3  # 30% GRPO, 70% OPD

rewards:
  code_pass_rate: 0.35
  gui_task_success: 0.25
  multi_agent_score: 0.15
  mcp_tool_accuracy: 0.10
  context_retrieval_1M: 0.10
  kl_regularization: 0.05

inference:
  deterministic: true
  backend: vllm
  jamba_mamba_chunk_size: 256  # Fixed for reproducibility
```

---

## Paper-to-VeRL-Config Mapping

| Paper Technique | VeRL Config Key | What It Does |
|---|---|---|
| **GRPO** | `algorithm.name: grpo` | Group-relative policy optimization |
| **On-Policy Distillation** | `algorithm.on_policy_distillation: true` | Token-level teacher logprob advantage |
| **CISPO loss** | `algorithm.loss_fn: cispo` | Asymmetric clipping for advantage |
| **Interleaved batching** | `data_mix[].weight` | Round-robin task sampling |
| **Expert verification** | Phase 2 data pipeline | Disagreement routing to experts |
| **LoRA on all layers** | `lora.target_modules` | Full-layer coverage (Mamba + Attn + MLP) |
| **Batch-invariant kernels** | `inference.deterministic: true` | Fixed split sizes, no Stream-K |
| **Behavior recovery** | Phase 4 recovery loop | OPD from pre-GRPO checkpoint |
| **1M context** | `rope_scaling`, `mamba_state_scaling` | Position interpolation + state scaling |
| **Jamba hybrid support** | VeRL + mamba-ssm package | AI21-contributed Jamba integration |

---

## Key Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Jamba2 3B coding too weak for enterprise use | Medium | Scale to Jamba 1.5 Mini (12B) — same VeRL config, just larger model |
| VeRL Jamba support has bugs | Low | AI21 contributed and validated it for Jamba Reasoning 3B training; test with a quick 50-step run first |
| 1M context training too slow | Low | 3B model at 1M context with gradient checkpointing fits on 8× A100; Mamba's O(n) memory is the key enabler |
| GPU rental preemption | Medium | VeRL supports checkpoint resume; save every 50 steps |
| Multi-objective reward hacking | Medium | KL regularization at 0.05 weight; held-out eval suite |
| No managed API = more ops work | Low | RunPod/Vast have pre-built templates; total setup time < 2 hours for a team that knows Docker |
