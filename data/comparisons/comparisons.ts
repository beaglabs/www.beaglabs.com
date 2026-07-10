export interface Comparison {
  slug: string
  title: string
  metaDescription: string
  optionA: { name: string; description: string; pros: string[]; cons: string[] }
  optionB: { name: string; description: string; pros: string[]; cons: string[] }
  comparisonTable: { feature: string; optionA: string; optionB: string }[]
  verdict: string[]
}

export const comparisons: Comparison[] = [
  {
    slug: 'beag-labs-vs-gpt-4-api',
    title: 'Beag Labs vs GPT-4 API',
    metaDescription:
      'Compare Beag Labs custom SLMs vs the GPT-4 API for domain-specific tasks in regulated industries. Cost, privacy, latency, customization, compliance, and model ownership.',
    optionA: {
      name: 'Beag Labs Custom SLM',
      description:
        'A purpose-built small language model (500M-5B parameters) trained on your domain data and deployed on-prem, air-gapped, or in your VPC. No external API calls, no data leakage, and full model ownership.',
      pros: [
        'Fixed cost per inference — no per-token billing or usage surprises',
        'Zero data egress; sensitive documents never leave your infrastructure',
        'Sub-100ms inference latency on a single GPU for batch classification',
        'Fine-tuned on your domain corpus for higher accuracy on niche tasks',
        'Full model weights and artifacts delivered — you own the IP',
        'Deployable in air-gapped environments for classified or regulated workloads',
      ],
      cons: [
        'Upfront investment required for model training and validation',
        'Requires GPU infrastructure (or a managed deployment partner)',
        'General-knowledge breadth is lower than a 1T+ parameter frontier model',
        'Iterating on the model requires a retraining cycle, not a prompt change',
      ],
    },
    optionB: {
      name: 'GPT-4 API',
      description:
        'OpenAI\'s frontier model accessed via a hosted API endpoint. Zero infrastructure to manage, broad general knowledge, and rapid prototyping — but every inference sends data to a third-party server and bills per token.',
      pros: [
        'Zero infrastructure — no GPUs to provision or maintain',
        'Broad general knowledge across virtually any topic',
        'Immediate iteration via prompt engineering, no retraining',
        'Rapid prototyping and proof-of-concept development',
        'Managed scaling and uptime by the provider',
      ],
      cons: [
        'Per-token pricing scales unpredictably with high-volume workloads',
        'Every inference transmits data to a third-party server',
        'Incompatible with air-gapped or on-prem compliance requirements',
        'Latency of 500ms-3s per call depending on load and output length',
        'No model ownership — the provider can change capabilities or pricing at any time',
        'Vendor lock-in: prompts and workflows are tightly coupled to one provider\'s API',
      ],
    },
    comparisonTable: [
      {
        feature: 'Cost per inference',
        optionA: 'Fixed amortized cost — near-zero marginal cost at scale',
        optionB: 'Per-token billing; cost scales linearly with volume',
      },
      {
        feature: 'Data privacy',
        optionA: 'Data never leaves your infrastructure',
        optionB: 'Data sent to third-party servers on every call',
      },
      {
        feature: 'Deployment options',
        optionA: 'On-prem, air-gapped, or VPC — full control',
        optionB: 'Hosted API only; no on-prem or air-gapped option',
      },
      {
        feature: 'Latency',
        optionA: 'Sub-100ms on a single GPU for classification tasks',
        optionB: '500ms-3s per call depending on load and output length',
      },
      {
        feature: 'Customization',
        optionA: 'Fine-tuned on your domain data for task-specific accuracy',
        optionB: 'Prompt engineering only; no weight-level customization',
      },
      {
        feature: 'Compliance',
        optionA: 'Meets air-gapped, FedRAMP, HIPAA, and SOC 2 requirements',
        optionB: 'Limited; depends on provider\'s compliance certifications',
      },
      {
        feature: 'Model ownership',
        optionA: 'You receive full model weights and artifacts',
        optionB: 'No ownership — provider controls the model entirely',
      },
      {
        feature: 'Vendor lock-in',
        optionA: 'No lock-in — standard PyTorch weights, portable anywhere',
        optionB: 'High lock-in — prompts and workflows coupled to one API',
      },
    ],
    verdict: [
      'For regulated industries running high-volume, domain-specific workloads — legal document classification, clinical note extraction, financial filing analysis — Beag Labs custom SLMs win on every axis that matters operationally. The cost curve inverts at scale: while the GPT-4 API is cheaper for low-volume prototyping, per-token billing becomes prohibitive at millions of inferences per month. A custom SLM amortizes its training cost rapidly and then runs at near-zero marginal cost on hardware you already own or lease.',
      'The privacy and compliance gap is even more decisive. In legal, healthcare, and government contexts, transmitting client or patient data to a third-party API is often a non-starter — not a preference but a regulatory hard line. Air-gapped deployment is not a feature you can add to an API; it is architecturally impossible by definition. Beag Labs models run inside your perimeter, period.',
      'Where the GPT-4 API retains an advantage is breadth: open-ended reasoning, creative generation, and zero-shot tasks across unfamiliar domains. If your workload is exploratory, low-volume, or requires general-world knowledge, the API is the right tool. But once a task is well-defined, repeated at scale, and touches regulated data, a custom SLM is the correct production architecture.',
    ],
  },
  {
    slug: 'custom-slm-vs-frontier-api',
    title: 'Custom SLM vs Frontier API',
    metaDescription:
      'Custom small language models vs frontier API endpoints — a general comparison of cost, privacy, latency, customization, compliance, model ownership, and vendor lock-in.',
    optionA: {
      name: 'Custom SLM',
      description:
        'A small language model (500M-5B parameters) purpose-built for a specific task or domain. Trained on proprietary data, deployed on infrastructure you control, and delivered as portable model weights you own outright.',
      pros: [
        'Predictable, amortized cost structure with near-zero marginal cost at scale',
        'Complete data sovereignty — no inference traffic leaves your network',
        'Optimized for a narrow task, often outperforming larger models on domain-specific benchmarks',
        'Deployable on-prem, air-gapped, or in a private VPC',
        'Portable standard-format weights — no runtime dependency on a vendor',
        'Deterministic behavior: the model does not change unless you retrain it',
      ],
      cons: [
        'Requires upfront investment in data curation and training',
        'Narrow scope — a single model serves its target task, not general-purpose queries',
        'Needs GPU resources for inference (though far less than frontier models)',
        'Updating the model requires a retraining and validation cycle',
      ],
    },
    optionB: {
      name: 'Frontier API',
      description:
        'A trillion-parameter-class model accessed through a vendor-hosted API. Broad capabilities, zero infrastructure, and fast prototyping — but with per-call pricing, data egress, and complete dependency on the provider.',
      pros: [
        'No infrastructure or DevOps overhead',
        'Exceptional breadth across languages, domains, and task types',
        'Instant iteration through prompt changes',
        'Managed availability, scaling, and model updates by the vendor',
        'Strong zero-shot and few-shot performance on novel tasks',
      ],
      cons: [
        'Per-token or per-call pricing that scales unpredictably with usage',
        'Every request transmits data to a third-party server',
        'No air-gapped or on-prem deployment path',
        'Model behavior can change silently when the vendor updates the model',
        'No model ownership — you are renting capability, not acquiring an asset',
        'Deep vendor lock-in via proprietary APIs, prompt formats, and tooling',
      ],
    },
    comparisonTable: [
      {
        feature: 'Cost per inference',
        optionA: 'Amortized fixed cost; near-zero marginal cost at high volume',
        optionB: 'Per-token or per-call billing; cost scales with every request',
      },
      {
        feature: 'Data privacy',
        optionA: 'All inference stays within your network perimeter',
        optionB: 'Data leaves your control on every API call',
      },
      {
        feature: 'Deployment options',
        optionA: 'On-prem, air-gapped, VPC, or edge — your choice',
        optionB: 'Vendor-hosted API only; no self-hosted option',
      },
      {
        feature: 'Latency',
        optionA: '10-100ms local inference on modest hardware',
        optionB: '200ms-3s+ including network round-trips',
      },
      {
        feature: 'Customization',
        optionA: 'Weights-level fine-tuning on your proprietary data',
        optionB: 'Prompt engineering and system messages only',
      },
      {
        feature: 'Compliance',
        optionA: 'Full control enables HIPAA, FedRAMP, ITAR, and air-gapped compliance',
        optionB: 'Limited to whatever the vendor has certified',
      },
      {
        feature: 'Model ownership',
        optionA: 'You own the weights, the training data pipeline, and the artifacts',
        optionB: 'Vendor owns everything; you have a usage license',
      },
      {
        feature: 'Vendor lock-in',
        optionA: 'Standard PyTorch/Safetensors weights — portable across any runtime',
        optionB: 'Proprietary API, proprietary prompt format, proprietary tooling',
      },
    ],
    verdict: [
      'The custom SLM versus frontier API decision is fundamentally a build-vs-buy decision, and the right answer depends on your workload profile. For exploratory, low-volume, or general-purpose tasks, a frontier API is the pragmatic choice: zero CapEx, immediate capability, and the breadth to handle whatever you throw at it. For production workloads that are well-defined, repeated at scale, and involve sensitive data, a custom SLM is structurally superior on cost, privacy, latency, and control.',
      'The economic crossover point arrives sooner than most teams expect. At a few thousand inferences per day, per-token API costs are manageable. At hundreds of thousands or millions, the API bill dwarfs what it would cost to train and operate a dedicated model — and the gap widens over time as your volume grows. A custom SLM also eliminates the tail risk of provider price changes, rate limits, or deprecations that can disrupt a production pipeline overnight.',
      'The privacy and ownership argument is categorical, not incremental. If your data is regulated, classified, or competitively sensitive, a frontier API is simply not an option regardless of cost. And if model behavior is mission-critical, the deterministic nature of a model you control — one that cannot be silently updated or degraded by a vendor — is itself a form of risk insurance that no API can provide.',
    ],
  },
  {
    slug: 'on-prem-ai-vs-cloud-ai',
    title: 'On-Prem AI vs Cloud AI',
    metaDescription:
      'On-prem AI vs cloud AI deployment models compared — data privacy, cost structure, latency, compliance, customization, model ownership, and vendor lock-in.',
    optionA: {
      name: 'On-Prem AI',
      description:
        'AI models deployed on infrastructure within your own data center or private cloud. Full control over hardware, data flow, and security posture. Includes air-gapped and VPC-hosted deployments where no traffic traverses public networks.',
      pros: [
        'Complete data sovereignty — no traffic leaves your network',
        'Air-gapped capable for classified or highly regulated workloads',
        'Predictable cost structure with owned or leased hardware',
        'Sub-100ms inference latency with no network round-trips',
        'Full control over the software stack, model versions, and update cadence',
        'No dependency on external provider availability or SLAs',
      ],
      cons: [
        'Requires capital investment in GPU hardware or leasing arrangements',
        'Infrastructure management overhead — provisioning, monitoring, maintenance',
        'Scaling requires procuring additional hardware, not just an API tier bump',
        'Requires in-house or partnered ML operations expertise',
      ],
    },
    optionB: {
      name: 'Cloud AI',
      description:
        'AI models hosted by a cloud provider (AWS, Azure, GCP) or accessed via a vendor API. Zero hardware to buy, elastic scaling, and managed services — but data traverses third-party infrastructure and costs scale with usage.',
      pros: [
        'Zero hardware investment — pay for what you use',
        'Elastic scaling to handle traffic spikes without capacity planning',
        'Managed infrastructure, monitoring, and model serving',
        'Fast time-to-value with pre-configured endpoints and SDKs',
        'Access to the latest hardware (H100s, TPUs) without procurement delays',
      ],
      cons: [
        'Data must traverse third-party network and storage infrastructure',
        'Ongoing usage costs that scale indefinitely with volume',
        'Not suitable for air-gapped or highest-assurance compliance requirements',
        'Network latency adds 100ms-3s per inference call',
        'Subject to provider outages, rate limits, and regional availability',
        'Vendor lock-in through proprietary services, APIs, and data formats',
      ],
    },
    comparisonTable: [
      {
        feature: 'Cost per inference',
        optionA: 'Amortized hardware cost; marginal cost approaches zero at scale',
        optionB: 'Pay-per-use; costs scale linearly with inference volume',
      },
      {
        feature: 'Data privacy',
        optionA: 'Data never leaves your physical or virtual perimeter',
        optionB: 'Data traverses provider network and storage systems',
      },
      {
        feature: 'Deployment options',
        optionA: 'Bare-metal, air-gapped, private data center, or VPC',
        optionB: 'Provider-hosted only; limited private-endpoint options',
      },
      {
        feature: 'Latency',
        optionA: 'Local inference: 10-100ms with no network overhead',
        optionB: '100ms-3s+ including network transit and queueing',
      },
      {
        feature: 'Customization',
        optionA: 'Full control over model weights, runtime, and hardware config',
        optionB: 'Constrained to provider-supported model sizes and fine-tuning options',
      },
      {
        feature: 'Compliance',
        optionA: 'Achievable for ITAR, FedRAMP High, HIPAA, and air-gapped requirements',
        optionB: 'Depends on provider certifications; air-gapped not possible',
      },
      {
        feature: 'Model ownership',
        optionA: 'You own the weights, the hardware, and the entire stack',
        optionB: 'Provider owns the serving infrastructure; you own only the model weights (if fine-tuned)',
      },
      {
        feature: 'Vendor lock-in',
        optionA: 'No lock-in — standard infrastructure and portable model formats',
        optionB: 'Moderate to high lock-in via proprietary ML services and data gravity',
      },
    ],
    verdict: [
      'On-prem AI and cloud AI serve fundamentally different deployment philosophies, and the right choice depends on your data sensitivity, workload volume, and operational maturity. Cloud AI excels for teams that need fast time-to-value, elastic scaling, and minimal infrastructure overhead. It is the natural starting point for prototyping, low-volume workloads, and organizations without dedicated ML operations teams. On-prem AI becomes the correct choice when data sovereignty is non-negotiable, when inference volume makes per-use cloud pricing uneconomical, or when compliance requirements demand physical control over the entire stack.',
      'The cost crossover is real and calculable. Cloud AI\'s pay-per-use model is attractive at low volume but becomes a significant operating expense at production scale. A team running millions of inferences per month on cloud GPU instances will often find that leasing or purchasing equivalent on-prem hardware pays for itself within 12-18 months — and then continues to deliver value at near-zero marginal cost for the hardware\'s useful life. The trade-off is operational: on-prem requires capacity planning, monitoring, and hardware lifecycle management that cloud providers absorb on your behalf.',
      'For regulated industries — legal, healthcare, finance, government and defense — the deployment question is often answered by compliance, not economics. Air-gapped environments, ITAR-controlled data, and HIPAA-covered workloads may require on-prem or private-VPC deployment as a legal necessity. In these contexts, cloud AI is not a cheaper alternative; it is a non-option. The practical path for many organizations is a hybrid model: cloud AI for exploration and low-stakes workloads, transitioning to on-prem as a workload matures into production and its data sensitivity and volume both increase.',
    ],
  },
]
