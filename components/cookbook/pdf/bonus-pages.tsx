import { theme, borderStyle, shadowStyle, labelStyle } from './theme'
import type { Recipe } from '@/data/cookbook/types'
import { getRecipesByPart } from '@/data/cookbook/recipes'
import { parts } from '@/data/cookbook/parts'

function bar(cx: number, cy: number, w: number, h: number, color: string): string {
  return `<rect x="${cx}" y="${cy}" width="${w}" height="${h}" rx="2" fill="${color}" />`
}

function text(cx: number, cy: number, label: string, size: number, color: string, bold?: boolean): string {
  return `<text x="${cx}" y="${cy}" font-family="Inter, sans-serif" font-size="${size}" fill="${color}" font-weight="${bold ? 700 : 400}">${label}</text>`
}

function arrow(cx: number, cy: number, dir: 'right' | 'down', color: string): string {
  if (dir === 'right') {
    return `<path d="M${cx} ${cy - 6} L${cx + 10} ${cy} L${cx} ${cy + 6} Z" fill="${color}" />`
  }
  return `<path d="M${cx - 6} ${cy} L${cx} ${cy + 10} L${cx + 6} ${cy} Z" fill="${color}" />`
}

export function PdfDecisionTree() {
  const branches: { label: string; followUp: string; recipes: string }[] = [
    { label: 'Need better reasoning?', followUp: '✕ RLVR, DAPO, Process Supervision', recipes: 'GRPO, On-Policy Distillation' },
    { label: 'Building a chatbot?', followUp: '✕ Self-Instruct, Evol-Instruct, Constitutional Gen', recipes: 'Preference Optimization, RLVR' },
    { label: 'Working with images?', followUp: '✕ Vision RL, Self-Training Vision, Image Reward', recipes: 'Multi-View Diffusion, Consistency Models' },
    { label: 'Generating 3D assets?', followUp: '✕ Mesh Diffusion, Gaussian Splatting, Neural Fields', recipes: 'Action Diffusion, Flow Matching' },
    { label: 'Processing speech?', followUp: '✕ Speech RL, Voice Cloning, Multi-Speaker Distill', recipes: 'Speech Token Models, Codec LMs' },
    { label: 'Deploying an agent?', followUp: '✕ Tool-Use RL, Web Agents, Computer Use Models', recipes: 'Multi-Agent RL, Interactive Learning' },
    { label: 'Limited compute?', followUp: '✕ Preference Optimization, Distillation, SSM Training', recipes: 'Linear Attention, Curriculum Generation' },
    { label: 'Lots of user data?', followUp: '✕ Data Flywheels, Offline RL, Interactive Learning', recipes: 'Recursive Self-Improvement, RLVR' },
  ]

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.offWhite,
        padding: '14mm 16mm',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          border: borderStyle(),
          borderRadius: theme.border.radius,
          boxShadow: shadowStyle(),
          backgroundColor: theme.colors.white,
          padding: '10mm 12mm',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={labelStyle({ fontSize: 8, padding: '3px 8px', marginBottom: 10 })}>
          Bonus
        </span>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 20,
            fontWeight: theme.weights.heading,
            letterSpacing: '-0.03em',
            color: theme.colors.black,
            marginBottom: 6,
          }}
        >
          Decision Tree
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 8.5,
            color: theme.colors.gray,
            lineHeight: 1.5,
            marginBottom: 18,
          }}
        >
          What are you trying to build? Follow the path from your goal to the recipes that fit.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {branches.map((b, i) => (
            <div
              key={i}
              style={{
                border: borderStyle(1),
                borderRadius: theme.border.radius,
                padding: '3.5mm 5mm',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                backgroundColor: theme.colors.offWhite,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.sans,
                  fontSize: 9.5,
                  fontWeight: theme.weights.heading,
                  color: theme.colors.black,
                  minWidth: 170,
                }}
              >
                {b.label}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: 7,
                  color: theme.colors.accent,
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {b.followUp}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: 6.5,
                  color: theme.colors.gray,
                  textAlign: 'right',
                  lineHeight: 1.5,
                  minWidth: 120,
                }}
              >
                Try: {b.recipes}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            fontFamily: theme.fonts.mono,
            fontSize: 6.5,
            color: theme.colors.lightGray,
            textAlign: 'center',
          }}
        >
          Start → What are you building? → Follow the branch → Pick your recipe
        </div>
      </div>
    </div>
  )
}

