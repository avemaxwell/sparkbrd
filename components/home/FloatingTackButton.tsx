"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

interface Board {
  id: string;
  name: string;
}

type Mode = "upload" | "url" | "scrape";

// ─── helpers ────────────────────────────────────────────────────────────────

const PIN_COLORS = [
  { id: "papaya",  hex: "#E24E42" },
  { id: "mustard", hex: "#E9B000" },
  { id: "aqua",    hex: "#2EC4B6" },
  { id: "blush",   hex: "#F4A4B0" },
  { id: "ink",     hex: "#1A1A1A" },
  { id: "white",   hex: "#FFFFFF" },
];

async function checkForAI(imageUrl: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch('/api/check-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });
    const data = await res.json();
    if (data.blocked) return { ok: false, reason: data.reason };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'This image could not be verified. Please try a different one.' }; // fail closed
  }
}

function genTags(imageUrl: string, tackId: string) {
  const supabase = createClient();
  fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  })
    .then(r => r.json())
    .then(({ tags }) => { if (tags) supabase.from('tacks').update({ tags }).eq('id', tackId).then(() => {}); })
    .catch(() => {});
}

// ─── main component ──────────────────────────────────────────────────────────

export default function FloatingTackButton() {
  const router = useRouter();
  const { profile } = useUser();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (!profile) { router.push('/login'); return; }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full bg-papaya text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform z-50"
        aria-label="Add tack"
      >
        <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {open && <AddTackFlow onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── flow orchestrator ────────────────────────────────────────────────────────

function AddTackFlow({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('boards')
        .select('id, name')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });
      setBoards(data || []);
      if (data && data.length === 1) setSelectedBoardId(data[0].id);
      setLoadingBoards(false);
    })();
  }, []);

  const handleNewBoard = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('boards')
      .insert({ owner_id: session.user.id, name: 'New Board', vibe: 'gradient', background_color: '#fef3e2,#fce7f3' })
      .select('id')
      .single();
    if (data) {
      onClose();
      router.push(`/board/${data.id}?addTack=true`);
    }
  };

  if (loadingBoards) {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
        </div>
      </ModalShell>
    );
  }

  // No boards yet — create one first
  if (boards.length === 0) {
    return (
      <ModalShell onClose={onClose} title="Create a board first">
        <p className="text-sm text-ink/50 mb-6">You need at least one board to tack images to.</p>
        <button
          onClick={handleNewBoard}
          className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors"
        >
          Create my first board
        </button>
      </ModalShell>
    );
  }

  // Board already chosen — show uploader
  if (selectedBoardId) {
    return (
      <TackUploader
        boardId={selectedBoardId}
        boardName={boards.find(b => b.id === selectedBoardId)?.name ?? ''}
        onClose={onClose}
        onChangeboard={() => setSelectedBoardId(null)}
      />
    );
  }

  // Board picker
  return (
    <ModalShell onClose={onClose} title="Where do you want to tack this?">
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {boards.map(board => (
          <button
            key={board.id}
            onClick={() => setSelectedBoardId(board.id)}
            className="w-full text-left px-4 py-3 rounded-xl bg-ink/5 hover:bg-papaya/10 hover:text-papaya transition-colors text-sm font-medium"
          >
            {board.name}
          </button>
        ))}
      </div>
      <button
        onClick={handleNewBoard}
        className="w-full py-2.5 border border-dashed border-ink/20 rounded-xl text-sm text-ink/50 hover:border-papaya/50 hover:text-papaya transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        New board
      </button>
    </ModalShell>
  );
}

// ─── uploader ────────────────────────────────────────────────────────────────

