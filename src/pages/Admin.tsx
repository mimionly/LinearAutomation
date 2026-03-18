import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { ShieldAlert, Users, FolderKanban, Check } from "lucide-react";

type Project = { id: string; name: string; state: string };
type DBUser = { _id: import("../../convex/_generated/dataModel").Id<"users">; clerkId: string; name?: string; email?: string; role: string; assignedProjects: string[] };

export default function Admin() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getCurrentUser, { clerkId: user?.id });
  const users = useQuery(api.users.getAllUsers, user ? { clerkId: user.id } : "skip");
  const getProjects = useAction(api.linear.getProjects);
  const updateProjects = useMutation(api.users.updateUserProjects);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUser, setSelectedUser] = useState<DBUser | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && dbUser?.role === "admin") {
      getProjects({ clerkId: user.id }).then((res) => {
        setProjects(res);
      });
    }
  }, [user, dbUser, getProjects]);

  if (dbUser === undefined) return <div className="p-10">Loading...</div>;
  if (dbUser?.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-zinc-400">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const toggleProject = (targetUserId: import("../../convex/_generated/dataModel").Id<"users">, projectId: string, currentProjects: string[]) => {
    if (saving) return;
    setSaving(true);
    const hasProject = currentProjects.includes(projectId);
    const newProjects = hasProject
      ? currentProjects.filter((id) => id !== projectId)
      : [...currentProjects, projectId];

    updateProjects({
      callerClerkId: user!.id,
      targetUserId: targetUserId,
      projectIds: newProjects,
    }).finally(() => {
      setSaving(false);
    });
  };

  return (
    <div className="p-10 w-full max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Manage user access and assign Linear projects to developers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 bg-zinc-900/30 glass-panel p-6">
          <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <Users className="h-5 w-5 text-indigo-400" />
            <h2 className="font-semibold text-lg text-white">Team Members</h2>
          </div>

          <div className="space-y-6">
            {users?.map((u) => (
              <button
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${selectedUser?._id === u._id
                  ? " "
                  : ""
                  } border`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{u.name || "Unknown"}</div>
                    <div className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/40 uppercase tracking-widest text-zinc-300">{u.role}</div>
                  </div>
                  <div className="text-xs opacity-60 font-mono mt-1">{u.email || u.clerkId.slice(0, 10)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-zinc-900/30  glass-panel p-6 flex flex-col">
          <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <FolderKanban className="h-5 w-5 text-purple-400" />
            <h2 className="font-semibold text-lg text-white">Linear Projects Assignment</h2>
          </div>

          {!selectedUser ? (
            <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
              Select a team member to manage their assignments.
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-6 bg-black/20 p-4 ">
                <p className="text-sm text-zinc-400 mb-1">Assigning projects for</p>
                <div className="text-xl font-bold text-white flex items-center gap-3">
                  {selectedUser.name}
                  <span className="text-xs px-2 py-0.5  bg-indigo-500/20 text-indigo-300">{selectedUser.role}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
                {projects.map((proj) => {
                  // Find the user object fresh from query since local state might be stale
                  const currentUserState = users?.find((u) => u._id === selectedUser._id);
                  const isAssigned = currentUserState?.assignedProjects?.includes(proj.id);

                  return (
                    <button
                      key={proj.id}
                      disabled={saving}
                      onClick={() => toggleProject(selectedUser._id, proj.id, currentUserState?.assignedProjects || [])}
                      className={`relative flex items-center gap-4 overflow-hidden  border p-4 text-left transition-all ${isAssigned
                        ? "border-green-500/30 bg-green-500/10 text-white"
                        : "border-white/5 hover:border-white/10 bg-zinc-950/50 text-zinc-300"
                        } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center  border transition-all ${isAssigned ? "border-green-400 bg-green-400 text-black" : "border-zinc-600 bg-transparent text-transparent"
                        }`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">{proj.name}</div>
                        <div className="text-xs uppercase tracking-wider opacity-60">{proj.state}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
