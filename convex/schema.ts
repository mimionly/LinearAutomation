import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Linear sync ───────────────────────────────────────────────────────────
  linearProjects: defineTable({
    id:          v.string(),
    // Optional emoji for project icon
    iconEmoji:   v.optional(v.string()),
    name:        v.string(),
    state:       v.string(),
    startDate:   v.optional(v.string()),
    targetDate:  v.optional(v.string()),
    description: v.optional(v.string()),
    priority:    v.optional(v.number()),
    createdAt:   v.optional(v.string()),
    health:      v.optional(v.string()),
    progress:    v.optional(v.number()),
    content:     v.optional(v.string()),
    badgeStatus: v.optional(
      v.union(
        v.literal("backlog"),
        v.literal("planned"),
   
        v.literal("completed"),
        v.literal("canceled"),
      ),
    ),
    lead: v.optional(
      v.union(
        v.null(),
        v.object({ name: v.string(), email: v.string() }),
      ),
    ),
    ventureId: v.optional(v.string()),
    members: v.optional(
      v.array(
        v.object({ name: v.string(), email: v.string() })
      )
    ),
    documents: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
        })
      )
    ),
  }).index("by_linearId", ["id"]),

  linearIssues: defineTable({
    id:       v.string(),
    title:    v.string(),
    priority: v.optional(v.number()),
    state:    v.object({ name: v.string() }),
    createdAt: v.optional(v.string()),
    project: v.union(
      v.null(),
      v.object({ id: v.string(), name: v.string() }),
    ),
    assignee: v.union(
      v.null(),
      v.object({ email: v.string(), id: v.string(), name: v.string() }),
    ),
  })
    .index("by_linearId", ["id"])
    .index("by_projectId", ["project.id"]),

  // ── Auth audit ────────────────────────────────────────────────────────────
  userActions: defineTable({
    clerkId: v.string(),
    action:  v.string(),
  }).index("by_clerkId", ["clerkId"]),

  // ── Workspace members ─────────────────────────────────────────────────────
  members: defineTable({
    name:        v.string(),
    handle:      v.string(),
    email:       v.string(),
    avatarUrl:   v.optional(v.string()),
    role:        v.union(v.literal("Admin"), v.literal("User")),
    status:      v.union(v.literal("active"), v.literal("suspended")),
    // FIX: joinedAt is written as string in acceptInvite — must not be optional
    joinedAt:    v.string(),
    // FIX: clerkUserId is always written as a string in acceptInvite,
    // keeping v.union(v.string(), v.null()) so existing null rows stay valid
    clerkUserId: v.union(v.string(), v.null()),
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_email",    ["email"])
    .index("by_status",   ["status"]),

  // ── Teams ─────────────────────────────────────────────────────────────────
  teams: defineTable({
    name:        v.string(),
    identifier:  v.string(),
    iconEmoji:   v.string(),
    iconColor:   v.string(),
    description: v.optional(v.string()),
    createdAt:   v.string(),
  })
    .index("by_name", ["name"])
    .index("by_identifier", ["identifier"]),

  memberTeams: defineTable({
    memberId: v.id("members"),
    teamId:   v.id("teams"),
  })
    .index("by_member", ["memberId"])
    .index("by_team",   ["teamId"]),

  // ── Invites ───────────────────────────────────────────────────────────────
 // convex/schema.ts — in your invites table definition
  invites: defineTable({
    createdAt: v.string(),
    email: v.string(),
    expiresAt: v.string(),
    invitedBy: v.id("members"),
    role: v.union(v.literal("Admin"), v.literal("User")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("revoked")),
    teamName: v.optional(v.string()),   // keep for old rows
    teamIds: v.optional(v.array(v.id("teams"))),  // add this
    token: v.string(),
  })
      .index("by_email",  ["email"])
      .index("by_token",  ["token"])
      .index("by_status", ["status"]),

  ventures: defineTable({
    name: v.string(),
    projects: v.number(),
    ownerId: v.union(v.id("members"), v.null()),
    status: v.union(
      v.literal("active"),    
      v.literal("planned"),
      v.literal("completed")
    ),
    summary: v.optional(v.string()),
    targetDeadline: v.optional(v.string()),
    description: v.optional(v.string()),
    documents: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
        })
      )
    ),
  }),

  appDocuments: defineTable({
    title: v.string(),
    content: v.string(),
    ventureId: v.id("ventures"),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_venture", ["ventureId"]),
});