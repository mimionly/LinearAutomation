import { rawProjects, rawIssues } from "@/data/mock-data"

/** Returns static mock project data (same shape as the old Convex query). */
export function useProjects() {
  return rawProjects
}

/** Returns static mock issue data (same shape as the old Convex query). */
export function useIssues() {
  return rawIssues
}
