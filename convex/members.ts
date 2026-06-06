import { internalMutation, internalQuery, query, action, mutation } from "./_generated/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
const INVITE_EXPIRY_DAYS = 7

// ── INVITE FLOW ──
export const sendInviteEmails = action({
  args: {
    emails:  v.array(v.string()),
    role: v.union(v.literal("Admin"), v.literal("User")),
    teamName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated.")

    const caller = await ctx.runQuery(internal.members.getCallerByClerkIdInternal, {
      clerkUserId: identity.subject,
    })
    if (!caller) throw new Error("You are not a workspace member.")
    if (caller.role !== "Admin") throw new Error("Only admins can invite members.")

    const results = await ctx.runMutation(internal.members.addMembers, {
      ...args,
      invitedBy: caller._id,
    })

    const redirectUrl = `${process.env.APP_URL}/accept-invite`

    for (const r of results.filter((r) => r.status === "invited")) {
      const response = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address:   r.email,
          redirect_url:    redirectUrl,
          public_metadata: { role: args.role, teamName: args.teamName },
          notify:          true,
          ignore_existing: true,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        console.error(`Clerk invite failed for ${r.email}:`, err)
      }
    }

    return results
  },
})
// Step 1: Insert pzending invite rows (internal — called from sendInviteEmails action)
export const addMembers = internalMutation({
  args: {
    emails:    v.array(v.string()),
    role: v.union(v.literal("Admin"), v.literal("User")),
    teamName:   v.optional(v.string()),
    invitedBy: v.id("members"),
  },
  handler: async (ctx, args) => {
    const results: { email: string; status: "invited" | "skipped" | "invalid" }[] = []

    for (const raw of args.emails) {
      const email = raw.trim().toLowerCase()
      if (!email) continue

      if (!isValidEmail(email)) {
        results.push({ email, status: "invalid" })
        continue
      }

      const existingMember = await ctx.db
        .query("members")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first()
      if (existingMember) {
        results.push({ email, status: "skipped" })
        continue
      }

      const existingInvite = await ctx.db
        .query("invites")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first()
      if (existingInvite?.status === "pending") {
        results.push({ email, status: "skipped" })
        continue
      }

      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

      await ctx.db.insert("invites", {
        email,
        role:      args.role,
        teamName:   args.teamName,
        token:     crypto.randomUUID(),
        status:    "pending",
        invitedBy: args.invitedBy,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      })

      results.push({ email, status: "invited" })
    


  results.push({ email, status: "invited" })
    }

    return results
  },
})

// Internal query used by sendInviteEmails to look up the caller without re-reading auth
export const getCallerByClerkIdInternal = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()
  },
})

// Step 2: Admin triggers invite emails — validates caller, inserts rows, fires Clerk emails


// Step 3: User clicks invite link → signs in → this mutation creates their member row
export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Must be signed in to accept an invite.")

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()

    if (!invite) throw new Error("Invite not found.")
    if (invite.status !== "pending") throw new Error("This invite has already been used or expired.")
    if (new Date(invite.expiresAt) < new Date()) {
      await ctx.db.patch(invite._id, { status: "expired" })
      throw new Error("This invite link has expired.")
    }
    if (invite.email !== identity.email) throw new Error("This invite is for a different email.")

    // If they already have a member row (e.g. re-clicking the link), just mark accepted
    const existing = await ctx.db
      .query("members")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()
    if (existing) {
      await ctx.db.patch(invite._id, { status: "accepted" })
      return { memberId: existing._id }
    }

    // Name and email come directly from Clerk — user can edit profile later
    const memberId = await ctx.db.insert("members", {
      name:        identity.name ?? identity.email!,
      handle:      `@${identity.email!.split("@")[0].replace(/[._-]+/g, "")}`,
      email:       identity.email!,
      avatarUrl:   identity.pictureUrl ?? undefined,
      role:        invite.role,
      status:      "active",
      clerkUserId: identity.subject,
      joinedAt:    new Date().toISOString(),
    })

    if (invite.teamName) {
      const team = await ctx.db
        .query("teams")
        .withIndex("by_name", (q) => q.eq("name", invite.teamName!))
        .first()
      if (team) {
        await ctx.db.insert("memberTeams", { memberId, teamId: team._id })
      }
    }

    await ctx.db.patch(invite._id, { status: "accepted" })

    return { memberId }
  },
})

