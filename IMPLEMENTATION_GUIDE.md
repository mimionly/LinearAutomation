# Linear Automation Dashboard - Implementation Guide

## Overview
This guide documents how the Linear Automation Dashboard implements a cost-effective read-only task management system for Devvoid developers. By syncing Linear data to Convex (a serverless database), we avoid paying $12/user/month for read-only Linear access.

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                   LINEAR (External API)                  │
│           $12/user/month for all access                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Fetch via GraphQL API
                     │ (Admin-only, once per sync)
                     ↓
┌─────────────────────────────────────────────────────────┐
│              CONVEX (Serverless Backend)                 │
│  ✓ Free tier (>80% of use cases)                        │
│  ✓ Caches: projects, tasks, users                       │
│  ✓ Handles: auth, mutations, queries                    │
└────────┬──────────────────────┬────────────────────────┘
         │                      │
    Admin Panel             User Dashboard
    (Manage access)         (View assigned tasks)
         ↓                      ↓
    Convex Actions          Convex Queries
    - Sync Linear           - getAssignedTasks
    - Assign projects       - getUserAssignedProjects
    - View all projects     - Search/filter
```

---

## Requirements Implementation

### **1. Admin User Can View All Linear Projects via API**

**Files Involved:**
- `convex/linear.ts` - Query & Action definitions
- `convex/schema.ts` - Database schema for projects
- `src/pages/Admin.tsx` - Admin dashboard UI

**Implementation:**

```typescript
// Backend: Two ways to access projects
export const getProjects = query({
  // Read from CACHED Convex database (fast, no API calls)
  handler: async (ctx, args) => {
    // Admin-only access check
    const user = await checkAdmin(ctx, args.clerkId);
    const projects = await ctx.db.query("linearProjects").collect();
    return projects;
  }
});

export const fetchProjectsFromAPI = action({
  // Fetch LIVE from Linear API (for verification)
  handler: async (ctx, args) => {
    const user = await checkAdmin(ctx, args.clerkId);
    // Direct Linear API call to verify current state
    const response = await fetch("https://api.linear.app/graphql", {...});
    return response.data.projects.nodes;
  }
});
```

**Admin Experience:**
-  Dashboard displays cached projects (instant load)
- Option to fetch live from Linear API (verify freshness)
- Sync button triggers full data refresh

**Why Two Methods?**
-  `getProjects`: Fast, responsive UI (cached data in Convex)
- `fetchProjectsFromAPI`: Verify data freshness without syncing entire DB

---

### **2. Admin Assigns Projects to Specific Users**

**Files Involved:**
- `convex/users.ts` - User & project assignment mutations
- `convex/schema.ts` - `users.assignedProjects` field
- `src/pages/Admin.tsx` - UI for project assignment

**Implementation:**

```typescript
export const updateUserProjects = mutation({
  args: {
    callerClerkId: v.string(),      // Admin's Clerk ID
    targetUserId: v.id("users"),    // User to assign projects to
    projectIds: v.array(v.string()), // Array of Linear project IDs
  },
  handler: async (ctx, args) => {
    // Verify caller is admin
    const caller = await ctx.db.query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", args.callerClerkId))
      .first();
    
    if (caller?.role !== "admin") throw new Error("Unauthorized");
    
    // Update user's assigned projects
    await ctx.db.patch(args.targetUserId, {
      assignedProjects: args.projectIds
    });
  }
});
```

**Admin UI Flow:**
1. Select user from team list (left panel)
2. Toggle project checkboxes (right panel)
3. Changes save immediately to database
4. User sees updated task list on next refresh

**Database Schema:**
```typescript
users: defineTable({
  clerkId: v.string(),
  role: "admin" | "user",
  name: string,
  email: string,
  assignedProjects: string[]  // Array of Linear project IDs
})
```

---

### **3. User Authentication with Project-Specific Access**

**Files Involved:**
- `convex/users.ts` - Auth & sync mutations
- `src/pages/Dashboard.tsx` - Frontend auth check
- Clerk integration (external authentication provider)

**Implementation:**

```typescript
// On user first login: Auto-sync user data
export const syncUser = mutation({
  args: { clerkId: v.string(), name?: string, email?: string },
  handler: async (ctx, args) => {
    let user = await ctx.db.query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user) {
      // First user becomes admin (optional logic)
      const isFirstUser = !(await ctx.db.query("users").first());
      user = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        role: isFirstUser ? "admin" : "user",
        assignedProjects: []
      });
    }
    return user;
  }
});

