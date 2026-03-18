import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
      });
      return existingUser._id;
    } else {
      // First user becomes admin? Or everyone is user by default? 
      // Let's say we check if any user exists, if not, they are admin.
      const allUsers = await ctx.db.query("users").first();
      const role = allUsers ? "user" : "admin";

      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        role: role,
        assignedProjects: [],
      });
    }
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.clerkId) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId as string))
      .first();
  },
});

export const getAllUsers = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await ctx.db.query("users").collect();
  },
});

export const updateUserProjects = mutation({
  args: {
    callerClerkId: v.string(),
    targetUserId: v.id("users"),
    projectIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.callerClerkId))
      .first();
    
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.targetUserId, {
      assignedProjects: args.projectIds,
    });
  },
});
