"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { SUBJECTS, GRADE_BANDS, RESOURCE_TYPES } from "@/lib/subjects";
import { US_STATES } from "@/lib/us-states";
import TagListInput from "@/components/resources/TagListInput";
import FileUploadList from "@/components/resources/FileUploadList";
import StandardsPicker from "@/components/resources/StandardsPicker";
import SectionOrderPicker, { DEFAULT_SECTION_ORDER } from "@/components/resources/SectionOrderPicker";
import LessonPlanUpload, { PII_REMINDER } from "@/components/resources/LessonPlanUpload";

const SUBJECT_NAMES = Object.values(SUBJECTS).map((s) => s.name);

interface UploadedFile { name: string; url: string }

interface FormState {
  title: string;
  subject: string;
  gradeBand: string;
  resourceType: string;
  state: string;
  standards: string[];
  materials: string[];
  learningTargets: string[];
  directions: string[];
  body: string;
  lessonPlanFile: UploadedFile | null;
  photos: UploadedFile[];
  attachments: UploadedFile[];
  sectionOrder: string[];
  priceCents: number | null;
}

const EMPTY: FormState = {
  title: "", subject: "", gradeBand: "", resourceType: "", state: "",
  standards: [], materials: [], learningTargets: [], directions: [],
  body: "", lessonPlanFile: null,
  photos: [], attachments: [], sectionOrder: [...DEFAULT_SECTION_ORDER],
  priceCents: null,
};

type StepId = "mode" | "title" | "basics" | "standards" | "materials" | "learningTargets" | "directions" | "uploadDoc" | "photos" | "attachments" | "sections" | "review";
type Mode = "build" | "upload";

// Worksheets/templates/assessments are usually "here's the file" resources, not
// step-by-step lesson plans — attachments are the main content, so they (and
// photos) come right after the basics instead of after four lesson-only steps.
const ATTACHMENT_FIRST_TYPES = ["Worksheet", "Template", "Assessment"];

const LESSON_SHAPED_ORDER: StepId[] = ["mode", "title", "basics", "standards", "materials", "learningTargets", "directions", "photos", "attachments", "sections", "review"];
const ATTACHMENT_FIRST_ORDER: StepId[] = ["mode", "title", "basics", "attachments", "photos", "standards", "materials", "learningTargets", "directions", "sections", "review"];
// Uploading an existing document replaces materials/learning targets/
// directions entirely — the document's own wording is the content, not
// something to re-chop into those arrays.
const UPLOAD_ORDER: StepId[] = ["mode", "title", "basics", "standards", "uploadDoc", "photos", "attachments", "sections", "review"];

