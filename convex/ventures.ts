import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const updateOwner = mutation({
  args: {
    ventureId: v.id("ventures"),
    ownerId: v.union(v.id("members"), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 1. Verify the caller is an active workspace member
    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
   

    // 2. Verify the caller is an Admin
    if (caller.role !== "Admin") {
      throw new Error("Only admins can assign venture owners.");
    }

    // 3. If an ownerId was provided, verify that person is also an active workspace member
    if (args.ownerId !== null) {
      const targetMember = await ctx.db.get(args.ownerId);
      if (!targetMember) throw new Error("The selected owner is not a workspace member.");
      if (targetMember.status !== "active") throw new Error("The selected owner's account is not active.");
    }

    await ctx.db.patch(args.ventureId, { ownerId: args.ownerId });
  },
});

export const createVenture = mutation({
  args: {
    name: v.string(),
    summary: v.optional(v.string()),
    targetDeadline: v.optional(v.string()),
    ownerId: v.union(v.id("members"), v.null()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("planned"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    if (caller.role !== "Admin") {
      throw new Error("Only admins can create ventures.");
    }

    const status = args.status ?? "planned";

    const ventureId = await ctx.db.insert("ventures", {
      name: args.name,
      projects: 0,
      ownerId: args.ownerId,
      status,
      summary: args.summary,
      targetDeadline: args.targetDeadline,
    });

    return ventureId;
  },
});

export const listVentures = query({
  handler: async (ctx) => {
    return await ctx.db.query("ventures").collect();
  },
});