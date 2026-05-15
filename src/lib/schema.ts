import { z } from "zod";

export const schema = z.object({
  id: z.number(),
  linearId: z.string(),      // the real Linear project ID (for fetching issues)
  header: z.string(),
  description: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  
  priority: z.number(),
  createdAt: z.string(),
  review: z.string().optional(),
  progress: z.number(),       // required — initialData always provides ?? 0
  health: z.string(),         // required — initialData always provides ?? ""
  content: z.string().optional(),
  leadName: z.string().optional(),   // lead's display name
  leadEmail: z.string().optional(),  // lead's email
});
