import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "next-themes";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useUser, useOrganization } from "@clerk/clerk-react";

import {
  ChevronDown,
  Users,
  Check,
  Calendar as CalendarIcon,
  PlusCircle,
  Trash2,
  Paperclip,
  ExternalLink,
  ArrowLeft,
  BarChart2,
  CircleDashed,
  CircleAlert  , 
  Minus,
  CheckCircle2,
  CalendarX2,
  Flag,
  Activity as ActivityIcon,
  ListTodo,

  SlidersHorizontal,
  Hexagon,
  Timer,
  CircleX
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import { cn } from "@/lib/utils";

type Priority = "urgent" | "high" | "medium" | "low" | "No-priority";

const priorityConfig: Record<Priority, { label: string; icon: React.ReactNode }> = {
  urgent: { label: "Urgent", icon: <CircleAlert className="size-3.5 text-red-500" /> },
  high:   { label: "High",   icon: <BarChart2 className="size-3.5 text-orange-500" /> },
  medium: { label: "Medium", icon: <BarChart2 className="size-3.5 text-yellow-500" /> },
  low:    { label: "Low",    icon: <BarChart2 className="size-3.5 text-muted-foreground" /> },
  "No-priority": { label: "No priority", icon: <Minus className="size-3.5 text-muted-foreground opacity-40" /> },
};

function AvatarPlaceholder({ name, size = 20 }: { name: string; size?: number }) {
  const initials = name ? name.split(/[\s@]/)[0].slice(0, 2).toUpperCase() : "??";
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-[9px] font-semibold text-violet-400 uppercase shrink-0"
    >
      {initials[0]}
    </div>
  );
}

const getStatusIcon = (s?: string, className?: string) => {
  switch (s?.toLowerCase()) {
    case "backlog":
      return <CircleDashed className={cn("text-orange-400 dark:text-orange-500 shrink-0", className)} />;
    case "unstarted":
    case "planned":
      return <Hexagon className={cn("text-zinc-400 dark:text-zinc-500 shrink-0", className)} />;
    case "In-progress":
    case "in-progress":
      return <Timer className={cn("text-blue-500 dark:text-blue-500 shrink-0", className)} />;
    case "completed":
      return <CheckCircle2 className={cn("text-emerald-500 dark:text-emerald-500 shrink-0", className)} />;
    case "canceled":
      return <CircleX className={cn("text-zinc-500 dark:text-zinc-400 shrink-0", className)} />;
    default:
      return <Hexagon className={cn("text-zinc-400 dark:text-zinc-500 shrink-0", className)} />;
  }
};

const QUICK_EMOJIS = ["🚀", "✨", "🎯", "🛡️", "🔮", "💡", "⚡", "🔥"];

const mapDbPriority = (p?: number | null): Priority => {
  if (p === 1) return "urgent";
  if (p === 2) return "high";
  if (p === 3) return "medium";
  if (p === 4) return "low";
  return "No-priority";
};

const mapPriorityToNumber = (p: Priority): number | null => {
  switch (p) {
    case "urgent": return 1;
    case "high": return 2;
    case "medium": return 3;
    case "low": return 4;
    default: return null;
  }
};

