"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTrainingRun } from "@/hooks/use-training-run";
import { getRemainingEstimate, formatEstimate, getPhaseEstimate } from "@/lib/model-training/estimates";
import type { TrainingRun, RunStatus } from "@/lib/model-training/types";

const STATUS_LABELS: Record<RunStatus, string> = {
  data_ingested: "Ingesting Data",
  deepseek_labeling: "DeepSeek Labeling",
  training: "Training",
  sampling: "Sampling",
  disagreement: "Computing Disagreement",
  awaiting_review: "Awaiting Review",
  retraining: "Retraining",
  opd_recovery: "OPD Recovery",
  exporting: "Exporting",
  complete: "Complete",
  failed: "Failed",
};

const STATUS_VARIANTS: Record<RunStatus, "default" | "secondary" | "destructive" | "outline"> = {
  data_ingested: "secondary",
  deepseek_labeling: "secondary",
  training: "secondary",
  sampling: "secondary",
  disagreement: "secondary",
  awaiting_review: "outline",
  retraining: "secondary",
  opd_recovery: "secondary",
  exporting: "secondary",
  complete: "default",
  failed: "destructive",
};

const PIPELINE_STAGES: { key: RunStatus; label: string; description: string; icon: string }[] = [
  { key: "data_ingested", label: "Ingest", description: "Data collected from sources", icon: "\u{1F4E5}" },
  { key: "deepseek_labeling", label: "Label", description: "Frontier model generates labels", icon: "\u{1F3F7}" },
  { key: "training", label: "Train", description: "Student trained on Tinker", icon: "\u{1F9E0}" },
  { key: "sampling", label: "Sample", description: "Model predicts on training data", icon: "\u{1F50D}" },
  { key: "disagreement", label: "Flag", description: "KL divergence finds contested examples", icon: "\u26A1" },
  { key: "awaiting_review", label: "Review", description: "Expert review of contested labels", icon: "\u{1F441}" },
  { key: "retraining", label: "Retrain", description: "Model retrained with corrections", icon: "\u{1F504}" },
  { key: "opd_recovery", label: "Recover", description: "On-policy distillation", icon: "\u{1F4A7}" },
  { key: "exporting", label: "Export", description: "Model exported to ONNX", icon: "\u{1F4E6}" },
  { key: "complete", label: "Done", description: "Model ready for download", icon: "\u2705" },
];

