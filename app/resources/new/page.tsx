"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { SUBJECTS, GRADE_BANDS, RESOURCE_TYPES } from "@/lib/subjects";
import TagListInput from "@/components/resources/TagListInput";
import FileUploadList from "@/components/resources/FileUploadList";

const SUBJECT_NAMES = Object.values(SUBJECTS).map((s) => s.name);

interface UploadedFile { name: string; url: string }

interface FormState {
  title: string;
  subject: string;
  gradeBand: string;
  resourceType: string;
  standards: string[];
  materials: string[];
  learningTargets: string[];
  directions: string[];
  photos: UploadedFile[];
  attachments: UploadedFile[];
}

const EMPTY: FormState = {
  title: "", subject: "", gradeBand: "", resourceType: "",
  standards: [], materials: [], learningTargets: [], directions: [],
  photos: [], attachments: [],
};

const STEPS = ["Title", "The basics", "Standards", "Materials", "Learning targets", "Directions", "Photos", "Attachments", "Review"];

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

  const canAdvance = () => {
    if (step === 0) return form.title.trim().length > 0;
    if (step === 1) return !!form.subject && !!form.gradeBand && !!form.resourceType;
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
          standards: form.standards,
          materials: form.materials,
          learning_targets: form.learningTargets,
          directions: form.directions,
          photos: form.photos.map((p) => p.url),
          attachments: form.attachments,
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
          {step === 0 && (
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

          {step === 1 && (
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
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Standards</h2>
              <p className="text-ink/50 mb-6">Which standards does this align to? (Optional)</p>
              <TagListInput items={form.standards} onChange={(v) => set("standards", v)} placeholder="e.g. CCSS.ELA-LITERACY.W.6.1" />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Materials</h2>
              <p className="text-ink/50 mb-6">What do teachers need to gather?</p>
              <TagListInput items={form.materials} onChange={(v) => set("materials", v)} placeholder="e.g. Air-dry clay, rolling pins" />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Learning targets</h2>
              <p className="text-ink/50 mb-6">What should students be able to do by the end?</p>
              <TagListInput items={form.learningTargets} onChange={(v) => set("learningTargets", v)} placeholder="e.g. I can identify the elements of a coil pot" />
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Directions</h2>
              <p className="text-ink/50 mb-6">Walk other teachers through it, step by step.</p>
              <TagListInput items={form.directions} onChange={(v) => set("directions", v)} placeholder="Describe the next step…" variant="numbered" />
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Photos</h2>
              <p className="text-ink/50 mb-6">Show what this looks like in the classroom. (Optional)</p>
              <FileUploadList bucket="resource-photos" files={form.photos} onChange={(v) => set("photos", v)} accept="image/*" label="Click to upload photos" />
            </div>
          )}

          {step === 7 && (
            <div>
              <h2 className="font-serif font-bold text-2xl text-ink mb-2">Attachments</h2>
              <p className="text-ink/50 mb-6">Add any handouts, slides, or templates. (Optional)</p>
              <FileUploadList bucket="resource-attachments" files={form.attachments} onChange={(v) => set("attachments", v)} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" label="Click to upload files" />
            </div>
          )}

          {step === 8 && (
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
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Standards</p>
                  <p className="text-ink/70 text-sm">{form.standards.length ? form.standards.join(", ") : "None added"}</p>
                </div>
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Photos &amp; attachments</p>
                  <p className="text-ink/70 text-sm">{form.photos.length} photo{form.photos.length !== 1 ? "s" : ""}, {form.attachments.length} file{form.attachments.length !== 1 ? "s" : ""}</p>
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

        {step < 8 && (
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
      </div>
    </div>
  );
}
