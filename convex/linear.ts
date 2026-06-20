import { internalMutation, query, mutation } from "./_generated/server"
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
export const upsertProjects = mutation({
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
        health: v.optional(v.union(v.null(), v.string())),     // null when not set in Linear
        progress: v.optional(v.union(v.null(), v.number())),   // null when no issues tracked
        content: v.optional(v.string()),
        // optional emoji for project icon
        iconEmoji: v.optional(v.union(v.null(), v.string())),
        // optional + nullable: absent when not set, null when explicitly cleared
        lead: v.optional(v.union(v.null(), v.object({
          name: v.string(),
          email: v.string(),
        }))),
        ventureId: v.optional(v.string()),
        startDate: v.optional(v.union(v.null(), v.string())),
        targetDate: v.optional(v.union(v.null(), v.string())),
        members: v.optional(
          v.array(
            v.object({ name: v.string(), email: v.string() })
          )
        ),
        documents: v.optional(
          v.array(
            v.object({ title: v.string(), url: v.string() })
          )
        ),
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
      const startDate = project.startDate ?? undefined;
      const targetDate = project.targetDate ?? undefined;
      const iconEmoji = project.iconEmoji ?? undefined;
      const members = project.members ?? undefined;
      const documents = project.documents ?? undefined;

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
            iconEmoji,
          lead: project.lead ?? undefined,
          ventureId: project.ventureId,
          startDate,
          targetDate,
          members,
          documents,
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
            iconEmoji,
          lead: project.lead ?? undefined,
          ventureId: project.ventureId,
          startDate,
          targetDate,
          members,
          documents,
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

const LINEAR_TO_BADGE_STATUS: Record<string, "backlog" | "planned" |"completed" | "canceled"> = {
  "backlog": "backlog",
  "planned": "planned",

  "completed": "completed",
  "canceled": "canceled",
};
function mapLinearStatus(LinearState: string): "backlog" | "planned" | "completed" | "canceled" {
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

export const updateProjectFields = mutation({
  args: {
    projectId: v.string(),
    name: v.optional(v.string()),
    state: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.null(), v.number())),
    progress: v.optional(v.number()),
    content: v.optional(v.string()),
    iconEmoji: v.optional(v.union(v.null(), v.string())),
    lead: v.optional(v.union(v.null(), v.object({ name: v.string(), email: v.string() }))),
    ventureId: v.optional(v.union(v.null(), v.string())),
    startDate: v.optional(v.union(v.null(), v.string())),
    targetDate: v.optional(v.union(v.null(), v.string())),
    members: v.optional(v.array(v.object({ name: v.string(), email: v.string() }))),
    documents: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
      
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    
    if (!caller && !isClerkAdmin) throw new Error("You are not a member of this workspace.");
    if (caller && caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");

    const existing = await ctx.db
      .query("linearProjects")
      .withIndex("by_linearId", (q) => q.eq("id", args.projectId))
      .first();
    if (!existing) throw new Error("Project not found");

    const patchData: any = {};
    if (args.name !== undefined) patchData.name = args.name;
    if (args.state !== undefined) {
      patchData.state = args.state;
      patchData.badgeStatus = mapLinearStatus(args.state);
    }
    if (args.description !== undefined) patchData.description = args.description;
    if (args.priority !== undefined) patchData.priority = args.priority;
    if (args.progress !== undefined) patchData.progress = args.progress;
    if (args.content !== undefined) patchData.content = args.content;
    if (args.iconEmoji !== undefined) patchData.iconEmoji = args.iconEmoji;
    if (args.lead !== undefined) patchData.lead = args.lead;
    if (args.ventureId !== undefined) patchData.ventureId = args.ventureId ?? undefined;
    if (args.startDate !== undefined) patchData.startDate = args.startDate ?? undefined;
    if (args.targetDate !== undefined) patchData.targetDate = args.targetDate ?? undefined;
    if (args.members !== undefined) patchData.members = args.members;
    if (args.documents !== undefined) patchData.documents = args.documents;

    await ctx.db.patch(existing._id, patchData);
  }
});

export const addProjectStorageDocument = mutation({
  args: {
    projectId: v.string(),
    title: v.string(),
    storageId: v.string(),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
      
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";

    if (!caller && !isClerkAdmin) throw new Error("You are not a member of this workspace.");
    if (caller && caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("File not found in storage");

    const existing = await ctx.db
      .query("linearProjects")
      .withIndex("by_linearId", (q) => q.eq("id", args.projectId))
      .first();
    if (!existing) throw new Error("Project not found");

    const currentDocs = existing.documents || [];
    const updatedDocs = [...currentDocs, { title: args.title, url }];

    await ctx.db.patch(existing._id, { documents: updatedDocs });
  },
});