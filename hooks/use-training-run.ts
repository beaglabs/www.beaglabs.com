"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TrainingRun, TrainingExample, PaginatedExamples, RunStatus } from "@/lib/model-training/types";

const API = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_MODEL_TRAINING_API || "http://localhost:8000/api/v1")
  : "";

interface PollOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function useTrainingRun(runId: string, options: PollOptions = {}) {
  const { intervalMs = 5000, enabled = true } = options;
  const [run, setRun] = useState<TrainingRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`${API}/runs/${runId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRun(data);
      setError(null);

      if (data.status === "complete" || data.status === "failed") {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (!enabled) return;
    fetchRun();
    timerRef.current = setInterval(fetchRun, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runId, intervalMs, enabled, fetchRun]);

  return { run, loading, error, refetch: fetchRun };
}

export function useReviewQueue(runId: string, options: PollOptions = {}) {
  const { intervalMs = 3000, enabled = true } = options;
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API}/runs/${runId}/review?limit=500`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedExamples = await res.json();
      setExamples(data.items);
      setTotal(data.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    if (!enabled) return;
    fetchQueue();
    timerRef.current = setInterval(fetchQueue, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runId, intervalMs, enabled, fetchQueue]);

  return { examples, total, loading, error, refetch: fetchQueue };
}

export function useRunList(orgId: string, options: PollOptions = {}) {
  const { intervalMs = 15000, enabled = true } = options;
  const [runs, setRuns] = useState<TrainingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isReady = enabled && !!orgId;

  const fetchRuns = useCallback(async () => {
    try {
      const params = new URLSearchParams({ organization_id: orgId, limit: "50" });
      const res = await fetch(`${API}/runs?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRuns(data);
    } catch (_) {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isReady) return;
    fetchRuns();
    if (intervalMs > 0) {
      const t = setInterval(fetchRuns, intervalMs);
      return () => clearInterval(t);
    }
  }, [orgId, intervalMs, isReady, fetchRuns]);

  return { runs, loading, refetch: fetchRuns };
}
