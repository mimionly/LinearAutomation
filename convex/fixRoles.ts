import { mutation } from "./_generated/server";

export const makeAdmins = mutation(async (ctx) => {
  const members = await ctx.db.query("members").collect();
  for (const m of members) {
    if (m.status === "active") {
      await ctx.db.patch(m._id, { role: "Admin" });
    }
  }
});
