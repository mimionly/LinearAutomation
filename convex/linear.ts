import { internalMutation, query, mutation } from "./_generated/server";
import { v } from "convex/values";
export interface LinearProject {
  name: string;
  id: string;
  state: string;
  description: string | null;
  priority: number | null;
  health : string | null;
  progress : number | null;
  createdAt: string;
  content: string | null;
  lead:{
    name: string;
    email: string;
  }
}
export interface LinearIssue {
  id: string;
  title: string;
  priority: number | null;
  state: {
    name: string;
  };
  project: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
}



export const upsertIssues = internalMutation({
  args: {
    issues: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        priority: v.optional(v.float64()),
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
      }),
    ),
  },

  handler: async (ctx, args) => {
    for (const issues of args.issues) {
      const existing = await ctx.db
        .query("linearIssues")
        .withIndex("by_linearId", (q) => q.eq("id", issues.id))
        .first();

      if (existing) {
        //update :  modify the existing record with new data
        await ctx.db.patch(existing._id, {
          title: issues.title,
          priority: issues.priority,
          state: issues.state,
          createdAt: issues.createdAt,
          project: issues.project,
          assignee: issues.assignee,
        });
      } else {
        //insert : if not existing then create a new record in the databaselinearAutomation/convex/linear.ts
        await ctx.db.insert("linearIssues", {
          id: issues.id,
          title: issues.title,
          priority: issues.priority,
          state: issues.state,
          createdAt: issues.createdAt,
          project: issues.project,
          assignee: issues.assignee,
        });
      }
    }
  },
});
export const upsertProjects = internalMutation({
  args: {
    projects: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        state: v.string(),
        createdAt: v.optional(v.string()),
        description: v.optional(v.string()),
        // Accept null from the Linear API (projects with no priority set return null)
        priority: v.union(v.null(), v.number()),
        health: v.union(v.null(), v.string()),     // null when not set in Linear
        progress: v.union(v.null(), v.number()),   // null when no issues tracked
        content: v.optional(v.string()),
        // optional + nullable: absent when not set, null when explicitly cleared
        lead: v.optional(v.union(v.null(), v.object({
          name: v.string(),
          email: v.string(),
        }))),
      }),
    ),
  },

  handler: async (ctx, args) => {
    for (const project of args.projects) {
      const existing = await ctx.db
        .query("linearProjects")
        .withIndex("by_linearId", (q) => q.eq("id", project.id))
        .first();

      const badgeStatus = mapLinearStatus(project.state);
      const priority = project.priority ?? undefined;
      const health   = project.health   ?? undefined;
      const progress = project.progress ?? undefined;

      if (existing) {
        //update :  modify the existing record with new data
        await ctx.db.patch(existing._id, {
          name: project.name,
          state: project.state,
          priority,
          createdAt: project.createdAt,
          description: project.description,
          badgeStatus,
          health,
          progress,
          content: project.content,
          lead: project.lead ?? undefined,
        });
      } else {
        //insert : if not existing then create a new record in the database
        await ctx.db.insert("linearProjects", {
          id: project.id,
          name: project.name,
          state: project.state,
          priority,
          createdAt: project.createdAt,
          description: project.description,
          badgeStatus,
          health,
          progress,
          content: project.content,
          lead: project.lead ?? undefined,
        });
      }
    }
  },
});





export const fetchProjects = query({
  
  handler: async (ctx) => {
    const projects = await ctx.db.query("linearProjects").collect();
    return projects;
  }
},
);
export const fetchIssues = query({
  
  handler: async (ctx) => {
    const issues = await ctx.db.query("linearIssues").collect();
    return issues;
  }
})
export const fetchIssuesByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const issues = await ctx.db
      .query("linearIssues")
      .withIndex("by_projectId", (q) => q.eq("project.id", args.projectId))
      .collect();
    return issues;
  },
});
export const fetchCounts = query({
  args: {}, //fetches the count for projects and issues 
  handler: async (ctx) => {
    const projects = await ctx.db.query("linearProjects").collect();
    const issues = await ctx.db.query("linearIssues").collect();
    return {
      totalProjects: projects.length,
      totalIssues: issues.length,
    };
  },
});

const LINEAR_TO_BADGE_STATUS: Record<string, "backlog" | "planned" | "in-progress" | "completed" | "canceled"> = {
  "backlog": "backlog",
  "planned": "planned",
  "in-progress": "in-progress",
  "completed": "completed",
  "canceled": "canceled",
};
function mapLinearStatus(LinearState: string): "backlog" | "planned" | "in-progress" | "completed" | "canceled" {
  return LINEAR_TO_BADGE_STATUS[LinearState.toLowerCase()] ?? "backlog";
}

export const logUserAction = mutation({
  args: {
    clerkId: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("userActions", {
      clerkId: args.clerkId,
      action: args.action,
    });
  },
});