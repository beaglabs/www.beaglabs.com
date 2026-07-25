export interface ContactTopic {
  slug: string
  title: string
  metaDescription: string
  heroTitle: string
  heroDescription: string
  subtitle: string
  features: { title: string; description: string; icon: string }[]
  ctaText: string
}

export const contactTopics: ContactTopic[] = [
  {
    slug: "fine-tuning",
    title: "Custom Fine-Tuning — Beag Labs",
    metaDescription:
      "Get a custom fine-tuned small language model for your specific domain, data, and task. We handle data prep, training, evaluation, and deployment.",
    heroTitle: "Fine-tune a model that knows your domain.",
    heroDescription:
      "Send us your data — documents, transcripts, logs, support tickets, or proprietary knowledge bases. We fine-tune a small language model (500M–5B parameters) to your specific task. You get a model that performs like a frontier model on your domain, at a fraction of the latency and cost.",
    subtitle: "We handle everything from data curation to deployment.",
    features: [
      {
        title: "Data preparation & curation",
        description:
          "We clean, deduplicate, and format your data into high-quality training examples. No noise, no leakage — just signal.",
        icon: "\u2699\ufe0f",
      },
      {
        title: "Custom training pipeline",
        description:
          "LoRA, QLoRA, or full fine-tuning on our GPU cluster. You choose the base model and hyperparameters — or let us recommend them.",
        icon: "🧪",
      },
      {
        title: "Evaluation & iteration",
        description:
          "We build bespoke eval sets from your data. You get clear metrics, side-by-side comparisons, and iterative improvement cycles.",
        icon: "📊",
      },
      {
        title: "Deployment anywhere",
        description:
          "On-prem, air-gapped, edge, or cloud — we ship the model as a container, ONNX export, or quantized checkpoint. No vendor lock-in.",
        icon: "🚀",
      },
      {
        title: "RLHF & preference tuning",
        description:
          "Go beyond supervised fine-tuning. We help you collect human preference data and run reinforcement learning to align outputs with your quality bar.",
        icon: "\u2b50",
      },
      {
        title: "Ongoing model updates",
        description:
          "Your data grows — your model should too. We set up pipelines for continuous fine-tuning as new data arrives.",
        icon: "🔄",
      },
    ],
    ctaText: "Start your fine-tuning project.",
  },
  {
    slug: "qat",
    title: "Quantization-Aware Training — Beag Labs",
    metaDescription:
      "Deploy smaller, faster, cheaper models with quantization-aware training. Maintain accuracy while reducing model size by 4x.",
    heroTitle: "Smaller models. Same accuracy.",
    heroDescription:
      "Quantization-aware training (QAT) lets you deploy models at INT4 or INT8 precision without accuracy loss. Models run 2-4x faster, use 75% less memory, and cost significantly less to serve — all while maintaining your accuracy benchmarks.",
    subtitle: "Production-ready quantization with no accuracy regression.",
    features: [
      {
        title: "Post-training quantization",
        description:
          "We apply PTQ to your existing model for immediate size and speed gains — a fast path to smaller models with minimal accuracy impact.",
        icon: "\u26a1",
      },
      {
        title: "Quantization-aware fine-tuning",
        description:
          "When PTQ isn't enough, we integrate fake quantization nodes into the training graph. Your model learns to compensate for reduced precision during training, not after.",
        icon: "🎯",
      },
      {
        title: "Mixed-precision deployment",
        description:
          "Not all layers need the same precision. We profile your model and assign optimal bit widths per layer — INT8 for robust layers, INT4 for the rest.",
        icon: "🧩",
      },
      {
        title: "Hardware-specific quantization",
        description:
          "Target-specific quantization for NVIDIA, AMD, Apple Silicon, Qualcomm, or edge NPUs. We optimize the precision scheme for your deployment hardware.",
        icon: "💻",
      },
      {
        title: "Accuracy validation suite",
        description:
          "We build a comprehensive eval suite before and after quantization. You get a report showing per-metric accuracy impact before you deploy.",
        icon: "📝",
      },
      {
        title: "Serving infrastructure",
        description:
          "Deploy your quantized model with vLLM, TGI, or ONNX Runtime. We help you set up the serving stack for maximum throughput and minimum latency.",
        icon: "🧰",
      },
    ],
    ctaText: "Start your QAT project.",
  },
  {
    slug: "agentic-support",
    title: "Agentic AI Support — Beag Labs",
    metaDescription:
      "AI support agents that actually work. Custom-built agents with tool access, knowledge grounding, and human-in-the-loop escalation.",
    heroTitle: "AI support agents that solve problems.",
    heroDescription:
      "Customer-facing AI agents are notoriously hard to get right. We build agents that actually work — grounded in your knowledge base, armed with your tools, and backed by human escalation when they're out of their depth. Measurable CSAT lift, tangible handle-time reduction.",
    subtitle: "From chatbots that fail to agents that deliver.",
    features: [
      {
        title: "Knowledge-grounding pipeline",
        description:
          "RAG, fine-tuning, or hybrid — we ground your agent in your docs, tickets, and knowledge base. Citations included, hallucinations minimized.",
        icon: "🔍",
      },
      {
        title: "Tool integration",
        description:
          "Your agent connects to your CRM, ticketing system, order management, and internal APIs. It doesn't just chat — it acts.",
        icon: "🔧",
      },
      {
        title: "Human-in-the-loop escalation",
        description:
          "When confidence drops below threshold, the agent hands off to a human with full context — no repetition, no dropped information.",
        icon: "🤝",
      },
      {
        title: "Conversation analytics",
        description:
          "Track resolution rate, CSAT, handle time, and escalation patterns. We build dashboards so you see exactly what your agent is doing.",
        icon: "📈",
      },
      {
        title: "Multi-channel deployment",
        description:
          "Deploy your agent on web chat, Slack, WhatsApp, email, or voice. Consistent experience across every channel your customers use.",
        icon: "📡",
      },
      {
        title: "Continuous improvement",
        description:
          "Every conversation generates training data. We use failed escalations and user feedback to iteratively improve your agent over time.",
        icon: "🌟",
      },
    ],
    ctaText: "Build your AI support agent.",
  },
]
