import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const updateOwner = mutation({
  args: {
    ventureId: v.id("ventures"),
    ownerId: v.union(v.id("members"), v.null()),
    clerkAdminBypass: v.optional(v.boolean()),
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
   

    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) {
      throw new Error("Your account is not active.");
    }
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (caller.role !== "Admin" && !isClerkAdmin) {
      throw new Error("Only admins can modify ventures.");
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
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");
    if (caller.role !== "Admin" && !isClerkAdmin) {
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

export const updateStatus = mutation({
  args: {
    ventureId: v.id("ventures"),
    status: v.union(
      v.literal("active"),
      v.literal("planned"),
      v.literal("completed")
    ),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) {
      throw new Error("Your account is not active.");
    }
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (caller.role !== "Admin" && !isClerkAdmin) {
      throw new Error("Only admins can modify ventures.");
    }

    await ctx.db.patch(args.ventureId, { status: args.status });
  },
});

export const updateTargetDeadline = mutation({
  args: {
    ventureId: v.id("ventures"),
    targetDeadline: v.optional(v.string()),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) {
      throw new Error("Your account is not active.");
    }
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (caller.role !== "Admin" && !isClerkAdmin) {
      throw new Error("Only admins can modify ventures.");
    }

    if (args.targetDeadline === undefined) {
      const venture = await ctx.db.get(args.ventureId);
      if (venture) {
        const { targetDeadline, ...rest } = venture;
        await ctx.db.replace(args.ventureId, rest);
      }
    } else {
      await ctx.db.patch(args.ventureId, { targetDeadline: args.targetDeadline });
    }
  },
});

export const updateDescription = mutation({
  args: {
    ventureId: v.id("ventures"),
    description: v.optional(v.string()),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (caller.role !== "Admin" && !isClerkAdmin) throw new Error("Only admins can modify ventures.");

    await ctx.db.patch(args.ventureId, { description: args.description });
  },
});

export const updateDocuments = mutation({
  args: {
    ventureId: v.id("ventures"),
    documents: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
      })
    ),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (caller.role !== "Admin" && !isClerkAdmin) throw new Error("Only admins can modify ventures.");

    await ctx.db.patch(args.ventureId, { documents: args.documents });
  },
});

export const generateUploadUrl = mutation({
  args: {
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");

    return await ctx.storage.generateUploadUrl();
  },
});

export const addStorageDocument = mutation({
  args: {
    ventureId: v.id("ventures"),
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
    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) throw new Error("Your account is not active.");
    if (caller.role !== "Admin" && !isClerkAdmin) throw new Error("Only admins can modify ventures.");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("File not found in storage");

    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");

    const currentDocs = venture.documents || [];
    const updatedDocs = [...currentDocs, { title: args.title, url }];

    await ctx.db.patch(args.ventureId, { documents: updatedDocs });
  },
});

export const updateVentureFields = mutation({
  args: {
    ventureId: v.id("ventures"),
    name: v.optional(v.string()),
    summary: v.optional(v.union(v.null(), v.string())),
    description: v.optional(v.union(v.null(), v.string())),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("planned"),
        v.literal("completed")
      )
    ),
    ownerId: v.optional(v.union(v.null(), v.id("members"))),
    targetDeadline: v.optional(v.union(v.null(), v.string())),
    clerkAdminBypass: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!caller) throw new Error("You are not a member of this workspace.");
    const isClerkAdmin = args.clerkAdminBypass || (identity as any).role === "admin" || (identity as any).role === "Admin" || (identity as any).org_role === "org:admin" || (identity as any).org_role === "admin";
    if (caller.status !== "active" && !isClerkAdmin) {
      throw new Error("Your account is not active.");
    }
    const venture = await ctx.db.get(args.ventureId);
    if (!venture) throw new Error("Venture not found");
    if (caller.role !== "Admin" && !isClerkAdmin) {
      throw new Error("Only admins can modify ventures.");
    }

    const patchData: any = {};
    if (args.name !== undefined) patchData.name = args.name;
    if (args.summary !== undefined) patchData.summary = args.summary ?? undefined;
    if (args.description !== undefined) patchData.description = args.description ?? undefined;
    if (args.status !== undefined) patchData.status = args.status;
    if (args.ownerId !== undefined) patchData.ownerId = args.ownerId;
    if (args.targetDeadline !== undefined) patchData.targetDeadline = args.targetDeadline ?? undefined;

    await ctx.db.patch(args.ventureId, patchData);
  },
});