function AnimatedPipeline({
  status,
  prevStatus,
  startedAt,
}: {
  status: RunStatus;
  prevStatus: RunStatus;
  startedAt?: string;
}) {
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === status);
  const failed = status === "failed";
  const complete = status === "complete";

  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    if (!startedAt) return;
    const update = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setElapsed(`${mins}m ${secs}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  return (
    <Card className="bg-white border-[#E2E0DB] overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">Pipeline</p>
          <div className="flex items-center gap-3">
            {startedAt && !complete && !failed && (
              <span className="text-[11px] text-[#777]">{elapsed} elapsed</span>
            )}
            {!complete && !failed && (
              <span className="text-[11px] text-[#ff5f1f]">
                ETA: {formatEstimate(getRemainingEstimate(status))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_STAGES.slice(0, -1).map((stage, i) => {
            const done = complete || (i < currentIdx);
            const active = i === currentIdx && !failed && !complete;
            const isFailed = failed && i === currentIdx;

            return (
              <div key={stage.key} className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="relative w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: isFailed ? "#D32F2F" : active ? "#ff5f1f" : done ? "#2E7D32" : "transparent",
                    borderColor: isFailed ? "#D32F2F" : active ? "#ff5f1f" : done ? "#2E7D32" : "#E2E0DB",
                    transform: active ? "scale(1.3)" : "scale(1)",
                    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: active ? "0 0 0 4px rgba(199, 102, 29, 0.2)" : "none",
                  }}
                  title={`${stage.label}: ${stage.description}`}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-30"
                      style={{ backgroundColor: "#ff5f1f" }}
                    />
                  )}
                </div>
                {i < PIPELINE_STAGES.length - 2 && (
                  <div
                    className="h-0.5 w-4 flex-shrink-0 transition-all duration-700"
                    style={{
                      backgroundColor: done ? "#ff5f1f" : "#E2E0DB",
                      width: active ? "12px" : "8px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className={`text-[12px] font-medium ${failed ? "text-[#D32F2F]" : "text-[#ff5f1f]"}`}>
            {PIPELINE_STAGES[currentIdx >= 0 ? currentIdx : 0].icon}{" "}
            {STATUS_LABELS[status] || status}
          </p>
          {!failed && !complete && currentIdx > 0 && (
            <span className="text-[10px] text-[#999]">
              {currentIdx} of {PIPELINE_STAGES.length - 2} stages complete
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <Card
      className={`bg-white transition-colors duration-300 ${highlight ? "border-[#ff5f1f]" : "border-[#E2E0DB]"}`}
    >
      <CardContent className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">{label}</p>
        <p
          className="text-[24px] font-semibold mt-1 tracking-[-0.03em] transition-colors duration-300"
          style={{ color: highlight ? "#ff5f1f" : "#111" }}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function AnimatedCounter({ value, duration = 500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = prevValue.current;
    prevValue.current = value;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return display;
}

export function RunDetail({ initialRun }: { initialRun?: TrainingRun }) {
  const { run, loading } = useTrainingRun(initialRun?.id || "", {
    intervalMs: runIdAndStatus(initialRun) === false ? 0 : 5000,
  });

  const display = run || initialRun;
  if (!display) return null;

  const needsReview = display.status === "awaiting_review" && display.contested_examples > 0;
  const isComplete = display.status === "complete";
  const isFailed = display.status === "failed";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/model-service/runs"
            className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] hover:text-[#ff5f1f] transition-colors"
          >
            ← All Runs
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-[17px] font-semibold text-[#111] tracking-[-0.03em]">{display.name}</h1>
            <Badge variant={STATUS_VARIANTS[display.status] || "secondary"}>
              {STATUS_LABELS[display.status] || display.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {needsReview && (
            <Link href={`/model-service/runs/${display.id}/review`}>
              <Button
                className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 px-5"
                style={{ backgroundColor: "#ff5f1f" }}
              >
                Review Labels ({display.contested_examples - display.reviewed_examples})
              </Button>
            </Link>
          )}
          {isComplete && display.onnx_s3_uri && (
            <Button
              variant="outline"
              className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 px-5 border-[#ff5f1f] text-[#ff5f1f]"
            >
              Download ONNX
            </Button>
          )}
        </div>
      </div>

      <AnimatedPipeline
        status={display.status}
        prevStatus={display.status}
        startedAt={display.created_at || undefined}
      />

      <div className="grid grid-cols-4 gap-4 mt-4">
        {[
          { label: "Task Type", value: display.task_type.toUpperCase() },
          { label: "Model Tier", value: display.model_tier.toUpperCase() },
          { label: "Base Model", value: display.base_model_id },
          {
            label: "Training Cost",
            value: display.training_cost != null ? `$${display.training_cost}` : "—",
          },
        ].map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <StatCard
          label="Total Examples"
          value={<AnimatedCounter value={display.total_examples || 0} />}
        />
        <StatCard
          label="Contested"
          value={<AnimatedCounter value={display.contested_examples || 0} />}
          highlight={display.contested_examples > 0}
        />
        <StatCard
          label="Reviewed"
          value={<AnimatedCounter value={display.reviewed_examples || 0} />}
        />
        <StatCard
          label="Accuracy"
          value={
            display.estimated_accuracy != null
              ? `${(display.estimated_accuracy * 100).toFixed(1)}%`
              : "—"
          }
        />
        <StatCard
          label="Disagreement Rate"
          value={
            display.disagreement_rate != null
              ? `${(display.disagreement_rate * 100).toFixed(1)}%`
              : "—"
          }
        />
        <StatCard
          label="Tinker Run"
          value={display.tinker_run_id?.slice(0, 12) || "—"}
        />
      </div>

      {isComplete && (
        <Card className="bg-[#F0F9F0] border-[#C8E6C9] mt-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#2E7D32] mb-1">Model Ready</p>
              <p className="text-sm text-[#2E7D32]">
                ONNX model exported and available for download. Ready to deploy in your application.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 px-5 border-[#2E7D32] text-[#2E7D32]"
              >
                Download ONNX
              </Button>
              <Button
                variant="outline"
                className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 px-5 border-[#ff5f1f] text-[#ff5f1f]"
              >
                Train Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isFailed && display.error_message && (
        <Card className="bg-[#FFF5F5] border-[#FFCDD2] mt-6">
          <CardContent className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#D32F2F] mb-2">Error</p>
            <p className="text-sm text-[#B71C1C]">{display.error_message}</p>
            <div className="mt-3">
              <Link href={`/model-service/runs/create`}>
                <Button
                  className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-8 px-4"
                  style={{ backgroundColor: "#ff5f1f" }}
                >
                  Start New Run
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function runIdAndStatus(run?: TrainingRun) {
  if (!run) return true;
  return run.status !== "complete" && run.status !== "failed";
}
