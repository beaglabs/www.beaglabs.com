# OpenAI Lost $20.9 Billion in 2025. Here's Why That's Everyone's Problem.

In 2025, OpenAI generated approximately $13 billion in revenue. It spent approximately $34 billion. The resulting $20.9 billion operating loss is not merely a startup burning cash — it is the largest operating loss ever reported by a private technology company, exceeding Uber's peak loss year by a factor of three.

These numbers, reported by Ars Technica and confirmed in filings reviewed by the Financial Times, reveal a fundamental economics problem at the heart of the frontier AI industry: the cost of delivering AI inference far exceeds what customers are willing to pay.

## The Math Doesn't Work

OpenAI's cost structure breaks down roughly as follows:

| Cost Category | Annual Amount |
|---------------|--------------|
| Inference compute (Azure) | $4+ billion |
| Training compute (GPT-5 and successors) | $5+ billion |
| Payroll (~4,000 employees) | $4.6 billion |
| Data acquisition and licensing | $1+ billion |
| Infrastructure and other operating costs | $19+ billion |

The critical issue is the gap between inference cost and revenue. Each query to GPT-4 or GPT-4o costs OpenAI substantially more in compute than the revenue it generates. The Financial Times estimated in early 2025 that OpenAI's gross margin on API inference was negative — the company loses money on every non-Microsoft enterprise query it serves.

This is the dirty secret of the AI API business: the unit economics are inverted. For most SaaS products, marginal cost per transaction trends toward zero. For AI inference, the marginal cost per token is substantial and does not decline as fast as the API prices. DeepSeek's entry into the market, offering API pricing at roughly 1/50th of GPT-4, has only intensified this pressure.

## Why This Matters for Enterprises

If you are building your business on top of OpenAI's API, you are standing on a financial foundation that is burning $20.9 billion per year. That creates several uncomfortable scenarios:

**Price increases.** At some point, OpenAI must raise prices or cut costs. Either move will flow downstream to its customers. When API prices double — and the compute cost structure suggests they must increase significantly for profitability — the economics of your AI-powered product changes overnight.

**Vendor lock-in risk.** OpenAI's deepest relationship is with Microsoft, which has invested $13+ billion and is the exclusive cloud provider for OpenAI's workloads. If you build on OpenAI's API, you are de facto building on Azure. The switching costs to alternative providers are high, and the competitive dynamics between Microsoft, OpenAI, and other hyperscalers will shape your costs regardless of your own engineering decisions.

**Service continuity.** Companies that lose $20.9 billion per year do not have unlimited runways. OpenAI has raised over $20 billion in equity and secured billions more in debt financing. But venture capital is not a permanent funding source. The expectation is that OpenAI will eventually become self-sustaining. If the unit economics remain negative, that day may never arrive.

## The Broader Landscape

OpenAI is not alone in this dynamic. Anthropic, valued at $380 billion with approximately $45 billion in annualized revenue run rate, faces similar unit economics. Its API pricing is comparable to OpenAI's, and its compute costs, running primarily on AWS and GCP, are similarly high.

The MSCI AI Exposure Index reveals that 92% of AI industry revenue is concentrated in just 6 companies — NVIDIA, Microsoft, Google, Amazon, Meta, and Apple. The AI labs themselves (OpenAI, Anthropic) are not among the top revenue generators. They are cost centers for the hyperscalers, existing primarily to drive cloud consumption.

Consider: when a startup uses OpenAI's API, the monetary flow is:

1. Startup pays OpenAI for API tokens
2. OpenAI pays Microsoft Azure for compute
3. Microsoft books Azure AI revenue
4. Microsoft's investment in OpenAI appreciates (on paper)

The startup's AI budget flows through this chain and ends up on Microsoft's balance sheet. The startup itself gains a product feature, but the dollars exit the real economy and enter the circular flow described in the first article of this series.

## What a Correction Looks Like

If OpenAI cannot close its cost gap — and the path to profitability is unclear given current pricing and cost structures — several outcomes are possible:

- **Acquisition**: Microsoft could absorb OpenAI entirely, converting the circular flow into a consolidated division. This would eliminate the standalone financial reporting that makes the losses visible.

- **Dramatically higher pricing**: Enterprise API rates could rise 5-10x. This would make most AI-powered startups uneconomic but would allow the hyperscalers to capture value.

- **Government intervention**: National security concerns around AI could lead to direct government funding, effectively socializing the costs while privatizing the benefits.

- **Market correction**: If venture capital dries up — and there are signs of AI funding fatigue — the circular flow collapses. OpenAI and similar labs would need to achieve rapid profitability or face restructuring.

For enterprises building on these platforms, the fourth scenario is the most likely within a 3-5 year window. The lesson of every previous technology cycle — from dot-com to cloud computing — is that unit economics eventually matter. Companies that built on unsustainable platforms either pivoted or failed.

The question is not whether the AI industry's financial structure will change. It is whether your business model survives the change.

---

*Sources: Ars Technica (OpenAI financial leak, $20.9B operating loss); Financial Times (OpenAI cost structure, Microsoft relationship); Sacra Research (inference cost analysis); MSCI AI Exposure Index (revenue concentration data); Bloomberg (OpenAI funding rounds); The Information (OpenAI payroll and headcount).*
