"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.enum([
    "cto-vp-engineering", "ml-engineer", "engineering-manager",
    "product-manager", "founder-ceo", "head-of-ai", "researcher", "other",
  ]),
  projectDescription: z.string().min(10, "Please describe your project"),
  timeline: z.enum(["asap", "1-2-months", "3-6-months", "just-exploring"]),
  budget: z.enum(["under-50k", "50k-200k", "200k-1m", "1m-plus"]),
  wantsMeeting: z.boolean().default(true),
  referral: z.enum([
    "google", "linkedin", "twitter-x", "github",
    "referral", "newsletter", "blog-article", "conference-event", "other",
  ]),
})

type FormData = z.infer<typeof contactSchema>

const topics = ["fine-tuning", "qat", "agentic-support"] as const

const stepLabels = ["Contact", "Project", "Review"]

const jobTitleLabels: Record<string, string> = {
  "cto-vp-engineering": "CTO / VP Engineering",
  "ml-engineer": "ML Engineer / Data Scientist",
  "engineering-manager": "Engineering Manager",
  "product-manager": "Product Manager",
  "founder-ceo": "Founder / CEO",
  "head-of-ai": "Head of AI / ML",
  researcher: "Researcher",
  other: "Other",
}

const budgetLabels: Record<string, string> = {
  "under-50k": "< $50K",
  "50k-200k": "$50K – $200K",
  "200k-1m": "$200K – $1M",
  "1m-plus": "$1M+",
}

const timelineLabels: Record<string, string> = {
  asap: "ASAP",
  "1-2-months": "1–2 months",
  "3-6-months": "3–6 months",
  "just-exploring": "Just exploring",
}

const referralLabels: Record<string, string> = {
  google: "Google / Web search",
  linkedin: "LinkedIn",
  "twitter-x": "X / Twitter",
  github: "GitHub",
  referral: "Referral from a colleague",
  newsletter: "Newsletter",
  "blog-article": "Blog post / Article",
  "conference-event": "Conference / Event",
  other: "Other",
}

