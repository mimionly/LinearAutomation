import { useUser } from "@clerk/clerk-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "../mode-toggle";
import * as React from "react";
import { Check, Pencil, Save, SearchCheck } from "lucide-react";
import {
  type ProfileData,
  EMPTY,
  loadProfile,
  saveProfile,
  clearProfile,
  validateEmail,
} from "../lib/profileData";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  const [committed, setCommitted] = useState<ProfileData>(EMPTY);
  const [form, setForm]           = useState<ProfileData>(EMPTY);
  const [saveFlash, setSaveFlash]       = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailError, setEmailError]     = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Runs once when Clerk finishes loading — single batched update, no cascades
  useEffect(() => {
    if (!isLoaded) return;

    const stored = loadProfile();

    const merged: ProfileData = {
      fullName:  stored.fullName  || user?.fullName                          || "",
      email:     stored.email     || user?.primaryEmailAddress?.emailAddress || "",
      avatarUrl: stored.avatarUrl || user?.imageUrl                          || "",
      title:     stored.title     || "",
      username:  stored.username  || user?.username                          || "",
    };

    setForm(merged);       // ← both in the same effect,
    setCommitted(stored);  //   React 18 batches these into one render
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = JSON.stringify(form) !== JSON.stringify(committed);
  const isSaved = JSON.stringify(committed) !== JSON.stringify(EMPTY);

  function setField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setField("avatarUrl", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleConfirm() {
    const err = validateEmail(form.email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    setEditingEmail(false);
  }

  function handleCancel() {
    clearProfile();
    setForm({ ...EMPTY });
    setCommitted({ ...EMPTY });
    setEmailError("");
    setEditingEmail(false);
  }

  function handleSave() {
    const err = validateEmail(form.email);
    if (err) {
      setEmailError(err);
      setEditingEmail(true);
      return;
    }
    const snapshot = { ...form };
    saveProfile(snapshot);
    setCommitted(snapshot);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }

  const initials = form.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">
            Manage your personal information and account settings.
          </p>
        </div>

        <Card className="border border-border shadow-sm">
          <CardContent className="p-0">

            <div className="flex items-center justify-between px-6 py-5">
              <Label className="text-sm font-semibold">Profile picture</Label>
              <div className="flex flex-col items-center gap-1.5">
                <label htmlFor="avatar-upload" className="text-[11px] text-muted-foreground">
                  click to change
                </label>
                <input
                  id="avatar-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="h-14 w-14 ring-2 ring-border ring-offset-2 ring-offset-background transition-all group-hover:ring-primary">
                    <AvatarImage src={form.avatarUrl} alt={form.fullName || "User"} />
                    <AvatarFallback className="bg-muted font-semibold text-base">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between px-6 py-5">
              <Label htmlFor="fullname" className="text-sm font-semibold">Full name</Label>
              <Input
                id="fullname"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                placeholder="Your Name"
                className="w-52 h-9 text-sm"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between px-6 py-5">
              <div className="space-y-0.5">
                <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
                <p className="text-xs text-muted-foreground">Your job title or role</p>
              </div>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Software engineer"
                className="w-52 h-9 text-sm"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between px-6 py-5">
              <div className="space-y-0.5">
                <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
                <p className="text-xs text-muted-foreground">One word, like a nickname or first name</p>
              </div>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setField("username", e.target.value)}
                className="w-52 h-9 text-sm"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between px-6 py-5">
              <Label className="text-sm font-semibold">Email</Label>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  {editingEmail ? (
                    <>
                      <Input
                        value={form.email}
                        onChange={(e) => {
                          setField("email", e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                        className={`h-8 w-56 text-sm ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        autoFocus
                        placeholder="you@gmail.com"
                      />
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleConfirm}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {form.email || <span className="italic opacity-50">Not set</span>}
                      </span>
                      <Button
                        variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setEditingEmail(true)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
            <p className="text-muted-foreground text-sm">Customize how the app looks and feels.</p>
          </div>
          <Card className="border border-border shadow-sm">
            <CardContent className="px-6 py-5 space-y-4">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">Preferred theme</p>
                <p className="text-xs text-muted-foreground">Choose how the interface appears to you.</p>
              </div>
              <div className="flex gap-3">
                <ModeToggle />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={!isSaved}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isDirty}>
            {saveFlash ? (
              <span className="inline-flex items-center gap-1.5">
                <SearchCheck className="w-4 h-4" /> Saved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}