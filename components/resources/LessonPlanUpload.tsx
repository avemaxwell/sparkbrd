"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generatePdfThumbnail } from "@/lib/pdf-thumbnail";
import MarkdownEditor from "@/components/resources/MarkdownEditor";

interface UploadedFile { name: string; url: string }

export const PII_REMINDER = "Before uploading: make sure this doesn't include student faces, names, or other identifying info (like your school's address). Your own name is fine.";

function PiiBanner() {
  return (
    <div className="flex items-start gap-3 bg-mustard/10 border border-mustard/25 rounded-2xl p-4 mb-6">
      <svg className="w-5 h-5 text-mustard flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="text-sm text-ink/70 leading-relaxed">{PII_REMINDER}</p>
    </div>
  );
}

export default function LessonPlanUpload({
  fileMeta,
  onFileChange,
  onThumbnail,
  body,
  onBodyChange,
}: {
  fileMeta: UploadedFile | null;
  onFileChange: (file: UploadedFile | null) => void;
  // Called with a page-1 preview image after a PDF upload — see FileUploadList.tsx.
  onThumbnail?: (file: UploadedFile) => void;
  body: string;
  onBodyChange: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleFile = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("You need to be signed in to upload a file."); setUploading(false); return; }

      // Extract text first — if this fails, don't leave an orphaned upload behind.
      const extractForm = new FormData();
      extractForm.append("file", file);
      const extractRes = await fetch("/api/resources/extract-text", { method: "POST", body: extractForm });
      const extractData = await extractRes.json();
      if (!extractRes.ok) {
        setError(extractData.error ?? "Couldn't read that file.");
        setUploading(false);
        return;
      }

      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("resource-attachments").upload(path, file);
      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        setUploading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("resource-attachments").getPublicUrl(path);

      onFileChange({ name: "Original Lesson Plan", url: publicUrlData.publicUrl });
      onBodyChange(extractData.text);

      if (file.name.toLowerCase().endsWith(".pdf") && onThumbnail) {
        try {
          const thumbBlob = await generatePdfThumbnail(file);
          const thumbPath = `${user.id}/${Date.now()}-thumb.png`;
          const { error: thumbError } = await supabase.storage.from("resource-photos").upload(thumbPath, thumbBlob);
          if (!thumbError) {
            const { data: thumbData } = supabase.storage.from("resource-photos").getPublicUrl(thumbPath);
            onThumbnail({ name: "Cover", url: thumbData.publicUrl });
          }
        } catch {
          // Non-fatal — the lesson plan itself uploaded fine, just skip the cover image.
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <PiiBanner />

      {!fileMeta ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={(e) => handleFile(e.target.files)}
            className="hidden"
            id="upload-lesson-plan"
          />
          <label
            htmlFor="upload-lesson-plan"
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/15 rounded-2xl py-10 cursor-pointer hover:border-papaya/40 hover:bg-papaya/5 transition-colors"
          >
            <svg className="w-6 h-6 stroke-ink/40 stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-sm text-ink/50">{uploading ? "Reading your file…" : "Click to upload your lesson plan (.docx or .pdf)"}</span>
          </label>
          {error && <p className="text-xs text-papaya mt-2">{error}</p>}
        </>
      ) : (
        <div>
          <div className="flex items-center gap-3 bg-ink/5 rounded-xl p-3 mb-4">
            <span className="flex-1 text-sm text-ink/80 truncate">{fileMeta.name}</span>
            <button
              type="button"
              onClick={() => { onFileChange(null); onBodyChange(""); }}
              className="w-6 h-6 rounded-full hover:bg-ink/10 flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-3 h-3 stroke-ink/50 stroke-[2.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <label className="block text-sm font-medium text-ink/60 mb-2">
            Here&rsquo;s what we pulled from your file — review and clean it up before publishing:
          </label>
          <MarkdownEditor value={body} onChange={onBodyChange} rows={16} />
        </div>
      )}
    </div>
  );
}
