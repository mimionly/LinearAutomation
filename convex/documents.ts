import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createDocument = mutation({
  args: {
    ventureId: v.id("ventures"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();
    
    const docId = await ctx.db.insert("appDocuments", {
      ventureId: args.ventureId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });

    return docId;
  },
});

export const getDocument = query({
  args: {
    id: v.id("appDocuments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    return await ctx.db.get(args.id);
  },
});

export const updateDocument = mutation({
  args: {
    id: v.id("appDocuments"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const listVentureDocuments = query({
  args: {
    ventureId: v.id("ventures"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return [];
    }
    
    return await ctx.db
      .query("appDocuments")
      .withIndex("by_venture", (q) => q.eq("ventureId", args.ventureId))
      .order("desc")
      .collect();
  },
});

export const deleteDocument = mutation({
  args: {
    id: v.id("appDocuments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});
