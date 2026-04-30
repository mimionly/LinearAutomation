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

  userLogs: defineTable({
    action: v.string(),
    clerkId: v.string(),
    user: v.optional(v.union(v.literal("admin"), v.literal("developer"))),
  }).index("by_clerkId", ["clerkId"]),
  assignments: defineTable({
    clerkId: v.string(),
    projectId: v.string(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_projectId", ["projectId"]),
});
