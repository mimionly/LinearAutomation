// src/pages/projects.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  Calendar as CalendarIcon,
  Plus,
  ChevronDown,
  Users,
  CircleDashed,
  CircleAlert,
  CheckCircle2,
  Hexagon,
  Timer,
  CircleX,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useTheme } from "next-themes";
import EmojiPicker, { Theme } from "emoji-picker-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";


type Priority = "urgent" | "high" | "medium" | "low" | "No-priority";

interface Project {
  id: string;
  name: string;
  lastUpdate?: string;
  priority: Priority;
  lead?: string;
  leadEmail?: string;
  targetDate?: string;
  issues: number;
  progress: number; // 0–100
  status?: string;
  members?: { name: string; email: string }[];
}


const priorityConfig: Record<Priority, { label: string; icon: React.ReactNode }> = {
  urgent: { label: "Urgent", icon: <CircleAlert className="size-3.5 text-red-500" /> },
  high:   { label: "High",   icon: <BarChart2 className="size-3.5 text-orange-400" /> },
  medium: { label: "Medium", icon: <BarChart2 className="size-3.5 text-yellow-400" /> },
  low:    { label: "Low",    icon: <BarChart2 className="size-3.5 text-muted-foreground" /> },
  "No-priority": { label: "No priority", icon: <Minus
     className="size-3.5 text-muted-foreground opacity-45" /> },
};



function AvatarPlaceholder({ name }: { name: string }) {
  return (
    <div className="size-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[9px] font-semibold text-violet-400 uppercase shrink-0">
      {name ? name[0] : "?"}
    </div>
  );
}

const getStatusIcon = (s?: string, className?: string) => {
  switch (s) {
    case "backlog":
      return <CircleDashed className={cn("text-orange-400 dark:text-orange-500 shrink-0", className)} />;
    case "unstarted":
      return <Hexagon className={cn("text-zinc-400 dark:text-zinc-500 shrink-0", className)} />;
    case "started":
      return <Timer className={cn("text-blue-400 dark:text-blue-500 shrink-0", className)} />;
    case "completed":
      return <CheckCircle2 className={cn("text-emerald-400 dark:text-emerald-500 shrink-0", className)} />;
    case "canceled":
      return <CircleX className={cn("text-zinc-500 dark:text-zinc-400 shrink-0", className)} />;
    default:
      return <Hexagon className={cn("text-zinc-400 dark:text-zinc-500 shrink-0", className)} />;
  }
};

const QUICK_EMOJIS = [];

const mapDbPriority = (p?: number | null): Priority => {
  if (p === 1) return "urgent";
  if (p === 2) return "high";
  if (p === 3) return "medium";
  if (p === 4) return "low";
  return "No-priority";
};

