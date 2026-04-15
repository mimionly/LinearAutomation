import { query, mutation,  internalAction, } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

interface LinearProject {
  id: string;
  name: string;
  description: string;
  state: { id: string; name: string; type: string };
  createdAt: number;
  updatedAt: number;
}

interface LinearIssue {
  id: string;
  title: string;
  identifier: string;
  description?: string;
  priority?: string;
  state: { name: string; type?: string };
  assignee?: { name: string; email: string } | null;
  createdAt: number;
  updatedAt: number;
}

const getHeaders = () => {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY is not configured");
  return {
    "Content-Type": "application/json",
    Authorization: apiKey,
  };
};

const linearFetch = async (query: string, headers: Record<string, string>) => {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });
  if (!res.ok)
    throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (data.errors)
    throw new Error(`Linear GraphQL error: ${JSON.stringify(data.errors)}`);
  return data.data;
};

export const upsertProjects = mutation({
  args: {
    projects: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        state: v.object({ id: v.string(), name: v.string(), type: v.string() }),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const project of args.projects) {
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_linear_id", (q) => q.eq("linearId", project.id))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: project.name,
          description: project.description,
          updatedAt: Date.now(),
          state : project.state,
        });
      } else {
        await ctx.db.insert("projects", {
          linearId: project.id,
          name: project.name,
          description: project.description,
          state: project.state,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const upsertIssues = mutation({
  args: {
    issues: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        identifier: v.string(),
        description: v.optional(v.string()),
        priority: v.optional(v.string()),
        state: v.object({
          name: v.string(),
          type: v.optional(v.string()),
        }),
        assignee: v.optional(
          v.object({
            name: v.string(),
            email: v.string(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const task of args.issues) {
      const existing = await ctx.db
        .query("issues")
        .withIndex("by_linear_id", (q) => q.eq("linearId", task.id))
        .first();

      const payload = {
        title: task.title,
        identifier: task.identifier,
        state: task.state,
        assignee: task.assignee ?? undefined,
        updatedAt: Date.now(),
        description: task.description ?? "",
        priority: task.priority ?? "",
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("issues", {
          linearId: task.id,
          ...payload,
          createdAt: Date.now(), // only set on insert
        });
      }
    }
  },
});
// Admin assigns projects to a developer
export const assignProjectsToDev = mutation({
  args: {
    adminClerkId: v.string(),
    targetClerkId: v.string(),
    projectIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .first();
    if (!admin || admin.role !== "admin")
      throw new Error("Unauthorized: Admin access required");

    // Find target developer
    const target = await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (!target) throw new Error("Target developer not found");

    await ctx.db.patch(target._id, {
      assignedProjects: args.projectIds,
    });

    return { success: true, assignedCount: args.projectIds.length };
  },
});

// Admin: get all projects from Convex DB
export const getAllProjects = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const developer = await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!developer || developer.role !== "admin")
      throw new Error("Unauthorized: Admin access required");
    return await ctx.db.query("projects").collect();
  },
});

// Developer: get only their assigned projects from Convex DB
export const getMyProjects = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const developer = await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!developer) throw new Error("developer not found");
    const assignedIds = developer.assignedProjects ?? [];
    if (assignedIds.length === 0) return [];

    const all = await ctx.db.query("projects").collect();
    return all.filter((p) => assignedIds.includes(p.linearId));
  },
});

// Developer: get issues for their assigned projects (read-only dashboard)
export const getMyIssues = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const developer = await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!developer) throw new Error("developer not found");

    const assignedIds = developer.assignedProjects ?? [];
    if (assignedIds.length === 0) return [];

    // Get all issues belonging to assigned projects
    const all = await ctx.db.query("issues").collect();
    return all.filter(
      (t) => t.assignee?.email ===developer.email
    );
  },
});

// Admin: get all developers (for project assignment UI)
export const getAllDevelopers = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!admin || admin.role !== "admin")
      throw new Error("Unauthorized: Admin access required");
    return await ctx.db.query("developer").collect();
  },
});

export const getDeveloperByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("developer")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// syncLinearData stays as action, but uses ctx.runQuery instead of ctx.db
export const syncLinearData = internalAction({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const developer = await ctx.runQuery(api.linear.getDeveloperByClerkId, {
      clerkId: args.clerkId,
    });
    if (!developer || developer.role !== "admin")
      throw new Error("Unauthorized: Admin access required");

    const headers = getHeaders();
    const errors: string[] = [];
    let syncedProjects: LinearProject[] = [];
    let syncedIssues: LinearIssue[] = [];

    // Fetch projects + issues in parallel
    const [projData, IssueData] = await Promise.allSettled([
      linearFetch(
        `query {
      projects {
        nodes {
            id
            name
            description
            state{
            id 
            name
            type
            }
            createdAt
            updatedAt
        }
    }}`,
        headers,
      ),
      linearFetch(
        `query {
        issues {
        nodes {
            id
            identifier
            title
            description
            priority
            state {
                name
                type
            }
            assignee {
                name
                email
            }
            createdAt
            updatedAt
        }
    }
}
`,
        headers,
      ),
    ]);

    if (projData.status === "fulfilled") {
      syncedProjects = projData.value.projects.nodes;
    } else {
      errors.push(`Projects fetch failed: ${projData.reason}`);
    }

    if (IssueData.status === "fulfilled") {
      syncedIssues = IssueData.value.issues.nodes;
    } else {
      errors.push(`Issues fetch failed: ${IssueData.reason}`);
    }

    // Write to Convex DB
    if (syncedProjects.length > 0) {
      await ctx.runMutation(api.linear.upsertProjects, {
        projects: syncedProjects,
      });
    }
    if (syncedIssues.length > 0) {
      await ctx.runMutation(api.linear.upsertIssues, {
        issues: syncedIssues.map((t) => ({
          ...t,
          assignee: t.assignee ?? undefined, // handle null case
          description: t.description ?? undefined,
          priority: t.priority ?? undefined,
        })),
      });
    }

    return {
      success: errors.length === 0,
      syncedProjectCount: syncedProjects.length,
      syncedIssueCount: syncedIssues.length,
      errors,
    };
  },
});

export const logUserAction = mutation({
  args: {
    clerkId: v.string(),
    action: v.union(v.literal("login"), v.literal("logout")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("userLogs", {
      clerkId: args.clerkId,
      action: args.action,
      timestamp: Date.now(),
    });
  },
});
