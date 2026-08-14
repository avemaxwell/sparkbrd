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

function BlockCard({
  block,
  onUpdate,
  onRemove,
  onAttach,
  onDetach,
}: {
  block: LessonBlock;
  onUpdate: (patch: Partial<LessonBlock>) => void;
  onRemove: () => void;
  onAttach: () => void;
  onDetach: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = BLOCK_TYPES[block.type];
  const Icon = meta.icon;

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
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-ink/30 hover:text-papaya transition-colors"
            >
              Remove block
            </button>
          </div>
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
}: {
  value: LessonBlocksData;
  onChange: (v: LessonBlocksData) => void;
}) {
  const [attachingBlockId, setAttachingBlockId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const setItems = (items: LessonBlock[]) => onChange({ ...value, items });
  const addBlock = (type: BlockType) => setItems([...value.items, createBlock(type)]);
  const removeBlock = (id: string) => setItems(value.items.filter((b) => b.id !== id));
  const updateBlock = (id: string, patch: Partial<LessonBlock>) =>
    setItems(value.items.map((b) => (b.id === id ? { ...b, ...patch } : b)));

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
                  onUpdate={(patch) => updateBlock(block.id, patch)}
                  onRemove={() => removeBlock(block.id)}
                  onAttach={() => setAttachingBlockId(block.id)}
                  onDetach={() => updateBlock(block.id, { linkedResourceId: null, linkedResourceTitle: null })}
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
