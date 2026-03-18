import { useAction } from "convex/react";//
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Circle, CircleDashed, CheckCircle2, MoreHorizontal } from "lucide-react";

type Task = { id: string; title: string; identifier: string; state: { name: string; color?: string }; project: { id: string; name: string } };

export default function Dashboard() {
  const { user } = useUser();
  const getTasks = useAction(api.linear.getAssignedTasks);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      getTasks({ clerkId: user.id })//
        .then((res) => setTasks(res))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user, getTasks]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-500">
        <h2 className="text-xl font-bold mb-2">Error loading tasks</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-20 text-center text-zinc-400">
        <div className="mb-6 rounded-full bg-zinc-900/50 p-6 glass-panel">
          <CheckCircle2 className="h-12 w-12 text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-200">No active tasks</h2>
        <p className="mt-2 text-sm">You are not assigned to any active projects right now. Enjoy your day!</p>
      </div>
    );
  }

  const getStateIcon = (stateName: string) => {
    const text = stateName.toLowerCase();
    if (text.includes("done") || text.includes("completed")) return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    if (text.includes("progress")) return <CircleDashed className="h-4 w-4 text-amber-400 animate-spin-slow" />;
    return <Circle className="h-4 w-4 text-zinc-400" />;
  };

  return (
    <div className="p-10 w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Your Work</h1>
        <p className="text-zinc-400">View your assigned Linear tasks across all projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900/30 p-5 transition-all hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 glass-panel">
            <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <button className="text-zinc-400 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 flex items-center justify-between mt-2">
              <span className="text-xs font-semibold tracking-wider text-indigo-400">{task.project.name}</span>
            </div>
            <h3 className="mb-6 text-lg font-medium leading-snug text-zinc-100">{task.title}</h3>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2">
                {getStateIcon(task.state?.name || '')}
                <span className="text-sm font-medium text-zinc-300">{task.state?.name}</span>
              </div>
              <span className="text-xs font-mono tracking-widest text-zinc-500">{task.identifier}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
