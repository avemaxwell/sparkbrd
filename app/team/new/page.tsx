"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      }).then(r => r.json());

      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      router.push(`/team/${res.team.slug}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cork-warm flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl">
            Spark<span className="text-papaya">urio</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl text-ink mb-1">Create a team workspace</h1>
          <p className="text-sm text-ink/40 mb-6">Give your team a name to get started.</p>

          {error && (
            <div className="mb-4 p-3 bg-papaya/10 text-papaya text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm text-ink/50 mb-2">Team name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
              placeholder="e.g. Design Team"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-papaya text-white font-medium rounded-full hover:bg-papaya/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create workspace"}
          </button>

          <div className="mt-5 text-center">
            <Link href="/" className="text-sm text-ink/40 hover:text-ink transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