function TackUploader({
  boardId,
  boardName,
  onClose,
  onChangeboard,
}: {
  boardId: string;
  boardName: string;
  onClose: () => void;
  onChangeboard: () => void;
}) {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("upload");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [pinColor, setPinColor] = useState("papaya");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [scrapedSource, setScrapedSource] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const saveTack = async (imageUrl: string, source?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSaving(true);
    const { data, error } = await supabase.from('tacks').insert({
      board_id: boardId,
      user_id: session.user.id,
      content_url: imageUrl,
      note: note.trim() || null,
      source: source || null,
      pin_color: pinColor,
      position_x: Math.round(100 + Math.random() * 300),
      position_y: Math.round(100 + Math.random() * 300),
      width: 250,
      height: 300,
      rotation: Math.floor(Math.random() * 6) - 3,
      z_index: 0,
    }).select('id').single();
    setSaving(false);
    if (!error && data) genTags(imageUrl, data.id);
    return !error;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 20;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`This photo is too big to upload. Try saving it as a JPEG first, or use a smaller version.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    const safeName = file.name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      || 'image';
    const fileName = `${boardId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('tacks').upload(fileName, file);
    if (error) {
      console.error('Upload error:', error);
      alert(error.message?.includes('too large') || error.message?.includes('413')
        ? `This photo is too big to upload. Try saving it as a JPEG first, or use a smaller version.`
        : `Something went wrong uploading your image. Please try again.`);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('tacks').getPublicUrl(fileName);
    setUrl(publicUrl);
    setUploading(false);
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setScrapedImages([]);
    setSelectedImages(new Set());
    try {
      const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: scrapeUrl }) });
      const data = await res.json();
      setScrapedImages(data.images || []);
      setScrapedSource(data.source || '');
    } catch {}
    setScraping(false);
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setChecking(true);
    const check = await checkForAI(url.trim());
    setChecking(false);
    if (!check.ok) { setAiWarning(check.reason || 'Likely AI-generated.'); setPendingUrl(url.trim()); return; }
    const ok = await saveTack(url.trim());
    if (ok) onClose();
  };

  const handleToggleScrape = async (imgUrl: string) => {
    if (selectedImages.has(imgUrl)) {
      const s = new Set(selectedImages); s.delete(imgUrl); setSelectedImages(s); return;
    }
    setChecking(true);
    const check = await checkForAI(imgUrl);
    setChecking(false);
    if (!check.ok) { setAiWarning(check.reason || 'Likely AI-generated.'); setPendingUrl(imgUrl); return; }
    setSelectedImages(new Set([...selectedImages, imgUrl]));
  };

  const handleAddSelected = async () => {
    setSaving(true);
    for (const imgUrl of selectedImages) await saveTack(imgUrl, scrapedSource);
    setSaving(false);
    onClose();
  };

  const handleAiProceed = async () => {
    if (!pendingUrl) return;
    setAiWarning(null);
    const ok = await saveTack(pendingUrl, scrapedSource || undefined);
    setPendingUrl(null);
    if (ok) onClose();
  };

  return (
    <ModalShell onClose={onClose}>
      {/* Board indicator */}
      <div className="flex items-center justify-between mb-4 -mt-1">
        <div className="flex items-center gap-2 text-sm text-ink/50">
          <svg className="w-4 h-4 stroke-current stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>{boardName}</span>
        </div>
        <button onClick={onChangeboard} className="text-xs text-papaya hover:underline">Change</button>
      </div>

      <div className="mb-4 p-3 bg-ink/5 rounded-lg">
        <p className="text-xs text-ink/50"><strong className="text-ink">Human-made content only.</strong> Sparkurio is a space for authentic, human-created inspiration.</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {(["upload", "url", "scrape"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-ink text-white' : 'bg-ink/5 text-ink hover:bg-ink/10'}`}>
            {m === 'scrape' ? 'From Page' : m === 'url' ? 'Image URL' : 'Upload'}
          </button>
        ))}
      </div>

      {checking && (
        <div className="mb-4 p-3 bg-ink/5 rounded-xl flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-ink/20 border-t-papaya rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-ink/60">Checking content authenticity…</p>
        </div>
      )}

      {/* ── Upload ── */}
      {mode === 'upload' && (
        <form onSubmit={handleSubmitSingle}>
          <div className="mb-4">
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                <button type="button" onClick={() => { setPreviewUrl(null); setUrl(''); }} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
                  <svg className="w-4 h-4 stroke-ink stroke-2 fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-ink/20 rounded-xl p-8 text-center hover:border-papaya hover:bg-papaya/5 transition-colors cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {uploading ? <p className="text-ink/50">Uploading…</p> : (
                  <>
                    <svg className="w-10 h-10 stroke-ink/30 stroke-[1.5] fill-none mx-auto mb-2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="font-medium text-ink/70 text-sm mb-0.5">Drop an image here</p>
                    <p className="text-xs text-ink/40">or click to browse</p>
                  </>
                )}
              </label>
            )}
          </div>
          <NoteField note={note} setNote={setNote} />
          <PinColorPicker pinColor={pinColor} setPinColor={setPinColor} />
          <button type="submit" disabled={!url || uploading || checking || saving} className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : checking ? 'Checking…' : 'Tack it'}
          </button>
        </form>
      )}

      {/* ── URL ── */}
      {mode === 'url' && (
        <form onSubmit={handleSubmitSingle}>
          <div className="mb-4">
            <label className="text-sm text-ink/50 mb-2 block">Image URL</label>
            <input type="url" value={url} onChange={e => { setUrl(e.target.value); setAiWarning(null); }} placeholder="https://example.com/image.jpg" className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30" required />
          </div>
          {url && <div className="mb-4"><img src={url} alt="Preview" className="w-full h-40 object-contain rounded-xl bg-ink/5" onError={e => (e.currentTarget.style.display = 'none')} /></div>}
          <NoteField note={note} setNote={setNote} />
          <PinColorPicker pinColor={pinColor} setPinColor={setPinColor} />
          <button type="submit" disabled={!url || checking || saving} className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : checking ? 'Checking…' : 'Tack it'}
          </button>
        </form>
      )}

      {/* ── From Page ── */}
      {mode === 'scrape' && (
        <div>
          <div className="mb-4">
            <label className="text-sm text-ink/50 mb-2 block">Page URL</label>
            <div className="flex gap-2">
              <input type="url" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://example.com/article" className="flex-1 bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30" />
              <button type="button" onClick={handleScrape} disabled={!scrapeUrl || scraping} className="px-4 py-2 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/80 transition-colors disabled:opacity-50">
                {scraping ? 'Finding…' : 'Find'}
              </button>
            </div>
          </div>
          {scrapedImages.length > 0 && (
            <>
              <p className="text-sm text-ink/50 mb-3">Found {scrapedImages.length} images from <strong className="text-ink">{scrapedSource}</strong>. Select to tack:</p>
              <div className="grid grid-cols-3 gap-2 mb-4 max-h-52 overflow-y-auto">
                {scrapedImages.map((img, i) => (
                  <button key={i} type="button" onClick={() => handleToggleScrape(img)} disabled={checking} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImages.has(img) ? 'border-papaya ring-2 ring-papaya/30' : 'border-transparent hover:border-ink/20'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => ((e.currentTarget.parentElement as HTMLElement).style.display = 'none')} />
                    {selectedImages.has(img) && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-papaya rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 stroke-white stroke-2 fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <NoteField note={note} setNote={setNote} />
              <PinColorPicker pinColor={pinColor} setPinColor={setPinColor} />
              <button type="button" onClick={handleAddSelected} disabled={selectedImages.size === 0 || saving} className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : `Tack ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
          {!scraping && scrapedImages.length === 0 && <p className="text-sm text-ink/40 text-center py-8">Enter a URL and tap &ldquo;Find&rdquo; to pull images from that page.</p>}
        </div>
      )}

      {/* AI warning overlay */}
      {aiWarning && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col justify-center p-6 z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 stroke-yellow-600 stroke-2 fill-none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-ink mb-1">This may be AI-generated</h3>
              <p className="text-sm text-ink/60">{aiWarning}</p>
            </div>
          </div>
          <div className="bg-ink/5 rounded-xl p-3 mb-4">
            <p className="text-xs text-ink/60"><strong className="text-ink">Sparkurio is for human-made inspiration.</strong> Uploading AI imagery violates our community standards.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setAiWarning(null); setPendingUrl(null); }} className="flex-1 py-3 bg-ink text-white rounded-full text-sm font-medium hover:bg-ink/90 transition-colors">Go back</button>
            <button onClick={handleAiProceed} className="flex-1 py-3 bg-ink/10 text-ink rounded-full text-sm font-medium hover:bg-ink/20 transition-colors">Upload anyway</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ─── shared sub-components ────────────────────────────────────────────────────

function ModalShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-2xl">{title ?? 'Tack something new'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center">
            <svg className="w-5 h-5 stroke-[#1A1A1A] stroke-[1.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NoteField({ note, setNote }: { note: string; setNote: (v: string) => void }) {
  return (
    <div className="mb-4">
      <label className="text-sm text-ink/50 mb-2 block">Note (optional)</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What inspires you about this?" rows={2} className="w-full bg-ink/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-papaya/30 resize-none" />
    </div>
  );
}

function PinColorPicker({ pinColor, setPinColor }: { pinColor: string; setPinColor: (v: string) => void }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-sm text-ink/50 mr-1">Pin</span>
      {PIN_COLORS.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => setPinColor(c.id)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${pinColor === c.id ? 'border-ink scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}
