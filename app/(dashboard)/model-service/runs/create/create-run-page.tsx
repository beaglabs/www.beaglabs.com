"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOrgId } from "@/hooks/use-org-id";
import { Input } from "@/components/ui/input";
import type { TaskType, TaskDefinition, FewShotExample } from "@/lib/model-training/types";

const TASK_TYPES: { value: TaskType; label: string; description: string; defaultLabels: string[] }[] = [
  { value: "classification", label: "Classification", description: "Assign each document to predefined categories", defaultLabels: ["support", "billing", "feature_request", "bug_report"] },
  { value: "relevance", label: "Relevance", description: "Determine if documents are relevant to a query", defaultLabels: ["relevant", "not_relevant"] },
  { value: "extraction", label: "Extraction", description: "Pull structured fields from unstructured text", defaultLabels: [] },
  { value: "code", label: "Code Analysis", description: "Analyze code for bugs and anti-patterns", defaultLabels: ["clean", "bug", "vulnerability", "anti_pattern"] },
  { value: "custom", label: "Custom Task", description: "Describe your own labeling task", defaultLabels: [] },
];

const API = process.env.NEXT_PUBLIC_MODEL_TRAINING_API || "http://localhost:8000/api/v1";

function LabelEditor({ labels, onChange }: { labels: string[]; onChange: (l: string[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(labels.join(", "));

  return editing ? (
    <div className="flex items-center gap-2">
      <Input value={text} onChange={(e) => setText(e.target.value)} className="h-8 text-[13px]" placeholder="label1, label2, ..." />
      <Button onClick={() => { onChange(text.split(",").map(s => s.trim()).filter(Boolean)); setEditing(false); }} className="h-8 rounded-full text-[11px] px-3" style={{ backgroundColor: "#C7661D" }}>Save</Button>
    </div>
  ) : (
    <div className="flex items-center gap-2 flex-wrap">
      {labels.map((l) => (
        <span key={l} className="text-[11px] px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: "#C7661D10", color: "#C7661D", border: "1px solid #C7661D20" }}>{l}</span>
      ))}
      <Button variant="ghost" onClick={() => { setText(labels.join(", ")); setEditing(true); }} className="h-6 text-[11px] text-[#999] px-2">Edit</Button>
    </div>
  );
}

export function CreateRunPage() {
  const router = useRouter();
  const orgId = useOrgId()

  if (!orgId) {
    return <div className="max-w-[720px] mx-auto py-24 text-center"><p className="text-sm text-[#777]">Loading workspace...</p></div>
  }

  const [step, setStep] = useState<"data" | "task">("data");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string[][]>([]);
  const [labelColumn, setLabelColumn] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taskType, setTaskType] = useState<TaskType>("classification");
  const [labels, setLabels] = useState<string[]>(["support", "billing", "feature_request", "bug_report"]);
  const [query, setQuery] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [fewShotExamples, setFewShotExamples] = useState<FewShotExample[]>([]);
  const [modelTier, setModelTier] = useState("standard");
  const [name, setName] = useState("");

  const taskDef: TaskDefinition = {
    type: taskType,
    labels,
    query,
    fields,
    description,
    language,
    few_shot_examples: fewShotExamples,
  };

  const handleFilePick = (file: File) => {
    setUploadedFile(file)
    setError("")
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = text.split('\n').filter(r => r.trim()).map(r => r.split(','))
      setUploadPreview(rows.slice(0, 11))
      if (rows.length > 0) setLabelColumn(rows[0][rows[0].length - 1] || "")
    }
    reader.readAsText(file)
  }

  const handleTaskChange = (type: TaskType) => {
    setTaskType(type);
    const cfg = TASK_TYPES.find(t => t.value === type);
    if (cfg) setLabels(cfg.defaultLabels);
    else setLabels([]);
    setQuery("");
    setFields([]);
    setDescription("");
    setLanguage("");
    setFewShotExamples([]);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      setError("Please upload a file first")
      return
    }
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch(`${API}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgId,
          name: name || undefined,
          model_tier: modelTier,
          task_type: taskType,
          task_definition: taskDef,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        let detail: string = `Failed to create run: ${res.status}`;
        try {
          const parsed = JSON.parse(body);
          const d = parsed.detail;
          if (Array.isArray(d)) detail = d.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join("; ");
          else if (typeof d === "string") detail = d;
          else if (d && typeof d === "object") detail = JSON.stringify(d);
          else if (typeof parsed === "string") detail = parsed;
        } catch { detail = body || detail; }
        throw new Error(detail);
      }
      const run = await res.json();

      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("label_column", labelColumn)

      const uploadRes = await fetch(`${API}/runs/${run.id}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.text();
        let detail: string = `Upload failed: ${uploadRes.status}`;
        try {
          const parsed = JSON.parse(body);
          const d = parsed.detail;
          if (Array.isArray(d)) detail = d.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join("; ");
          else if (typeof d === "string") detail = d;
          else if (d && typeof d === "object") detail = JSON.stringify(d);
          else if (typeof parsed === "string") detail = parsed;
        } catch { detail = body || detail; }
        throw new Error(detail);
      }

      router.push(`/model-service/runs/${run.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSubmitting(false)
    }
  };

  return (
    <div className="max-w-[720px] mx-auto">
      <h1 className="text-[17px] font-semibold text-[#111] tracking-[-0.03em] mb-2">Create Training Run</h1>

      <div className="flex items-center gap-3 mb-8">
        {(["data", "task"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border-2" style={{
              backgroundColor: step === s ? "#C7661D" : i < ["data", "task"].indexOf(step) ? "#2E7D32" : "transparent",
              borderColor: step === s ? "#C7661D" : i < ["data", "task"].indexOf(step) ? "#2E7D32" : "#E2E0DB",
              color: step === s || i < ["data", "task"].indexOf(step) ? "#fff" : "#999",
            }}>{i < ["data", "task"].indexOf(step) ? "✓" : i + 1}</div>
            <span className="text-[13px] font-medium" style={{ color: step === s ? "#111" : "#999" }}>
              {s === "data" ? "Upload Data" : "Define Task"}
            </span>
            {i < 1 && <div className="w-8 h-px" style={{ backgroundColor: "#E2E0DB" }} />}
          </div>
        ))}
      </div>

      {step === "data" && (
        <div>
          <h2 className="text-[15px] font-semibold text-[#111] mb-1">Upload your dataset</h2>
          <p className="text-[13px] text-[#777] mb-6">Upload a CSV or Parquet file with labeled examples. The last column will be used as the prediction target by default.</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all hover:border-[#C7661D] hover:bg-[#F5F4F0]"
            style={{ borderColor: uploadedFile ? '#C7661D' : '#E2E0DB' }}
          >
            {uploadedFile ? (
              <div>
                <p className="text-sm font-semibold text-[#111]">{uploadedFile.name}</p>
                <p className="font-mono text-[11px] text-[#6B6B6B] mt-1">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                  {uploadPreview.length > 0 && ` · ${uploadPreview.length - 1} rows · ${uploadPreview[0]?.length || 0} columns`}
                </p>
                <p className="font-mono text-[10px] text-[#999] mt-2">Click to replace</p>
              </div>
            ) : (
              <div>
                <span className="text-2xl">⊞</span>
                <p className="text-sm font-medium text-[#111] mt-2">Drop CSV or Parquet here</p>
                <p className="font-mono text-[11px] text-[#6B6B6B] mt-1">or click to browse</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".csv,.parquet,.pq,.tsv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFilePick(f); }} />
          </div>

          {uploadPreview.length > 0 && (
            <div className="mt-6">
              <label className="block text-[12px] font-medium uppercase tracking-[0.08em] text-[#777] mb-2">Label column</label>
              <select value={labelColumn} onChange={(e) => setLabelColumn(e.target.value)}
                className="w-full border border-[#E2E0DB] px-4 py-2 text-[14px] text-[#111] outline-none focus:border-[#C7661D] bg-white">
                {uploadPreview[0]?.map((col) => <option key={col} value={col}>{col}</option>)}
              </select>
              <div className="mt-4 overflow-x-auto border rounded-lg" style={{ borderColor: '#E2E0DB' }}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#F5F4F0] border-b" style={{ borderColor: '#E2E0DB' }}>
                      {uploadPreview[0]?.map((col) => (
                        <th key={col} className={`px-3 py-2 font-mono text-[11px] font-medium ${col === labelColumn ? 'text-[#C7661D]' : 'text-[#6B6B6B]'}`}>
                          {col}{col === labelColumn ? '  ←' : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreview.slice(1).map((row, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: '#F5F4F0' }}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 font-mono text-[11px] text-[#404040] truncate max-w-[180px]">
                            {cell.length > 50 ? cell.slice(0, 50) + '...' : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <Button onClick={() => setStep("task")} disabled={!uploadedFile}
              className="rounded-full bg-[#111] px-6 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] disabled:opacity-30">
              Continue to Task Setup
            </Button>
          </div>
        </div>
      )}

      {step === "task" && (
        <div>
          <h2 className="text-[15px] font-semibold text-[#111] mb-1">Define your task</h2>
          <p className="text-[13px] text-[#777] mb-6">Tell the model what to predict.</p>

          <label className="block text-[11px] font-medium text-[#777] mb-1.5">Name (optional)</label>
          <Input placeholder="My training run" value={name} onChange={(e) => setName(e.target.value)}
            className="mb-6 h-10 text-[14px] border-[#E2E0DB]" />

          <label className="block text-[11px] font-medium text-[#777] mb-2">Task Type</label>
          <div className="space-y-2 mb-6">
            {TASK_TYPES.map((t) => (
              <div key={t.value}
                onClick={() => handleTaskChange(t.value)}
                className="border rounded-lg px-4 py-3 cursor-pointer transition-all hover:bg-[#F5F4F0] flex items-start gap-3"
                style={{ borderColor: taskType === t.value ? '#C7661D' : '#E2E0DB', boxShadow: taskType === t.value ? '0 0 0 1px #C7661D' : 'none' }}>
                <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 border-2 ${taskType === t.value ? 'border-[#C7661D]' : 'border-[#E2E0DB]'}`}>
                  {taskType === t.value && <div className="w-2 h-2 rounded-full m-0.5" style={{ backgroundColor: '#C7661D' }} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#111]">{t.label}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{t.description}</p>
                </div>
              </div>
            ))}
          </div>

          <label className="block text-[11px] font-medium text-[#777] mb-1.5">Labels</label>
          <LabelEditor labels={labels} onChange={setLabels} />

          {taskType !== "custom" && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#777] mb-1">Model Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["starter", "standard", "performance"] as const).map((t) => (
                    <div key={t}
                      onClick={() => setModelTier(t)}
                      className="border rounded-lg px-3 py-2 text-center cursor-pointer text-[13px] font-medium capitalize transition-all"
                      style={{ borderColor: modelTier === t ? '#C7661D' : '#E2E0DB', backgroundColor: modelTier === t ? '#C7661D08' : '#fff' }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" onClick={() => setStep("data")} className="rounded-full text-[11px] font-bold uppercase tracking-[0.08em]" style={{ borderColor: '#E2E0DB', color: '#6B6B6B' }}>
              Back
            </Button>

            {error && <p className="text-[13px] text-red-600">{error}</p>}

            <Button onClick={handleSubmit} disabled={submitting || !uploadedFile}
              className="rounded-full px-8 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white hover:bg-[#2a2a2a] disabled:opacity-50"
              style={{ backgroundColor: '#111' }}>
              {submitting ? "Creating..." : "Create Run & Start Training"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
