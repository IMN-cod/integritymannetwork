"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Lock,
  Bell,
  Save,
  Loader2,
  Check,
  Camera,
  AlertTriangle,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Mail,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  role: string;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Preferences {
  notifyCommunity: boolean;
  notifyBlog: boolean;
  notifyEvents: boolean;
  notifyOrders: boolean;
  notifyPromotions: boolean;
}

type TabId = "profile" | "password" | "notifications" | "account";

// ─── Component ───────────────────────────────────────────────────────────────
export default function DashboardSettingsPage() {
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification preferences
  const [prefs, setPrefs] = useState<Preferences>({
    notifyCommunity: true,
    notifyBlog: true,
    notifyEvents: true,
    notifyOrders: true,
    notifyPromotions: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ─── Fetch Profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      const u = data.user;
      setProfile(u);
      setFirstName(u.firstName || "");
      setLastName(u.lastName || "");
      setDisplayName(u.displayName || "");
      setPhone(u.phone || "");
      setBio(u.bio || "");
      setAvatar(u.avatar || "");
      if (data.preferences) setPrefs(data.preferences);
    } catch {
      setProfileError("Failed to load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ─── Save Profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName: displayName || null,
          phone: phone || null,
          bio: bio || null,
          avatar: avatar || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      // Update session so header reflects new name
      await updateSession({
        name: `${firstName} ${lastName}`,
        image: avatar || undefined,
      });

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── Change Password ──────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // ─── Save Preferences ─────────────────────────────────────────────────────
  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    setPrefsError(null);
    setPrefsSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  // ─── Avatar Upload ──────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    setProfileError(null);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.urls?.length) throw new Error("Upload failed");

      setAvatar(data.urls[0]);
    } catch {
      setProfileError("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ─── Password Strength ────────────────────────────────────────────────────
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score: 2, label: "Fair", color: "bg-yellow-500" };
    if (score <= 5) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const passwordRequirements = [
    { met: newPassword.length >= 8, label: "At least 8 characters" },
    { met: /[A-Z]/.test(newPassword), label: "One uppercase letter" },
    { met: /[a-z]/.test(newPassword), label: "One lowercase letter" },
    { met: /[0-9]/.test(newPassword), label: "One number" },
    { met: /[^A-Za-z0-9]/.test(newPassword), label: "One special character" },
  ];

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "account", label: "Account", icon: <Shield className="w-4 h-4" /> },
  ];

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // ─── Error Alert ───────────────────────────────────────────────────────────
  const ErrorAlert = ({ error, onDismiss }: { error: string | null; onDismiss: () => void }) =>
    error ? (
      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="flex-1">{error}</span>
        <button onClick={onDismiss} className="text-red-400 hover:text-red-300">
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : null;

  const SuccessBanner = ({ show, message }: { show: boolean; message: string }) =>
    show ? (
      <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg flex items-center gap-2 text-sm">
        <Check className="w-4 h-4" />
        {message}
      </div>
    ) : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-display">Account Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your profile, security, and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Nav */}
          <nav className="lg:w-52 shrink-0">
            <div className="lg:sticky lg:top-6 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                    activeTab === tab.id
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* ── Profile Tab ────────────────────────────────────────────── */}
            {activeTab === "profile" && (
              <>
                <ErrorAlert error={profileError} onDismiss={() => setProfileError(null)} />
                <SuccessBanner show={profileSaved} message="Profile saved successfully!" />

                {/* Avatar */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-zinc-400">
                              {firstName?.charAt(0)}{lastName?.charAt(0)}
                            </span>
                          )}
                          {uploadingAvatar && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg"
                          disabled={uploadingAvatar}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {firstName} {lastName}
                        </p>
                        <p className="text-sm text-zinc-400">{profile?.email}</p>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">First Name *</label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Last Name *</label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Display Name</label>
                      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional display name" />
                      <p className="text-xs text-zinc-500 mt-1">If set, this will be shown instead of your full name.</p>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
                      <div className="flex items-center gap-2">
                        <Input value={profile?.email || ""} disabled className="opacity-60" />
                        <Mail className="w-4 h-4 text-zinc-500" />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Contact support to change your email address.</p>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Phone</label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+233 20 123 4567" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1.5">Bio</label>
                      <Textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a little about yourself..."
                        rows={4}
                      />
                      <p className="text-xs text-zinc-500 mt-1">{bio.length}/500 characters</p>
                    </div>
                    <div className="pt-2">
                      <Button onClick={handleSaveProfile} disabled={savingProfile || !firstName || !lastName}>
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {profileSaved ? "Saved!" : "Save Profile"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Password Tab ───────────────────────────────────────────── */}
            {activeTab === "password" && (
              <>
                <ErrorAlert error={passwordError} onDismiss={() => setPasswordError(null)} />
                <SuccessBanner show={passwordSaved} message="Password changed successfully!" />

                {!profile?.hasPassword ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Social Login Account</h3>
                      <p className="text-sm text-zinc-400 max-w-md mx-auto">
                        Your account uses social login (Google). Password management is not available for social login accounts.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lock className="w-4 h-4 text-orange-500" />
                        Change Password
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Current Password</label>
                        <div className="flex gap-2">
                          <Input
                            type={showCurrentPw ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPw(!showCurrentPw)}
                            className="px-3 py-2 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">New Password</label>
                        <div className="flex gap-2">
                          <Input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="px-3 py-2 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                          >
                            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Strength Bar */}
                        {newPassword && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-zinc-500">Password strength</span>
                              <span className={`text-xs font-medium ${
                                passwordStrength.score <= 1 ? "text-red-400" :
                                passwordStrength.score === 2 ? "text-yellow-400" :
                                passwordStrength.score === 3 ? "text-blue-400" : "text-green-400"
                              }`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 flex-1 rounded-full transition-all ${
                                    i <= passwordStrength.score ? passwordStrength.color : "bg-zinc-800"
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Requirements */}
                            <div className="mt-3 space-y-1">
                              {passwordRequirements.map((req) => (
                                <div key={req.label} className="flex items-center gap-2">
                                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${req.met ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-600"}`}>
                                    {req.met && <Check className="w-2.5 h-2.5" />}
                                  </div>
                                  <span className={`text-xs ${req.met ? "text-zinc-300" : "text-zinc-500"}`}>{req.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-1.5">Confirm New Password</label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                          <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        >
                          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : passwordSaved ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {passwordSaved ? "Changed!" : "Change Password"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* ── Notifications Tab ──────────────────────────────────────── */}
            {activeTab === "notifications" && (
              <>
                <ErrorAlert error={prefsError} onDismiss={() => setPrefsError(null)} />
                <SuccessBanner show={prefsSaved} message="Notification preferences saved!" />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" />
                      Email Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-400">Choose which emails you&apos;d like to receive.</p>

                    {[
                      { key: "notifyCommunity" as const, label: "Community updates and announcements", description: "News, updates, and important announcements from IMN" },
                      { key: "notifyBlog" as const, label: "New blog posts", description: "Get notified when new articles are published" },
                      { key: "notifyEvents" as const, label: "Event reminders", description: "Upcoming events and event registration updates" },
                      { key: "notifyOrders" as const, label: "Order and shipping updates", description: "Status updates for your store orders" },
                      { key: "notifyPromotions" as const, label: "Promotional offers", description: "Special deals, discounts, and offers" },
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-start gap-3 py-2">
                        <button
                          type="button"
                          onClick={() => setPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                            prefs[pref.key] ? "bg-orange-500" : "bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              prefs[pref.key] ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                        <div>
                          <span className="text-sm font-medium text-zinc-200">{pref.label}</span>
                          <p className="text-xs text-zinc-500 mt-0.5">{pref.description}</p>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-zinc-800">
                      <Button onClick={handleSavePrefs} disabled={savingPrefs}>
                        {savingPrefs ? <Loader2 className="w-4 h-4 animate-spin" /> : prefsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {prefsSaved ? "Saved!" : "Save Preferences"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Account Tab ────────────────────────────────────────────── */}
            {activeTab === "account" && (
              <>
                {/* Account Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-500" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                        <div>
                          <span className="text-sm text-zinc-400">Account ID</span>
                          <p className="text-sm text-zinc-200 font-mono">{profile?.id}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                        <div>
                          <span className="text-sm text-zinc-400">Email</span>
                          <p className="text-sm text-zinc-200">{profile?.email}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full">Verified</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                        <div>
                          <span className="text-sm text-zinc-400">Role</span>
                          <p className="text-sm text-zinc-200">{profile?.role}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                        <div>
                          <span className="text-sm text-zinc-400">Member Since</span>
                          <p className="text-sm text-zinc-200">
                            {profile?.createdAt
                              ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div>
                          <span className="text-sm text-zinc-400">Authentication Method</span>
                          <p className="text-sm text-zinc-200">{profile?.hasPassword ? "Email & Password" : "Google (Social Login)"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      Sessions & Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <p className="text-sm text-zinc-200">
                            Current Session
                          </p>
                          <p className="text-xs text-zinc-500">
                            Last updated: {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                      <div>
                        <p className="text-sm font-medium text-red-400">Deactivate Account</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Temporarily disable your account. You can reactivate by contacting support.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                        onClick={() => alert("Please contact support at support@integritymannetwork.org to deactivate your account.")}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
