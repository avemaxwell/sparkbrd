"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { EDUCATOR_ROLES, isClassroomEducatorRole, type EducatorRole } from "@/lib/educator";
import ConfirmSchoolModal from "@/components/educator/ConfirmSchoolModal";

export default function EducatorSection() {
  const { profile, refreshProfile } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [savingRole, setSavingRole] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [savingDisplay, setSavingDisplay] = useState(false);
  const [linkingNotice, setLinkingNotice] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.verified_institution_name) setInstitutionName(profile.verified_institution_name);
  }, [profile?.verified_institution_name]);

  // Finalize verification after the Google OAuth-link redirect lands back here.
  useEffect(() => {
    if (searchParams.get("linked") !== "google") return;
    (async () => {
      setLinkingNotice("Confirming your school Google account…");
      const res = await fetch("/api/school-verifications/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });
      const data = await res.json();
      setLinkingNotice(res.ok ? "School confirmed!" : data.error ?? "Couldn’t confirm that account.");
      if (res.ok) await refreshProfile();
      router.replace("/settings?tab=educator");
      setTimeout(() => setLinkingNotice(null), 4000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (!profile) return null;

  const supabase = createClient();

  const handleRoleChange = async (role: EducatorRole) => {
    setSavingRole(true);
    await supabase.from("profiles").update({ role }).eq("id", profile.id);
    await refreshProfile();
    setSavingRole(false);
  };

  const handleSaveInstitutionName = async () => {
    setSavingInstitution(true);
    await supabase.from("profiles").update({ verified_institution_name: institutionName }).eq("id", profile.id);
    await refreshProfile();
    setSavingInstitution(false);
  };

  const handleToggleDisplay = async () => {
    setSavingDisplay(true);
    await supabase.from("profiles").update({ display_school_publicly: !profile.display_school_publicly }).eq("id", profile.id);
    await refreshProfile();
    setSavingDisplay(false);
  };

  const eligible = isClassroomEducatorRole(profile.role);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-2xl mb-1">Teaching Profile</h2>
        <p className="text-sm text-ink-soft mb-6">
          Tell us how you use Sparkurio so we can personalize your experience — this never restricts access.
        </p>

        <label className="block text-sm font-medium text-ink mb-2">I am a…</label>
        <select
          value={profile.role ?? ""}
          onChange={(e) => handleRoleChange(e.target.value as EducatorRole)}
          disabled={savingRole}
          className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all disabled:opacity-50"
        >
          <option value="" disabled>Select one</option>
          {EDUCATOR_ROLES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      {linkingNotice && (
        <div className="bg-papaya/10 text-papaya text-sm rounded-xl p-4">{linkingNotice}</div>
      )}

      {profile.role === "homeschool" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-lime text-ink text-xs font-semibold rounded-full">Homeschool</span>
          </div>
          <p className="text-sm text-ink-soft">
            You&rsquo;re on the Homeschool track — recommendations and planning tools are tailored for at-home education.
            Classroom-only perks (like unlimited downloads for verified educators) aren&rsquo;t part of this track, since they&rsquo;re tied to confirmed school affiliation.
          </p>
        </div>
      )}

      {eligible && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {profile.is_verified_educator ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 stroke-green-600 stroke-[3] fill-none" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <h3 className="font-semibold text-ink">School confirmed</h3>
              </div>
              <p className="text-xs text-ink-soft mb-1">Domain</p>
              <p className="text-sm text-ink mb-4">{profile.verified_school_domain}</p>
              <p className="text-xs text-ink-soft mb-1">Confirmed</p>
              <p className="text-sm text-ink mb-6">
                {profile.verified_at ? new Date(profile.verified_at).toLocaleDateString() : "—"}
              </p>

              <label className="block text-sm font-medium text-ink mb-2">Institution name</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
                />
                <button
                  onClick={handleSaveInstitutionName}
                  disabled={savingInstitution || institutionName === profile.verified_institution_name}
                  className="px-4 py-2.5 bg-ink/10 text-ink rounded-full text-sm font-medium hover:bg-ink/20 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-ink-soft mb-4">This is a label you can edit — it&rsquo;s never verified against a directory.</p>

              <label className="flex items-center justify-between gap-4 py-3 border-t border-ink/5">
                <span className="text-sm text-ink">
                  Show my institution name on my public profile
                  <span className="block text-xs text-ink-soft mt-0.5">Your school email is never shown publicly, only this name if you opt in.</span>
                </span>
                <button
                  onClick={handleToggleDisplay}
                  disabled={savingDisplay}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${profile.display_school_publicly ? "bg-papaya" : "bg-ink/15"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.display_school_publicly ? "translate-x-5" : ""}`} />
                </button>
              </label>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-papaya/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 stroke-papaya stroke-2 fill-none" viewBox="0 0 24 24">
                    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-ink mb-1">Not yet confirmed</h3>
                  <p className="text-sm text-ink-soft">
                    Confirm your school email to unlock unlimited downloads and other classroom-educator perks — free, no upgrade needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors"
              >
                Confirm your school
              </button>
            </>
          )}
        </div>
      )}

      {showConfirmModal && <ConfirmSchoolModal onClose={() => setShowConfirmModal(false)} />}
    </div>
  );
}
