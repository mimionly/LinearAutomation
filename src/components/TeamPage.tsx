import * as React from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import EmojiPicker, { Theme } from "emoji-picker-react";
//import { UserRoundPen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPlus,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconTrash,
  IconChevronRight,
  IconArrowLeft,
  IconUsers,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  handle?: string;
}

interface Team {
  _id: string;
  name: string;
  identifier: string;
  iconEmoji?: string;
  iconColor?: string;
  description?: string;
  members?: Member[];
}

const QUICK_EMOJIS = ["🚀", "💻", "🎨", "📢", "🛠️", "👥", "📈", "🔒", "🎯", "💡"];

function getTeamIdentifier(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 3) return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
  if (words.length === 2) return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
  return name.trim().slice(0, 3).toUpperCase();
}

// ─── Team Icon ────────────────────────────────────────────────────────────────

interface TeamIconProps {
  emoji: string;
  size?: "sm" | "md" | "preview" | "lg";
  className?: string;
  onClick?: () => void;
}

function TeamIcon({ emoji, size = "md", className = "", onClick }: TeamIconProps) {
  const sizeClasses = {
    sm:      "h-10 w-10 text-base ",
    md:      "h-11 w-11 text-lg ",
    preview: "h-12 w-12 text-xl ",
    lg:      "h-14 w-14 text-2xl ",
  };

  const shared =
    `flex items-center justify-center ` +
    ` shrink-0 select-none shadow-xs ` +
    `transition-all duration-200 ${sizeClasses[size]} ${className}`;

  const emojiSpan = (
    <span className="leading-none flex items-center justify-center select-none">
      {emoji}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shared}>
        {emojiSpan}
      </button>
    );
  }
  return (
    <div className={shared}>
      {emojiSpan}
    </div>
  );
}

// ─── Member Avatar Stack ──────────────────────────────────────────────────────

