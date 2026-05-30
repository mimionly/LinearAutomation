import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("CLERK_WEBHOOK_SECRET is not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const payload = await request.text();

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Verification failed", { status: 400 });
    }

    const { type, data } = evt;

    try {
      switch (type) {
        case "organizationInvitation.created": {
          await ctx.runMutation(internal.members.handleInvitationCreatedInternal, {
            email: data.email_address,
            role: data.role === "org:admin" ? "Admin" : "User",
            teamName: data.public_metadata?.teamName,
            createdAt: new Date(data.created_at).toISOString(),
          });
          break;
        }
        case "organizationInvitation.accepted": {
          await ctx.runMutation(internal.members.handleInvitationAcceptedInternal, {
            email: data.email_address,
          });
          break;
        }
        case "organizationInvitation.revoked": {
          await ctx.runMutation(internal.members.handleInvitationRevokedInternal, {
            email: data.email_address,
          });
          break;
        }
        case "organizationMembership.created": {
          await ctx.runMutation(internal.members.handleMembershipCreatedInternal, {
            clerkUserId: data.public_user_data.user_id,
            email: data.public_user_data.identifier,
            firstName: data.public_user_data.first_name || "",
            lastName: data.public_user_data.last_name || "",
            imageUrl: data.public_user_data.image_url || "",
            role: data.role === "org:admin" ? "Admin" : "User",
          });
          break;
        }
        case "organizationMembership.deleted": {
          await ctx.runMutation(internal.members.handleMembershipDeletedInternal, {
            clerkUserId: data.public_user_data.user_id,
          });
          break;
        }
      }
    } catch (err) {
      console.error(`Error processing webhook event ${type}:`, err);
      return new Response("Error processing webhook", { status: 500 });
    }

    return new Response("Webhook processed", { status: 200 });
  }),
});

export default http;
