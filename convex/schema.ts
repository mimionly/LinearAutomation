import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  developer: defineTable({
    clerkId : v.string(), 
    name : v.string() , 
    email: v.string() , 
    role : v.union( v.literal("admin") , v.literal("developer")),
    assignedProjects : v.optional(v.array(v.string())),
    avatarUrl : v.optional(v.string()),
    createdAt: v.optional(v.number()), 
  }).index("by_clerk_id" , ['clerkId']),

  projects : defineTable({ // linear projects  Table 
    linearId : v.string() , 
    name : v.string() , 
    description :v.string(),
    state: v.object({
      id : v.string(), 
      name : v.string() ,
      type : v.string(), 
    }),
    createdAt : v.number() ,
    updatedAt: v.number(),  
  }).index("by_linear_id" , ['linearId']),

  issues : defineTable ({ // <-- linear Taskks table 
    linearId : v.string() , 
    title : v.string() , 
    identifier : v.string() , 
    description : v.string() ,
    priority : v.string() ,
    state : v.object({
      name : v.string() , 
      type  : v.optional(v.string()),
    }),
    assignee: v.optional(v.object({
      name: v.string(),
      email: v.string() , 
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_linear_id", ["linearId"]),
  
  userLogs: defineTable({
    clerkId: v.string(),
    action: v.union(v.literal("login"), v.literal("logout")),
    timestamp: v.number(),
  }).index("by_clerk_id", ["clerkId"]),
});
