import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ProjectContextType {
  projects: any[] | undefined;
  createProject: (project: any) => Promise<any>;
  updateProject: (project: any) => Promise<any>;
}

const ProjectsContext = React.createContext<ProjectContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const dbProjects = useQuery(api.linear.fetchProjects);
  const mutateProjects = useMutation(api.linear.upsertProjects);

  const createProject = React.useCallback(async (projectData: any) => {
    return await mutateProjects({
      projects: [projectData]
    });
  }, [mutateProjects]);

  const updateProject = React.useCallback(async (projectData: any) => {
    return await mutateProjects({
      projects: [projectData]
    });
  }, [mutateProjects]);

  return (
    <ProjectsContext.Provider value={{ projects: dbProjects, createProject, updateProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = React.useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
