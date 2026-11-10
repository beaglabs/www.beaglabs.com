"use client";

import { memo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrainingExample } from "@/lib/model-training/types";

interface ReviewCardProps {
  example: TrainingExample;
  index: number;
  total: number;
  reviewed: boolean;
  onCorrect: () => void;
  onIncorrect: () => void;
  onUncertain: () => void;
}

export const ReviewCard = memo(function ReviewCard({
  example,
  index,
  total,
  reviewed,
  onCorrect,
  onIncorrect,
  onUncertain,
}: ReviewCardProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (reviewed) return;
      switch (e.key.toLowerCase()) {
        case "c":
          e.preventDefault();
          onCorrect();
          break;
        case "w":
          e.preventDefault();
          onIncorrect();
          break;
        case "u":
          e.preventDefault();
          onUncertain();
          break;
      }
    },
    [reviewed, onCorrect, onIncorrect, onUncertain]
  );

  const text = formatText(example.input_data);
  const hasBothLabels =
    example.frontier_label &&
    example.model_label &&
    example.frontier_label !== example.model_label;

  return (
    <Card
      className="bg-[#fffaf3] border-[#e2c9a6] focus-within:border-[#e5632f] transition-colors outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.1em]">
              {index + 1} of {total}
            </Badge>
            {reviewed && (
              <Badge style={{ backgroundColor: "#2E7D32", color: "#fffaf3" }} className="text-[9px]">
                Done
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {example.kl_divergence != null && (
              <span className="text-[10px] text-[#a08b78]">
                KL: {((example.kl_divergence ?? 0) * 1000).toFixed(0)}e-3
              </span>
            )}
            {example.model_confidence != null && (
              <span className="text-[10px] text-[#a08b78]">
                Conf: {(example.model_confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#FDEEE1] rounded-lg p-3 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#a08b78] mb-1">Input</p>
          <p className="text-sm text-[#1a1714] whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto">
            {text}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div>
            <p className="text-[9px] text-[#a08b78] uppercase">Frontier</p>
            <Badge variant="outline" className={hasBothLabels ? "border-[#e5632f] text-[#e5632f]" : ""}>
              {example.frontier_label || "—"}
            </Badge>
          </div>
          {hasBothLabels && <span className="text-[#D32F2F] text-sm">vs</span>}
          <div>
            <p className="text-[9px] text-[#a08b78] uppercase">Student</p>
            <Badge variant="secondary">{example.model_label || "—"}</Badge>
          </div>
        </div>

        {!reviewed && (
          <div className="flex items-center gap-2">
            {[
              { label: "Correct", key: "c", color: "#2E7D32", action: onCorrect },
              { label: "Incorrect", key: "w", color: "#D32F2F", action: onIncorrect },
              { label: "Uncertain", key: "u", color: "#a08b78", action: onUncertain },
            ].map(({ label, key, color, action }) => (
              <button
                key={label}
                onClick={action}
                className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#fffaf3] rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: color }}
              >
                {label}
                <kbd className="bg-black/20 rounded px-1 text-[8px] leading-none">{key}</kbd>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

function formatText(data: Record<string, unknown>): string {
  if (typeof data.text === "string") return data.text;
  if (typeof data.code === "string") return data.code;
  if (typeof data.body === "string") return data.body;
  return JSON.stringify(data, null, 2);
}
