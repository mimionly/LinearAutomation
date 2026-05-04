import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  linearProjects: defineTable({
    id: v.string(),
    name: v.string(),
    state: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_linearId", ["id"])
    .index("by_state", ["state"]),
  linearIssues: defineTable({
    id: v.string(),
    title: v.string(),
    priority: v.optional(v.number()),
    state: v.object({
      name: v.string(),
    }),
    project: v.union(
      v.null(),
      v.object({
        id: v.string(),
        name: v.string(),
      }),
    ),
    assignee: v.union(
      v.null(),
      v.object({
        email: v.string(),
        id: v.string(),
        name: v.string(),
      }),
    ),
  })
    .index("by_linearId", ["id"])
    .index("by_projectId", ["project.id"]),
});