// ── BOOTSTRAP ──────────────────────────────────────────────────────────────

// One-time: creates the first Admin when no members exist yet.
// Remove <BootstrapAdmin /> from the UI once you've run this.
export const bootstrapFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated.")

    const anyMember = await ctx.db.query("members").first()
    if (anyMember) throw new Error("Workspace already has members. Use invites.")

    const memberId = await ctx.db.insert("members", {
      name:        identity.name ?? identity.email!,
      handle:      `@${identity.email!.split("@")[0].replace(/[._-]+/g, "")}`,
      email:       identity.email!,
      avatarUrl:   identity.pictureUrl ?? undefined,
      role:        "Admin",
      status:      "active",
      clerkUserId: identity.subject,
      joinedAt:    new Date().toISOString(),
    })

    return { memberId }
  },
})

// ── MEMBER MANAGEMENT ──────────────────────────────────────────────────────

export const removeMembers = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated.")

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()
    if (caller?.role !== "Admin") throw new Error("Only admins can remove members.")

    // Clean up team memberships first
    const memberTeams = await ctx.db
      .query("memberTeams")
      .withIndex("by_member", (q) => q.eq("memberId", args.id))
      .collect()
    for (const mt of memberTeams) {
      await ctx.db.delete(mt._id)
    }

    await ctx.db.delete(args.id)
  },
})

export const createTeam = mutation({
  args: {
    name:        v.string(),
    identifier:  v.string(),
    iconEmoji:   v.string(),
    iconColor:   v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated.")

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()
    if (caller?.role !== "Admin") throw new Error("Only admins can create teams.")

    const name = args.name.trim()
    if (!name) throw new Error("Team name is required.")

    const identifier = args.identifier.trim().toUpperCase()
    if (!identifier) throw new Error("Team identifier is required.")

    const existingName = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first()
    if (existingName) throw new Error(`A team named "${name}" already exists.`)

    const existingIdentifier = await ctx.db
      .query("teams")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .first()
    if (existingIdentifier) throw new Error(`A team with identifier "${identifier}" already exists.`)

    const teamId = await ctx.db.insert("teams", {
      name,
      identifier,
      iconEmoji: args.iconEmoji.trim(),
      iconColor: args.iconColor.trim(),
      description: args.description?.trim(),
      createdAt:   new Date().toISOString(),
    })

    return { teamId, name, identifier }
  },
})

export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated.")

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()
    if (caller?.role !== "Admin") throw new Error("Only admins can delete teams.")

    // Verify team exists
    const team = await ctx.db.get(args.teamId)
    if (!team) throw new Error("Team not found.")

    // Clean up memberTeams mapping rows
    const memberTeams = await ctx.db
      .query("memberTeams")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect()
    for (const mt of memberTeams) {
      await ctx.db.delete(mt._id)
    }

    // Clean up teamIds from any pending invites
    const pendingInvites = await ctx.db
      .query("invites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    for (const invite of pendingInvites) {
      if (invite.teamIds?.includes(args.teamId)) {
        const updatedTeamIds = invite.teamIds.filter((id) => id !== args.teamId)
        await ctx.db.patch(invite._id, { teamIds: updatedTeamIds })
      }
    }

    // Delete the team itself
    await ctx.db.delete(args.teamId)
  },
})


// ── QUERIES ────────────────────────────────────────────────────────────────

export const listMembers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const members = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()

    return Promise.all(
      members.map(async (m) => {
        const memberTeams = await ctx.db
          .query("memberTeams")
          .withIndex("by_member", (q) => q.eq("memberId", m._id))
          .collect()
        
        const teams = await Promise.all(
          memberTeams.map(async (mt) => {
            const team = await ctx.db.get(mt.teamId)
            return team ? { _id: team._id, name: team.name, identifier: team.identifier, iconEmoji: team.iconEmoji, iconColor: team.iconColor } : null
          })
        )

        return { ...m, teams: teams.filter((t): t is NonNullable<typeof t> => t !== null) }
      })
    )
  },
})

