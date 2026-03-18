import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    assignedProjects: v.array(v.string()), // Linear project IDs
  }).index("by_clerkId", ["clerkId"]),
  
});
