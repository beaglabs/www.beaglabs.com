export type Capability = {
  slug:
    | 'modernization'
    | 'spec-drive-development'
    | 'agent-ux'
    | 'slm-feasibility'
    | 'slm-deployment'
  number: string
  eyebrow: string
  title: string
  subtitle: string
  description: string
  hero: {
    src: string
    alt: string
    badge: string
  }
  includes: {
    title: string
    blurb: string
    bullets: string[]
  }[]
  process: { step: string; title: string; blurb: string }[]
  proof: { metric: string; label: string }[]
  cta: {
    headline: string
    blurb: string
    chatPrompt: string
  }
  metaDescription: string
}

export const capabilities: Capability[] = [
  {
    slug: 'modernization',
    number: '01',
    eyebrow: 'Capability · Legacy',
    title: 'Legacy Data Extraction',
    subtitle: 'Read your mainframe without rewriting it.',
    description:
      "We modernize things like mainframe data without affecting the core data using SLMs. We sit alongside your system of record — COBOL, AS/400, DB2, EDI, fixed-width tapes, scanned PDFs — and pull the fields your modern apps actually need.",
    hero: {
      src: 'https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg',
      alt: 'Vintage computer terminal in a dim room',
      badge: 'ON-PREM · AIR-GAPPED',
    },
    includes: [
      {
        title: 'What we read',
        blurb: 'Every format still running in production, including the ones nobody wants to touch.',
        bullets: [
          'COBOL, RPG, AS/400, DB2, VSAM record layouts',
          'Fixed-width, EBCDIC, EDI X12 / EDIFACT',
          'Scanned PDFs and TIFFs via OCR + SLM',
          'Green-screen terminal session parsing',
        ],
      },
      {
        title: 'How it ships',
        blurb: 'Field-level outputs that drop into the systems you already run.',
        bullets: [
          'JSON / Parquet to your warehouse or lake',
          'Streaming records to Kafka, Kinesis, or pub/sub',
          'Validated against your golden record when one exists',
          'Replayable runs against historical archives',
        ],
      },
      {
        title: 'What we never do',
        blurb: 'The system of record stays untouched. Always.',
        bullets: [
          'No writes back to the mainframe',
          'No schema changes to source systems',
          'No vendor lock-in — you own the pipeline',
          'No data leaves your perimeter without approval',
        ],
      },
    ],
    process: [
      {
        step: '01',
        title: 'Inventory',
        blurb: 'Two weeks. We read your source, document every format, and produce a written map of the data.',
      },
      {
        step: '02',
        title: 'Build',
        blurb: 'Four to six weeks. We train the SLM on your real records, ship the pipeline, and validate against ground truth.',
      },
      {
        step: '03',
        title: 'Run',
        blurb: 'Hand-off to your team with runbooks, monitoring, and an upgrade path. We stay on retainer.',
      },
    ],
    proof: [
      { metric: '120x', label: 'Cheaper than proprietary LLM APIs' },
      { metric: '6 wks', label: 'Median time to first field in production' },
      { metric: '0', label: 'Writes back to source systems. Ever.' },
    ],
    cta: {
      headline: 'Got a system nobody wants to touch?',
      blurb: "Send us a sample record. We'll tell you in 48 hours whether we can read it.",
      chatPrompt:
        'I have a legacy system I need to read data from without modifying. Can you help me figure out what an engagement would look like?',
    },
    metaDescription:
      "Read COBOL, AS/400, DB2, and scanned legacy records with SLMs. We modernize data extraction without touching the system of record.",
  },
  {
    slug: 'spec-drive-development',
    number: '02',
    eyebrow: 'Capability · Build',
    title: 'AI-Enabled Software Development',
    subtitle: 'We embed with your team and ship a working AI feature in 6–10 weeks.',
    description:
      "We don't bolt on a chatbot. We own the model training, evaluation, infra, and the integration code end-to-end — then hand it to your team in a state they can actually run. You ship a real feature, not a demo.",
    hero: {
      src: 'https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg',
      alt: 'Code on a dark monitor in a developer workspace',
      badge: 'EMBEDDED · 6–10 WK',
    },
    includes: [
      {
        title: 'What we own',
        blurb: "The full vertical slice from data to production traffic. Your team owns it after we leave.",
        bullets: [
          'Data curation, labeling, and eval set design',
          'SLM training, fine-tuning, and quantization',
          'Inference server selection and deployment',
          'API + SDK that matches your existing patterns',
        ],
      },
      {
        title: 'What we measure',
        blurb: "The numbers that actually matter when the feature is in front of users.",
        bullets: [
          'Quality on your real eval set — not a benchmark',
          'P50 / P95 / P99 latency under realistic load',
          'Cost per request at projected production volume',
          'Failure modes and recovery paths',
        ],
      },
      {
        title: 'How we hand off',
        blurb: "You can run this without us. That's the test.",
        bullets: [
          'Code merged into your monorepo, not a sandbox',
          'Runbooks for the on-call rotation',
          'A/B framework so you can ship behind a flag',
          'Recorded walkthroughs for your team',
        ],
      },
    ],
    process: [
      {
        step: '01',
        title: 'Scope',
        blurb: 'Two weeks. We agree on the user-facing feature, the eval set, and the success metrics.',
      },
      {
        step: '02',
        title: 'Build',
        blurb: 'Four to six weeks. Weekly demos. Real users by week six. Slack channel with your team.',
      },
      {
        step: '03',
        title: 'Ship & transfer',
        blurb: 'Two weeks. Production rollout behind a flag, then knowledge transfer to your engineers.',
      },
    ],
    proof: [
      { metric: '6–10', label: 'Weeks from kickoff to production' },
      { metric: '100%', label: 'Code merged into your repo' },
      { metric: '0', label: 'Sandboxes left behind' },
    ],
    cta: {
      headline: "Have a feature that's been stuck in 'AI someday'?",
      blurb: "We'll tell you in 30 minutes whether we can ship it.",
      chatPrompt:
        'I have a feature in mind that involves AI. Can you help me figure out what an embedded engagement would look like and whether it is realistic?',
    },
    metaDescription:
      "We embed with your team and ship a working AI feature in 6–10 weeks. Not a chatbot — a real vertical slice in your codebase.",
  },
  {
    slug: 'agent-ux',
    number: '03',
    eyebrow: 'Capability · Design',
    title: 'Agent UX Consulting',
    subtitle: 'Design agentic experiences users actually trust and complete.',
    description:
      "Most agent failures aren't model failures — they're design failures. We help product teams design agentic experiences that recover from errors, disclose what they're doing, respect latency budgets, and don't overwhelm the user with what the model is thinking.",
    hero: {
      src: 'https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg',
      alt: 'Designer workspace with sketches and a laptop',
      badge: 'UX · PROTOTYPE',
    },
    includes: [
      {
        title: 'What we cover',
        blurb: 'The full surface area of an agentic product, not just the chat box.',
        bullets: [
          'Interaction patterns for autonomous and supervised agents',
          'Disclosure design — what to show, what to hide, when to ask',
          'Recovery from agent errors without losing user trust',
          'Latency budgets that match what users will actually wait for',
        ],
      },
      {
        title: 'What we deliver',
        blurb: 'A working prototype plus the design system to extend it.',
        bullets: [
          'Annotated wireframes and interaction specs',
          'A clickable prototype backed by a real model',
          'A design system your team can extend without us',
          'Recorded walkthrough of the design rationale',
        ],
      },
      {
        title: 'Who this is for',
        blurb: 'Product teams that already have a model and a use case but the UX is the bottleneck.',
        bullets: [
          'Internal tooling teams shipping agents to ops',
          'Consumer products with an AI surface that feels off',
          'B2B SaaS adding agent features to existing workflows',
          'Founders about to ship an agent for the first time',
        ],
      },
    ],
    process: [
      {
        step: '01',
        title: 'Audit',
        blurb: 'One week. We sit with your team, watch users fail, and write up what we found.',
      },
      {
        step: '02',
        title: 'Prototype',
        blurb: 'Three weeks. A clickable prototype backed by a real model, with the failure modes built in.',
      },
      {
        step: '03',
        title: 'Handoff',
        blurb: 'One week. A design system, a recorded walkthrough, and async support for the next sprint.',
      },
    ],
    proof: [
      { metric: '3 wks', label: 'From audit to working prototype' },
      { metric: '+40%', label: 'Median task completion on prototype' },
      { metric: '1', label: 'Senior designer, not a deck' },
    ],
    cta: {
      headline: 'Have a model but the UX is the bottleneck?',
      blurb: "We'll watch three users fail, then build the fix.",
      chatPrompt:
        'I have an AI feature that works technically but the UX is not landing. Can you help us redesign the agent experience for our users?',
    },
    metaDescription:
      "We help product teams design agentic experiences users actually trust and complete. Working prototype, not a deck.",
  },
  {
    slug: 'slm-feasibility',
    number: '04',
    eyebrow: 'Capability · Assess',
    title: 'SLM Feasibility & Savings',
    subtitle: '2–4 week paid assessment. Quality, $/year, go/no-go.',
    description:
      "Before you commit to building, we take a sample of your actual workload, build a small model that handles it, and produce a written report with quality benchmarks vs. your current API, projected $/year savings at production volume, and a go/no-go recommendation. Most engagements pay back the assessment fee 50–100x in year one.",
    hero: {
      src: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
      alt: 'Analytics dashboard on a screen in a dark room',
      badge: '2–4 WK · FIXED FEE',
    },
    includes: [
      {
        title: 'What we measure',
        blurb: "The numbers you actually need to make a build / buy / stay decision.",
        bullets: [
          'Quality on your real eval set vs. your current API',
          'P50 / P95 / P99 latency at projected production volume',
          'Cost per 1k requests at 1x, 10x, and 100x current scale',
          'Failure modes and the cost of getting them wrong',
        ],
      },
      {
        title: "What's in the report",
        blurb: 'A 20–40 page document you can hand to your CFO.',
        bullets: [
          'Executive summary with go / no-go recommendation',
          'Side-by-side quality benchmarks on your data',
          'Three-year cost projection under realistic assumptions',
          'A concrete deployment plan if the answer is "go"',
        ],
      },
      {
        title: 'How we de-risk it',
        blurb: "You don't pay the full fee unless we believe the numbers work.",
        bullets: [
          'Week 1: a 48-hour sniff test on a small sample',
          'No-fee exit if the workload isn\'t a fit',
          'Fixed-fee engagement — no surprise invoices',
          'NDA and data residency handled upfront',
        ],
      },
    ],
    process: [
      {
        step: '01',
        title: 'Sample',
        blurb: 'You send us 1k–10k representative examples. We sign the NDA, set up the secure channel.',
      },
      {
        step: '02',
        title: 'Train',
        blurb: 'We fine-tune a small model on your data, run it against your eval set, and measure cost.',
      },
      {
        step: '03',
        title: 'Report',
        blurb: 'A 20–40 page report with the benchmarks, the projection, and a go / no-go recommendation.',
      },
    ],
    proof: [
      { metric: '2–4', label: 'Weeks, fixed fee' },
      { metric: '50–100x', label: 'Median year-one payback' },
      { metric: '0', label: 'Cost if we say "this isn\'t a fit"' },
    ],
    cta: {
      headline: 'Wondering if an SLM actually pays off for your workload?',
      blurb: "Send 1k examples. We'll have numbers in two weeks.",
      chatPrompt:
        'I am paying a lot for an LLM API and I want to know if an SLM could replace it. Can you walk me through what a feasibility assessment would look like?',
    },
    metaDescription:
      "2–4 week paid assessment. Quality benchmarks, $/year projections, and a go/no-go recommendation. Most engagements pay back 50–100x.",
  },
  {
    slug: 'slm-deployment',
    number: '05',
    eyebrow: 'Capability · Deploy',
    title: 'SLM Deployments',
    subtitle: 'On-prem, air-gapped, VPC, edge.',
    description:
      "We take a model from feasibility — or build one from scratch — and ship it to your infrastructure. You own the weights, the serving stack, and the data. We handle the quantization, the inference server selection, the observability, and the rollback path.",
    hero: {
      src: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg',
      alt: 'Server racks lit by blue indicator lights',
      badge: 'YOU OWN IT',
    },
    includes: [
      {
        title: 'Where it runs',
        blurb: 'Wherever your security team is comfortable.',
        bullets: [
          'On-prem bare metal (H100, A100, MI300, custom silicon)',
          'Air-gapped networks with no outbound traffic',
          'Your existing VPC, your existing IAM, your existing logging',
          'Edge — automotive, retail, factory floor, mobile',
        ],
      },
      {
        title: 'What we handle',
        blurb: 'The stack between "the model is trained" and "the model is in production".',
        bullets: [
          'Quantization: QAT, GPTQ, AWQ, INT4/INT8',
          'Inference: vLLM, TGI, llama.cpp, TensorRT-LLM',
          'Autoscaling, rolling deploys, blue/green',
          'Observability: tokens/sec, queue depth, OOMs, evals',
        ],
      },
      {
        title: 'What you own',
        blurb: 'Everything. We don\'t gate-keep the model or the stack.',
        bullets: [
          'The model weights — checked into your artifact store',
          'The serving config — declarative, in your repo',
          'The data pipeline — runs in your perimeter',
          'The upgrade path — no phone-home, no license server',
        ],
      },
    ],
    process: [
      {
        step: '01',
        title: 'Survey',
        blurb: 'One week. We read your infrastructure, security requirements, and latency budgets.',
      },
      {
        step: '02',
        title: 'Pilot',
        blurb: 'Three to four weeks. We deploy a single workload end-to-end and validate the stack.',
      },
      {
        step: '03',
        title: 'Scale',
        blurb: 'Six to eight weeks. We move the rest of the workloads over, with your team driving.',
      },
    ],
    proof: [
      { metric: '100%', label: 'You own the weights' },
      { metric: '0', label: 'Phone-home or license servers' },
      { metric: '6 wks', label: 'From kickoff to first workload in prod' },
    ],
    cta: {
      headline: 'Ready to move off the API?',
      blurb: "Tell us your infra. We'll tell you what's realistic.",
      chatPrompt:
        'I want to move from a hosted LLM API to a self-hosted SLM on our own infrastructure. Can you walk me through what an SLM deployment engagement would look like?',
    },
    metaDescription:
      "On-prem, air-gapped, VPC, edge. You own the weights, the serving stack, and the data. We handle the rest.",
  },
]

export const capabilityBySlug = (slug: string) =>
  capabilities.find((c) => c.slug === slug)