export function PdfComputeBudgetGuide() {
  const computeData: { label: string; min: string; max: string; gpus: string; days: string; time: string }[] = [
    { label: 'GRPO', min: '8', max: '64', gpus: '8', days: '3-10', time: 'Medium' },
    { label: 'DAPO', min: '8', max: '64', gpus: '8-16', days: '3-10', time: 'Medium' },
    { label: 'On-Policy Distillation', min: '4', max: '32', gpus: '4-8', days: '2-7', time: 'Low-Med' },
    { label: 'RLVR', min: '4', max: '32', gpus: '4-8', days: '2-7', time: 'Low-Med' },
    { label: 'Preference Optimization', min: '1', max: '8', gpus: '1-4', days: '1-3', time: 'Low' },
    { label: 'Constitutional AI', min: '1', max: '8', gpus: '1-4', days: '1-3', time: 'Low' },
    { label: 'Process Supervision', min: '4', max: '32', gpus: '4-8', days: '2-7', time: 'Low-Med' },
    { label: 'Self-Instruct', min: '1', max: '8', gpus: '1-4', days: '2-5', time: 'Low-Med' },
    { label: 'Evol-Instruct', min: '1', max: '8', gpus: '1-4', days: '2-5', time: 'Low-Med' },
    { label: 'Judge Models', min: '4', max: '16', gpus: '4-8', days: '2-5', time: 'Medium' },
    { label: 'Vision RL', min: '8', max: '64', gpus: '8-16', days: '3-10', time: 'Medium' },
    { label: 'Multi-View Diffusion', min: '8', max: '64', gpus: '8-16', days: '5-14', time: 'Medium' },
    { label: 'Mesh Diffusion', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Low-Med' },
    { label: 'Neural Field Training', min: '4', max: '16', gpus: '4-8', days: '2-7', time: 'Low-Med' },
    { label: 'Flow Matching', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Low-Med' },
    { label: 'Rectified Flow', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Low-Med' },
    { label: 'Gaussian Splatting', min: '1', max: '8', gpus: '1-4', days: '1-3', time: 'Low' },
    { label: 'Consistency Models', min: '4', max: '32', gpus: '4-8', days: '2-7', time: 'Low-Med' },
    { label: 'Speech RL', min: '8', max: '64', gpus: '8-16', days: '5-14', time: 'High' },
    { label: 'Speech Token Models', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Medium' },
    { label: 'Voice Cloning', min: '1', max: '8', gpus: '1-4', days: '1-5', time: 'Low-Med' },
    { label: 'Codec Language Models', min: '8', max: '64', gpus: '8-16', days: '5-14', time: 'High' },
    { label: 'Sim-to-Real', min: '1', max: '8', gpus: '1-4', days: '3-10', time: 'Low-Med' },
    { label: 'Behavior Cloning', min: '1', max: '8', gpus: '1-4', days: '1-3', time: 'Low' },
    { label: 'Offline RL', min: '4', max: '32', gpus: '4-8', days: '2-7', time: 'Low-Med' },
    { label: 'World Models (Dreamer)', min: '8', max: '64', gpus: '8-16', days: '5-14', time: 'High' },
    { label: 'Tool-Use RL', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Medium' },
    { label: 'Multi-Agent RL', min: '8', max: '128', gpus: '16-32', days: '7-21', time: 'Very High' },
    { label: 'Interactive Learning', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Medium' },
    { label: 'Data Flywheels', min: '4', max: '32', gpus: '4-16', days: 'ongoing', time: 'Med-High' },
    { label: 'SSM Training (Mamba)', min: '8', max: '64', gpus: '8-16', days: '5-14', time: 'Medium' },
    { label: 'Linear Attention', min: '4', max: '32', gpus: '4-8', days: '3-10', time: 'Medium' },
  ]

  const rows = computeData.map((r, i) => {
    const accent = i % 2 === 0 ? 'transparent' : theme.colors.offWhite
    return (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', padding: '1.8mm 3mm',
        backgroundColor: accent, borderRadius: 2,
      }}>
        <div style={{ width: 150, fontFamily: theme.fonts.sans, fontSize: 7.5, fontWeight: theme.weights.body, color: theme.colors.black }}>{r.label}</div>
        <div style={{ width: 50, fontFamily: theme.fonts.mono, fontSize: 7, color: theme.colors.gray, textAlign: 'center' }}>{r.min}–{r.max}</div>
        <div style={{ width: 55, fontFamily: theme.fonts.mono, fontSize: 7, color: theme.colors.gray, textAlign: 'center' }}>{r.gpus}</div>
        <div style={{ width: 50, fontFamily: theme.fonts.mono, fontSize: 7, color: theme.colors.gray, textAlign: 'center' }}>{r.days}</div>
        <div style={{ width: 65, fontFamily: theme.fonts.mono, fontSize: 7, color: theme.colors.accent, textAlign: 'right' }}>{r.time}</div>
      </div>
    )
  })

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.offWhite,
        padding: '14mm 16mm',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          border: borderStyle(),
          borderRadius: theme.border.radius,
          boxShadow: shadowStyle(),
          backgroundColor: theme.colors.white,
          padding: '10mm 12mm',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={labelStyle({ fontSize: 8, padding: '3px 8px', marginBottom: 10 })}>
          Bonus
        </span>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 20,
            fontWeight: theme.weights.heading,
            letterSpacing: '-0.03em',
            color: theme.colors.black,
            marginBottom: 4,
          }}
        >
          Compute Budget Guide
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 8.5,
            color: theme.colors.gray,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          GPU-hours, parallelism, and typical wall-clock time for each recipe at production scale.
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', padding: '1.8mm 3mm', marginBottom: 3,
          borderBottom: `1px solid ${theme.colors.black}`,
        }}>
          <div style={{ width: 150, fontFamily: theme.fonts.mono, fontSize: 6.5, fontWeight: theme.weights.mono, color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recipe</div>
          <div style={{ width: 50, fontFamily: theme.fonts.mono, fontSize: 6.5, fontWeight: theme.weights.mono, color: theme.colors.accent, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GPU</div>
          <div style={{ width: 55, fontFamily: theme.fonts.mono, fontSize: 6.5, fontWeight: theme.weights.mono, color: theme.colors.accent, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GPUs</div>
          <div style={{ width: 50, fontFamily: theme.fonts.mono, fontSize: 6.5, fontWeight: theme.weights.mono, color: theme.colors.accent, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Days</div>
          <div style={{ width: 65, fontFamily: theme.fonts.mono, fontSize: 6.5, fontWeight: theme.weights.mono, color: theme.colors.accent, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cost</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rows}
        </div>

        <div style={{
          marginTop: 10, fontFamily: theme.fonts.mono, fontSize: 6.5, color: theme.colors.lightGray, textAlign: 'center',
          borderTop: `1px solid ${theme.colors.gray}`, paddingTop: 8,
        }}>
          GPU counts assume H100 (80 GB). Multiply by 2–3× for A100. Costs vary by region and spot availability.
        </div>
      </div>
    </div>
  )
}

export function PdfDependencyMap() {
  const deps: { from: string; to: string[] }[] = [
    { from: 'GRPO', to: ['RLVR', 'DAPO'] },
    { from: 'Process Supervision', to: ['RLVR', 'GRPO'] },
    { from: 'Preference Optimization', to: ['Constitutional AI', 'Diffusion Pref Opt'] },
    { from: 'On-Policy Distillation', to: ['Skill Distillation', 'Multi-Speaker Distillation'] },
    { from: 'Self-Instruct', to: ['Evol-Instruct', 'Curriculum Generation', 'Synthetic Curriculum'] },
    { from: 'Flow Matching', to: ['Rectified Flow', 'Action Diffusion'] },
    { from: 'Multi-View Diffusion', to: ['Mesh Diffusion', '3D Generation pipeline'] },
    { from: 'Neural Field Training', to: ['Gaussian Splatting Supervision'] },
    { from: 'Speech Token Models', to: ['Codec Language Models', 'Voice Cloning'] },
    { from: 'Codec Language Models', to: ['Speech RL', 'Multi-Speaker Distillation'] },
    { from: 'Behavior Cloning', to: ['Offline RL', 'Interactive Learning'] },
    { from: 'World Models (Dreamer)', to: ['Latent Planning', 'Scene-Graph Planning'] },
    { from: 'Offline RL', to: ['Multi-Agent RL', 'Tool-Use RL'] },
    { from: 'Tool-Use RL', to: ['Web Agents', 'Computer Use Models'] },
    { from: 'Interactive Learning', to: ['Recursive Self-Improvement'] },
    { from: 'Data Flywheels', to: ['Recursive Self-Improvement'] },
    { from: 'Linear Attention', to: ['SSM Training (Mamba)', 'State-Space Models'] },
    { from: 'Synthetic Curriculum', to: ['Curriculum Generation'] },
    { from: 'Self-Training Vision', to: ['Vision RL', 'Image Reward Models'] },
  ]

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.offWhite,
        padding: '14mm 16mm',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          border: borderStyle(),
          borderRadius: theme.border.radius,
          boxShadow: shadowStyle(),
          backgroundColor: theme.colors.white,
          padding: '10mm 12mm',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={labelStyle({ fontSize: 8, padding: '3px 8px', marginBottom: 10 })}>
          Bonus
        </span>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 20,
            fontWeight: theme.weights.heading,
            letterSpacing: '-0.03em',
            color: theme.colors.black,
            marginBottom: 4,
          }}
        >
          Dependency Map
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 8.5,
            color: theme.colors.gray,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          Which recipes build on which. Prerequisites left, dependents right.
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {deps.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '2.5mm 4mm',
              border: borderStyle(1),
              borderRadius: theme.border.radius,
              backgroundColor: i % 2 === 0 ? theme.colors.offWhite : 'transparent',
            }}>
              <div style={{
                fontFamily: theme.fonts.sans, fontSize: 8.5, fontWeight: theme.weights.heading,
                color: theme.colors.black, minWidth: 160,
              }}>
                {d.from}
              </div>
              <div style={{ color: theme.colors.accent, fontFamily: theme.fonts.mono, fontSize: 11 }}>→</div>
              <div style={{
                fontFamily: theme.fonts.mono, fontSize: 7, color: theme.colors.gray, lineHeight: 1.6,
              }}>
                {d.to.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PdfTimeline() {
  const eras = [
    {
      year: '2014–2017',
      title: 'The Foundations',
      items: ['Attention is All You Need (Transformer)', 'Seq2Seq + Attention', 'Teacher Forcing', 'Curriculum Learning'],
      color: theme.colors.accent,
    },
    {
      year: '2017–2020',
      title: 'Pre-Training Era',
      items: ['GPT / BERT pre-training', 'Masked Language Modeling', 'Next Sentence Prediction', 'Unsupervised Pre-training'],
      color: theme.colors.accent,
    },
    {
      year: '2020–2022',
      title: 'Instruction Tuning',
      items: ['FLAN / T0 instruction tuning', 'Self-Instruct', 'RLHF (InstructGPT)', 'Constitutional AI'],
      color: theme.colors.accent,
    },
    {
      year: '2022–2023',
      title: 'Alignment & Preferences',
      items: ['Preference Optimization (DPO)', 'Process Reward Models', 'Constitutional AI', 'GRPO (Group Relative PO)'],
      color: theme.colors.accent,
    },
    {
      year: '2023–2024',
      title: 'Scaling Synthesis',
      items: ['Evol-Instruct & WizardLM', 'Synthetic Data Pipelines', 'Curriculum Generation (Phi)', 'Diffusion for 3D/Speech'],
      color: theme.colors.accent,
    },
    {
      year: '2024–2025',
      title: 'Agentic & Self-Improving',
      items: ['Tool-Use RL / Web Agents', 'Computer Use Models', 'Multi-Agent RL', 'Recursive Self-Improvement', 'Data Flywheels'],
      color: theme.colors.accent,
    },
    {
      year: '2025–2026',
      title: 'The Frontier',
      items: ['On-Policy Distillation at Scale', 'DAPO & Decoupled RL', 'World Models for Planning', 'Autonomous Curriculum Evolution'],
      color: theme.colors.accent,
    },
  ]

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: theme.colors.offWhite,
        padding: '14mm 16mm',
        display: 'flex',
        flexDirection: 'column',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          border: borderStyle(),
          borderRadius: theme.border.radius,
          boxShadow: shadowStyle(),
          backgroundColor: theme.colors.white,
          padding: '10mm 12mm',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={labelStyle({ fontSize: 8, padding: '3px 8px', marginBottom: 10 })}>
          Bonus
        </span>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 20,
            fontWeight: theme.weights.heading,
            letterSpacing: '-0.03em',
            color: theme.colors.black,
            marginBottom: 4,
          }}
        >
          Timeline of Training Paradigms
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 8.5,
            color: theme.colors.gray,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          How training paradigms evolved from 2014 to present, and where we are heading.
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {eras.map((era, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{
                minWidth: 60, textAlign: 'right',
                fontFamily: theme.fonts.mono, fontSize: 7.5, fontWeight: theme.weights.mono,
                color: theme.colors.accent, paddingTop: 3,
              }}>
                {era.year}
              </div>
              <div style={{
                width: 3, alignSelf: 'stretch',
                backgroundColor: era.color, borderRadius: 2, minHeight: 48,
              }} />
              <div style={{
                flex: 1,
                border: borderStyle(1),
                borderRadius: theme.border.radius,
                padding: '3mm 4mm',
                backgroundColor: theme.colors.offWhite,
              }}>
                <div style={{
                  fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: theme.weights.heading,
                  color: theme.colors.black, marginBottom: 3,
                }}>
                  {era.title}
                </div>
                <div style={{
                  fontFamily: theme.fonts.mono, fontSize: 6.5, color: theme.colors.gray, lineHeight: 1.7,
                }}>
                  {era.items.map((item, j) => (
                    <span key={j}>
                      {j > 0 && <span style={{ color: theme.colors.accent }}> &middot; </span>}
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
