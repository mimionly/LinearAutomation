import { internalMutation, query, mutation } from "./_generated/server";
import { v } from "convex/values";
export interface LinearProject {
  name: string;
  id: string;
  state: string, 
  
  description : string | null ;
}
export interface Users {
  clerkId : string , 
  action : string ;
  user : "admin" | "developer"
}


export const getHeaders = () => {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY is not configured");
  return {
    "Content-Type": "application/json",
    Authorization: apiKey,
  };
};
export const linearFetch = async (
  query: string,
  headers: Record<string, string>,
) => {
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

export const upsertProjects = internalMutation({
args: {
    projects: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        state: v.string(),
        description : v.optional(v.string()) ,
      }),
    ),
  },

  handler: async (ctx, args) => {
   await Promise.all(
    args.projects.map(async(project) =>{
      const existing = await ctx.db
        .query("linearProjects")
        .withIndex("by_linearId", (q) => q.eq("id", project.id))
        .first();

      if (existing) {
        //update :  modify the existing record with new data
        await ctx.db.patch(existing._id, {
        name: project.name,
        state: project.state,
        description : project.description, 
        
        });
      } else {
        //insert : if not existing then create a new record in the database
        await ctx.db.insert("linearProjects", {
            id: project.id,       
            name: project.name,   
            state: project.state,
            description: project.description ,
             
            
            
        }
      )};
    })
  )}
})

export const getProjectforUser = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    //fething projects from convex dashboard table database
    return await ctx.db
      .query("linearProjects")
      .withIndex("by_linearId", (q) => q.eq("id", args.id))
      .first();
  },
});

export const assignProjectToUser = mutation ({
  args :{
    clerkId : v.string(),
    projectId : v.string(),
  },
  handler : async(ctx , args ) =>{
    const existing = await ctx.db
        .query("assignments")
        .withIndex("by_clerkId" , (q) => 
        q.eq("clerkId" , args.clerkId))
          .filter((q) =>
            q.eq(q.field("projectId") , args.projectId))
          .first();
          if(!existing){
            await ctx.db.insert("assignments" , {
              clerkId:args.clerkId,
              projectId: args.projectId
            });
          }
      },
    });

export const logUserAction = mutation({
  args: {
    clerkId : v.string() , 
    action: v.string(),
    user: v.optional(v.union(v.literal("admin"), v.literal("developer"))),
  },
  handler: async (ctx, args) => {
    // Log to a "logs" table or perform tracking
    await ctx.db.insert("userLogs", {
    action: args.action,
    clerkId : args.clerkId,
    user : args.user,
    });
  },
});


