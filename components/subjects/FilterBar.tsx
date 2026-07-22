"use client";

import { GRADE_BANDS, RESOURCE_TYPES } from "@/lib/subjects";
import { IconMedal, IconChevronDown } from "@/components/icons";

export interface SubjectFilters {
  grade: string;
  type: string;
  time: string;
  standard: string;
  provenOnly: boolean;
  sort: string;
}

export const DEFAULT_FILTERS: SubjectFilters = { grade: "All", type: "All", time: "All", standard: "", provenOnly: false, sort: "relevant" };

const TIME_BUCKETS = ["All", "Under 30 min", "30-60 min", "1-2 hrs", "2+ hrs"];
const SORTS = [
  { value: "relevant", label: "Most Relevant" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "likes", label: "Most Liked" },
];

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3.5 pr-8 py-2 rounded-full text-sm font-medium bg-white border border-black/10 text-ink hover:border-black/20 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-papaya/30"
      >
        <option value="All">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <IconChevronDown className="w-3.5 h-3.5 text-ink/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default function FilterBar({ filters, onChange, standardOptions = [] }: { filters: SubjectFilters; onChange: (patch: Partial<SubjectFilters>) => void; standardOptions?: string[] }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2.5">
      <Select value={filters.grade} onChange={(grade) => onChange({ grade })} options={[...GRADE_BANDS]} placeholder="Grade Level" />
      <Select value={filters.type} onChange={(type) => onChange({ type })} options={[...RESOURCE_TYPES]} placeholder="Resource Type" />
      <Select value={filters.time} onChange={(time) => onChange({ time })} options={TIME_BUCKETS.slice(1)} placeholder="Time" />

      <div className="relative">
        <input
          type="text"
          list="standard-options"
          value={filters.standard}
          onChange={(e) => onChange({ standard: e.target.value })}
          placeholder="Standard (e.g. CCSS.ELA...)"
          className="w-48 pl-3.5 pr-3 py-2 rounded-full text-sm font-medium bg-white border border-black/10 text-ink hover:border-black/20 transition-colors outline-none focus:ring-2 focus:ring-papaya/30 placeholder:text-ink/40 placeholder:font-normal"
        />
        {standardOptions.length > 0 && (
          <datalist id="standard-options">
            {standardOptions.map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>

      <button
        onClick={() => onChange({ provenOnly: !filters.provenOnly })}
        className={`inline-flex items-center gap-1.5 pl-3 pr-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
          filters.provenOnly ? "bg-papaya text-white border-papaya" : "bg-white text-ink border-black/10 hover:border-black/20"
        }`}
      >
        <IconMedal className="w-3.5 h-3.5" />
        Classroom Proven
      </button>

      <div className="ml-auto relative">
        <select
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="appearance-none pl-3.5 pr-8 py-2 rounded-full text-sm font-medium bg-white border border-black/10 text-ink hover:border-black/20 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-papaya/30"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
        </select>
        <IconChevronDown className="w-3.5 h-3.5 text-ink/40 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
