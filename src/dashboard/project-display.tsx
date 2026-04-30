import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Badge } from "../components/ui/badge";
export function ProjectDisplay() {
  const { user } = useUser();

  // Fetch projects from Convex  when the user ID is loaded
  const linearProjects = useQuery(
    api.linear.getProjects,
    user ? { id: user.id } : "skip",
  );
  if (linearProjects === undefined) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {linearProjects.map((project) => (
        <div
          key={project._id}
          className="rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all duration-200 p-6 flex flex-col"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg tracking-tight">
              {project.name}
            </h3>
            {project.state && (
              <Badge
                variant={
                  project.state === "Active"
                    ? "default"
                    : project.state === "Completed"
                      ? "secondary"
                      : project.state === "Blocked"
                        ? "destructive"
                        : "outline"
                }
              >
                {project.state}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
