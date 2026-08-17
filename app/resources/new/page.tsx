"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { SUBJECTS, GRADE_BANDS, RESOURCE_TYPES } from "@/lib/subjects";
import { US_STATES } from "@/lib/us-states";
import ChipSelect from "@/components/resources/ChipSelect";
import { DEFAULT_SECTION_ORDER } from "@/components/resources/SectionOrderPicker";
import LessonPlanUpload from "@/components/resources/LessonPlanUpload";
import FileUploadList from "@/components/resources/FileUploadList";

const SUBJECT_NAMES = Object.values(SUBJECTS).map((s) => s.name);

interface UploadedFile { name: string; url: string }

interface FormState {
  title: string;
  subject: string;
  gradeBand: string;
  resourceType: string;
  state: string;
  body: string;
  lessonPlanFile: UploadedFile | null;
  attachments: UploadedFile[];
  photos: UploadedFile[];
  priceCents: number | null;
}

const EMPTY: FormState = {
  title: "", subject: "", gradeBand: "", resourceType: "", state: "",
  body: "", lessonPlanFile: null, attachments: [], photos: [], priceCents: null,
};

// Text extraction only makes sense for an actual lesson-plan document —
// a worksheet's "text" is disconnected labels and word lists pulled off a
// visual layout (e.g. "SAY IT ANOTHER WAY! HAPPY SAD ANGRY"), not prose
// worth showing as a page body. Everything else just gets attached as a
// file, same as the classic builder's Attachments step.
const TEXT_EXTRACTABLE_TYPES = ["Lesson"];

type StepId = "basics" | "upload" | "review";
const STEPS: StepId[] = ["basics", "upload", "review"];

// The default landing for "share a resource" — most teachers already have a
// finished lesson plan and just want to post it, not re-type it into
// materials/learning-targets/directions fields. The full section-by-section
// builder still exists at /resources/new/build for a brand-new lesson.
function NewResourcePageContent() {
  const { profile, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  // The nav dropdown links straight here with ?type=Worksheet etc. (see
  // components/layout/Header.tsx) so the teacher doesn't have to pick the
  // type again in the Basics step. Ignore anything that isn't a real type.
  const typeFromQuery = searchParams.get("type");
  const initialResourceType = typeFromQuery && (RESOURCE_TYPES as readonly string[]).includes(typeFromQuery) ? typeFromQuery : "";
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY, resourceType: initialResourceType });
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
          <p className="text-ink-soft mb-6">Create a free account to start sharing your lesson.</p>
          <Link href="/signup?intent=share&redirect=/resources/new" className="inline-block px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const currentStepId = STEPS[step];
  const isTextExtractable = TEXT_EXTRACTABLE_TYPES.includes(form.resourceType);

  const canAdvance = () => {
    if (currentStepId === "basics") return form.title.trim().length > 0 && !!form.subject && !!form.gradeBand && !!form.resourceType;
    if (currentStepId === "upload") {
      return isTextExtractable
        ? !!form.lessonPlanFile && form.body.trim().length > 0
        : form.attachments.length > 0;
    }
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
          standards: [],
          materials: [],
          learning_targets: [],
          directions: [],
          body: isTextExtractable ? (form.body || null) : null,
          photos: form.photos.map((p) => p.url),
          attachments: isTextExtractable
            ? (form.lessonPlanFile ? [form.lessonPlanFile] : [])
            : form.attachments,
          section_order: DEFAULT_SECTION_ORDER,
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
          <p className="text-xs text-ink/40 uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden mb-10">
          <div className="h-full bg-papaya rounded-full transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
          {currentStepId === "basics" && (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif font-bold text-3xl text-ink mb-2">What are you sharing?</h1>
                <p className="text-ink/50 mb-6">Give it a clear, searchable title — you&rsquo;ll upload the file next.</p>
                <input
                  type="text"
                  autoFocus
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Hand-Building Ceramics Unit"
                  className="w-full px-5 py-4 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all text-lg"
                />
              </div>
              <div>
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
                      <p className="text-xs text-ink/35 mt-2">You&rsquo;ll receive ${(form.priceCents * 0.93 / 100).toFixed(2)} per sale after Sparkurio&rsquo;s 7% Creator Pro fee.</p>
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

          {currentStepId === "upload" && (
            <div>
              {isTextExtractable ? (
                <>
                  <h2 className="font-serif font-bold text-2xl text-ink mb-2">Upload your lesson plan</h2>
                  <p className="text-ink/50 mb-6">Word (.docx) or PDF. We&rsquo;ll pull the text out so you can review it before publishing.</p>
                  <LessonPlanUpload
                    fileMeta={form.lessonPlanFile}
                    onFileChange={(f) => set("lessonPlanFile", f)}
                    onThumbnail={(thumb) => { if (form.photos.length === 0) set("photos", [thumb]); }}
                    body={form.body}
                    onBodyChange={(v) => set("body", v)}
                  />
                </>
              ) : (
                <>
                  <h2 className="font-serif font-bold text-2xl text-ink mb-2">Upload your file</h2>
                  <p className="text-ink/50 mb-6">
                    PDF, Word, PowerPoint, or Excel — attach the {form.resourceType.toLowerCase() || "file"} as-is.
                    There&rsquo;s no text to review here; it&rsquo;ll show up on the page as a viewable, printable file.
                  </p>
                  <FileUploadList
                    bucket={form.priceCents ? "resource-attachments-paid" : "resource-attachments"}
                    files={form.attachments}
                    onChange={(v) => set("attachments", v)}
                    onThumbnail={(thumb) => { if (form.photos.length === 0) set("photos", [thumb]); }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    label="Click to upload files"
                  />
                  {form.priceCents ? (
                    <p className="text-xs text-ink/35 mt-3">This is a paid resource — files upload privately and only unlock for buyers after purchase.</p>
                  ) : null}
                </>
              )}
            </div>
          )}

          {currentStepId === "review" && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Review &amp; publish</h2>
              <p className="text-ink/50 mb-6">
                Sparkurio will build the lesson page automatically. Standards, extra photos, additional files,
                and section order can all be added from the resource page after you publish.
              </p>

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
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">{isTextExtractable ? "Lesson plan" : "File"}</p>
                  <p className="text-ink/70 text-sm">
                    {isTextExtractable
                      ? `${form.body.trim().split(/\s+/).filter(Boolean).length} words, from ${form.lessonPlanFile?.name ?? "your upload"}`
                      : `${form.attachments.length} file${form.attachments.length !== 1 ? "s" : ""}: ${form.attachments.map((a) => a.name).join(", ") || "none"}`}
                  </p>
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
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canAdvance()}
              className="px-7 py-3 bg-ink text-white rounded-full font-medium hover:bg-ink/85 transition-colors disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        )}

        {step === 0 && (
          <p className="text-center text-sm text-ink/40 mt-6">
            Starting from a blank page instead?{" "}
            <Link href="/resources/new/build" className="text-papaya font-medium hover:underline">Build it step-by-step</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function NewResourcePage() {
  return (
    <Suspense>
      <NewResourcePageContent />
    </Suspense>
  );
}