const mapDbProject = (dbProj): Project => {
  return {
    id: dbProj.id,
    name: dbProj.name,
    lastUpdate: dbProj.description || dbProj.content || "",
    priority: mapDbPriority(dbProj.priority),
    lead: dbProj.lead?.name || "",
    leadEmail: dbProj.lead?.email || "",
    targetDate: dbProj.targetDate || "",
    issues: 0,
    progress: dbProj.progress ?? 0,
    status: dbProj.badgeStatus || dbProj.state || "backlog",
    members: dbProj.members || [],
  };
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const dbProjects = useQuery(api.linear.fetchProjects);
  const mutateProjects = useMutation(api.linear.upsertProjects);
  const dbVentures = useQuery(api.ventures.listVentures);
  const dbMembers = useQuery(api.members.listMembers);

  const projects = React.useMemo(() => {
    if (!dbProjects) return [];
    return dbProjects.map(mapDbProject);
  }, [dbProjects]);


  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Form states for creating a project
  const [projectName, setProjectName] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<"backlog" | "unstarted" | "started" | "completed" | "">("");
  const [priority, setPriority] = React.useState<Priority>("No-priority");
  const [leadMember, setLeadMember] = React.useState<{ name: string; email: string } | null>(null);
  const [selectedMembers, setSelectedMembers] = React.useState<{ name: string; email: string }[]>([]);
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [targetDate, setTargetDate] = React.useState<Date | undefined>(undefined);
  const [selectedVentureId, setSelectedVentureId] = React.useState<string>("");
  const { resolvedTheme } = useTheme();

  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [selectedEmoji, setSelectedEmoji] = React.useState(" ");



  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    const mapPriorityToNumber = (p: Priority): number | null => {
      switch (p) {
        case "urgent": return 1;
        case "high": return 2;
        case "medium": return 3;
        case "low": return 4;
        default: return null;
      }
    };

    const resolvedStatus = status || "backlog";
    const generatedId = String(Date.now());

    try {
      await mutateProjects({
        projects: [
          {
            id: generatedId,
            name: projectName,
            state: resolvedStatus,
            description: description || undefined,
            priority: mapPriorityToNumber(priority),
            progress: 0,
            content: summary || undefined,
            lead: leadMember ? { name: leadMember.name, email: leadMember.email } : null,
            ventureId: selectedVentureId || undefined,
            members: selectedMembers,
            iconEmoji: selectedEmoji,
            startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
            targetDate: targetDate ? targetDate.toISOString().split('T')[0] : undefined,
          }
        ]
      });

      // Reset fields
      setProjectName("");
      setSummary("");
      setDescription("");
      setStatus("");
      setPriority("No-priority");
      setLeadMember(null);
      setSelectedMembers([]);
      setStartDate(undefined);
      setTargetDate(undefined);
      setSelectedVentureId("");
      
      setIsCreateOpen(false);
      navigate(`/projects/${generatedId}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  return (
    <div className="flex flex-col h-full px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border py-3">
        <h1 className="group inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-300 h-auto cursor-pointer border rounded-2xl p-2">
          All projects
        </h1>
        <div className="flex items-center gap-1.5">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="group inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-300 h-auto p-0"
          >
            <Plus className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-90" />
            <span>Create new project</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="w-8 pl-1 py-2"></th>
              <th className="py-2 text-left font-medium whitespace-nowrap pr-4 min-w-[150px]">Name</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[100px]">Status</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[100px]">Priority</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[100px]">Lead</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[120px]">Members</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[100px]">Target date</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[60px]">Issues</th>
              <th className="py-2 text-left font-medium whitespace-nowrap px-3 min-w-[120px]">Progress</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const priorityVal = priorityConfig[project.priority];
            
              return (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer "
                >
                <td></td>

                  {/* Name + update */}
                  <td className="py-2.5 pr-4" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="flex items-center gap-2 min-w-0 cursor-pointer">
                     
                      <span className="font-medium text-foreground hover:text-[#5e6ad2] dark:hover:text-[#6e7bf2] hover:underline truncate transition-all duration-200" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}>
                        {project.name}
                      </span>
                      {project.lastUpdate && (
                        <span className="text-xs text-muted-foreground truncate hidden md:block max-w-xs">
                          · {project.lastUpdate}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                      {getStatusIcon(project.status, "size-3.5")}
                      {project.status}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {priorityVal?.icon}
                      {priorityVal?.label}
                    </span>
                  </td>

                  {/* Lead */}
                  <td className="py-2.5 px-3">
                    {project.lead ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AvatarPlaceholder name={project.lead} />
                        {project.lead}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/40">
                        <div className="size-5 rounded-full border border-dashed border-border" />
                        No lead
                      </span>
                    )}
                  </td>

                  {/* Members */}
                  <td className="py-2.5 px-3">
                    {project.members && project.members.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {project.members.map((m: any, idx: number) => {
                          const initials = m.name ? m.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase() : "??";
                          return (
                            <div
                              key={idx}
                              className="inline-block ring-2 ring-background rounded-full"
                              title={`${m.name} (${m.email})`}
                            >
                              <div className="size-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[9px] font-semibold text-indigo-400 uppercase shrink-0">
                                {initials[0]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>

                  {/* Target date */}
                  <td className="py-2.5 px-3">
                    {project.targetDate ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="size-3.5" />
                        {project.targetDate}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </td>

                  {/* Issues */}
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">
                    {project.issues}
                  </td>

                  {/* Progress bar with percentage */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5 min-w-[100px]">
                      <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden shrink-0">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            project.progress === 100 ? "bg-blue-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums min-w-[28px] text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl bg-popover text-popover-foreground border border-border p-0 gap-0 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-foreground/10 outline-none">
          {/* Custom Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground select-none">
              <span>New project</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-full size-6 text-muted-foreground hover:bg-muted/80 flex items-center justify-center animate-none"
            >
     
            </Button>
          </div>

          {/* Scrollable Form Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Icon Selector + Name Input */}
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-lg border border-border/85 bg-muted/20 flex items-center justify-center text-muted-foreground hover:bg-muted/40 cursor-pointer shrink-0 transition-colors">
                 <div className="flex items-center gap-2">
                  <DropdownMenu open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <DropdownMenuTrigger>
                      <button className="h-10 w-10 rounded-lg flex items-center justify-center text-lg">
                        {selectedEmoji}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="p-0 border-0 bg-transparent shadow-none" style={{ width: 300 }} align="start">
                      <div className="z-50 shadow-2xl border  overflow-hidden bg-card">
                        <div className="p-2 flex flex-wrap gap-1">
                          {QUICK_EMOJIS.map((e) => (
                            <button key={e} type="button" className={`h-9 w-9 text-lg flex items-center justify-center rounded ${selectedEmoji===e? 'bg-muted':''}`} onClick={() => { setSelectedEmoji(e); setShowEmojiPicker(false); }}>
                              {e}
                            </button>
                          ))}
                        </div>
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
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-transparent text-xl md:text-2xl font-semibold text-foreground placeholder:text-muted-foreground/35 border-none outline-none focus:ring-0 p-0"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Add a short summary..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/35 border-none outline-none focus:ring-0 p-0"
                />
              </div>
            </div>

            {/* Attributes Row */}
            <div className="flex flex-wrap items-center gap-2 py-2 border-b border-border/20">
              {/* Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger >
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    {getStatusIcon(status, "size-3.5")}
                    <span className="capitalize">{status || "Status"}</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-1 z-50">
                  <DropdownMenuItem onClick={() => setStatus("backlog")} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon("backlog", "size-3.5")}
                    Backlog
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("unstarted")} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon("unstarted", "size-3.5")}
                    Unstarted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("started")} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon("started", "size-3.5")}
                    Started
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("completed")} className="flex items-center gap-2 cursor-pointer">
                    {getStatusIcon("completed", "size-3.5")}
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger >
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    {priorityConfig[priority]?.icon || <BarChart2 className="size-3" />}
                    <span className="capitalize">{priority}</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-1 z-50">
                  <DropdownMenuItem onClick={() => setPriority("urgent")} className="flex items-center gap-2 cursor-pointer">
                    <CircleAlert className="size-3 text-red-500" />
                    Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriority("high")} className="flex items-center gap-2 cursor-pointer">
                    <BarChart2 className="size-3 text-orange-400" />
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriority("medium")} className="flex items-center gap-2 cursor-pointer">
                    <BarChart2 className="size-3 text-yellow-400" />
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriority("low")} className="flex items-center gap-2 cursor-pointer">
                    <BarChart2 className="size-3 text-muted-foreground" />
                    Low
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriority("No-priority")} className="flex items-center gap-2 cursor-pointer">
                    <Minus className="size-3 text-muted-foreground opacity-45" />
                    No priority
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Venture Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    <span className="capitalize">
                      {dbVentures?.find(v => v._id === selectedVentureId)?.name || "Venture"}
                    </span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-1 z-50 max-h-56 overflow-y-auto">
                  <DropdownMenuItem onClick={() => setSelectedVentureId("")} className="flex items-center gap-2 cursor-pointer text-muted-foreground text-xs">
                    No Venture
                  </DropdownMenuItem>
                  {dbVentures?.map((v) => (
                    <DropdownMenuItem key={v._id} onClick={() => setSelectedVentureId(v._id)} className="flex items-center gap-2 cursor-pointer text-xs">
                      {v.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Lead Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    {leadMember ? (
                      <>
                        <AvatarPlaceholder name={leadMember.name} />
                        <span>{leadMember.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="size-4 rounded-full border border-dashed border-border flex items-center justify-center text-[8px] text-muted-foreground font-bold shrink-0">+</div>
                        <span>Lead</span>
                      </>
                    )}
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-1 z-50 max-h-60 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/40 select-none mb-1">
                    Select Lead
                  </div>
                  <DropdownMenuItem onClick={() => setLeadMember(null)} className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                    No Lead
                  </DropdownMenuItem>
                  {dbMembers?.map((m) => (
                    <DropdownMenuItem
                      key={m._id}
                      onClick={() => setLeadMember({ name: m.name, email: m.email })}
                      className="flex items-center gap-2 cursor-pointer text-xs"
                    >
                      <AvatarPlaceholder name={m.name} />
                      <span className="truncate">{m.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Members Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    <Users className="size-3" />
                    <span>
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length} member${selectedMembers.length > 1 ? "s" : ""}`
                        : "Members"}
                    </span>
                    <ChevronDown className="size-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-1 z-50 max-h-60 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/40 select-none mb-1">
                    Assign Members
                  </div>
                  {dbMembers?.map((m) => {
                    const isAssigned = selectedMembers.some((sm) => sm.email === m.email);
                    return (
                      <DropdownMenuItem
                        key={m._id}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedMembers((prev) =>
                            isAssigned
                              ? prev.filter((sm) => sm.email !== m.email)
                              : [...prev, { name: m.name, email: m.email }]
                          );
                        }}
                        className="flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <AvatarPlaceholder name={m.name} />
                          <span className="truncate">{m.name}</span>
                        </div>
                        {isAssigned && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Start Date Button */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    <span>
                      {startDate
                        ? startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : "Start"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-1.5 bg-popover border border-border shadow-lg rounded-lg z-50 w-[92vw] sm:w-auto">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      // Clear target date if it is on or before the new start date
                      if (targetDate && date && targetDate <= date) {
                        setTargetDate(undefined);
                      }
                    }}
                  />
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Target Date Button */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/10 hover:bg-muted/20 text-xs font-medium text-muted-foreground transition-colors cursor-pointer">
                    <CalendarIcon className="size-3 text-muted-foreground" />
                    <span>
                      {targetDate
                        ? targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : "Target"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-1.5 bg-popover border border-border shadow-lg rounded-lg z-50 w-[92vw] sm:w-auto">
                  <CalendarComponent
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    disabled={(date) => {
                      if (!startDate) return false;
                      const start = new Date(startDate);
                      start.setHours(0,0,0,0);
                      const current = new Date(date);
                      current.setHours(0,0,0,0);
                      return current <= start;
                    }}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description Textarea */}
            <textarea
              placeholder="Write a description, a project brief, or collect ideas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 border-none outline-none focus:ring-0 p-0 resize-none min-h-[140px]"
            />
          </div>

          {/* Custom Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-muted/20 border-t border-border/40">
            <Button
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#5e6ad2] hover:bg-[#4d59c2] disabled:hover:bg-[#5e6ad2] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Create project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}