"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generatePdfThumbnail } from "@/lib/pdf-thumbnail";

interface UploadedFile {
  name: string;
  url: string;
}

export default function FileUploadList({
  bucket,
  files,
  onChange,
  onThumbnail,
  accept,
  label,
}: {
  bucket: "resource-photos" | "resource-attachments" | "resource-attachments-paid";
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  // Called with a page-1 preview image after a PDF attachment uploads — lets
  // the resource pick up a real cover photo instead of the generic
  // placeholder used when "Save to collection" has no photo to show.
  onThumbnail?: (file: UploadedFile) => void;
  accept: string;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You need to be signed in to upload files."); setUploading(false); return; }

    // `resource-attachments-paid` is a private bucket (paid resources) — it has
    // no public SELECT policy, so `getPublicUrl` would return a URL that never
    // resolves. Store the raw storage path instead; the download API resolves
    // it to a short-lived signed URL only after verifying purchase/ownership.
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(fileList)) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) {
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }
      if (bucket === "resource-attachments-paid") {
        uploaded.push({ name: file.name, url: path });
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push({ name: file.name, url: data.publicUrl });
      }

      if (bucket !== "resource-photos" && file.name.toLowerCase().endsWith(".pdf") && onThumbnail) {
        try {
          const thumbBlob = await generatePdfThumbnail(file);
          const thumbPath = `${user.id}/${Date.now()}-thumb.png`;
          const { error: thumbError } = await supabase.storage.from("resource-photos").upload(thumbPath, thumbBlob);
          if (!thumbError) {
            const { data: thumbData } = supabase.storage.from("resource-photos").getPublicUrl(thumbPath);
            onThumbnail({ name: "Cover", url: thumbData.publicUrl });
          }
        } catch {
          // Non-fatal — the attachment itself uploaded fine, just skip the cover image.
        }
      }
    }

    onChange([...files, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i: number) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id={`upload-${bucket}`}
      />
      <label
        htmlFor={`upload-${bucket}`}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/15 rounded-2xl py-10 cursor-pointer hover:border-papaya/40 hover:bg-papaya/5 transition-colors"
      >
        <svg className="w-6 h-6 stroke-ink/40 stroke-[1.5] fill-none" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span className="text-sm text-ink/50">{uploading ? "Uploading…" : label}</span>
      </label>

      {error && <p className="text-xs text-papaya mt-2">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 bg-ink/5 rounded-xl p-3">
              <span className="flex-1 text-sm text-ink/80 truncate">{f.name}</span>
              <button type="button" onClick={() => removeAt(i)} className="w-6 h-6 rounded-full hover:bg-ink/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 stroke-ink/50 stroke-[2.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