// Get current user (used in queries)
export const getCurrentUser = query({
  handler: async (ctx, args) => {
    return await ctx.db.query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
      .first();
  }
});
```

**Project-Specific Access:**
```typescript
export const getAssignedTasks = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Get user's assigned projects
    const user = await ctx.db.query("users")
      .withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId))
      .first();
    
    if (!user?.assignedProjects?.length) return []; // No access
    
    // Filter tasks to only assigned projects
    const tasks = await ctx.db.query("linearTasks").collect();
    return tasks.filter(t => 
      user.assignedProjects.includes(t.project.id)
    );
  }
});
```

**Authentication Flow:**
1. User logs in via Clerk
2. If first login: `syncUser` mutation creates database entry
3. User's `assignedProjects` array controls data visibility
4. Admin controls which projects each user can see

---

### **4. Read-Only Task Dashboard for Assigned Developers**

**Files Involved:**
- `src/pages/Dashboard.tsx` - React component for task display
- `convex/linear.ts` - Data queries
- Lucide React icons - UI visual components

**Implementation:**

```typescript
export default function Dashboard() {
  const { user } = useUser(); // Clerk authentication
  
  // Query tasks assigned to current user
  const tasks = useQuery(
    api.linear.getAssignedTasks, 
    user ? { clerkId: user.id } : "skip"
  );

  // Frontend filtering
  const filtered = tasks.filter(task => {
    const matchesSearch = task.title.includes(searchQuery);
    const matchesState = filterState(task.state);
    return matchesSearch && matchesState;
  });

  return (
    <div>
      {/* Search & Filter Controls */}
      <input 
        placeholder="Search tasks or IDs..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      
      {/* State Filter Buttons */}
      <button onClick={() => setActiveFilter("All")}>All</button>
      <button onClick={() => setActiveFilter("Todo")}>Todo</button>
      <button onClick={() => setActiveFilter("Active")}>Active</button>
      <button onClick={() => setActiveFilter("Done")}>Done</button>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

// TaskCard displays individual task
function TaskCard({ task }) {
  const stateTheme = getStateDetails(task.state.name);
  return (
    <div className="rounded-lg border bg-zinc-900/40 p-5">
      <div className="text-sm text-zinc-400">{task.project.name}</div>
      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
      <div className="mt-4 flex justify-between">
        <span className={`px-2 py-1 rounded text-xs ${stateTheme.bg}`}>
          {stateTheme.icon} {task.state.name}
        </span>
        <span className="text-xs font-mono text-zinc-500">
          {task.identifier}
        </span>
      </div>
    </div>
  );
}
```

**Dashboard Features:**
- ✅ Search by task title or ID
- ✅ Filter by state (All, Todo, Active, Done)
- ✅ Color-coded state badges
- ✅ Project badge per task
- ✅ Task identifier (e.g., "PROJ-123")
- ✅ Responsive grid layout
- ✅ Empty state message
- ✅ Loading skeleton UI
- ✅ Read-only (no edit buttons)

---

## Sync Flow & Data Refresh

### **Admin Sync Process**

```typescript
export const syncLinearData = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // 1. Auth Check
    const user = await checkAdmin(ctx, args.clerkId);
    
    // 2. Fetch Projects from Linear API
    const projRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: LINEAR_API_KEY },
      body: JSON.stringify({ 
        query: `query { projects { nodes { id name state } } }`
      })
    });
    const projects = projRes.data.projects.nodes;
    
    // 3. Replace cached projects in Convex
    await ctx.runMutation(internal.linear.syncProjectsInner, { projects });
    
    // 4. Fetch Tasks from Linear API (max 250)
    const taskRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: LINEAR_API_KEY },
      body: JSON.stringify({ 
        query: `query { issues(first: 250) { 
          nodes { id title identifier state project assignee } 
        } }`
      })
    });
    const tasks = taskRes.data.issues.nodes;
    
    // 5. Replace cached tasks in Convex
    await ctx.runMutation(internal.linear.syncTasksInner, { tasks });
    
    // 6. Return sync status
    return {
      success: true,
      syncedProjects: projects.length,
      syncedTasks: tasks.length,
      message: "Synced X projects and Y tasks"
    };
  }
});
```

**Error Handling:**
- Timeout protection (30s per API call)
- Graceful error messages for API failures
- Partial sync support (projects can sync even if tasks fail, or vice versa)
- Error details returned to admin for debugging

**Admin Panel Integration:**
```typescript
// Admin.tsx
const [syncing, setSyncing] = useState(false);
const [syncStatus, setSyncStatus] = useState(null);

