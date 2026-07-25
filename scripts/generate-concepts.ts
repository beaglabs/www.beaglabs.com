import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { recipes } from '../data/cookbook/recipes/index'
import { parts } from '../data/cookbook/parts'
import type { Recipe } from '../data/cookbook/types'

interface PaperLink { title: string; url: string }
interface ResourceLink { label: string; url: string }
interface TrainingConcept {
  slug: string
  title: string
  part: string
  partIndex: number
  description: string
  complexity: string
  category: 'technique' | 'dataset'
  keyPapers: PaperLink[]
  openSource: ResourceLink[]
  huggingface: ResourceLink[]
}

const complexityMap: Record<number, string> = {
  1: '★☆☆☆☆',
  2: '★★☆☆☆',
  3: '★★★☆☆',
  4: '★★★★☆',
  5: '★★★★★',
}

const partMap: Record<string, { title: string; index: number }> = {}
parts.sort((a, b) => a.order - b.order).forEach((p, i) => {
  partMap[p.id] = { title: p.title, index: i + 1 }
})

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function recipeToConcept(r: Recipe): TrainingConcept {
  const part = partMap[r.part]
  return {
    slug: titleToSlug(r.title),
    title: r.title,
    part: part?.title ?? r.part,
    partIndex: part?.index ?? 0,
    description: `${r.purpose} ${r.coreIdea}`,
    complexity: complexityMap[r.complexity] ?? '★★☆☆☆',
    category: 'technique',
    keyPapers: r.keyPapers.map((p) => ({
      title: p.title.replace(/'/g, "\\'"),
      url: p.url,
    })),
    openSource: r.openSource.map((s) => {
      const [, label, url] = s.match(/^(.+?) \((https?:\/\/.+)\)$/) || [null, s, s]
      return { label, url }
    }),
    huggingface: [],
  }
}

const concepts: TrainingConcept[] = recipes
  .sort((a, b) => {
    const pa = partMap[a.part]?.index ?? 0
    const pb = partMap[b.part]?.index ?? 0
    if (pa !== pb) return pa - pb
    return a.order - b.order
  })
  .map(recipeToConcept)

concepts.push({
  slug: 'quantization-aware-training',
  title: 'Quantization-Aware Training',
  part: 'Model Optimization',
  partIndex: 8,
  description: 'Train models that are robust to reduced numerical precision by simulating quantization effects during the forward pass, enabling deployment at INT4 or INT8 precision without accuracy loss. QAT inserts fake quantization nodes into the computation graph during training — the model learns to compensate for the information loss of lower precision, producing models that run 2-4x faster with 75% less memory while maintaining accuracy benchmarks.',
  complexity: '★★★★☆',
  category: 'technique',
  keyPapers: [
    { title: 'LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale', url: 'https://arxiv.org/abs/2208.07339' },
    { title: 'QLoRA: Efficient Finetuning of Quantized Language Models', url: 'https://arxiv.org/abs/2305.14314' },
    { title: 'AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration', url: 'https://arxiv.org/abs/2306.00978' },
    { title: 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers', url: 'https://arxiv.org/abs/2210.17323' },
    { title: 'SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models', url: 'https://arxiv.org/abs/2211.10438' },
  ],
  openSource: [
    { label: 'bitsandbytes', url: 'https://github.com/bitsandbytes-foundation/bitsandbytes' },
    { label: 'AutoGPTQ', url: 'https://github.com/AutoGPTQ/AutoGPTQ' },
    { label: 'vLLM', url: 'https://github.com/vllm-project/vllm' },
    { label: 'llama.cpp', url: 'https://github.com/ggml-org/llama.cpp' },
    { label: 'QuIP#', url: 'https://github.com/Cornell-RelaxML/quip-sharp' },
  ],
  huggingface: [],
})

const header = `export interface PaperLink {
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
`

const footer = `]
`

const conceptStrings = concepts.map((c, i) => {
  const parts = [
    `  {`,
    `    slug: "${c.slug}",`,
    `    title: "${c.title}",`,
    `    part: "${c.part}",`,
    `    partIndex: ${c.partIndex},`,
    `    description: "${c.description}",`,
    `    complexity: "${c.complexity}",`,
    `    category: "${c.category}",`,
    `    keyPapers: [`,
    ...c.keyPapers.map((p) => `      { title: "${p.title}", url: "${p.url}" },`),
    `    ],`,
    `    openSource: [`,
    ...c.openSource.map((s) => `      { label: "${s.label}", url: "${s.url}" },`),
    `    ],`,
    `    huggingface: [],`,
    `  },`,
  ]
  return parts.join('\n')
})

const output = header + conceptStrings.join('\n\n') + '\n' + footer

const outPath = resolve(process.cwd(), 'data/training/concepts.ts')
writeFileSync(outPath, output, 'utf-8')
console.log(`Generated ${outPath}`)
console.log(`Concepts: ${concepts.length}`)
console.log(`Empty huggingface arrays: ALL`)
