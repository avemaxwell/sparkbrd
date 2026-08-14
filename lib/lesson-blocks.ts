import type { ComponentType, SVGProps } from "react";
import {
  IconFlag, IconLightbulb, IconBook, IconUsers, IconPencil,
  IconMedal, IconBrain, IconWrench, IconGraduationCap,
} from "@/components/icons";

export type BlockType =
  | "objective" | "warmup" | "direct_instruction" | "guided_practice"
  | "independent_practice" | "assessment" | "differentiation"
  | "materials" | "homework";

export interface LessonBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string;
  minutes: number | null;
  linkedResourceId: string | null;
  linkedResourceTitle: string | null;
}

export interface LessonBlocksData {
  periodMinutes: number;
  items: LessonBlock[];
  // Mirrors the resource-level `standards` column (same field the classic
  // builder's StandardsPicker writes to) — kept here too so the block
  // canvas can read/suggest/attach them without a second round trip, and
  // publish just forwards this array alongside `blocks`.
  standards: string[];
}

export const EMPTY_BLOCKS_DATA: LessonBlocksData = { periodMinutes: 50, items: [], standards: [] };

interface BlockMeta {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Literal Tailwind class names — Tailwind's JIT scanner only picks up
  // class strings that appear verbatim in source, so these can't be built
  // from an interpolated color token at render time.
  bg: string;
  bgSoft: string;
  stroke: string;
  text: string;
  defaultMinutes: number | null;
}

// Order here is also palette display order.
export const BLOCK_TYPES: Record<BlockType, BlockMeta> = {
  objective: { label: "Objective / Standard", icon: IconFlag, bg: "bg-papaya", bgSoft: "bg-papaya/10", stroke: "stroke-papaya", text: "text-papaya", defaultMinutes: null },
  warmup: { label: "Warm-up / Hook", icon: IconLightbulb, bg: "bg-mustard", bgSoft: "bg-mustard/10", stroke: "stroke-mustard", text: "text-mustard", defaultMinutes: 5 },
  direct_instruction: { label: "Direct Instruction", icon: IconBook, bg: "bg-lavender", bgSoft: "bg-lavender/15", stroke: "stroke-lavender", text: "text-ink", defaultMinutes: 15 },
  guided_practice: { label: "Guided Practice", icon: IconUsers, bg: "bg-blush", bgSoft: "bg-blush/10", stroke: "stroke-blush", text: "text-blush", defaultMinutes: 10 },
  independent_practice: { label: "Independent Practice", icon: IconPencil, bg: "bg-lime", bgSoft: "bg-lime/20", stroke: "stroke-ink", text: "text-ink", defaultMinutes: 15 },
  assessment: { label: "Assessment / Exit Ticket", icon: IconMedal, bg: "bg-papaya", bgSoft: "bg-papaya/10", stroke: "stroke-papaya", text: "text-papaya", defaultMinutes: 5 },
  differentiation: { label: "Differentiation", icon: IconBrain, bg: "bg-lavender", bgSoft: "bg-lavender/15", stroke: "stroke-lavender", text: "text-ink", defaultMinutes: null },
  materials: { label: "Materials", icon: IconWrench, bg: "bg-mustard", bgSoft: "bg-mustard/10", stroke: "stroke-mustard", text: "text-mustard", defaultMinutes: null },
  homework: { label: "Homework / Extension", icon: IconGraduationCap, bg: "bg-blush", bgSoft: "bg-blush/10", stroke: "stroke-blush", text: "text-blush", defaultMinutes: null },
};

export function createBlock(type: BlockType): LessonBlock {
  const meta = BLOCK_TYPES[type];
  return {
    id: crypto.randomUUID(),
    type,
    title: meta.label,
    content: "",
    minutes: meta.defaultMinutes,
    linkedResourceId: null,
    linkedResourceTitle: null,
  };
}

export function totalMinutes(items: LessonBlock[]): number {
  return items.reduce((sum, b) => sum + (b.minutes ?? 0), 0);
}