const handleSync = async () => {
  setSyncing(true);
  try {
    const result = await syncLinear({ clerkId: user.id });
    setSyncStatus({
      type: "success",
      message: `${result.message}`
    });
  } catch (error) {
    setSyncStatus({
      type: "error",
      message: error.message
    });
  } finally {
    setSyncing(false);
  }
};
```

---

## Cost Analysis

### **Before (Direct Linear Access)**
- Cost: $12/user/month × N developers
- Example: 10 developers = $120/month

### **After (Sync + Convex Cache)**
- Linear: $12/month (1 admin account for syncing)
- Convex: Free tier (covers most use cases)
- Example: 10 developers = $12/month
- **Savings: Up to 90% reduction**

#### Convex Free Tier Limits:
- 200 database documents (easily covers projects/tasks)
- Generous compute allowance
- Upgrade at $50/month if needed (still much cheaper than Linear)

---

## Setup Instructions

### **1. Environment Variables**

Set in Convex Dashboard (`npx convex env`):
```
LINEAR_API_KEY=<your-linear-api-key>
```

Get API key from: Linear Settings → Integrations → API & Webhooks

### **2. Clerk Configuration**

Ensure Clerk is integrated:
```bash
npm install @clerk/clerk-react @clerk/clerk-sdk-node
```

Set Clerk pub key in `.env.local`:
```
VITE_CLERK_PUBLISHABLE_KEY=<key>
CLERK_SECRET_KEY=<secret>
```

### **3. Database Schema**

Already defined in `convex/schema.ts`:
- `users`: Stores Clerk users + assigned projects
- `linearProjects`: Cached Linear projects
- `linearTasks`: Cached Linear tasks
- `settings`: Stores Linear API key

### **4. First-Time Setup**

1. **Create first admin:**
   - Sign up with Clerk
   - Automatic: First user becomes admin
   
2. **Configure Linear API key:**
   - Go to Admin Dashboard
   - Set Linear API key in settings (or env var)
   
3. **Sync Linear data:**
   - Click "Sync Linear Data" button
   - Wait for completion
   
4. **Assign projects to users:**
   - Select team member
   - Toggle projects
   - Save

### **5. Deploy**

```bash
# Build
npm run build

# Deploy to Vercel
npx deploy

# Or use: vercel deploy
```

---

## API Reference

### **Queries (Read-Only)**

#### `getProjects(clerkId: string): LinearProject[]`
- Returns: All cached Linear projects
- Access: Admin only
- Speed: Instant (cached in Convex)

#### `getAssignedTasks(clerkId: string): LinearTask[]`
- Returns: Tasks in user's assigned projects
- Access: Any authenticated user
- Filtering: Frontend (search, state, project)

#### `getUserAssignedProjects(clerkId: string): LinearProject[]`
- Returns: Projects assigned to user
- Access: Any authenticated user
- Use: Show user's project list

#### `getCurrentUser(clerkId: string): User`
- Returns: Current user's data (role, assignments)
- Access: Any authenticated user

### **Actions (Async Operations)**

#### `syncLinearData(clerkId: string)`
- Fetches from Linear API + syncs to Convex
- Returns: `{ success, syncedProjects, syncedTasks, errors }`
- Access: Admin only

#### `fetchProjectsFromAPI(clerkId: string): LinearProject[]`
- Fetches live projects from Linear API
- Returns: Latest data from Linear (not cached)
- Access: Admin only

### **Mutations (Write Operations)**

#### `updateUserProjects(callerClerkId, targetUserId, projectIds)`
- Assigns projects to user
- Caller must be admin
- Updates: `users[targetUserId].assignedProjects`

#### `syncUser(clerkId, name, email)`
- Auto-syncs Clerk user to Convex on first login
- Creates user record if doesn't exist
- First user auto-assigned admin role

---

## Testing Checklist

- [ ] Admin can log in
- [ ] Admin dashboard loads projects
- [ ] Admin can click "Sync Linear Data"
- [ ] Sync completes with success message
- [ ] Admin can select user and assign projects
- [ ] Project assignments save
- [ ] Regular user sees assigned tasks
- [ ] Search/filter works on dashboard
- [ ] Task state badges display correctly
- [ ] Read-only (no edit buttons visible)

---

## Troubleshooting

### **Sync fails with "Linear API key not configured"**
- Solution: Set `LINEAR_API_KEY` in Convex env vars
- Verify key from Linear settings

### **Admin dashboard shows no projects**
- Verify Linear API key is valid
- Click "Sync Linear Data" to fetch
- Check network requests in browser dev tools

### **User sees no tasks**
- Verify admin assigned projects to user
- Verify tasks exist in Linear for assigned projects
- User may need to refresh page

### **"Unauthorized" errors**
- Verify user role is "admin" for sync operations
- Check that target user exists in database

---

## Future Enhancements

1. **Auto-sync on schedule** (Convex cron jobs)
2. **Pagination for large task lists** (>250 tasks)
3. **Offline mode** (service workers)
4. **Real-time sync status** (WebSocket updates)
5. **Bulk user assignment** (CSV import)
6. **Task filtering by assignee** on user dashboard
7. **Integration with Slack** for task notifications

---

## FAQS

**Q: Why cache in Convex instead of direct Linear API?**
A: Linear charges per-user access. Caching allows unlimited read-only access for free/cheap.

**Q: What happens if Linear data changes while I'm viewing the dashboard?**
A: You see the last synced version. Click "Sync Linear Data" to refresh.

**Q: Can users still edit tasks in Linear?**
A: Yes! This dashboard is read-only, but users with Linear access can still edit directly in Linear.

**Q: How often should I sync?**
A: Depends on your needs. Suggest once per day or after major tasks complete.

**Q: What if I have >250 tasks?**
A: Current sync fetches first 250. Enhancement needed for pagination/multiple fetches.

---

## Support

For issues:
1. Check logs in Convex dashboard
2. Verify Linear API key
3. Check network requests in browser dev tools
4. Review error messages in admin sync status

