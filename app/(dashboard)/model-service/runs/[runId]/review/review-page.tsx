"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReviewQueue, useTrainingRun } from "@/hooks/use-training-run";
import { formatEstimate } from "@/lib/model-training/estimates";
import type { TrainingExample } from "@/lib/model-training/types";

interface ReviewPageProps {
  runId: string;
}

const API = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_MODEL_TRAINING_API || "http://localhost:8000/api/v1")
  : "";

function highlightMatches(text: string, highlights: string[]): React.ReactNode {
  if (highlights.length === 0) return text;

  const pattern = highlights
    .filter((h) => h.length > 0)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!pattern) return text;

  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ backgroundColor: "#FFE0C0", color: "#111", borderRadius: "2px", padding: "0 1px" }}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function ReviewProgressBar({ reviewed, total, startTime }: { reviewed: number; total: number; startTime: number }) {
  const pct = total > 0 ? (reviewed / total) * 100 : 0;

  const etaMinutes = useMemo(() => {
    if (reviewed === 0 || total === 0) return null;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = reviewed / elapsed;
    const remaining = total - reviewed;
    const etaSeconds = rate > 0 ? remaining / rate : 0;
    return Math.ceil(etaSeconds / 60);
  }, [reviewed, total, startTime]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#111]">
            {reviewed} / {total}
          </span>
          <span className="text-[11px] text-[#999]">reviewed</span>
          {etaMinutes != null && etaMinutes > 0 && (
            <span className="text-[11px] text-[#ff5f1f]">{formatEstimate(etaMinutes)} remaining</span>
          )}
        </div>
        <span className="text-[11px] text-[#999]">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 bg-[#E2E0DB] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#2E7D32" : "#ff5f1f" }}
        />
      </div>
    </div>
  );
}

function ShortcutHints() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {[
        { key: "j", label: "Next" },
        { key: "k", label: "Prev" },
        { key: "c", label: "Correct" },
        { key: "w", label: "Wrong" },
        { key: "u", label: "Uncertain" },
        { key: "Enter", label: "Submit" },
      ].map(({ key, label }) => (
        <span key={key} className="flex items-center gap-1.5 text-[10px] text-[#999]">
          <kbd className="bg-[#E2E0DB] text-[#555] rounded px-1.5 py-0.5 text-[9px] font-mono leading-none">
            {key}
          </kbd>
          {label}
        </span>
      ))}
    </div>
  );
}

