"use client";

export default function ChipSelect({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
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