export const listInvites = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return ctx.db
      .query("invites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
  },
})

export const listTeams = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    
    const teams = await ctx.db.query("teams").collect()
    return Promise.all(
      teams.map(async (t) => {
        const memberTeams = await ctx.db
          .query("memberTeams")
          .withIndex("by_team", (q) => q.eq("teamId", t._id))
          .collect()

        const members = await Promise.all(
          memberTeams.map(async (mt) => {
            const m = await ctx.db.get(mt.memberId)
            return m ? { _id: m._id, name: m.name, email: m.email, avatarUrl: m.avatarUrl, role: m.role, handle: m.handle } : null
          })
        )

        return {
          ...t,
          memberCount: memberTeams.length,
          members: members.filter((m): m is NonNullable<typeof m> => m !== null),
        }
      })
    )
  },
})

export const getCallerByClerkId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()
  },
})

// Used by the invite dialog to live-check if an email already has a pending invite
export const getInviteByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first()
  },
})

export const getInviteByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()
  },
})

export const debugCaller = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { error: "no identity" }

    const allMembers = await ctx.db.query("members").collect()
    const byClerkId  = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()

    return {
      identitySubject: identity.subject,
      identityEmail:   identity.email,
      totalMembers:    allMembers.length,
      allClerkIds:     allMembers.map((m) => ({ id: m._id, clerkUserId: m.clerkUserId, email: m.email })),
      foundByClerkId:  byClerkId ?? null,
    }
  },
})

// ── CLERK SYNC & TEAM MANAGEMENT ───────────────────────────────────────────

