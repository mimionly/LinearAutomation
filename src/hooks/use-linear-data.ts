import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api"

export function useProjects() {
  return useQuery(api.linear.fetchProjects);
}

export function useIssues() {
  return useQuery(api.linear.fetchIssues);
}