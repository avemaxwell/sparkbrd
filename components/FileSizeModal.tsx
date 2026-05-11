"use client";

export default function FileSizeModal({
  fileName,
  sizeMB,
  onClose,
}: {
  fileName: string;
  sizeMB: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 stroke-amber-600 stroke-[1.5] fill-none" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-ink leading-tight">Image is too large</h3>
            <p className="text-sm text-ink/50 mt-0.5 truncate max-w-[220px]">{fileName}</p>
            <p className="text-sm font-medium text-amber-600 mt-0.5">{sizeMB} MB &mdash; max is 20 MB</p>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">How to resize it</p>
        <div className="space-y-3 mb-5">

          <div className="flex gap-2.5">
            <span className="text-base leading-none mt-0.5">🌐</span>
            <div>
              <p className="text-sm font-medium text-ink">Any device — easiest</p>
              <p className="text-xs text-ink/50">Go to <span className="font-medium text-ink/70">squoosh.app</span>, drop your image in, drag the quality slider down, then download.</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <span className="text-base leading-none mt-0.5">🍎</span>
            <div>
              <p className="text-sm font-medium text-ink">Mac</p>
              <p className="text-xs text-ink/50">Open in <span className="font-medium text-ink/70">Preview</span> → Tools → Adjust Size → set width to 2000 px → Save.</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <span className="text-base leading-none mt-0.5">🪟</span>
            <div>
              <p className="text-sm font-medium text-ink">Windows</p>
              <p className="text-xs text-ink/50">Open in <span className="font-medium text-ink/70">Paint</span> → Home → Resize → 50% → Save as JPEG.</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <span className="text-base leading-none mt-0.5">📱</span>
            <div>
              <p className="text-sm font-medium text-ink">iPhone</p>
              <p className="text-xs text-ink/50">Email the photo to yourself and when you save the attachment, choose <span className="font-medium text-ink/70">Small</span> or <span className="font-medium text-ink/70">Medium</span>. Or take a screenshot of it — screenshots are always smaller.</p>
            </div>
          </div>

          <div className="flex gap-2.5">
            <span className="text-base leading-none mt-0.5">🤖</span>
            <div>
              <p className="text-sm font-medium text-ink">Android</p>
              <p className="text-xs text-ink/50">In <span className="font-medium text-ink/70">Google Photos</span>, share → save as copy at lower resolution. Or screenshot the image.</p>
            </div>
          </div>

        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/85 transition-colors"
        >
          Try a different image
        </button>
      </div>
    </div>
  );
}
