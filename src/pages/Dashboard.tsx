import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Circle, CircleDashed, CheckCircle2,
  MoreHorizontal, LayoutGrid, Search,
  Filter, AlertCircle, Eye
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Task = { id: string; title: string; identifier: string; state: { name: string; color?: string }; project: { id: string; name: string } };

export default function Dashboard() {
  const { user } = useUser();
  const getTasks = useAction(api.linear.getAssignedTasks);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    if (user) {
      getTasks({ clerkId: user.id })
        .then((res) => setTasks(res))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user, getTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.identifier.toLowerCase().includes(searchQuery.toLowerCase());
      const stateGroup = task.state?.name.toLowerCase();
      let matchesFilter = true;
      if (activeFilter === "Active") matchesFilter = stateGroup?.includes("progress") || false;
      if (activeFilter === "Todo") matchesFilter = stateGroup?.includes("todo") || stateGroup?.includes("backlog") || false;
      if (activeFilter === "Done") matchesFilter = stateGroup?.includes("done") || stateGroup?.includes("completed") || false;

      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchQuery, activeFilter]);

  const getStateDetails = (stateName: string) => {
    const text = (stateName || '').toLowerCase();
    if (text.includes("done") || text.includes("completed") || text.includes("canceled")) {
      return { icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    }
    if (text.includes("progress") || text.includes("review")) {
      return { icon: <CircleDashed className="h-4 w-4 animate-spin-slow" />, bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
    }
    return { icon: <Circle className="h-4 w-4" />, bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-10 w-full">
        <div className="mb-10 space-y-4 animate-pulse">
          <div className="h-10 w-64 bg-zinc-800/50 rounded-lg"></div>
          <div className="h-5 w-96 bg-zinc-800/30 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-zinc-900/30 border border-white/5 animate-pulse glass-panel p-5">
              <div className="h-4 w-24 bg-zinc-800/50 rounded-md mb-6"></div>
              <div className="h-6 w-full bg-zinc-800/50 rounded-md mb-2"></div>
              <div className="h-6 w-3/4 bg-zinc-800/50 rounded-md mb-8"></div>
              <div className="flex justify-between items-center mt-auto">
                <div className="h-6 w-28 bg-zinc-800/50 rounded-full"></div>
                <div className="h-4 w-16 bg-zinc-800/50 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-20 text-center">
        <div className="mb-6 rounded-3xl bg-red-500/10 p-6 border border-red-500/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.25)]">
          <AlertCircle className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Sync Interrupted</h2>
        <p className="text-zinc-400 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Board overview</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold backdrop-blur-md">
              <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Read Only</span>
            </div>
          </div>
          <p className="text-zinc-400 mb-0 lg:max-w-xl">
            A read-only perspective of your active tasks.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/10 rounded-xl p-1 w-full sm:w-auto overflow-x-auto custom-scrollbar">
            {["All", "Todo", "Active", "Done"].map((v) => (
              <button
                key={v}
                onClick={() => setActiveFilter(v)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                  activeFilter === v
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center text-zinc-400">
          <div className="mb-6 rounded-full bg-zinc-900/80 border border-white/5 p-8 glass-panel shadow-2xl">
            <LayoutGrid className="h-10 w-10 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-200">No tasks assigned</h2>
          <p className="mt-2 text-sm max-w-sm">You are not currently assigned to any active tasks across your permitted projects. Enjoy your day!</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 lg:py-32 text-center">
          <Filter className="h-10 w-10 text-zinc-600 mb-4" />
          <h2 className="text-xl font-medium text-white">No tasks match your filters</h2>
          <button
            onClick={() => { setSearchQuery(""); setActiveFilter("All"); }}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTasks.map((task) => {
            const stateTheme = getStateDetails(task.state?.name);
            return (
              <div
                key={task.id}
                className="group flex flex-col relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] hover:bg-zinc-900/60 glass-panel"
              >
                {/* Subtle top glow effect */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs font-semibold text-zinc-400 border border-white/5 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-colors">
                    {task.project.name}
                  </span>
                  <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/10 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mb-6 text-base font-semibold leading-relaxed text-zinc-100 line-clamp-3 group-hover:text-white transition-colors">
                  {task.title}
                </h3>

                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium", stateTheme.bg, stateTheme.text, stateTheme.border)}>
                    {stateTheme.icon}
                    {task.state?.name}
                  </div>
                  <span className="text-xs font-mono font-medium tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                    {task.identifier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