function MemberAvatarStack({ members, max = 4 }: { members: Member[]; max?: number }) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  if (members.length === 0)
    return <span className="text-xs text-muted-foreground italic">No members</span>;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((m) => {
        const initials = m.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase();
        return m.avatarUrl ? (
          <img key={m._id} src={m.avatarUrl} alt={m.name} title={m.name}
            className="h-6 w-6 rounded-full ring-2 ring-background object-cover shrink-0" />
        ) : (
          <span key={m._id} title={m.name}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-foreground ring-2 ring-background shrink-0">
            {initials}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[8px] font-semibold text-muted-foreground ring-2 ring-background shrink-0">
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── Manage Team Members Dialog ───────────────────────────────────────────────

interface ManageTeamMembersDialogProps {
  team: Pick<Team, "_id" | "name" | "members">;
  isAdmin: boolean;
}

function ManageTeamMembersDialog({ team, isAdmin }: ManageTeamMembersDialogProps) {
  const dbMembers = useQuery(api.members.listMembers) ?? [];
  const mutateAssignTeamMembers = useMutation(api.members.assignTeamMembers);

  const [open, setOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedIds((team.members ?? []).map((m) => m._id));
      setError("");
      setSuccess(false);
    }
  }, [open, team]);

  function toggleMember(memberId: string) {
    setSelectedIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      await mutateAssignTeamMembers({
        teamId: team._id as Id<"teams">,
        memberIds: selectedIds as Id<"members">[],
      });
      setSuccess(true);
      setTimeout(() => setOpen(false), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update team members.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* FIX: asChild prevents a <button> nested inside a <button> */}
      <DialogTrigger >
        <Button
          disabled={!isAdmin}
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs font-medium"
        >
          Manage
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md gap-0 p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">
            Manage members — {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 py-4 max-h-[55vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground">
            Select the members who belong to this team.
          </p>

          <div className="flex flex-col gap-1.5">
            {dbMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No members found in this workspace.
              </p>
            ) : (
              dbMembers.map((member) => {
                const isSelected = selectedIds.includes(member._id);
                const initials = member.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase();
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleMember(member._id)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all active:scale-[0.99] ${
                      isSelected
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name}
                          className="h-8 w-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                          {initials}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{member.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                    }`}>
                      {isSelected && <IconCheck size={12} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {success && (
            <div className="text-xs text-emerald-950 dark:text-emerald-300    p-2.5  flex items-center gap-2">
              <IconCheck size={13} className="shrink-0 text-emerald-950 dark:text-emerald-300" />
              Team members updated!
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2.5 rounded-md flex items-start gap-2">
              <IconAlertCircle size={13} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3.5 border-t bg-muted/20 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || success} className="ml-auto">
            {loading ? (
              <><IconLoader2 size={13} className="animate-spin mr-1.5" />Saving…</>
            ) : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Details View ────────────────────────────────────────────────────────

interface TeamDetailsViewProps {
  team: Team;
  isAdmin: boolean;
  onBack: () => void;
}

function TeamDetailsView({ team, isAdmin, onBack }: TeamDetailsViewProps) {
  const [search, setSearch] = React.useState("");
  const mutateAssignTeamMembers = useMutation(api.members.assignTeamMembers);
  const [removingMemberId, setRemovingMemberId] = React.useState<string | null>(null);
  const [removeError, setRemoveError] = React.useState("");
  const [removeLoading, setRemoveLoading] = React.useState(false);

  const members = team.members ?? [];
  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.handle?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  async function handleRemoveMember(memberId: string) {
    setRemoveLoading(true);
    setRemoveError("");
    try {
      const remainingIds = members
        .filter((m) => m._id !== memberId)
        .map((m) => m._id);
      await mutateAssignTeamMembers({
        teamId: team._id as Id<"teams">,
        memberIds: remainingIds as Id<"members">[],
      });
      setRemovingMemberId(null);
    } catch (err: unknown) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove member.");
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Back button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent"
        >
          <IconArrowLeft size={16} />
          Back to Teams
        </Button>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden bg-card p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-xl border">
        <div className="flex items-start gap-4">
          <TeamIcon emoji={team.iconEmoji ?? " "} size="lg" />
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {team.name}
              </h1>
              <span className="inline-flex items-center border-l-2 border-indigo-500 bg-indigo-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest shrink-0">
                {team.identifier}
              </span>
            </div>
            {team.description ? (
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">{team.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground/45 italic mt-1">No description provided.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto md:self-center shrink-0">
          <span className="text-xs bg-muted text-muted-foreground px-3 py-1 font-medium rounded">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
          {isAdmin && <ManageTeamMembersDialog team={team} isAdmin={isAdmin} />}
        </div>
      </div>

      {/* Members Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Team Members</h2>
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {removeError && (
          <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-3 rounded-lg flex items-center gap-2">
            <IconAlertCircle size={14} className="shrink-0" />
            {removeError}
          </div>
        )}

        {/* Mobile members list layout */}
        <div className="flex flex-col gap-3 sm:hidden">
          {filtered.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground italic bg-card border rounded-xl">
              No members found.
            </div>
          ) : (
            filtered.map((member) => {
              const initials = member.name
                ? member.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase()
                : "??";
              return (
                <div key={member._id} className="flex items-center justify-between p-3 rounded-xl border bg-card shadow-sm gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name}
                        className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-border" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold ring-1 ring-border">
                        {initials}
                      </span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                        {member.name}
                        {member.handle && (
                          <span className="text-[10px] text-muted-foreground font-normal">{member.handle}</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                      member.role === "Admin"
                        ? "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {member.role === "Admin" ? "Admin" : "Member"}
                    </span>
                    {isAdmin && (
                      <Dialog
                        open={removingMemberId === member._id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setRemovingMemberId(null);
                            setRemoveError("");
                          } else {
                            setRemovingMemberId(member._id);
                          }
                        }}
                      >
                        <DialogTrigger >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            title="Remove member from team"
                          >
                            <IconTrash size={15} />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm rounded-xl">
                          <DialogHeader>
                            <DialogTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                              <IconAlertCircle size={16} />
                              Remove from team
                            </DialogTitle>
                          </DialogHeader>
                          <div className="py-3 text-xs text-muted-foreground">
                            Are you sure you want to remove{" "}
                            <strong>{member.name}</strong> from{" "}
                            <strong>{team.name}</strong>?
                          </div>
                          <DialogFooter className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline"
                              onClick={() => setRemovingMemberId(null)}
                              disabled={removeLoading}>
                              Cancel
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => handleRemoveMember(member._id)}
                              disabled={removeLoading}>
                              {removeLoading ? "Removing…" : "Remove"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop members table layout */}
        <div className="hidden sm:block overflow-hidden rounded-xl border shadow-sm bg-card">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Member</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Email</TableHead>
                <TableHead className="w-[120px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Role</TableHead>
                {isAdmin && (
                  <TableHead className="w-[100px] text-right pr-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="h-24 text-center text-sm text-muted-foreground italic">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((member) => {
                  const initials = member.name
                    ? member.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase()
                    : "??";
                  return (
                    <TableRow key={member._id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name}
                              className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-border" />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-1 ring-border">
                              {initials}
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate text-foreground flex items-center gap-1.5">
                              {member.name}
                              {member.handle && (
                                <span className="text-[10px] text-muted-foreground font-normal">{member.handle}</span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground truncate sm:hidden">{member.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {member.email}
                      </TableCell>

                      <TableCell className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          member.role === "Admin"
                            ? "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {member.role === "Admin" ? "Admin" : "Member"}
                        </span>
                      </TableCell>

                      {isAdmin && (
                        <TableCell className="py-3 pr-4 text-right">
                          <Dialog
                            open={removingMemberId === member._id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setRemovingMemberId(null);
                                setRemoveError("");
                              } else {
                                setRemovingMemberId(member._id);
                              }
                            }}
                          >
                            {/* FIX: asChild on DialogTrigger wrapping a Button */}
                            <DialogTrigger >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                title="Remove member from team"
                              >
                                <IconTrash size={15} />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-sm rounded-xl">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                                  <IconAlertCircle size={16} />
                                  Remove from team
                                </DialogTitle>
                              </DialogHeader>
                              <div className="py-3 text-xs text-muted-foreground">
                                Are you sure you want to remove{" "}
                                <strong>{member.name}</strong> from{" "}
                                <strong>{team.name}</strong>?
                              </div>
                              <DialogFooter className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline"
                                  onClick={() => setRemovingMemberId(null)}
                                  disabled={removeLoading}>
                                  Cancel
                                </Button>
                                <Button size="sm" variant="destructive"
                                  onClick={() => handleRemoveMember(member._id)}
                                  disabled={removeLoading}>
                                  {removeLoading ? "Removing…" : "Remove"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Team Dialog ───────────────────────────────────────────────────────

interface DeleteTeamDialogProps {
  team: Pick<Team, "_id" | "name" | "identifier">;
  isAdmin: boolean;
}

function DeleteTeamDialog({ team, isAdmin }: DeleteTeamDialogProps) {
  const mutateDeleteTeam = useMutation(api.members.deleteTeam);
  const [open, setOpen] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) { setConfirmName(""); setError(""); }
  }, [open]);

  async function handleDelete() {
    if (confirmName !== team.name) {
      setError("Please type the team name exactly to confirm.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await mutateDeleteTeam({ teamId: team._id as Id<"teams"> });
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete team.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* FIX: asChild prevents nested button */}
      <DialogTrigger >
        <Button
          disabled={!isAdmin}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          title="Delete team"
        >
          <IconTrash size={15} />
          <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md gap-0 p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
            <IconAlertCircle size={18} />
            Delete {team.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-5">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive dark:text-red-400 space-y-1">
            <p className="font-semibold">This action is permanent and cannot be undone.</p>
            <p className="text-muted-foreground">
              All memberships for <strong>{team.name}</strong> ({team.identifier}) will be removed.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-name" className="text-xs font-medium text-muted-foreground">
              Type <span className="font-semibold text-foreground">{team.name}</span> to confirm:
            </Label>
            <Input
              id="confirm-name"
              placeholder={team.name}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <IconAlertCircle size={13} /> {error}
            </p>
          )}
        </div>

        <DialogFooter className="px-5 py-3.5 border-t bg-muted/20 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmName !== team.name}
            className="ml-auto gap-1.5"
          >
            {loading
              ? <><IconLoader2 size={13} className="animate-spin" />Deleting…</>
              : "Delete team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Card (mobile) ───────────────────────────────────────────────────────

interface TeamCardProps {
  team: Team;
  isAdmin: boolean;
}

function TeamCard({ team, isAdmin }: TeamCardProps) {
  const [, setSearchParams] = useSearchParams();
  const emoji = team.iconEmoji ?? " ";
  const identifier = team.identifier || getTeamIdentifier(team.name);
  const memberCount = (team.members ?? []).length;

  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setSearchParams({ teamId: team._id })}
            className="flex items-start gap-3 text-left focus:outline-none hover:opacity-85 transition-opacity flex-1 min-w-0"
          >
            <TeamIcon emoji={emoji} size="md" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-foreground leading-tight  truncate">
                {team.name}
              </span>
              {team.description ? (
                <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{team.description}</span>
              ) : (
                <span className="text-xs text-muted-foreground/40 italic mt-0.5">No description</span>
              )}
            </div>
          </button>
          <span className="inline-flex items-center border-l-2 border-indigo-500 bg-indigo-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest shrink-0">
            {identifier}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSearchParams({ teamId: team._id })}
          className="flex items-center gap-2.5 w-full rounded-lg border border-dashed border-border/60 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
        >
          <MemberAvatarStack members={team.members ?? []} />
          {memberCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          )}
          <IconChevronRight size={14} className="ml-auto text-muted-foreground/50 shrink-0" />
        </button>

        <div className="flex items-center justify-end gap-2 pt-0.5">
          <ManageTeamMembersDialog team={team} isAdmin={isAdmin} />
          {isAdmin && (
            <DeleteTeamDialog team={{ _id: team._id, name: team.name, identifier }} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Team Dialog ───────────────────────────────────────────────────────

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const { resolvedTheme } = useTheme();
  const mutateCreateTeam = useMutation(api.members.createTeam);

  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [identifier, setIdentifier] = React.useState("");
  const [selectedEmoji, setSelectedEmoji] = React.useState("🚀");
  const [hasManuallyEditedIdentifier, setHasManuallyEditedIdentifier] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Auto-generate identifier from name unless user has manually edited it
  React.useEffect(() => {
    if (!hasManuallyEditedIdentifier && name.trim()) {
      setIdentifier(getTeamIdentifier(name));
    }
  }, [name, hasManuallyEditedIdentifier]);

  function resetForm() {
    setName("");
    setDescription("");
    setIdentifier("");
    setSelectedEmoji("  ");
    setHasManuallyEditedIdentifier(false);
    setShowEmojiPicker(false);
    setError("");
    setSuccess(false);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) resetForm();
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedId = identifier.trim().toUpperCase();
    const trimmedDesc = description.trim();

    if (!trimmedName) { setError("Team name is required."); return; }
    if (!trimmedId) { setError("Team identifier is required."); return; }
    if (!/^[A-Z0-9]{2,5}$/.test(trimmedId)) {
      setError("Identifier must be 2–5 alphanumeric characters.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await mutateCreateTeam({
        name: trimmedName,
        identifier: trimmedId,
        iconEmoji: selectedEmoji,
        iconColor: "gray",
        ...(trimmedDesc ? { description: trimmedDesc } : {}),
      });
      setSuccess(true);
      setTimeout(() => handleOpenChange(false), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create team.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md gap-0 p-0 overflow-hidden rounded-xl">
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">Create a new team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateTeam}>
          <div className="flex flex-col gap-5 px-5 py-5 max-h-[72vh] overflow-y-auto">

            {/* Preview */}
            <div className="flex items-center gap-4  p-3.5 bg-muted/20">
              <TeamIcon emoji={selectedEmoji} size="preview" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Preview</span>
                <span className="text-sm font-semibold truncate">{name.trim() || "New Team"}</span>
                {description.trim() && (
                  <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{description.trim()}</span>
                )}
              </div>
            </div>

            {/* Emoji */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Icon</Label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setSelectedEmoji(emoji); setShowEmojiPicker(false); }}
                    className={`h-9 w-9 text-lg flex items-center justify-center  transition-all hover:bg-muted ${
                      selectedEmoji === emoji && !showEmojiPicker ? "bg-muted " : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
                <DropdownMenu open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <DropdownMenuTrigger >
                    <button
                      type="button"
                      className={`h-9 px-3 text-xs  rounded-lg font-medium flex items-center gap-1.5 hover:bg-muted transition-colors ${showEmojiPicker ? "bg-muted" : ""}`}
                    >
                      More 
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-0 border-0 bg-transparent shadow-none" style={{ width: "300px" }} align="start">
                    <div className="z-50 shadow-2xl border  overflow-hidden bg-card">
                      <EmojiPicker
                        onEmojiClick={(d) => { setSelectedEmoji(d.emoji); setShowEmojiPicker(false); }}
                        theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                        lazyLoadEmojis skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                        width={300}
                        height={320}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Team Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-name"
                placeholder="e.g. Engineering, Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm"
                maxLength={50}
              />
            </div>

            {/* Description — NEW */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-description" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description <span className="text-muted-foreground/50 font-normal normal-case">(optional)</span>
              </Label>
              <Textarea
                id="team-description"
                placeholder="What does this team work on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm resize-none min-h-[72px]"
                maxLength={200}
              />
            </div>

            {/* Identifier */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="team-identifier" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identifier <span className="text-destructive">*</span>
              </Label>
              <Input
                id="team-identifier"
                placeholder="e.g. ENG"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                  setHasManuallyEditedIdentifier(true);
                }}
                className="h-10 text-sm font-mono uppercase tracking-widest"
                maxLength={5}
              />
              <span className="text-[11px] text-muted-foreground">
                Uppercase code used as issue prefix (2–5 characters).
              </span>
            </div>

            {/* Feedback */}
            {success && (
              <div className="flex items-center gap-2     px-3 py-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                <IconCheck size={13} className="shrink-0 text-emerald-500 dark:text-emerald-300" />
                Team created successfully!
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2  bg-destructive/5 border border-destructive/20 px-3 py-2.5 text-xs text-destructive">
                <IconAlertCircle size={13} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="px-5 py-3.5 border-t bg-muted/20 flex gap-2">
            <Button type="button" variant="outline" size="sm"
              onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !name.trim() || !identifier.trim() || success}
              className="ml-auto gap-1.5"
            >
              {loading
                ? <><IconLoader2 size={13} className="animate-spin" />Creating…</>
                : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Team Page ────────────────────────────────────────────────────────────────

export function TeamPage() {
  const syncClerk = useAction(api.members.syncClerkMembers);
  React.useEffect(() => {
    syncClerk().catch((err) => console.error("Clerk sync failed:", err));
  }, [syncClerk]);

  const teams = useQuery(api.members.listTeams);
  const caller = useQuery(api.members.getCallerByClerkId);

  const [searchParams, setSearchParams] = useSearchParams();
  const viewingTeamId = searchParams.get("teamId");
  const [createOpen, setCreateOpen] = React.useState(false);

  const isAdmin = caller?.role === "Admin";
  const isLoading = teams === undefined;

  const activeTeam = React.useMemo(
    () => (teams && viewingTeamId ? (teams.find((t) => t._id === viewingTeamId) ?? null) : null),
    [teams, viewingTeamId]
  );

  // Clear stale teamId from URL if team no longer exists
  React.useEffect(() => {
    if (!isLoading && viewingTeamId && !activeTeam) {
      setSearchParams({});
    }
  }, [isLoading, viewingTeamId, activeTeam, setSearchParams]);

  if (activeTeam) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto">
        <TeamDetailsView team={activeTeam} isAdmin={isAdmin} onBack={() => setSearchParams({})} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b pb-5 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">
            Manage workspace teams, identifiers, and members.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            disabled={!isAdmin}
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 w-full"
          >
            <IconPlus size={15} />
            Create Team
          </Button>
        </div>
        <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      {/* Non-admin notice */}
      {caller && !isAdmin && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-700 px-4 py-3 text-xs sm:text-sm text-red-800 dark:text-red-800">
          <IconAlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>View-only:</strong> You must be an Admin to create or modify teams.
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-muted-foreground">
          <IconLoader2 size={18} className="animate-spin" />
          Loading teams…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-xl border border-dashed bg-muted/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <IconUsers size={28} className="text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No teams yet</p>
            <p className="text-xs text-muted-foreground max-w-[22rem]">
              {isAdmin
                ? "Create your first team to start organizing workspace members."
                : "Ask an administrator to create teams for this workspace."}
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" className="mt-1 gap-1.5" onClick={() => setCreateOpen(true)}>
              <IconPlus size={14} /> Create first team
            </Button>
          )}
        </div>
      )}

      {/* Mobile cards */}
      {!isLoading && teams.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!isLoading && teams.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-xl border shadow-sm">
          <Table className="min-w-[640px]">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="w-[68px] pl-4" />
                <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Team</TableHead>
                <TableHead className="w-[140px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Identifier</TableHead>
                <TableHead className="w-[220px] font-semibold text-xs uppercase tracking-wide text-muted-foreground">Members</TableHead>
                <TableHead className="w-[130px] text-right pr-4 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => {
                const emoji = team.iconEmoji ?? "👥";
                const identifier = team.identifier || getTeamIdentifier(team.name);

                return (
                  <TableRow key={team._id} className="hover:bg-muted/30 transition-colors group/row">
                    <TableCell className="pl-4 py-4">
                      <TeamIcon
                        emoji={emoji}
                        size="sm"
                        onClick={() => setSearchParams({ teamId: team._id })}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="py-4">
                      <button
                        type="button"
                        onClick={() => setSearchParams({ teamId: team._id })}
                        className="flex flex-col text-left focus:outline-none"
                      >
                        <span className="text-sm font-semibold">{team.name}</span>
                        {team.description ? (
                          <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{team.description}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 italic mt-0.5">No description</span>
                        )}
                      </button>
                    </TableCell>

                    <TableCell className="py-4">
                      <span className="inline-flex items-center border-l-2 border-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider shrink-0">
                        {identifier}
                      </span>
                    </TableCell>

                    <TableCell className="py-4">
                      <button
                        type="button"
                        onClick={() => setSearchParams({ teamId: team._id })}
                        className="flex items-center gap-2 hover:opacity-70 transition-opacity focus:outline-none"
                        title="View members"
                      >
                        <MemberAvatarStack members={team.members ?? []} />
                        {(team.members?.length ?? 0) > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {team.members!.length}{" "}
                            {team.members!.length === 1 ? "member" : "members"}
                          </span>
                        )}
                      </button>
                    </TableCell>

                    <TableCell className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ManageTeamMembersDialog team={team} isAdmin={isAdmin} />
                        {isAdmin && (
                          <DeleteTeamDialog
                            team={{ _id: team._id, name: team.name, identifier }}
                            isAdmin={isAdmin}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}