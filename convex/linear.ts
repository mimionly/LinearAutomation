import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

interface LinearProject { id: string; name: string; state: string }
interface LinearTask { id: string; title: string; identifier: string; state: { name: string; color?: string }; project: { id: string; name: string } }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

const getLinearHeaders = () => {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.warn("LINEAR_API_KEY environment variable not set. Using mock data.");
    return null;
  }
  return {
    Authorization: apiKey,
    "Content-Type": "application/json",
  };
};

export const getProjects = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<LinearProject[]> => {
    // Only admin can get all projects?
    const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId: args.clerkId });
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const headers = getLinearHeaders();
    if (!headers) {
      // Return mock data
      return [
        { id: "proj_1", name: "Devvoid Website Rewrite", state: "active" },
        { id: "proj_2", name: "Linear Automation Dashboard", state: "active" },
        { id: "proj_3", name: "Mobile App V2", state: "planned" },
      ];
    }

    const query = `
      query {
        projects {
          nodes {
            id
            name
            state
          }
        }
      }
    `;

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Linear API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data.projects.nodes;
  },
});

export const getAssignedTasks = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<LinearTask[]> => {
    const user = await ctx.runQuery(api.users.getCurrentUser, { clerkId: args.clerkId });
    if (!user) {
      throw new Error("Unauthorized");
    }

    const assignedProjectIds = user.assignedProjects || [];

    const headers = getLinearHeaders();
    if (!headers) {
      // Mock tasks for assigned projects
      if (assignedProjectIds.length === 0) return [];
      
      const mockTasks = [
        { id: "task_1", title: "Build project list UI", identifier: "LAD-12", state: { name: "In Progress" }, project: { id: "proj_2", name: "Linear Automation Dashboard" } },
        { id: "task_2", title: "Setup Clerk Auth", identifier: "LAD-13", state: { name: "Done" }, project: { id: "proj_2", name: "Linear Automation Dashboard" } },
        { id: "task_3", title: "Deploy to production", identifier: "DEV-45", state: { name: "Todo" }, project: { id: "proj_1", name: "Devvoid Website Rewrite" } },
      ];
      
      return mockTasks.filter(t => assignedProjectIds.includes(t.project.id));
    }

    if (assignedProjectIds.length === 0) return [];

    // linear API max limits or filtering might be needed
    // Assuming a simple query to fetch tasks for the assigned projects
    const query = `
      query {
        issues(filter: { project: { id: { in: ${JSON.stringify(assignedProjectIds)} } } }) {
          nodes {
            id
            title
            identifier
            state {
              name
              color
            }
            project {
              id
              name
            }
          }
        }
      }
    `;

    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Linear API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data.issues.nodes;
  },
});