export function ContactForm({ topic }: { topic: string }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      jobTitle: "other",
      timeline: "just-exploring",
      budget: "50k-200k",
      wantsMeeting: true,
      referral: "other",
    },
  })

  const wantsMeeting = watch("wantsMeeting")
  const values = watch()

  async function nextStep() {
    const fields: (keyof FormData)[] =
      step === 0
        ? ["name", "email", "company", "phone", "jobTitle"]
        : ["projectDescription", "timeline", "budget", "referral"]
    const valid = await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, 2))
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, topic }),
      })
      if (!res.ok) throw new Error("Submission failed")
      setDone(true)
      toast.success("We got your message!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="nb-card bg-white p-8 text-center lg:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-[3px] border-[#111] bg-[#FF5F1F] text-3xl">
          ✓
        </div>
        <h3 className="mb-3 text-[28px] font-extrabold tracking-[-0.03em] text-[#111]">
          Thanks, {values.name}!
        </h3>
        <p className="mx-auto mb-6 max-w-[480px] text-[15px] leading-[1.7] text-[#444] font-medium">
          We&apos;ll review your project and get back to you within one
          business day.
        </p>
        {wantsMeeting && (
          <a
            href="https://cal.com/comradelemoncake/meet-the-founder"
            target="_blank"
            rel="noopener noreferrer"
            className="nb-btn-orange inline-flex items-center gap-2 px-8 py-4 text-[12px] uppercase"
          >
            Schedule a meeting &rarr;
          </a>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="nb-card bg-white p-6 lg:p-10">
      {/* Steps indicator */}
      <div className="mb-8 flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center border-[2px] border-[#111] text-[11px] font-extrabold ${
                i === step
                  ? "bg-[#FF5F1F] text-[#111]"
                  : i < step
                    ? "bg-[#111] text-white"
                    : "bg-white text-[#111]"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.12em] ${
                i === step ? "text-[#111]" : "text-[#999]"
              }`}
            >
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <span className="mx-1 text-[#ccc]">—</span>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Contact info */}
      {step === 0 && (
        <div className="animate-slide-up space-y-5">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Your details
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="Full name *" error={errors.name?.message}>
              <input
                {...register("name")}
                placeholder="Jane Smith"
                className="nb-input w-full"
              />
            </Field>
            <Field label="Email *" error={errors.email?.message}>
              <input
                {...register("email")}
                type="email"
                placeholder="jane@company.com"
                className="nb-input w-full"
              />
            </Field>
            <Field label="Company *" error={errors.company?.message}>
              <input
                {...register("company")}
                placeholder="Acme Corp"
                className="nb-input w-full"
              />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+1 555 0000"
                className="nb-input w-full"
              />
            </Field>
            <Field label="Job title *" error={errors.jobTitle?.message}>
              <select {...register("jobTitle")} className="nb-input w-full">
                <option value="cto-vp-engineering">CTO / VP Engineering</option>
                <option value="ml-engineer">ML Engineer / Data Scientist</option>
                <option value="engineering-manager">Engineering Manager</option>
                <option value="product-manager">Product Manager</option>
                <option value="founder-ceo">Founder / CEO</option>
                <option value="head-of-ai">Head of AI / ML</option>
                <option value="researcher">Researcher</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* Step 2: Project details */}
      {step === 1 && (
        <div className="animate-slide-up space-y-5">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Project details
          </div>
          <Field label="Describe your project *" error={errors.projectDescription?.message}>
            <textarea
              {...register("projectDescription")}
              rows={4}
              placeholder="Tell us about your use case, data volume, timeline, and any specific requirements..."
              className="nb-input w-full resize-y"
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Field label="Timeline *" error={errors.timeline?.message}>
              <select {...register("timeline")} className="nb-input w-full">
                <option value="asap">ASAP</option>
                <option value="1-2-months">1–2 months</option>
                <option value="3-6-months">3–6 months</option>
                <option value="just-exploring">Just exploring</option>
              </select>
            </Field>
            <Field label="Budget *" error={errors.budget?.message}>
              <select {...register("budget")} className="nb-input w-full">
                <option value="under-50k">&lt; $50K</option>
                <option value="50k-200k">$50K – $200K</option>
                <option value="200k-1m">$200K – $1M</option>
                <option value="1m-plus">$1M+</option>
              </select>
            </Field>
          </div>
          <Field label="How did you hear about us? *" error={errors.referral?.message}>
            <select {...register("referral")} className="nb-input w-full">
              <option value="google">Google / Web search</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter-x">X / Twitter</option>
              <option value="github">GitHub</option>
              <option value="referral">Referral from a colleague</option>
              <option value="newsletter">Newsletter</option>
              <option value="blog-article">Blog post / Article</option>
              <option value="conference-event">Conference / Event</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <label className="flex items-start gap-3 pt-2">
            <input
              {...register("wantsMeeting")}
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 border-[2px] border-[#111] accent-[#FF5F1F]"
            />
            <span className="text-[14px] font-bold leading-[1.5] text-[#111]">
              I&apos;d like to schedule a call to discuss this project
            </span>
          </label>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <div className="animate-slide-up space-y-5">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Review &amp; submit
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ReviewItem label="Name" value={values.name} />
            <ReviewItem label="Email" value={values.email} />
            <ReviewItem label="Company" value={values.company} />
            <ReviewItem label="Phone" value={values.phone || "—"} />
            <ReviewItem label="Job title" value={jobTitleLabels[values.jobTitle] || "—"} />
            <ReviewItem label="Timeline" value={timelineLabels[values.timeline] || values.timeline} />
            <ReviewItem label="Budget" value={budgetLabels[values.budget] || values.budget} />
            <ReviewItem label="How did you hear" value={referralLabels[values.referral] || "—"} />
            <ReviewItem label="Schedule a call" value={wantsMeeting ? "Yes" : "No"} />
          </div>
          <div className="border-t-[2px] border-[#111] pt-4">
            <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.1em] text-[#666]">
              Project description
            </p>
            <p className="text-[14px] leading-[1.7] text-[#111] font-medium">
              {values.projectDescription}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t-[2px] border-[#111] pt-6">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="nb-btn-outline px-6 py-3 text-[11px] uppercase tracking-[0.12em]"
          >
            &larr; Back
          </button>
        ) : (
          <div />
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={nextStep}
            className="nb-btn-orange px-8 py-3 text-[11px] uppercase tracking-[0.12em]"
          >
            Next &rarr;
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="nb-btn-orange px-8 py-3 text-[11px] uppercase tracking-[0.12em] disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Submit &rarr;"}
          </button>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#555]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[11px] font-bold text-[#C7661D]">
          {error}
        </span>
      )}
    </label>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#666]">
        {label}
      </p>
      <p className="text-[14px] font-bold text-[#111]">{value}</p>
    </div>
  )
}
