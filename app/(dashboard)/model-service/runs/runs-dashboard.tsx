"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrgId } from "@/hooks/use-org-id";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRunList } from "@/hooks/use-training-run";
import type { TrainingRun, RunStatus } from "@/lib/model-training/types";

const STATUS_LABELS: Record<RunStatus, string> = {
  data_ingested: "Ingesting Data",
  deepseek_labeling: "Labeling",
  training: "Training",
  sampling: "Sampling",
  disagreement: "Disagreement",
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

const STATUS_ORDER: RunStatus[] = [
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

function ProgressBar({ status }: { status: RunStatus }) {
  const idx = STATUS_ORDER.indexOf(status);
  const complete = status === "complete";
  const failed = status === "failed";
  const pct = failed ? 100 : complete ? 100 : Math.max(5, ((idx + 1) / STATUS_ORDER.length) * 100);

  return (
    <div className="h-1.5 bg-[#E2E0DB] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          backgroundColor: failed ? "#D32F2F" : pct === 100 && !failed ? "#2E7D32" : "#C7661D",
        }}
      />
    </div>
  );
}

export function RunsDashboard({ initialRuns = [] }: { initialRuns?: TrainingRun[] }) {
  const router = useRouter();
  const orgId = useOrgId()
  const { runs: polledRuns, loading } = useRunList(orgId ?? "", { intervalMs: 10000 });
  if (!orgId) return <div className="text-center py-16 text-sm text-[#777]">Loading workspace...</div>
  const runs = polledRuns.length > 0 ? polledRuns : initialRuns;

  const stats = {
    total: runs.length,
    active: runs.filter((r) => r.status !== "complete" && r.status !== "failed").length,
    complete: runs.filter((r) => r.status === "complete").length,
    review: runs.filter((r) => r.status === "awaiting_review").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[17px] font-semibold text-[#111] tracking-[-0.03em]">Training Runs</h1>
          <p className="text-sm text-[#777] mt-1">Manage your model training pipelines</p>
        </div>
        <Link href="/model-service/runs/create">
          <Button className="rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 px-5" style={{ backgroundColor: "#111" }}>
            + New Run
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Runs", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Complete", value: stats.complete },
          { label: "Needing Review", value: stats.review },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white border-[#E2E0DB]">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">{stat.label}</p>
              <p className="text-[24px] font-semibold text-[#111] mt-1 tracking-[-0.03em]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {runs.length === 0 ? (
        <Card className="bg-white border-[#E2E0DB]">
          <CardContent className="p-12 text-center">
            <p className="text-[15px] text-[#777]">No training runs yet.</p>
          <Link href="/model-service/runs/create">
            <Button className="mt-4 rounded-full text-[12px] font-extrabold uppercase tracking-[0.08em] h-9 px-5" style={{ backgroundColor: "#C7661D" }}>
              Create your first run
            </Button>
          </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E0DB] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E0DB]">
                {["Name", "Task", "Tier", "Status", "Samples", "Accuracy", "Cost", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-[#E2E0DB] last:border-b-0 hover:bg-[#F5F4F0] cursor-pointer transition-colors"
                  onClick={() => router.push(`/model-service/runs/${run.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#111]">{run.name}</p>
                    <ProgressBar status={run.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[#777]">
                      {run.task_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-[0.1em]">
                      {run.model_tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[run.status] || "secondary"}>
                      {STATUS_LABELS[run.status] || run.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#777]">{run.total_examples}</td>
                  <td className="px-4 py-3 text-sm text-[#777]">
                    {run.estimated_accuracy != null ? `${(run.estimated_accuracy * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#777]">
                    {run.training_cost != null ? `$${run.training_cost}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-[#C7661D] text-xs">
                      View →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
