// convex/myData.ts
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const fetchFromGraphQL = internalAction({
  args: {},
  handler: async (ctx) => {
    const response = await fetch("https://your-graphql-endpoint.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOUR_API_TOKEN}`,
      },
      body: JSON.stringify({
        query: `{ yourQuery { field1 field2 } }`,
      }),
    });
    const data = await response.json();

    // Store the result via a mutation
    await ctx.runMutation(internal.myData.storeData, { data: data.data });
  },
});