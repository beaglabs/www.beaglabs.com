/** Time estimates for training pipeline phases */

import type { RunStatus } from "@/lib/model-training/types";

interface PhaseEstimate {
  phase: RunStatus;
  label: string;
  estimateMinutes: number;
}

const DEFAULT_PHASE_ESTIMATES: PhaseEstimate[] = [
  { phase: "data_ingested", label: "Data ingestion", estimateMinutes: 2 },
  { phase: "deepseek_labeling", label: "DeepSeek labeling", estimateMinutes: 8 },
  { phase: "training", label: "Training", estimateMinutes: 120 },
  { phase: "sampling", label: "Sampling", estimateMinutes: 5 },
  { phase: "disagreement", label: "Disagreement", estimateMinutes: 1 },
  { phase: "awaiting_review", label: "Awaiting review", estimateMinutes: 0 },
  { phase: "retraining", label: "Retraining", estimateMinutes: 60 },
  { phase: "opd_recovery", label: "OPD recovery", estimateMinutes: 15 },
  { phase: "exporting", label: "ONNX export", estimateMinutes: 5 },
  { phase: "complete", label: "Complete", estimateMinutes: 0 },
  { phase: "failed", label: "Failed", estimateMinutes: 0 },
];

const PHASE_ORDER: RunStatus[] = [
  "data_ingested",
  "deepseek_labeling",
  "training",
  "sampling",
  "disagreement",
  "awaiting_review",
  "retraining",
  "opd_recovery",
  "exporting",
  "complete",
];

const ESTIMATE_MAP = new Map(DEFAULT_PHASE_ESTIMATES.map((e) => [e.phase, e]));

export function getPhaseEstimate(phase: RunStatus): PhaseEstimate {
  return ESTIMATE_MAP.get(phase) ?? { phase, label: phase, estimateMinutes: 0 };
}

export function getRemainingEstimate(status: RunStatus): number {
  if (status === "complete" || status === "failed") return 0;

  const currentIdx = PHASE_ORDER.indexOf(status);
  if (currentIdx === -1) return 0;

  let totalMinutes = 0;
  for (let i = currentIdx; i < PHASE_ORDER.length; i++) {
    const phase = PHASE_ORDER[i];
    if (phase === "awaiting_review" || phase === "complete" || phase === "failed") continue;
    const est = ESTIMATE_MAP.get(phase);
    if (est) totalMinutes += est.estimateMinutes;
  }

  return Math.max(1, totalMinutes);
}

export function getTotalEstimate(): number {
  return DEFAULT_PHASE_ESTIMATES
    .filter((e) => e.phase !== "awaiting_review" && e.phase !== "complete" && e.phase !== "failed")
    .reduce((sum, e) => sum + e.estimateMinutes, 0);
}

export function formatEstimate(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `~${hrs}h`;
  return `~${hrs}h ${mins}m`;
}