export const syncDbWithClerk = internalMutation({
  args: {
    memberships: v.array(
      v.object({
        clerkUserId: v.string(),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        imageUrl: v.string(),
        role: v.union(v.literal("Admin"), v.literal("User")),
      })
    ),
    invitations: v.array(
      v.object({
        email: v.string(),
        role: v.union(v.literal("Admin"), v.literal("User")),
        teamName: v.optional(v.string()),
        createdAt: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let defaultAdmin = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("role"), "Admin"))
      .first()

    if (!defaultAdmin) {
      defaultAdmin = await ctx.db.query("members").first()
    }

    for (const m of args.memberships) {
      let memberRow = await ctx.db
        .query("members")
        .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", m.clerkUserId))
        .first()

      if (!memberRow) {
        memberRow = await ctx.db
          .query("members")
          .withIndex("by_email", (q) => q.eq("email", m.email.toLowerCase().trim()))
          .first()
      }

      const name = `${m.firstName} ${m.lastName}`.trim() || m.email
      const handle = `@${m.email.split("@")[0].replace(/[._-]+/g, "")}`

      if (memberRow) {
        await ctx.db.patch(memberRow._id, {
          clerkUserId: m.clerkUserId,
          name: name || memberRow.name,
          email: m.email.toLowerCase().trim(),
          avatarUrl: m.imageUrl || memberRow.avatarUrl,
          role: m.role,
        })

        const invite = await ctx.db
          .query("invites")
          .withIndex("by_email", (q) => q.eq("email", m.email.toLowerCase().trim()))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first()
        if (invite) {
          await ctx.db.patch(invite._id, { status: "accepted" })
          if (invite.teamName) {
            const team = await ctx.db
              .query("teams")
              .withIndex("by_name", (q) => q.eq("name", invite.teamName!))
              .first()
            if (team) {
              const exists = await ctx.db
                .query("memberTeams")
                .withIndex("by_member", (q) => q.eq("memberId", memberRow!._id))
                .filter((q) => q.eq(q.field("teamId"), team._id))
                .first()
              if (!exists) {
                await ctx.db.insert("memberTeams", { memberId: memberRow._id, teamId: team._id })
              }
            }
          }
        }
      } else {
        const newMemberId = await ctx.db.insert("members", {
          name,
          handle,
          email: m.email.toLowerCase().trim(),
          avatarUrl: m.imageUrl || undefined,
          role: m.role,
          status: "active",
          clerkUserId: m.clerkUserId,
          joinedAt: new Date().toISOString(),
        })

        const invite = await ctx.db
          .query("invites")
          .withIndex("by_email", (q) => q.eq("email", m.email.toLowerCase().trim()))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first()
        if (invite) {
          await ctx.db.patch(invite._id, { status: "accepted" })
          if (invite.teamName) {
            const team = await ctx.db
              .query("teams")
              .withIndex("by_name", (q) => q.eq("name", invite.teamName!))
              .first()
            if (team) {
              await ctx.db.insert("memberTeams", { memberId: newMemberId, teamId: team._id })
            }
          }
        }
      }
    }

    for (const inv of args.invitations) {
      const email = inv.email.toLowerCase().trim()
      
      const alreadyMember = await ctx.db
        .query("members")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first()
      if (alreadyMember) continue

      const existingInvite = await ctx.db
        .query("invites")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first()

      if (!existingInvite) {
        const expiresAt = new Date(new Date(inv.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        
        await ctx.db.insert("invites", {
          email,
          role: inv.role,
          teamName: inv.teamName,
          token: crypto.randomUUID(),
          status: "pending",
          invitedBy: defaultAdmin?._id || (null as any),
          createdAt: inv.createdAt,
          expiresAt,
        })
      }
    }
  }
})

export const syncClerkMembers = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!process.env.CLERK_SECRET_KEY) {
      console.error("CLERK_SECRET_KEY is not defined in Convex env variables")
      return { success: false, reason: "CLERK_SECRET_KEY missing" }
    }

    const orgsResponse = await fetch("https://api.clerk.com/v1/organizations", {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      }
    })
    if (!orgsResponse.ok) {
      const errorText = await orgsResponse.text()
      throw new Error(`Failed to fetch Clerk organizations: ${errorText}`)
    }
    const orgs = await orgsResponse.json()
    const orgList = orgs.data || orgs
    const org = orgList?.[0]
    if (!org) {
      console.log("No organization found in Clerk.")
      return { success: false, reason: "No Clerk organization found" }
    }
    const orgId = org.id

    const membershipsResponse = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/memberships`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      }
    })
    if (!membershipsResponse.ok) {
      throw new Error("Failed to fetch Clerk organization memberships")
    }
    const membershipsData = await membershipsResponse.json()
    const memberships = membershipsData.data || membershipsData

    const invitesResponse = await fetch(`https://api.clerk.com/v1/organizations/${orgId}/invitations`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      }
    })
    if (!invitesResponse.ok) {
      throw new Error("Failed to fetch Clerk organization invitations")
    }
    const invitesData = await invitesResponse.json()
    const invitations = invitesData.data || invitesData

    await ctx.runMutation(internal.members.syncDbWithClerk, {
      memberships: memberships
        .filter((m: any) => m.public_user_data?.user_id != null && m.public_user_data?.identifier != null)
        .map((m: any) => ({
          clerkUserId: m.public_user_data.user_id,
          email: m.public_user_data.identifier,
          firstName: m.public_user_data.first_name || "",
          lastName: m.public_user_data.last_name || "",
          imageUrl: m.public_user_data.image_url || "",
          role: m.role === "org:admin" ? "Admin" : "User",
        })),
      invitations: invitations
        .filter((inv: any) => inv.status === "pending" && inv.email_address != null)
        .map((inv: any) => ({
          email: inv.email_address,
          role: inv.role === "org:admin" ? "Admin" : "User",
          teamName: inv.public_metadata?.teamName || undefined,
          createdAt: new Date(inv.created_at).toISOString(),
        })),
    })

    return { success: true }
  }
})

