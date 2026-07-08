"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API = process.env.NEXT_PUBLIC_MODEL_TRAINING_API || "http://localhost:8000/api/v1";

interface DomainStats {
  domain: string;
  adapter_count: number;
  avg_accuracy: number | null;
  best_accuracy: number | null;
  ready_to_merge: boolean;
}

interface MergeCandidate {
  domain: string;
  adapter_count: number;
  avg_accuracy: number;
  best_accuracy: number;
  source_customers: string[];
}

function DomainCard({ stat, onMerge }: { stat: DomainStats; onMerge: (domain: string) => void }) {
  const displayName = stat.domain
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Card className="bg-white border-[#E2E0DB]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[#111]">{displayName}</p>
            <p className="text-[10px] text-[#999] mt-0.5">{stat.domain}</p>
          </div>
          {stat.ready_to_merge ? (
            <Badge style={{ backgroundColor: "#2E7D32", color: "#fff" }} className="text-[9px]">
              Ready to Merge
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px]">
              Collecting
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">Adapters</p>
            <p className="text-[20px] font-semibold text-[#111] tracking-[-0.03em]">
              {stat.adapter_count}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">Avg Acc</p>
            <p className="text-[20px] font-semibold text-[#111] tracking-[-0.03em]">
              {stat.avg_accuracy != null ? `${(stat.avg_accuracy * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">Best</p>
            <p className="text-[20px] font-semibold text-[#111] tracking-[-0.03em]">
              {stat.best_accuracy != null ? `${(stat.best_accuracy * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>

        <div className="h-1.5 bg-[#E2E0DB] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (stat.adapter_count / 3) * 100)}%`,
              backgroundColor: stat.adapter_count >= 3 ? "#2E7D32" : "#C7661D",
            }}
          />
        </div>

        {stat.ready_to_merge && (
          <Button
            onClick={() => onMerge(stat.domain)}
            className="w-full rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em] h-8"
            style={{ backgroundColor: "#C7661D" }}
          >
            Merge Domain
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function LibraryPage() {
  const [domains, setDomains] = useState<DomainStats[]>([]);
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [domRes, candRes] = await Promise.all([
        fetch(`${API}/library/domains`),
        fetch(`${API}/library/merge-candidates`),
      ]);
      if (domRes.ok) setDomains(await domRes.json());
      if (candRes.ok) setCandidates(await candRes.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMerge = async (domain: string) => {
    try {
      await fetch(`${API}/library/domains/${domain}/merge`, { method: "POST" });
      fetchData();
    } catch (_) {}
  };

  if (loading) {
    return <div className="text-center py-16"><p className="text-sm text-[#777]">Loading...</p></div>;
  }

  const totalAdapters = domains.reduce((s, d) => s + d.adapter_count, 0);
  const mergeReady = domains.filter((d) => d.ready_to_merge).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[17px] font-semibold text-[#111] tracking-[-0.03em]">Base Model Library</h1>
          <p className="text-sm text-[#777] mt-1">
            Domain-adapted checkpoints built from anonymized customer adapters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Adapters", value: totalAdapters },
          { label: "Domains", value: domains.length },
          { label: "Ready to Merge", value: mergeReady },
          { label: "Warm Start Eligible", value: mergeReady, subtitle: "domains with >=3 adapters" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white border-[#E2E0DB]">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999]">{stat.label}</p>
              <p className="text-[24px] font-semibold text-[#111] mt-1 tracking-[-0.03em]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {candidates.length > 0 && (
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] mb-3">Merge Candidates</p>
          <div className="bg-[#FFF5EC] border border-[#FFE0C0] rounded-lg p-4">
            {candidates.map((c) => (
              <div key={c.domain} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#111]">
                    {c.domain.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                  </p>
                  <p className="text-[10px] text-[#777]">
                    {c.adapter_count} adapters from {c.source_customers.length} customers · Avg accuracy: {(c.avg_accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <Button
                  onClick={() => handleMerge(c.domain)}
                  className="rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em] h-8 px-4"
                  style={{ backgroundColor: "#C7661D" }}
                >
                  Merge Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] mb-3">All Domains</p>
        {domains.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E2E0DB] bg-white p-12 text-center">
            <p className="text-[15px] text-[#777]">No adapters collected yet.</p>
            <p className="text-xs text-[#999] mt-1">Adapters are collected after each successful training run and stored here for domain merging.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {domains.map((stat) => (
              <DomainCard key={stat.domain} stat={stat} onMerge={handleMerge} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-[#F5F4F0] rounded-lg p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#999] mb-2">How It Works</p>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-[#111]">1. Collect</p>
            <p className="text-[11px] text-[#777] mt-1">
              After each successful training run, the LoRA adapter is de-identified and stored in S3.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#111]">2. Merge</p>
            <p className="text-[11px] text-[#777] mt-1">
              When 3+ customers train in the same domain, adapters are distilled into a single checkpoint.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#111]">3. Warm Start</p>
            <p className="text-[11px] text-[#777] mt-1">
              Future customers in that domain start from the merged checkpoint — 30% fewer examples needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
