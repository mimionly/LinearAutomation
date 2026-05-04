import { internalMutation, internalAction , query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
export interface LinearProject {
  name: string;
  id: string;
  state: string;
  description: string | null;
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


export const getProjects = internalAction({
  handler: async () => {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: process.env.LINEAR_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            projects {
              nodes {
                id
                name
                description
                state
              }
            }
          }
        `,
      }),
    });

    const data = await res.json();
    return data.data.projects.nodes;
  },
});
export const getIssues = internalAction({
  handler: async () => {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: process.env.LINEAR_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
        query { issues { nodes { id title state { name } priority project { id name } assignee { id name email } } } }`,
      }),
    });
    const data = await res.json();
    return data.data.issues.nodes;
  },
});

export const upsertIssues = internalMutation({
  args: {
    issues: v.array(
      v.object({
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
        description: v.optional(v.string()),
      }),
    ),
  },

  handler: async (ctx, args) => {
    for (const project of args.projects) {
      const existing = await ctx.db
        .query("linearProjects")
        .withIndex("by_linearId", (q) => q.eq("id", project.id))
        .first();

      if (existing) {
        //update :  modify the existing record with new data
        await ctx.db.patch(existing._id, {
          name: project.name,
          state: project.state,
          description: project.description,
        });
      } else {
        //insert : if not existing then create a new record in the database
        await ctx.db.insert("linearProjects", {
          id: project.id,
          name: project.name,
          state: project.state,
          description: project.description,
        });
      }
    }
  },
});
export const syncProjects = internalAction({
  handler: async (ctx) => {
    const projects = await ctx.runAction(internal.linear.getProjects);
    await ctx.runMutation(internal.linear.upsertProjects, { projects });
  },
});
export const syncIssues = internalAction({
  handler: async (ctx) => {
    const issues = await ctx.runAction(internal.linear.getIssues);
    await ctx.runMutation(internal.linear.upsertIssues, { issues });
  },
});

export const fetchProjects = query({
  args:{
    id : v.string(),
    name : v.string(),
    state: v.string(),
    description :v.optional(v.string()),
  },
  handler: async(ctx )=>{
    const projects = await ctx.db.query("linearProjects").collect();
    return projects;
  }
  },
);
export const fetchIssues = query({
  args:{
      id : v.string(), 
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
  },
  handler: async(ctx )=>{
    const issues = await ctx.db.query("linearIssues").collect();
    return issues;
  }
})