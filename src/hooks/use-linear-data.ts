import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/** Returns database project data using Convex query. */
export function useProjects() {
  return useQuery(api.linear.fetchProjects);
}

/** Returns database issue data using Convex query. */
export function useIssues() {
  return useQuery(api.linear.fetchIssues);
}
