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
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "educator" | "preferences" | "privacy">(
    initialTab === "educator" ? "educator" : "profile"
  );
  const router = useRouter();

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

function PrivacySection({ profile }: { profile: any }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

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
            Add an extra layer of security to your account.
          </p>
          <button
            className="px-5 py-2.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors"
            onClick={() => alert("Coming soon!")}
          >
            Enable 2FA
          </button>
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
            className="px-5 py-2.5 bg-ink/5 text-ink rounded-full font-medium hover:bg-ink/10 transition-colors"
            onClick={() => alert("Coming soon!")}
          >
            Request data export
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