function ChipSelect({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
            value === opt ? "border-papaya bg-papaya/5 text-papaya" : "border-ink/10 text-ink/60 hover:border-ink/20"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function NewResourcePage() {
  const { profile, loading } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-ink/5">
          <h1 className="font-serif text-2xl mb-2">Sign in to share a resource</h1>
          <p className="text-ink-soft mb-6">Create a free account to start building your lesson.</p>
          <Link href="/signup?intent=share&redirect=/resources/new" className="inline-block px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const steps =
    mode === "upload" ? UPLOAD_ORDER
    : ATTACHMENT_FIRST_TYPES.includes(form.resourceType) ? ATTACHMENT_FIRST_ORDER
    : LESSON_SHAPED_ORDER;
  const currentStepId = steps[step];

  const canAdvance = () => {
    if (currentStepId === "mode") return !!mode;
    if (currentStepId === "title") return form.title.trim().length > 0;
    if (currentStepId === "basics") return !!form.subject && !!form.gradeBand && !!form.resourceType;
    if (currentStepId === "uploadDoc") return !!form.lessonPlanFile && form.body.trim().length > 0;
    return true;
  };

  const submit = async (status: "draft" | "published") => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          grade_band: form.gradeBand,
          resource_type: form.resourceType,
          state: form.state || null,
          standards: form.standards,
          materials: form.materials,
          learning_targets: form.learningTargets,
          directions: form.directions,
          body: form.body || null,
          photos: form.photos.map((p) => p.url),
          attachments: form.lessonPlanFile ? [form.lessonPlanFile, ...form.attachments] : form.attachments,
          section_order: form.sectionOrder,
          price_cents: form.priceCents,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); setSubmitting(false); return; }
      router.push(`/resources/${data.resource.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cork-warm py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-sm text-ink/50 hover:text-ink transition-colors">Cancel</Link>
          <p className="text-xs text-ink/40 uppercase tracking-widest">Step {step + 1} of {steps.length}</p>
        </div>

        <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden mb-10">
          <div className="h-full bg-papaya rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          {currentStepId === "mode" && (
            <div>
              <h1 className="font-serif font-bold text-3xl text-ink mb-2">How do you want to create this?</h1>
              <p className="text-ink/50 mb-6">Either way, it&rsquo;ll look the same to everyone else on Sparkurio.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode("build")}
                  className={`text-left p-6 rounded-2xl border-2 transition-colors ${mode === "build" ? "border-papaya bg-papaya/5" : "border-ink/10 hover:border-ink/20"}`}
                >
                  <p className="font-serif font-semibold text-lg text-ink mb-1.5">Build from scratch</p>
                  <p className="text-sm text-ink/50 leading-relaxed">Fill in materials, learning targets, and step-by-step directions as you go — good for a brand-new lesson.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={`text-left p-6 rounded-2xl border-2 transition-colors ${mode === "upload" ? "border-papaya bg-papaya/5" : "border-ink/10 hover:border-ink/20"}`}
                >
                  <p className="font-serif font-semibold text-lg text-ink mb-1.5">Upload an existing lesson plan</p>
                  <p className="text-sm text-ink/50 leading-relaxed">Already have it written in Word or as a PDF? Upload it and we&rsquo;ll pull in the text — no retyping.</p>
                </button>
              </div>
            </div>
          )}

          {currentStepId === "title" && (
            <div>
              <h1 className="font-serif font-bold text-3xl text-ink mb-2">What are you teaching?</h1>
              <p className="text-ink/50 mb-6">Give your resource a clear, searchable title.</p>
              <input
                type="text"
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Hand-Building Ceramics Unit"
                className="w-full px-5 py-4 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-lg"
              />
            </div>
          )}

          {currentStepId === "basics" && (
            <div className="space-y-8">
              <div>
                <h2 className="font-serif font-bold text-2xl text-ink mb-4">The basics</h2>
                <p className="text-sm font-medium text-ink/60 mb-3">Grade level</p>
                <ChipSelect options={GRADE_BANDS} value={form.gradeBand} onChange={(v) => set("gradeBand", v)} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink/60 mb-3">Subject</p>
                <ChipSelect options={SUBJECT_NAMES} value={form.subject} onChange={(v) => set("subject", v)} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink/60 mb-3">Resource type</p>
                <ChipSelect options={RESOURCE_TYPES} value={form.resourceType} onChange={(v) => set("resourceType", v)} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink/60 mb-3">State <span className="font-normal text-ink/35">(optional — helps with context, not required)</span></p>
                <select
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
                >
                  <option value="">Select a state…</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                {profile.plan === "creator_pro" && profile.stripe_connect_payouts_enabled ? (
                  <>
                    <p className="text-sm font-medium text-ink/60 mb-3">Price <span className="font-normal text-ink/35">(optional — leave blank to share for free)</span></p>
                    <div className="relative w-40">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={form.priceCents ? (form.priceCents / 100).toString() : ""}
                        onChange={(e) => {
                          const dollars = parseFloat(e.target.value);
                          set("priceCents", Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null);
                        }}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-sm"
                      />
                    </div>
                    {form.priceCents ? (
                      <p className="text-xs text-ink/35 mt-2">You'll receive ${(form.priceCents * 0.93 / 100).toFixed(2)} per sale after Sparkurio's 7% Creator Pro fee.</p>
                    ) : null}
                  </>
                ) : profile.plan === "creator_pro" ? (
                  <p className="text-xs text-ink/40 bg-ink/5 rounded-xl px-4 py-3">
                    Want to charge for this resource?{" "}
                    <Link href="/settings?tab=account" className="text-papaya font-medium hover:underline">Connect your payout account</Link> to unlock pricing.
                  </p>
                ) : (
                  <p className="text-xs text-ink/40 bg-ink/5 rounded-xl px-4 py-3">
                    Want to charge for this resource?{" "}
                    <Link href="/settings/billing" className="text-papaya font-medium hover:underline">Upgrade to Creator Pro</Link> to unlock pricing.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStepId === "standards" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Standards</h2>
              <p className="text-ink/50 mb-6">Which standards does this align to? (Optional — skip if this doesn't apply)</p>
              <StandardsPicker items={form.standards} onChange={(v) => set("standards", v)} subject={form.subject} gradeBand={form.gradeBand} />
            </div>
          )}

          {currentStepId === "materials" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Materials</h2>
              <p className="text-ink/50 mb-6">What do teachers need to gather? (Optional — skip if this doesn't apply)</p>
              <TagListInput items={form.materials} onChange={(v) => set("materials", v)} placeholder="e.g. Air-dry clay, rolling pins" />
            </div>
          )}

          {currentStepId === "learningTargets" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Learning targets</h2>
              <p className="text-ink/50 mb-6">What should students be able to do by the end? (Optional — skip if this doesn't apply)</p>
              <TagListInput items={form.learningTargets} onChange={(v) => set("learningTargets", v)} placeholder="e.g. I can identify the elements of a coil pot" />
            </div>
          )}

          {currentStepId === "directions" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Directions</h2>
              <p className="text-ink/50 mb-6">Walk other teachers through it, step by step. (Optional — skip if this doesn't apply)</p>
              <TagListInput items={form.directions} onChange={(v) => set("directions", v)} placeholder="Describe the next step…" variant="numbered" />
            </div>
          )}

          {currentStepId === "uploadDoc" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Upload your lesson plan</h2>
              <p className="text-ink/50 mb-6">Word (.docx) or PDF. We&rsquo;ll pull the text out so you can review it before publishing.</p>
              <LessonPlanUpload
                fileMeta={form.lessonPlanFile}
                onFileChange={(f) => set("lessonPlanFile", f)}
                onThumbnail={(thumb) => { if (form.photos.length === 0) set("photos", [thumb]); }}
                body={form.body}
                onBodyChange={(v) => set("body", v)}
              />
            </div>
          )}

          {currentStepId === "photos" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Photos</h2>
              <p className="text-ink/50 mb-6">Show what this looks like in the classroom. (Optional)</p>
              <div className="flex items-start gap-3 bg-mustard/10 border border-mustard/25 rounded-2xl p-4 mb-6">
                <svg className="w-5 h-5 text-mustard flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-sm text-ink/70 leading-relaxed">{PII_REMINDER}</p>
              </div>
              <FileUploadList bucket="resource-photos" files={form.photos} onChange={(v) => set("photos", v)} accept="image/*" label="Click to upload photos" />
            </div>
          )}

          {currentStepId === "attachments" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Attachments</h2>
              <p className="text-ink/50 mb-6">
                {ATTACHMENT_FIRST_TYPES.includes(form.resourceType)
                  ? "Upload your file — this is the main thing people will download."
                  : "Add any handouts, slides, or templates. (Optional)"}
              </p>
              <FileUploadList bucket={form.priceCents ? "resource-attachments-paid" : "resource-attachments"} files={form.attachments} onChange={(v) => set("attachments", v)} onThumbnail={(thumb) => { if (form.photos.length === 0) set("photos", [thumb]); }} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" label="Click to upload files" />
              {form.priceCents ? (
                <p className="text-xs text-ink/35 mt-3">This is a paid resource — files upload privately and only unlock for buyers after purchase.</p>
              ) : null}
            </div>
          )}

          {currentStepId === "sections" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Sections</h2>
              <p className="text-ink/50 mb-6">Choose which sections appear on the published page, and in what order.</p>
              <SectionOrderPicker order={form.sectionOrder} onChange={(v) => set("sectionOrder", v)} />
            </div>
          )}

          {currentStepId === "review" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Review &amp; publish</h2>
              <p className="text-ink/50 mb-6">Sparkurio will build the lesson page automatically.</p>

              {error && <div className="mb-4 p-3 bg-papaya/10 text-papaya text-sm rounded-xl">{error}</div>}

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Title</p>
                  <p className="text-ink">{form.title || "—"}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Grade</p>
                    <p className="text-ink">{form.gradeBand || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Subject</p>
                    <p className="text-ink">{form.subject || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Type</p>
                    <p className="text-ink">{form.resourceType || "—"}</p>
                  </div>
                  {form.state && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">State</p>
                      <p className="text-ink">{form.state}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Sections</p>
                  <p className="text-ink/70 text-sm">{form.sectionOrder.length} of {DEFAULT_SECTION_ORDER.length} included</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Standards</p>
                  <p className="text-ink/70 text-sm">{form.standards.length ? form.standards.join(", ") : "None added"}</p>
                </div>
                {mode === "upload" ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Lesson plan</p>
                    <p className="text-ink/70 text-sm">{form.body.trim().split(/\s+/).filter(Boolean).length} words, from {form.lessonPlanFile?.name ?? "your upload"}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Materials</p>
                      <p className="text-ink/70 text-sm">{form.materials.length ? form.materials.join(", ") : "None added"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Learning targets</p>
                      <p className="text-ink/70 text-sm">{form.learningTargets.length} added</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Directions</p>
                      <p className="text-ink/70 text-sm">{form.directions.length} step{form.directions.length !== 1 ? "s" : ""}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Photos &amp; attachments</p>
                  <p className="text-ink/70 text-sm">{form.photos.length} photo{form.photos.length !== 1 ? "s" : ""}, {form.attachments.length} file{form.attachments.length !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Price</p>
                  <p className="text-ink/70 text-sm">{form.priceCents ? `$${(form.priceCents / 100).toFixed(2)}` : "Free"}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => submit("published")}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-papaya text-white rounded-full font-semibold hover:bg-papaya/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Publishing…" : "Publish resource"}
                </button>
                <button
                  onClick={() => submit("draft")}
                  disabled={submitting}
                  className="px-6 py-3.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors disabled:opacity-50"
                >
                  Save draft
                </button>
              </div>
            </div>
          )}
        </div>

        {currentStepId !== "review" && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-6 py-3 text-ink/60 font-medium hover:text-ink transition-colors disabled:opacity-0"
            >
              Back
            </button>
            <button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={!canAdvance()}
              className="px-7 py-3 bg-ink text-white rounded-full font-medium hover:bg-ink/85 transition-colors disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