export default function ProjectDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  // Extract ID from path manually: /projects/:projectId
  const pathId = location.pathname.split("/")[2];
  const id = pathId || "";

  // Queries
  const dbProjects = useQuery(api.linear.fetchProjects);
  const dbMembers = useQuery(api.members.listMembers);
  const dbVentures = useQuery(api.ventures.listVentures);
  const currentUser = useQuery(api.members.getCurrentUser);

  // Auth
  const { user } = useUser();
  const { membership } = useOrganization();

  const isClerkAdmin = 
    user?.publicMetadata?.role === 'admin' || 
    user?.publicMetadata?.role === 'Admin' ||
    membership?.role === 'admin' || 
    membership?.role === 'org:admin' ||
    user?.organizationMemberships?.some(m => m.role === 'admin' || m.role === 'org:admin');
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin' || isClerkAdmin;

  // Find current project
  const project = React.useMemo(() => {
    if (!dbProjects) return undefined;
    return dbProjects.find((p) => p.id === id || p._id === id);
  }, [dbProjects, id]);

  const dbIssues = useQuery(api.linear.fetchIssuesByProject, { projectId: project?.id || id });

  // Mutations
  const updateProject = useMutation(api.linear.updateProjectFields);
  const generateUploadUrl = useMutation(api.ventures.generateUploadUrl);
  const addProjectStorageDocument = useMutation(api.linear.addProjectStorageDocument);

  // States
  const [activeTab, setActiveTab] = React.useState<"overview" | "activity" | "issues">("overview");
  const [name, setName] = React.useState("");
  const [content, setContent] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  // File Upload states
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState("");

  // Resource Link adding states
  const [isAddingDoc, setIsAddingDoc] = React.useState(false);
  const [docTitle, setDocTitle] = React.useState("");
  const [docUrl, setDocUrl] = React.useState("");
  const [docError, setDocError] = React.useState("");

  // Mobile drawer state
  const [isMobilePropsOpen, setIsMobilePropsOpen] = React.useState(false);

  // Sync inputs with DB
  React.useEffect(() => {
    if (project) {
      setName(project.name ?? "");
      setContent(project.content ?? "");
      setDescription(project.description ?? "");
    }
  }, [project]);

  if (dbProjects === undefined || dbMembers === undefined || dbVentures === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-sm text-muted-foreground">
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center border rounded-xl bg-card mt-12">
        <h2 className="text-xl font-bold mb-2">Project not found</h2>
        <p className="text-sm text-muted-foreground mb-6">The project with ID "{id}" does not exist in the database.</p>
        <Button onClick={() => navigate("/projects")} className="bg-indigo-600 text-white hover:bg-indigo-500">
          Back to Projects List
        </Button>
      </div>
    );
  }

  // Update helper
  const handleUpdateField = async (fields: any) => {
    try {
      await updateProject({
        projectId: project.id,
        ...fields,
        clerkAdminBypass: isClerkAdmin
      });
    } catch (err) {
      console.error("Failed to update project field:", err);
    }
  };

  // Input Blurs
  const handleNameBlur = () => {
    if (name.trim() && name !== project.name) {
      handleUpdateField({ name: name.trim() });
    }
  };

  const handleContentBlur = () => {
    if (content.trim() !== (project.content ?? "")) {
      handleUpdateField({ content: content.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    if (description !== (project.description ?? "")) {
      handleUpdateField({ description: description.trim() });
    }
  };

  // Upload Document handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    setUploadError("");
    try {
      const uploadUrl = await generateUploadUrl({ clerkAdminBypass: isClerkAdmin });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!result.ok) throw new Error("Upload request failed.");
      const { storageId } = await result.json();

      await addProjectStorageDocument({
        projectId: project.id,
        title: file.name,
        storageId,
        clerkAdminBypass: isClerkAdmin
      });
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add Link Resource handler
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docUrl.trim()) {
      setDocError("Both title and URL are required.");
      return;
    }
    let formattedUrl = docUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const currentDocs = project.documents || [];
    const updatedDocs = [...currentDocs, { title: docTitle.trim(), url: formattedUrl }];

    try {
      await handleUpdateField({ documents: updatedDocs });
      setDocTitle("");
      setDocUrl("");
      setIsAddingDoc(false);
      setDocError("");
    } catch (err: any) {
      setDocError(err?.message || "Failed to add document.");
    }
  };

  const handleDeleteDocument = async (indexToDelete: number) => {
    const currentDocs = project.documents || [];
    const updatedDocs = currentDocs.filter((_, idx) => idx !== indexToDelete);
    await handleUpdateField({ documents: updatedDocs });
  };

  // Properties helpers
  const priorityVal = mapDbPriority(project.priority);
  const currentVenture = dbVentures?.find((v) => v._id === project.ventureId);

  const renderPropertiesSidebar = (isMobile: boolean) => {
    const sidebarContent = (
      <div className="flex flex-col gap-4">
        {/* 1. Status Dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Status</span>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={!isAdmin}>
              <button disabled={!isAdmin} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200 min-w-[100px] justify-between`}>
                <span className="flex items-center gap-1.5 capitalize">
                  {getStatusIcon(project.state, "size-3.5")}
                  {project.state || "planned"}
                </span>
                <ChevronDown className="size-3 opacity-60 ml-1.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 z-50">
              {["backlog", "planned", "In-progress", "completed", "canceled"].map((st) => (
                <DropdownMenuItem
                  key={st}
                  onClick={() => handleUpdateField({ state: st })}
                  className="flex items-center gap-2 cursor-pointer capitalize text-xs"
                >
                  {getStatusIcon(st, "size-3.5")}
                  {st}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 2. Priority Dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Priority</span>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={!isAdmin}>
              <button disabled={!isAdmin} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200 min-w-[100px] justify-between`}>
                <span className="flex items-center gap-1.5">
                  {priorityConfig[priorityVal]?.icon}
                  {priorityConfig[priorityVal]?.label}
                </span>
                <ChevronDown className="size-3 opacity-60 ml-1.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 z-50">
             {(Object.keys(priorityConfig) as Priority[]).map((pr) => (
  <DropdownMenuItem
    key={pr}
    onClick={() => handleUpdateField({ priority: mapPriorityToNumber(pr) })}
    className={cn("flex items-center gap-2 cursor-pointer text-xs group/pri", pr === "urgent" && "hover:[&_svg]:text-red-500")}
  >
    {priorityConfig[pr].icon}
    {priorityConfig[pr].label}
  </DropdownMenuItem>
))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 3. Lead Dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Lead</span>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={!isAdmin}>
              <button disabled={!isAdmin} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200 min-w-[100px] justify-between`}>
                {project.lead ? (
                  <span className="flex items-center gap-1.5 truncate max-w-[100px]">
                    <AvatarPlaceholder name={project.lead.name} size={16} />
                    <span className="truncate">{project.lead.name}</span>
                  </span>
                ) : (
                  <span className="text-zinc-400">No lead</span>
                )}
                <ChevronDown className="size-3 opacity-60 ml-1.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-50 max-h-60 overflow-y-auto">
              <DropdownMenuItem onClick={() => handleUpdateField({ lead: null })} className="cursor-pointer text-xs text-muted-foreground">
                No Lead
              </DropdownMenuItem>
              {dbMembers?.map((m) => (
                <DropdownMenuItem
                  key={m._id}
                  onClick={() => handleUpdateField({ lead: { name: m.name, email: m.email } })}
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <AvatarPlaceholder name={m.name} size={18} />
                  <span className="truncate">{m.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 4. Members Dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Members</span>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={!isAdmin}>
              <button disabled={!isAdmin} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200 min-w-[100px] justify-between`}>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 opacity-60" />
                  <span>
                    {project.members && project.members.length > 0
                      ? `${project.members.length} assign...`
                      : "No members"}
                  </span>
                </span>
                <ChevronDown className="size-3 opacity-60 ml-1.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 z-50 max-h-60 overflow-y-auto">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase border-b border-border/40 select-none mb-1">
                Assign Members
              </div>
              {dbMembers?.map((m) => {
                const isAssigned = (project.members || []).some((sm) => sm.email === m.email);
                return (
                  <DropdownMenuItem
                    key={m._id}
                    onClick={(e) => {
                      e.preventDefault();
                      const updatedMembers = isAssigned
                        ? (project.members || []).filter((sm) => sm.email !== m.email)
                        : [...(project.members || []), { name: m.name, email: m.email }];
                      handleUpdateField({ members: updatedMembers });
                    }}
                    className="flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <AvatarPlaceholder name={m.name} size={18} />
                      <span className="truncate">{m.name}</span>
                    </div>
                    {isAssigned && <Check className="size-3.5 text-indigo-500 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 6. Combined Dates Picker */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Dates</span>
          <div className="flex items-center gap-1.5">
            {/* Start Date Button */}
            <DropdownMenu>
              <DropdownMenuTrigger disabled={!isAdmin}>
                <button disabled={!isAdmin} className={`flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200`} title="Start date">
                  <CalendarIcon className="size-3 opacity-60 mr-1" />
                  <span>
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : "Start"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-1 bg-popover border border-border shadow-lg rounded-lg z-50 w-[92vw] sm:w-auto">
                <CalendarComponent
                  mode="single"
                  selected={project.startDate ? new Date(project.startDate) : undefined}
                  onSelect={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : "";
                    const updatedTarget = project.targetDate && date && new Date(project.targetDate) <= date ? "" : project.targetDate;
                    handleUpdateField({ startDate: dateStr || null, targetDate: updatedTarget || null });
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-zinc-400 font-normal">&rarr;</span>

            {/* End Date Button */}
            <DropdownMenu>
              <DropdownMenuTrigger disabled={!isAdmin}>
                <button disabled={!isAdmin} className={`flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200`} title="End date">
                  <CalendarX2 className="size-3 opacity-60 mr-1" />
                  <span>
                    {project.targetDate
                      ? new Date(project.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : "End"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-1 bg-popover border border-border shadow-lg rounded-lg z-50 w-[92vw] sm:w-auto">
                <CalendarComponent
                  mode="single"
                  selected={project.targetDate ? new Date(project.targetDate) : undefined}
                  onSelect={(date) => {
                    handleUpdateField({ targetDate: date ? date.toISOString().split('T')[0] : null });
                  }}
                  disabled={(date) => {
                    if (!project.startDate) return false;
                    const start = new Date(project.startDate);
                    start.setHours(0,0,0,0);
                    const current = new Date(date);
                    current.setHours(0,0,0,0);
                    return current <= start;
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 5. Venture Dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Venture</span>
          <DropdownMenu>
            <DropdownMenuTrigger disabled={!isAdmin}>
              <button disabled={!isAdmin} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 ${isAdmin ? 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40' : 'opacity-70 cursor-not-allowed'} font-medium transition-colors text-zinc-800 dark:text-zinc-200 min-w-[100px] justify-between`}>
                <span className="truncate max-w-[90px]">
                  {currentVenture?.name || "No initiative"}
                </span>
                <ChevronDown className="size-3 opacity-60 ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 z-50 max-h-56 overflow-y-auto">
              <DropdownMenuItem onClick={() => handleUpdateField({ ventureId: null })} className="cursor-pointer text-xs text-muted-foreground">
                No initiative
              </DropdownMenuItem>
              {dbVentures?.map((v) => (
                <DropdownMenuItem key={v._id} onClick={() => handleUpdateField({ ventureId: v._id })} className="cursor-pointer text-xs">
                  {v.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 6. Tags Row */}
       {/* 6. Tags Row */}
<div className="flex flex-col gap-2 text-xs">
  <div className="flex items-center justify-between">
    <span className="text-zinc-500 dark:text-zinc-400 font-semibold">Tags</span>
    {isAdmin && (
      <button
        onClick={() => {
          const tag = prompt("Enter tag name:");
          if (!tag?.trim()) return;
          const colors = [
            "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
            "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
            "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
            "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
            "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
            "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
            "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
            "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
          ];
          // deterministic color based on tag text
          const colorClass = colors[
            tag.trim().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
          ];
          const currentTags = project.tags || [];
          handleUpdateField({ tags: [...currentTags, { label: tag.trim(), color: colorClass }] });
        }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium transition-colors"
      >
        <PlusCircle className="h-3 w-3" />
        Add tag
      </button>
    )}
  </div>
  {(project.tags || []).length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {(project.tags || []).map((tag: any, idx: number) => (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tag.color}`}
        >
          {tag.label}
          {isAdmin && (
            <button
              onClick={() => {
                const updated = (project.tags || []).filter((_: any, i: number) => i !== idx);
                handleUpdateField({ tags: updated });
              }}
              className="hover:opacity-70 transition-opacity ml-0.5"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  )}
</div>
      </div>
    );

    if (isMobile) {
      return sidebarContent;
    }

    return (
      <div className="flex flex-col gap-5 border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/40 dark:bg-[#18181b]/20 p-5 rounded-xl shadow-sm">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800/40">
          <h3 className="text-xs font-bold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
            Properties
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        {sidebarContent}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full px-5 py-4 max-w-[1400px] mx-auto text-zinc-800 dark:text-zinc-100">
      
      {/* ─── Breadcrumbs ─── */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => navigate("/projects")}
            className="hover:text-zinc-800 dark:hover:text-zinc-350 transition-colors font-medium"
          >
            Projects
          </button>
          <span>&gt;</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
            {project.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Properties toggle */}
          <button
            onClick={() => setIsMobilePropsOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
            <span>Properties</span>
          </button>
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Projects list</span>
          </button>
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-sm font-medium mb-6">
        {[
          { id: "overview", label: "Overview", icon: <ListTodo className="h-3.5 w-3.5" /> },
          { id: "activity", label: "Activity", icon: <ActivityIcon className="h-3.5 w-3.5" /> },
          { id: "issues", label: `Issues (${dbIssues?.length ?? 0})`, icon: <Flag className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-2.5 px-1 flex items-center gap-1.5 relative transition-colors",
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Main Content Layout ─── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* ─── Left Column (Editor & Details) ─── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Title Block */}
            <div className="flex items-start gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              {/* Emoji Trigger */}
              <div className="size-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer shrink-0 transition-colors relative">
                <DropdownMenu open={showEmojiPicker} onOpenChange={(open) => { if (isAdmin) setShowEmojiPicker(open); }}>
                  <DropdownMenuTrigger disabled={!isAdmin}>
                    <button disabled={!isAdmin} className={`h-10 w-10 flex items-center justify-center text-xl outline-none border-none bg-transparent ${!isAdmin && 'opacity-70 cursor-not-allowed'}`}>
                      {project.iconEmoji && project.iconEmoji.trim() !== "" ? project.iconEmoji : "📁"}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-0 border-0 bg-transparent shadow-none z-50" align="start" style={{ width: 300 }}>
                    <div className="shadow-2xl border rounded-lg overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                      <div className="p-2 flex flex-wrap gap-1 bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800">
                        {QUICK_EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            className={cn(
                              "h-8 w-8 text-lg flex items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors",
                              project.iconEmoji === e ? "bg-zinc-200 dark:bg-zinc-700" : ""
                            )}
                            onClick={() => {
                              handleUpdateField({ iconEmoji: e });
                              setShowEmojiPicker(false);
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                      <EmojiPicker
                        onEmojiClick={(d) => {
                          handleUpdateField({ iconEmoji: d.emoji });
                          setShowEmojiPicker(false);
                        }}
                        theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                        lazyLoadEmojis
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                        width={300}
                        height={320}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title & Summary Editing */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  disabled={!isAdmin}
                  placeholder="Project name"
                  className="w-full bg-transparent text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-none outline-none focus:ring-0 p-0 disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onBlur={handleContentBlur}
                  disabled={!isAdmin}
                  placeholder="Add a short summary or project subtitle..."
                  className="w-full bg-transparent text-xs text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-none outline-none focus:ring-0 p-0 mt-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Horizontal Properties Summary Row */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs py-2 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-400 dark:text-zinc-500">Properties</span>
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {getStatusIcon(project.state, "size-3.5")}
                  <span className="capitalize">{project.state || "planned"}</span>
                </div>

                {/* Priority Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {priorityConfig[priorityVal]?.icon}
                  <span>{priorityConfig[priorityVal]?.label}</span>
                </div>

                {/* Lead Badge */}
                {project.lead ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <AvatarPlaceholder name={project.lead.name} size={14} />
                    <span>{project.lead.name}</span>
                  </div>
                ) : null}

                {/* Members Avatars */}
                {project.members && project.members.length > 0 ? (
                  <div className="flex items-center -space-x-1.5">
                    {project.members.map((m, idx) => (
                      <div key={idx} title={m.name}>
                        <AvatarPlaceholder name={m.name} size={16} />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Dates Badge */}
                {(project.startDate || project.targetDate) ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <CalendarIcon className="size-3" />
                    <span>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Start"}
                      {" -> "}
                      {project.targetDate ? new Date(project.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Target"}
                    </span>
                  </div>
                ) : null}

                {/* Venture/Initiative Badge */}
                {currentVenture ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">V</span>
                    <span>{currentVenture.name}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Resources / Notepad Upload Support */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Resources</span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger disabled={!isAdmin}>
                    <button disabled={!isAdmin} className={`flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors border-none bg-transparent outline-none ${isAdmin ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}>
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Add document or link...</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 z-50">
                    <DropdownMenuItem onClick={() => setIsAddingDoc(true)} className="cursor-pointer text-xs">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Add link URL
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-xs">
                      <Paperclip className="h-3.5 w-3.5 mr-2" />
                      Upload local document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {isUploading && <span className="text-xs text-muted-foreground animate-pulse">Uploading file...</span>}
                {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}
              </div>

              {isAddingDoc && (
                <form onSubmit={handleAddDocument} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-4 flex flex-col gap-3.5 animate-in fade-in duration-200 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Link Title</label>
                      <input
                        type="text"
                        required
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g., Design Specs, Project Wiki"
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">URL / Link</label>
                      <input
                        type="text"
                        required
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="e.g., google.com or https://..."
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 placeholder-zinc-400 dark:placeholder-zinc-600"
                      />
                    </div>
                  </div>
                  {docError && (
                    <p className="text-[11px] text-red-500 font-medium">{docError}</p>
                  )}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingDoc(false);
                        setDocTitle("");
                        setDocUrl("");
                        setDocError("");
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-300 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#5e6ad2] hover:bg-[#4d59c2] text-white font-medium px-3.5 py-1.5 rounded text-xs transition-colors shadow-sm"
                    >
                      Add Link
                    </button>
                  </div>
                </form>
              )}

              {/* Display resources in a nice grid or vertical list */}
              <div className="flex flex-col gap-2 mt-1">
                {(project.documents || []).map((doc, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/10 dark:bg-gray-900/5 px-3.5 py-2 hover:bg-zinc-100/40 dark:hover:bg-gray-800/10 transition-colors"
                  >
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#5e6ad2] dark:text-[#7e8cf2] hover:underline font-medium min-w-0"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                      <span className="truncate">{doc.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteDocument(idx)}
                        className="text-zinc-400 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150"
                        title="Remove resource"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Description Section */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Description</h3>
              <div className="relative group/desc">
                {isEditingDescription ? (
                  <textarea
                    autoFocus
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    placeholder="Write a detailed project brief, goals, outline or collect design ideas here..."
                    rows={8}
                    className="w-full bg-white dark:bg-gray-950 border border-indigo-500/30 dark:border-indigo-400/30 rounded-xl p-3.5 text-sm text-zinc-900 dark:text-gray-200 outline-none shadow-sm focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans resize-y leading-relaxed"
                  />
                ) : (
                  <div
                    onClick={() => isAdmin && setIsEditingDescription(true)}
                    className={`min-h-[140px] rounded-xl border border-zinc-200/80 dark:border-gray-800/50 bg-zinc-50/20 dark:bg-gray-900/5 p-4 text-sm hover:border-zinc-300 dark:hover:border-gray-800 transition-colors duration-200 leading-relaxed font-sans ${isAdmin ? 'cursor-pointer' : ''}`}
                  >
                    {description ? (
                      <p className="text-zinc-800 dark:text-gray-300 whitespace-pre-wrap">{description}</p>
                    ) : (
                      <span className="text-zinc-400 dark:text-gray-600 italic font-medium">Add description or write project brief...</span>
                    )}
                  </div>
                )}
                {!isEditingDescription && (
                  <span className="absolute right-3.5 top-3.5 text-[10px] text-zinc-400 dark:text-gray-600 opacity-0 group-hover/desc:opacity-100 transition-opacity select-none font-medium pointer-events-none">
                    Click to edit
                  </span>
                )}
              </div>
            </div>



          </div>

          {/* ─── Right Column (Sidebar Properties) ─── */}
          <div className="hidden lg:col-span-1 lg:flex flex-col gap-6">
            {renderPropertiesSidebar(false)}
          </div>

        </div>
      )}

      {/* Mobile Properties Sheet Drawer */}
      <Sheet open={isMobilePropsOpen} onOpenChange={setIsMobilePropsOpen}>
        <SheetContent side="right" className="p-6 bg-background text-foreground overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 w-[85vw] sm:max-w-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-5">
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Properties
            </h3>
          </div>
          {renderPropertiesSidebar(true)}
        </SheetContent>
      </Sheet>

      {/* ─── Activity Tab Content ─── */}
      {activeTab === "activity" && (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 dark:bg-gray-900/5 rounded-xl p-8 text-center text-sm text-zinc-500 dark:text-zinc-600 max-w-2xl mx-auto mt-4">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full bg-[#5e6ad2]/10 flex items-center justify-center text-[#5e6ad2]">
              <ActivityIcon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-zinc-700 dark:text-zinc-400">Activity History</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-sm">No activity logged for this project yet. Action history and sync updates will appear here in chronological order.</p>
          </div>
        </div>
      )}

      {/* ─── Issues Tab Content ─── */}
      {activeTab === "issues" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-gray-200">
              Project Issues ({dbIssues?.length ?? 0})
            </h3>
          </div>

          {!dbIssues || dbIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl py-12 text-sm text-zinc-500 dark:text-zinc-600 bg-zinc-50/10 dark:bg-gray-900/5">
              <div className="flex flex-col items-center gap-2">
                <Flag className="h-8 w-8 text-zinc-400 opacity-60" />
                <span className="font-semibold">No issues matched with this project</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Any issues created inside or mapped to this project will be listed here.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-gray-500">
                    <th className="py-2.5 px-4 text-left">Issue ID</th>
                    <th className="py-2.5 px-4 text-left">Title</th>
                    <th className="py-2.5 px-4 text-left">Status</th>
                    <th className="py-2.5 px-4 text-left">Priority</th>
                    <th className="py-2.5 px-4 text-left">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {dbIssues.map((issue) => {
                    const issuePriority = issue.priority === 1 ? "urgent" : issue.priority === 2 ? "high" : issue.priority === 3 ? "medium" : issue.priority === 4 ? "low" : "No-priority";
                    return (
                      <tr key={issue.id} className="border-b border-zinc-200/50 dark:border-zinc-800/60 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-xs font-mono font-medium text-zinc-600 dark:text-gray-400">{issue.id.slice(-6).toUpperCase()}</td>
                        <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-gray-200">{issue.title}</td>
                        <td className="py-2.5 px-4 text-xs">
                          <span className="capitalize px-2 py-0.5 rounded border border-zinc-200 dark:border-gray-800 bg-zinc-50/50 dark:bg-gray-950/40 text-zinc-500">
                            {issue.state?.name || "Backlog"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="flex items-center gap-1 text-xs">
                            {priorityConfig[issuePriority]?.icon}
                            <span className="capitalize text-zinc-500">{priorityConfig[issuePriority]?.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs">
                          {issue.assignee ? (
                            <span className="flex items-center gap-1.5 text-zinc-700 dark:text-gray-300">
                              <AvatarPlaceholder name={issue.assignee.name} size={16} />
                              <span>{issue.assignee.name}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
