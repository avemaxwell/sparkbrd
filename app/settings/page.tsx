"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { planDisplayName } from "@/lib/plan-limits";
import EducatorSection from "@/components/settings/EducatorSection";

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cork-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const { profile, loading, refreshProfile, signOut } = useUser();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const VALID_TABS = ["profile", "account", "educator", "preferences", "privacy"] as const;
  const [activeTab, setActiveTab] = useState<typeof VALID_TABS[number]>(
    VALID_TABS.includes(initialTab as any) ? (initialTab as typeof VALID_TABS[number]) : "profile"
  );
  const router = useRouter();

  useEffect(() => {
    // Coming back from a successful Stripe checkout — the cached profile
    // (from before the redirect to Stripe) still shows the old plan, and the
    // webhook that actually updates it can lag the redirect slightly. Refetch
    // now and once more shortly after so the new plan (and, for Creator Pro,
    // the payout card) shows up without requiring a manual page refresh.
    if (searchParams.get("upgrade") === "success") {
      refreshProfile();
      const timer = setTimeout(refreshProfile, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cork-warm flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    router.push("/login");
    return null;
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )},
    { id: "account", label: "Account", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
      </svg>
    )},
    { id: "educator", label: "Teaching Profile", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3 2 8l10 5 10-5-10-5Z"/>
        <path d="M6 10.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-5.5"/>
      </svg>
    )},
    { id: "preferences", label: "Preferences", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )},
    { id: "privacy", label: "Privacy & Security", icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-cork-warm">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cork-warm/90 backdrop-blur-md border-b border-ink/5 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-ink/5 transition-colors"
            >
              <svg className="w-5 h-5 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h1 className="font-serif text-xl">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-papaya/10 text-papaya"
                      : "text-ink hover:bg-ink/5"
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Sign out button */}
            <button
              onClick={signOut}
              className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="font-medium">Sign out</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === "profile" && <ProfileSection onUpdate={refreshProfile} />}
            {activeTab === "account" && <AccountSection profile={profile} />}
            {activeTab === "educator" && <EducatorSection />}
            {activeTab === "preferences" && <PreferencesSection />}
            {activeTab === "privacy" && <PrivacySection profile={profile} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROFILE SECTION
// ============================================================================

function ProfileSection({ onUpdate }: { onUpdate: () => void }) {
  const { profile } = useUser();
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const supabase = createClient();

  // Update name state when profile changes
  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", profile.id);

    if (!error) {
      setSaved(true);
      onUpdate();
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setAvatarUploading(true);

    const fileName = `avatars/${profile.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setAvatarUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("profiles")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
    } else {
      console.log("Avatar saved:", publicUrl);
      onUpdate();
    }
    
    setAvatarUploading(false);
  };

  if (!profile) return null;

  const initials = profile.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const hasChanges = name !== (profile.name || "");

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="font-serif text-2xl mb-6">Profile</h2>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name || "Avatar"}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blush to-mustard flex items-center justify-center text-white text-2xl font-semibold">
              {initials}
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-ink/5 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {avatarUploading ? (
              <div className="w-4 h-4 border-2 border-ink/20 border-t-papaya rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 stroke-ink stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </label>
        </div>
        <div>
          <p className="font-medium text-lg">{profile.name || "Add your name"}</p>
          <p className="text-ink-soft">{profile.email}</p>
        </div>
      </div>

      {/* Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-2">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 bg-ink/5 rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all"
        />
      </div>

      {/* Email (read-only) */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-ink mb-2">Email</label>
        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full px-4 py-3 bg-ink/5 rounded-xl text-ink-soft cursor-not-allowed"
        />
        <p className="text-xs text-ink-soft mt-1">Contact support to change your email</p>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Saved!
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </div>
  );
}

// ============================================================================
// ACCOUNT SECTION
// ============================================================================

function AccountSection({ profile }: { profile: any }) {
  const currentPlanName = planDisplayName(profile.plan);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [agreedToCreatorTerms, setAgreedToCreatorTerms] = useState(false);

  const startConnectOnboarding = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch('/api/creator/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreedToTerms: agreedToCreatorTerms }),
      });
      const data = await res.json();
      if (!res.ok) { setConnectError(data.error ?? 'Something went wrong.'); setConnecting(false); return; }
      window.location.href = data.url;
    } catch {
      setConnectError('Something went wrong. Please try again.');
      setConnecting(false);
    }
  };

  const openPayoutsDashboard = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch('/api/creator/connect');
      const data = await res.json();
      if (!res.ok) { setConnectError(data.error ?? 'Something went wrong.'); setConnecting(false); return; }
      window.open(data.url, '_blank');
    } catch {
      setConnectError('Something went wrong. Please try again.');
    }
    setConnecting(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-2xl mb-6">Account</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-soft mb-1">Current Plan</p>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-papaya/10 text-papaya">
              {currentPlanName}
            </span>
          </div>
          <Link
            href="/settings/billing"
            className="px-4 py-2 bg-papaya text-white rounded-full text-sm font-medium hover:bg-papaya/90 transition-colors"
          >
            {profile.plan === "free" ? "Upgrade" : "Manage billing"}
          </Link>
        </div>
      </div>

      {profile.plan === "creator_pro" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-serif text-2xl mb-2">Sell your resources</h2>
          {profile.stripe_connect_payouts_enabled ? (
            <>
              <p className="text-sm text-ink-soft mb-4">
                Payouts are connected — you can price any resource you share. Your Creator Pro rate keeps Sparkurio's fee at 7%.
              </p>
              {connectError && <p className="text-sm text-papaya mb-3">{connectError}</p>}
              <button
                onClick={openPayoutsDashboard}
                disabled={connecting}
                className="px-6 py-3 border-2 border-ink/20 text-ink rounded-full font-medium hover:border-ink/40 transition-colors disabled:opacity-50"
              >
                {connecting ? "Loading…" : "Manage payouts"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-soft mb-4">
                Connect a payout account to price your resources — Sparkurio takes a 7% fee per sale as a Creator Pro member, the rest is transferred to you automatically via Stripe.
              </p>
              {connectError && <p className="text-sm text-papaya mb-3">{connectError}</p>}
              <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToCreatorTerms}
                  onChange={(e) => setAgreedToCreatorTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-papaya flex-shrink-0"
                />
                <span className="text-sm text-ink-soft">
                  I agree to the{" "}
                  <a href="/terms#creator-terms" target="_blank" rel="noopener noreferrer" className="text-papaya font-medium hover:underline">
                    Creator Terms
                  </a>
                  , including that all sales are final and I&apos;m solely responsible for what I list.
                </span>
              </label>
              <button
                onClick={startConnectOnboarding}
                disabled={connecting || !agreedToCreatorTerms}
                className="px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
              >
                {connecting ? "Loading…" : "Connect payout account"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PREFERENCES SECTION
// ============================================================================

function PreferencesSection() {
  const { profile } = useUser();
  const [defaultBgStyle, setDefaultBgStyle] = useState("gradient");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save to localStorage or database
    localStorage.setItem("sparkurio_preferences", JSON.stringify({
      defaultBgStyle,
      emailNotifications,
      weeklyDigest,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    const saved = localStorage.getItem("sparkurio_preferences");
    if (saved) {
      const prefs = JSON.parse(saved);
      setDefaultBgStyle(prefs.defaultBgStyle || "gradient");
      setEmailNotifications(prefs.emailNotifications ?? true);
      setWeeklyDigest(prefs.weeklyDigest ?? false);
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="font-serif text-2xl mb-6">Preferences</h2>

      {/* Default Board Style */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-ink mb-3">Default Collection Background</label>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: "gradient", label: "Gradient" },
            { id: "starburst", label: "Starburst" },
            { id: "swirl", label: "Swirl" },
            { id: "solid", label: "Solid" },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setDefaultBgStyle(style.id)}
              className={`p-3 rounded-xl border-2 transition-all ${
                defaultBgStyle === style.id
                  ? "border-papaya bg-papaya/5"
                  : "border-ink/10 hover:border-ink/20"
              }`}
            >
              <div
                className="w-full h-12 rounded-lg mb-2"
                style={{
                  background:
                    style.id === "gradient"
                      ? "linear-gradient(135deg, #F0FFC2 0%, #FFD6F2 100%)"
                      : style.id === "starburst"
                      ? "repeating-conic-gradient(from 0deg, #F0FFC2 0deg 15deg, #FFD6F2 15deg 30deg)"
                      : style.id === "swirl"
                      ? "radial-gradient(ellipse at 20% 80%, #F0FFC2 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #FFD6F2 0%, transparent 50%), linear-gradient(135deg, #F0FFC2 0%, #FFD6F2 100%)"
                      : "#F0FFC2",
                }}
              />
              <p className={`text-xs font-medium ${defaultBgStyle === style.id ? "text-papaya" : "text-ink"}`}>
                {style.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Email Notifications */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-ink mb-4">Email Notifications</h3>
        
        <label className="flex items-center justify-between py-3 border-b border-ink/5 cursor-pointer">
          <div>
            <p className="font-medium">Activity notifications</p>
            <p className="text-sm text-ink-soft">Get notified when someone interacts with your collections</p>
          </div>
          <div
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`w-12 h-7 rounded-full transition-colors ${
              emailNotifications ? "bg-papaya" : "bg-ink/20"
            } relative`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                emailNotifications ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
        </label>

        <label className="flex items-center justify-between py-3 cursor-pointer">
          <div>
            <p className="font-medium">Weekly digest</p>
            <p className="text-sm text-ink-soft">Receive a weekly summary of your inspiration</p>
          </div>
          <div
            onClick={() => setWeeklyDigest(!weeklyDigest)}
            className={`w-12 h-7 rounded-full transition-colors ${
              weeklyDigest ? "bg-papaya" : "bg-ink/20"
            } relative`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                weeklyDigest ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
        </label>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="px-6 py-3 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors flex items-center gap-2"
      >
        {saved ? (
          <>
            <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Saved!
          </>
        ) : (
          "Save preferences"
        )}
      </button>
    </div>
  );
}

// ============================================================================
// PRIVACY SECTION
// ============================================================================

interface MfaFactor {
  id: string;
  status: string;
  factor_type: string;
}

function PrivacySection({ profile }: { profile: any }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [factorsLoading, setFactorsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [showDisableChallenge, setShowDisableChallenge] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sparkurio-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Couldn't export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const verifiedFactor = factors.find((f) => f.factor_type === "totp" && f.status === "verified");

  const loadFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
    setFactorsLoading(false);
  };

  useEffect(() => {
    loadFactors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startEnroll = async () => {
    setMfaError(null);
    setEnrolling(true);

    // A previous enrollment attempt that was abandoned mid-flow (closed tab,
    // reloaded, tried again) leaves unverified factors behind, which block a
    // fresh enroll with a "friendly name already exists" error — clear all
    // of them first, not just the first one found.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const stale = existing?.totp.filter((f: MfaFactor) => f.status === "unverified") ?? [];
    for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id });

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !data) {
      setMfaError(error?.message ?? "Couldn't start 2FA setup. Please try again.");
      setEnrolling(false);
      return;
    }
    setEnrollData({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
  };

  const cancelEnroll = async () => {
    if (enrollData) await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId });
    setEnrollData(null);
    setVerifyCode("");
    setMfaError(null);
    setEnrolling(false);
  };

  const confirmEnroll = async () => {
    if (!enrollData || verifyCode.trim().length !== 6) return;
    setVerifying(true);
    setMfaError(null);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });
    if (challengeError || !challenge) {
      setMfaError(challengeError?.message ?? "Couldn't verify that code. Please try again.");
      setVerifying(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId: challenge.id,
      code: verifyCode.trim(),
    });
    if (verifyError) {
      setMfaError("That code didn't match. Check your authenticator app and try again.");
      setVerifying(false);
      return;
    }
    setEnrollData(null);
    setVerifyCode("");
    setEnrolling(false);
    setVerifying(false);
    await loadFactors();
  };

  // Supabase requires the session to be stepped up to AAL2 before a verified
  // factor can be removed — a password-only session isn't enough, otherwise
  // 2FA could be defeated by anyone who just knows the password. So disabling
  // asks for one more code from the authenticator app first.
  const startDisable = () => {
    setMfaError(null);
    setDisableCode("");
    setShowDisableChallenge(true);
  };

  const confirmDisable = async (factorId: string) => {
    if (disableCode.trim().length !== 6) return;
    setUnenrolling(factorId);
    setMfaError(null);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setMfaError(challengeError?.message ?? "Couldn't verify that code. Please try again.");
      setUnenrolling(null);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: disableCode.trim(),
    });
    if (verifyError) {
      setMfaError("That code didn't match. Check your authenticator app and try again.");
      setUnenrolling(null);
      return;
    }
    await supabase.auth.mfa.unenroll({ factorId });
    setShowDisableChallenge(false);
    setDisableCode("");
    await loadFactors();
    setUnenrolling(null);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    
    setDeleting(true);
    
    // Delete user data
    await supabase.from("tacks").delete().eq("user_id", profile.id);
    await supabase.from("text_blocks").delete().eq("user_id", profile.id);
    await supabase.from("boards").delete().eq("owner_id", profile.id);
    await supabase.from("profiles").delete().eq("id", profile.id);
    
    // Sign out and redirect
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-2xl mb-6">Privacy & Security</h2>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Change Password</h3>
          <p className="text-sm text-ink-soft mb-4">
            We&apos;ll send you an email with a link to reset your password.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.resetPasswordForEmail(profile.email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              alert("Password reset email sent!");
            }}
            className="px-5 py-2.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors"
          >
            Send reset email
          </button>
        </div>

        <div className="border-t border-ink/10 pt-6">
          <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-ink-soft mb-4">
            Add an extra layer of security to your account with an authenticator app.
          </p>

          {factorsLoading ? (
            <div className="w-5 h-5 border-2 border-ink/10 border-t-papaya rounded-full animate-spin" />
          ) : enrollData ? (
            <div className="bg-ink/5 rounded-2xl p-5 max-w-sm">
              <p className="text-sm text-ink mb-3">Scan this code with your authenticator app (like Google Authenticator or Authy):</p>
              <img src={enrollData.qrCode} alt="2FA QR code" className="w-40 h-40 bg-white rounded-xl p-2 mb-3" />
              <p className="text-xs text-ink-soft mb-3">Or enter this code manually: <code className="bg-white px-1.5 py-0.5 rounded">{enrollData.secret}</code></p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                className="w-full px-4 py-2.5 bg-white rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all mb-3"
              />
              {mfaError && <p className="text-sm text-red-600 mb-3">{mfaError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={confirmEnroll}
                  disabled={verifyCode.length !== 6 || verifying}
                  className="px-5 py-2.5 bg-papaya text-white rounded-full font-medium hover:bg-papaya/90 transition-colors disabled:opacity-50"
                >
                  {verifying ? "Verifying…" : "Confirm"}
                </button>
                <button
                  onClick={cancelEnroll}
                  className="px-5 py-2.5 bg-white text-ink rounded-full font-medium hover:bg-ink/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : verifiedFactor ? (
            showDisableChallenge ? (
              <div className="bg-ink/5 rounded-2xl p-5 max-w-sm">
                <p className="text-sm text-ink mb-3">Enter a code from your authenticator app to confirm disabling 2FA:</p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="w-full px-4 py-2.5 bg-white rounded-xl outline-none focus:ring-2 focus:ring-papaya/30 transition-all mb-3"
                />
                {mfaError && <p className="text-sm text-red-600 mb-3">{mfaError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmDisable(verifiedFactor.id)}
                    disabled={disableCode.length !== 6 || unenrolling === verifiedFactor.id}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {unenrolling === verifiedFactor.id ? "Disabling…" : "Confirm disable"}
                  </button>
                  <button
                    onClick={() => { setShowDisableChallenge(false); setDisableCode(""); setMfaError(null); }}
                    className="px-5 py-2.5 bg-white text-ink rounded-full font-medium hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">2FA is enabled</span>
                <button
                  onClick={startDisable}
                  className="px-5 py-2.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors"
                >
                  Disable 2FA
                </button>
              </div>
            )
          ) : (
            <>
              {mfaError && <p className="text-sm text-red-600 mb-3">{mfaError}</p>}
              <button
                onClick={startEnroll}
                disabled={enrolling}
                className="px-5 py-2.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors disabled:opacity-50"
              >
                {enrolling ? "Starting…" : "Enable 2FA"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-serif text-xl mb-4">Your Data</h3>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Export your data</h4>
          <p className="text-sm text-ink-soft mb-4">
            Download a copy of all your collections, resources, and account information.
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-5 py-2.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors disabled:opacity-50"
          >
            {exporting ? "Preparing…" : "Download my data"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-red-100">
        <h3 className="font-serif text-xl text-red-600 mb-4">Danger Zone</h3>
        
        {!showDeleteConfirm ? (
          <div>
            <h4 className="font-medium mb-2">Delete Account</h4>
            <p className="text-sm text-ink-soft mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 bg-red-50 text-red-600 rounded-full font-medium hover:bg-red-100 transition-colors"
            >
              Delete my account
            </button>
          </div>
        ) : (
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-red-800 mb-4">
              This will permanently delete all your collections, resources, and account data. 
              Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-300 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "DELETE" || deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput("");
                }}
                className="px-5 py-2.5 bg-white text-ink rounded-full font-medium hover:bg-ink/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}