export function ReviewPage({ runId }: ReviewPageProps) {
  const router = useRouter();
  const { run } = useTrainingRun(runId);
  const { examples, total, loading } = useReviewQueue(runId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const submitAll = useCallback(async () => {
    setSubmitting(true);
    const payload = Object.entries(reviews).map(([example_id, corrected_label]) => ({
      example_id,
      corrected_label,
    }));

    try {
      const res = await fetch(`${API}/runs/${runId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.all_reviewed) {
        setComplete(true);
        setTimeout(() => router.push(`/model-service/runs/${runId}`), 3000);
      } else {
        router.refresh();
        router.push(`/model-service/runs/${runId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }, [reviews, runId, router]);

  const handleLabel = useCallback(
    (label: string) => {
      const ex = examples[currentIdx];
      if (!ex || reviews[ex.id]) return;
      setReviews((prev) => ({ ...prev, [ex.id]: label }));
      if (currentIdx < examples.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      }
    },
    [examples, currentIdx, reviews]
  );

  const handlePrev = useCallback(() => setCurrentIdx((p) => Math.max(0, p - 1)), []);
  const handleNext = useCallback(() => setCurrentIdx((p) => Math.min(examples.length - 1, p + 1)), [examples.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case "j":
          e.preventDefault();
          handleNext();
          break;
        case "k":
          e.preventDefault();
          handlePrev();
          break;
        case "c":
          e.preventDefault();
          handleLabel("Correct");
          break;
        case "w":
          e.preventDefault();
          handleLabel("Incorrect");
          break;
        case "u":
          e.preventDefault();
          handleLabel("Uncertain");
          break;
        case "enter":
          if (Object.keys(reviews).length > 0 && !submitting) {
            e.preventDefault();
            submitAll();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev, handleLabel, reviews, submitting, submitAll]);

  if (loading || !examples) {
    return (
      <div className="text-center py-24">
        <p className="text-sm text-[#777]">Loading review queue...</p>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="text-center py-24">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#E8F5E9" }}>
          <span className="text-[20px]" style={{ color: "#2E7D32" }}>&#10003;</span>
        </div>
        <p className="text-[17px] font-semibold text-[#111] tracking-[-0.03em]">All reviews submitted</p>
        <p className="text-sm text-[#777] mt-2">Retraining triggered. Redirecting...</p>
      </div>
    );
  }

  if (examples.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-[15px] text-[#777]">No contested examples to review.</p>
        <Link href={`/model-service/runs/${runId}`} className="block mt-4">
          <Button variant="outline" className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 border-[#E2E0DB]">
            Back to Run
          </Button>
        </Link>
      </div>
    );
  }

  const current = examples[currentIdx];
  const reviewedCount = Object.keys(reviews).length;

  return (
    <div ref={containerRef} tabIndex={-1} className="outline-none">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            href={`/model-service/runs/${runId}`}
            className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] hover:text-[#ff5f1f] transition-colors"
          >
            ← Run Detail
          </Link>
          <h1 className="text-[17px] font-semibold text-[#111] tracking-[-0.03em] mt-2">Label Review</h1>
        </div>
        <div className="text-right">
          <ShortcutHints />
        </div>
      </div>

      <ReviewProgressBar reviewed={reviewedCount} total={total || examples.length} startTime={startTime} />

      {error && (
        <Card className="bg-[#FFF5F5] border-[#FFCDD2] mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-[#B71C1C]">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Example card */}
          <Card className="bg-white border-[#E2E0DB]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-[10px] uppercase tracking-[0.1em]">
                  {currentIdx + 1} of {examples.length}
                </Badge>
                <div className="flex items-center gap-2">
                  {reviews[current.id] && (
                    <Badge style={{ backgroundColor: "#2E7D32", color: "#fff" }} className="text-[9px]">
                      Reviewed
                    </Badge>
                  )}
                  <span className="text-[10px] text-[#999]">
                    KL: {((current.kl_divergence ?? 0) * 1000).toFixed(0)}e-3
                  </span>
                  {current.model_confidence != null && (
                    <span className="text-[10px] text-[#999]">
                      Conf: {(current.model_confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#F5F4F0] rounded-lg p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] mb-2">Input Data</p>
                <div className="text-sm text-[#111] whitespace-pre-wrap font-sans leading-relaxed">
                  {highlightMatches(formatInputData(current.input_data), extractKeywords(current))}
                </div>
              </div>

              {current.metadata && Object.keys(current.metadata).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(current.metadata).map(([key, value]) => (
                    <span key={key} className="text-[10px] text-[#777] bg-[#F5F4F0] px-2 py-1 rounded">
                      {key}: {typeof value === "string" ? (value.length > 40 ? value.slice(0, 40) + "..." : value) : String(value)}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 border-[#E2E0DB]"
            >
              ← Prev <kbd className="ml-1 bg-[#E2E0DB] rounded px-1 text-[9px]">k</kbd>
            </Button>

            <div className="flex items-center gap-1">
              {examples.slice(Math.max(0, currentIdx - 2), Math.min(examples.length, currentIdx + 3)).map((ex, i) => {
                const idx = Math.max(0, currentIdx - 2) + i;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setCurrentIdx(idx)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: idx === currentIdx ? "#ff5f1f" : reviews[ex.id] ? "#2E7D32" : "#E2E0DB",
                      transform: idx === currentIdx ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIdx === examples.length - 1}
              className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 border-[#E2E0DB]"
            >
              <kbd className="mr-1 bg-[#E2E0DB] rounded px-1 text-[9px]">j</kbd> Next →
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="bg-white border-[#E2E0DB]">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] mb-3">Labels</p>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-[#999]">Frontier (DeepSeek)</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {current.frontier_label || "—"}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] text-[#999]">Student Model</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{current.model_label || "—"}</Badge>
                    {current.model_confidence != null && (
                      <span className="text-[10px] text-[#999]">{(current.model_confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>

                {reviews[current.id] && (
                  <div>
                    <p className="text-[10px] text-[#999]">Your Correction</p>
                    <Badge className="mt-1 text-xs" style={{ backgroundColor: "#2E7D32", color: "#fff" }}>
                      {reviews[current.id]}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E2E0DB]">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] mb-3">
                Quick Correct
              </p>
              <div className="space-y-2">
                {[
                  { label: "Correct", key: "c", color: "#2E7D32" },
                  { label: "Incorrect", key: "w", color: "#D32F2F" },
                  { label: "Uncertain", key: "u", color: "#999" },
                ].map(({ label, key, color }) => (
                  <Button
                    key={label}
                    onClick={() => handleLabel(label)}
                    className="w-full rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 justify-between px-4"
                    style={{ backgroundColor: color, color: "#fff" }}
                    disabled={!!reviews[current.id]}
                  >
                    {label}
                    <kbd className="bg-black/20 rounded px-1.5 py-0.5 text-[9px] leading-none">{key}</kbd>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={submitAll}
            disabled={reviewedCount === 0 || submitting}
            className="w-full rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-10"
            style={{ backgroundColor: "#ff5f1f" }}
          >
            {submitting
              ? "Submitting..."
              : `Submit ${reviewedCount} Review${reviewedCount !== 1 ? "s" : ""}`}{" "}
            <kbd className="ml-2 bg-black/15 rounded px-1.5 py-0.5 text-[9px] leading-none">&#8629;</kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatInputData(data: Record<string, unknown>): string {
  if (typeof data.text === "string") return data.text;
  if (typeof data.code === "string") return data.code;
  if (typeof data.body === "string") return data.body;
  return JSON.stringify(data, null, 2);
}

function extractKeywords(example: TrainingExample): string[] {
  if (example.frontier_label && example.model_label && example.frontier_label !== example.model_label) {
    return [example.frontier_label, example.model_label];
  }
  return example.frontier_label ? [example.frontier_label] : [];
}
