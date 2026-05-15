import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  linearProjects: defineTable({
    id: v.string(),
    name: v.string(),
    state: v.string(),
    startDate: v.optional(v.string()),
    targetDate: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.number()),
    createdAt: v.optional(v.string()),
    health: v.optional(v.string()),
    progress: v.optional(v.number()),
    content: v.optional(v.string()),
    badgeStatus: v.optional(v.union(
      v.literal("backlog"),
      v.literal("planned"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("canceled"),
    )),
    lead: v.optional(v.union(
      v.null(),
      v.object({
        name: v.string(),
        email: v.string(),
      })
    )),
  })
    .index("by_linearId", ["id"]),

  linearIssues: defineTable({
    id: v.string(),
    title: v.string(),
    priority: v.optional(v.number()),
    state: v.object({
      name: v.string(),
    }),
    createdAt: v.optional(v.string()),
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

  userActions: defineTable({
    clerkId: v.string(),
    action: v.string(),
  }).index("by_clerkId", ["clerkId"]),
});
