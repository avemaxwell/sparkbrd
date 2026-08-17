"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BLOCK_TYPES, type BlockType, type LessonBlock, type LessonBlocksData,
  createBlock, totalMinutes,
} from "@/lib/lesson-blocks";
import MarkdownEditor from "@/components/resources/MarkdownEditor";
import ResourcePickerModal, { type PickedResource } from "@/components/resources/ResourcePickerModal";

interface MatchedStandard { code: string; text: string }
interface StateStandard { code: string; description: string }
interface StandardSuggestions { matched: MatchedStandard[]; stateSuggestions: StateStandard[] }

// AI assist, scoped exactly as pitched: teacher writes an objective, this
// suggests candidate codes, teacher confirms/edits — nothing attaches on
// its own. Common Core/NGSS suggestions are grounded in the real embedded
// dataset server-side; state-level ones come from the model's own
// knowledge and are labeled unverified since there's no dataset to check
// them against.
function StandardsPanel({
  standards,
  onChange,
  objectiveText,
  subject,
  gradeBand,
  state,
}: {
  standards: string[];
  onChange: (standards: string[]) => void;
  objectiveText: string;
  subject?: string;
  gradeBand?: string;
  state?: string;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<StandardSuggestions | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const hasObjective = objectiveText.trim().length > 0;

  const suggest = async () => {
    setSuggesting(true);
    setSuggestError(null);
    setSuggestions(null);
    try {
      const res = await fetch("/api/resources/suggest-standards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: objectiveText, subject, gradeBand, state }),
      });
      const data = await res.json();
      if (!res.ok) { setSuggestError(data.error ?? "Couldn't get suggestions."); return; }
      setSuggestions(data);
    } catch {
      setSuggestError("Couldn't get suggestions. Please try again.");
    } finally {
      setSuggesting(false);
    }
  };

  const addStandard = (label: string) => { if (!standards.includes(label)) onChange([...standards, label]); };
  const removeStandard = (label: string) => onChange(standards.filter((s) => s !== label));

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Standards</p>
        <button
          type="button"
          onClick={suggest}
          disabled={!hasObjective || suggesting}
          title={hasObjective ? undefined : "Add an Objective / Standard block with some text first"}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-papaya hover:underline disabled:text-ink/25 disabled:no-underline disabled:cursor-not-allowed"
        >
          {suggesting ? <span className="w-3 h-3 border-2 border-papaya/30 border-t-papaya rounded-full animate-spin" /> : <span>✨</span>}
          {suggesting ? "Thinking…" : "Suggest from Objective"}
        </button>
      </div>

      {standards.length === 0 ? (
        <p className="text-sm text-ink/30 mb-2">Nothing added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-2">
          {standards.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-papaya/10 text-papaya text-sm rounded-full max-w-full">
              <span className="truncate">{s}</span>
              <button type="button" onClick={() => removeStandard(s)} className="w-4 h-4 rounded-full hover:bg-papaya/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 stroke-current stroke-[2.5] fill-none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {suggestError && <p className="text-xs text-papaya mb-2">{suggestError}</p>}

      {suggestions && (
        <div className="bg-papaya/5 border border-papaya/15 rounded-2xl p-4 space-y-3">
          {suggestions.matched.length === 0 && suggestions.stateSuggestions.length === 0 ? (
            <p className="text-xs text-ink/40">No confident matches for this objective — try adding more detail.</p>
          ) : (
            <>
              {suggestions.matched.map((m) => {
                const label = `${m.code} — ${m.text}`;
                const added = standards.includes(label);
                return (
                  <button key={m.code} type="button" onClick={() => addStandard(label)} disabled={added} className="w-full flex items-start gap-2.5 text-left">
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${added ? "bg-papaya border-papaya" : "border-ink/20"}`}>
                      {added && <svg className="w-3 h-3 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-papaya">{m.code}</span>
                      <span className="block text-xs text-ink/60 line-clamp-2">{m.text}</span>
                    </span>
                  </button>
                );
              })}
              {suggestions.stateSuggestions.map((s) => {
                const label = `${s.code} — ${s.description}`;
                const added = standards.includes(label);
                return (
                  <button key={s.code} type="button" onClick={() => addStandard(label)} disabled={added} className="w-full flex items-start gap-2.5 text-left">
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${added ? "bg-mustard border-mustard" : "border-ink/20"}`}>
                      {added && <svg className="w-3 h-3 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-mustard">{s.code}</span>
                        <span className="text-[10px] text-ink/35">unverified — double-check the code</span>
                      </span>
                      <span className="block text-xs text-ink/60 line-clamp-2">{s.description}</span>
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface DifferentiationSuggestion { label: string; text: string }

function BlockCard({
  block,
  subject,
  gradeBand,
  onUpdate,
  onRemove,
  onAttach,
  onDetach,
  onInsertDifferentiation,
}: {
  block: LessonBlock;
  subject?: string;
  gradeBand?: string;
  onUpdate: (patch: Partial<LessonBlock>) => void;
  onRemove: () => void;
  onAttach: () => void;
  onDetach: () => void;
  onInsertDifferentiation: (label: string, text: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = BLOCK_TYPES[block.type];
  const Icon = meta.icon;

  const [suggestingDiff, setSuggestingDiff] = useState(false);
  const [diffSuggestions, setDiffSuggestions] = useState<DifferentiationSuggestion[] | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [addedLabels, setAddedLabels] = useState<Set<string>>(new Set());
  const hasContent = block.content.trim().length > 0;

  const suggestDifferentiation = async () => {
    setSuggestingDiff(true);
    setDiffError(null);
    setDiffSuggestions(null);
    setAddedLabels(new Set());
    try {
      const res = await fetch("/api/resources/suggest-differentiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: block.content, blockLabel: block.title, subject, gradeBand }),
      });
      const data = await res.json();
      if (!res.ok) { setDiffError(data.error ?? "Couldn't get suggestions."); return; }
      setDiffSuggestions(data.suggestions ?? []);
    } catch {
      setDiffError("Couldn't get suggestions. Please try again.");
    } finally {
      setSuggestingDiff(false);
    }
  };

  const addSuggestion = (s: DifferentiationSuggestion) => {
    onInsertDifferentiation(s.label, s.text);
    setAddedLabels((prev) => new Set(prev).add(s.label));
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-2xl border border-black/5 p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="mt-1.5 w-6 h-6 flex items-center justify-center text-ink/25 hover:text-ink/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
        </button>

        <div className={`w-8 h-8 rounded-full ${meta.bgSoft} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${meta.stroke}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <input
              value={block.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="font-serif font-semibold text-ink bg-transparent outline-none focus:bg-ink/5 rounded px-1 -mx-1 min-w-0 flex-1"
            />
            {meta.defaultMinutes !== null || block.minutes !== null ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  min={0}
                  value={block.minutes ?? 0}
                  onChange={(e) => onUpdate({ minutes: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-12 px-1.5 py-0.5 bg-ink/5 rounded-md text-xs text-center outline-none focus:ring-2 focus:ring-papaya/30"
                />
                <span className="text-xs text-ink/40">min</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUpdate({ minutes: 5 })}
                className="text-xs text-ink/30 hover:text-ink/60 transition-colors flex-shrink-0"
              >
                + add time
              </button>
            )}
          </div>

          <MarkdownEditor value={block.content} onChange={(v) => onUpdate({ content: v })} rows={4} />

          <div className="flex items-center justify-between mt-3">
            {block.linkedResourceId ? (
              <button
                type="button"
                onClick={onDetach}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink/5 rounded-full text-xs font-medium text-ink/70 hover:bg-ink/10 transition-colors"
              >
                <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                {block.linkedResourceTitle ?? "Linked resource"}
                <span className="text-ink/30">×</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onAttach}
                className="text-xs font-medium text-papaya hover:underline"
              >
                + Attach a resource
              </button>
            )}
            <div className="flex items-center gap-3">
              {block.type !== "differentiation" && (
                <button
                  type="button"
                  onClick={suggestDifferentiation}
                  disabled={!hasContent || suggestingDiff}
                  title={hasContent ? undefined : "Add some content to this block first"}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-lavender hover:underline disabled:text-ink/25 disabled:no-underline disabled:cursor-not-allowed"
                >
                  {suggestingDiff ? <span className="w-3 h-3 border-2 border-lavender/40 border-t-lavender rounded-full animate-spin" /> : <span>✨</span>}
                  {suggestingDiff ? "Thinking…" : "Differentiate"}
                </button>
              )}
              <button
                type="button"
                onClick={onRemove}
                className="text-xs text-ink/30 hover:text-papaya transition-colors"
              >
                Remove block
              </button>
            </div>
          </div>

          {diffError && <p className="text-xs text-papaya mt-2">{diffError}</p>}

          {diffSuggestions && (
            <div className="bg-lavender/10 border border-lavender/25 rounded-2xl p-4 space-y-3 mt-3">
              {diffSuggestions.length === 0 ? (
                <p className="text-xs text-ink/40">No suggestions came back — try adding more detail to this block.</p>
              ) : (
                diffSuggestions.map((s) => {
                  const added = addedLabels.has(s.label);
                  return (
                    <button key={s.label} type="button" onClick={() => addSuggestion(s)} disabled={added} className="w-full flex items-start gap-2.5 text-left">
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${added ? "bg-lavender border-lavender" : "border-ink/20"}`}>
                        {added && <svg className="w-3 h-3 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-ink">{s.label}</span>
                        <span className="block text-xs text-ink/60">{s.text}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Controlled block-canvas editor — the core of the Lesson Plan Builder.
// Fully controlled (value/onChange) so both the create flow
// (app/resources/new/build/page.tsx) and the post-publish edit flow use
// the exact same component.
export default function LessonBlockCanvas({
  value,
  onChange,
  subject,
  gradeBand,
  state,
}: {
  value: LessonBlocksData;
  onChange: (v: LessonBlocksData) => void;
  subject?: string;
  gradeBand?: string;
  state?: string;
}) {
  const [attachingBlockId, setAttachingBlockId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const setItems = (items: LessonBlock[]) => onChange({ ...value, items });
  const objectiveText = value.items.find((b) => b.type === "objective" && b.content.trim())?.content ?? "";
  const addBlock = (type: BlockType) => setItems([...value.items, createBlock(type)]);
  const removeBlock = (id: string) => setItems(value.items.filter((b) => b.id !== id));
  const updateBlock = (id: string, patch: Partial<LessonBlock>) =>
    setItems(value.items.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  // Suggestions never edit a block directly — they land in a Differentiation
  // block (creating one right after the source block if none exists yet),
  // same "starting point, not final text" posture as the rest of the AI.
  const insertDifferentiation = (afterBlockId: string, label: string, text: string) => {
    const formatted = `**${label}:** ${text}`;
    const existingIndex = value.items.findIndex((b) => b.type === "differentiation");
    if (existingIndex !== -1) {
      const existing = value.items[existingIndex];
      const nextContent = existing.content.trim() ? `${existing.content}\n\n${formatted}` : formatted;
      setItems(value.items.map((b, i) => (i === existingIndex ? { ...b, content: nextContent } : b)));
      return;
    }
    const newBlock = createBlock("differentiation");
    newBlock.content = formatted;
    const afterIndex = value.items.findIndex((b) => b.id === afterBlockId);
    const insertAt = afterIndex === -1 ? value.items.length : afterIndex + 1;
    const next = [...value.items];
    next.splice(insertAt, 0, newBlock);
    setItems(next);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = value.items.findIndex((b) => b.id === active.id);
    const newIndex = value.items.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setItems(arrayMove(value.items, oldIndex, newIndex));
  };

  const total = totalMinutes(value.items);
  const overUnder = total - value.periodMinutes;
  const barDenominator = Math.max(total, value.periodMinutes, 1);

  return (
    <div>
      {/* Timeline / time-check */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-ink/60">Class period length</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={5}
              value={value.periodMinutes}
              onChange={(e) => onChange({ ...value, periodMinutes: Math.max(1, parseInt(e.target.value) || 0) })}
              className="w-16 px-2 py-1 bg-ink/5 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-papaya/30"
            />
            <span className="text-sm text-ink/40">min</span>
          </div>
        </div>
        <div className="h-8 rounded-full bg-ink/5 overflow-hidden flex">
          {value.items.filter((b) => b.minutes).map((b) => (
            <div
              key={b.id}
              className={BLOCK_TYPES[b.type].bg}
              style={{ width: `${((b.minutes ?? 0) / barDenominator) * 100}%` }}
              title={`${BLOCK_TYPES[b.type].label}: ${b.minutes} min`}
            />
          ))}
        </div>
        <p className={`text-xs mt-1.5 ${overUnder > 0 ? "text-mustard font-medium" : "text-ink/40"}`}>
          {total} / {value.periodMinutes} min planned
          {overUnder > 0 && ` — ${overUnder} min over the period`}
          {overUnder < 0 && ` — ${-overUnder} min unplanned`}
        </p>
      </div>

      <StandardsPanel
        standards={value.standards}
        onChange={(standards) => onChange({ ...value, standards })}
        objectiveText={objectiveText}
        subject={subject}
        gradeBand={gradeBand}
        state={state}
      />

      {/* Palette */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-2">Add a block</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(BLOCK_TYPES) as BlockType[]).map((type) => {
            const meta = BLOCK_TYPES[type];
            const Icon = meta.icon;
            return (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-ink/10 hover:border-ink/20 text-sm font-medium text-ink/70 transition-colors"
              >
                <Icon className={`w-4 h-4 ${meta.stroke}`} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      {value.items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-ink/10 rounded-2xl">
          <p className="text-sm text-ink/30">Add your first block above to start building.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.items.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {value.items.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  subject={subject}
                  gradeBand={gradeBand}
                  onUpdate={(patch) => updateBlock(block.id, patch)}
                  onRemove={() => removeBlock(block.id)}
                  onAttach={() => setAttachingBlockId(block.id)}
                  onDetach={() => updateBlock(block.id, { linkedResourceId: null, linkedResourceTitle: null })}
                  onInsertDifferentiation={(label, text) => insertDifferentiation(block.id, label, text)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {attachingBlockId && (
        <ResourcePickerModal
          onClose={() => setAttachingBlockId(null)}
          onSelect={(r: PickedResource) => {
            updateBlock(attachingBlockId, { linkedResourceId: r.id, linkedResourceTitle: r.title });
            setAttachingBlockId(null);
          }}
        />
      )}
    </div>
  );
}
