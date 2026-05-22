import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Queries ────────────────────────────────────────────────────────────────

export const listMembers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return[];

   
    return ctx.db.query("members").collect();
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const addMembers = mutation({
  args: {
    emails:    v.array(v.string()),
    avatarUrl: v.optional(v.string()),
    role:      v.union(v.literal("Admin"), v.literal("User")),
    teams:     v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return[];

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (caller?.role !== "Admin") throw new Error("Only admins can invite members.");

    if (args.emails.length === 0) throw new Error("At least one email is required.");

    const results: { email: string; status: "invited" | "skipped" | "invalid" }[] = [];

    for (const raw of args.emails) {
      const email = raw.trim().toLowerCase();

      if (!email) continue;

      if (!isValidEmail(email)) {
        results.push({ email, status: "invalid" });
        continue;
      }

      const existing = await ctx.db
        .query("members")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (existing) {
        results.push({ email, status: "skipped" });
        continue;
      }

      const localPart = email.split("@")[0];
      const name      = localPart.replace(/[._-]+/g, " ");
      const handle    = `@${localPart.replace(/[._-]+/g, "")}`;

      await ctx.db.insert("members", {
        name,
        handle,
        email,
        // avatarUrl is a placeholder — overwritten by the Clerk webhook on sign-up
        avatarUrl:   args.avatarUrl,
        role:        args.role,
        teams:       args.teams,
        clerkUserId: null,
      });

      results.push({ email, status: "invited" });
    }

    return results;
  },
});

export const removeMembers = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return[];

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
    if (caller?.role !== "Admin") throw new Error("Only admins can remove members.");

    await ctx.db.delete(args.id);
  },
});