export const assignTeamMembers = mutation({
  args: {
    teamId: v.id("teams"),
    memberIds: v.array(v.id("members")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated.")

    const caller = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()
    if (caller?.role !== "Admin") throw new Error("Only admins can assign members to teams.")

    const existing = await ctx.db
      .query("memberTeams")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect()

    const existingMemberIds = existing.map((et) => et.memberId)

    for (const et of existing) {
      if (!args.memberIds.includes(et.memberId)) {
        await ctx.db.delete(et._id)
      }
    }

    for (const memberId of args.memberIds) {
      if (!existingMemberIds.includes(memberId)) {
        await ctx.db.insert("memberTeams", {
          memberId,
          teamId: args.teamId,
        })
      }
    }
  },
})

// ── CLERK WEBHOOK HANDLERS ──────────────────────────────────────────────────

export const handleInvitationCreatedInternal = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("Admin"), v.literal("User")),
    teamName: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    
    const alreadyMember = await ctx.db
      .query("members")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first()
    if (alreadyMember) return

    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first()
    if (existingInvite) return

    let defaultAdmin = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("role"), "Admin"))
      .first()

    if (!defaultAdmin) {
      defaultAdmin = await ctx.db.query("members").first()
    }

    if (!defaultAdmin) {
      console.warn("Cannot save invite in Convex: no members exist to set invitedBy.")
      return
    }

    const expiresAt = new Date(new Date(args.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    await ctx.db.insert("invites", {
      email,
      role: args.role,
      teamName: args.teamName,
      token: crypto.randomUUID(),
      status: "pending",
      invitedBy: defaultAdmin._id,
      createdAt: args.createdAt,
      expiresAt,
    })
  },
})

export const handleInvitationAcceptedInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect()
    for (const invite of invites) {
      await ctx.db.patch(invite._id, { status: "accepted" })
    }
  },
})

export const handleInvitationRevokedInternal = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect()
    for (const invite of invites) {
      await ctx.db.patch(invite._id, { status: "revoked" })
    }
  },
})

export const handleMembershipCreatedInternal = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.string(),
    role: v.union(v.literal("Admin"), v.literal("User")),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    let memberRow = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (!memberRow) {
      memberRow = await ctx.db
        .query("members")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first()
    }

    const name = `${args.firstName} ${args.lastName}`.trim() || args.email
    const handle = `@${args.email.split("@")[0].replace(/[._-]+/g, "")}`

    let memberId: any

    if (memberRow) {
      memberId = memberRow._id
      await ctx.db.patch(memberRow._id, {
        clerkUserId: args.clerkUserId,
        name: name || memberRow.name,
        email: email,
        avatarUrl: args.imageUrl || memberRow.avatarUrl,
        role: args.role,
        status: "active",
      })
    } else {
      memberId = await ctx.db.insert("members", {
        name,
        handle,
        email,
        avatarUrl: args.imageUrl || undefined,
        role: args.role,
        status: "active",
        clerkUserId: args.clerkUserId,
        joinedAt: new Date().toISOString(),
      })
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first()

    if (invite) {
      await ctx.db.patch(invite._id, { status: "accepted" })
      if (invite.teamName) {
        const team = await ctx.db
          .query("teams")
          .withIndex("by_name", (q) => q.eq("name", invite.teamName!))
          .first()
        if (team) {
          const exists = await ctx.db
            .query("memberTeams")
            .withIndex("by_member", (q) => q.eq("memberId", memberId))
            .filter((q) => q.eq(q.field("teamId"), team._id))
            .first()
          if (!exists) {
            await ctx.db.insert("memberTeams", { memberId, teamId: team._id })
          }
        }
      }
    }
  },
})

export const handleMembershipDeletedInternal = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first()

    if (member) {
      const memberTeams = await ctx.db
        .query("memberTeams")
        .withIndex("by_member", (q) => q.eq("memberId", member._id))
        .collect()
      for (const mt of memberTeams) {
        await ctx.db.delete(mt._id)
      }
      await ctx.db.delete(member._id)
    }
  },
})

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("members")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first(); // returns the full member record, including role: "Admin" | "Member" etc.
  },
});