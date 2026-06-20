import { query } from "./_generated/server";

export const getMembers = query(async (ctx) => {
  return await ctx.db.query("members").collect();
});
