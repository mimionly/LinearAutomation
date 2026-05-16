import type { z } from "zod"
import type { schema } from "@/lib/schema"

// ── Mock Projects (matches the Zod schema shape) ──────────────────────────
export type Project = z.infer<typeof schema>

export const mockProjects: Project[] = [
  {
    id: 1,
    linearId: "proj-001",
    header: "Authentication System Overhaul",
    description: "Complete rewrite of the authentication flow with OAuth2, MFA support, and session management improvements.",
    type: "in-progress",
    status: "In Progress",
    target: "Authentication System Overhaul",
    priority: 1,
    createdAt: "2026-04-10T08:30:00Z",
    progress: 0.72,
    health: "onTrack",
    content: "## Scope\n- Implement OAuth2 PKCE flow\n- Add TOTP-based MFA\n- Migrate session storage to Redis\n- Rate limiting on auth endpoints\n\n## Notes\nBackend team has completed the Redis migration. Frontend integration is 60% done.",
    leadName: "Anika Patel",
    leadEmail: "anika@devvoid.io",
  },
  {
    id: 2,
    linearId: "proj-002",
    header: "Dashboard Analytics V2",
    description: "Redesign analytics dashboard with real-time charts, customizable widgets, and data export capabilities.",
    type: "planned",
    status: "Planned",
    target: "Dashboard Analytics V2",
    priority: 2,
    createdAt: "2026-04-15T14:00:00Z",
    progress: 0.15,
    health: "atRisk",
    content: "## Goals\n- Interactive area/bar/pie charts\n- Drag-and-drop widget layout\n- CSV + PDF export\n- Scheduled report emails\n\n## Blockers\nDesign team hasn't finalized the widget system mockups yet.",
    leadName: "Marcus Chen",
    leadEmail: "marcus@devvoid.io",
  },
  {
    id: 3,
    linearId: "proj-003",
    header: "API Rate Limiting & Throttling",
    description: "Implement token-bucket rate limiting across all public API endpoints with per-user and per-IP quotas.",
    type: "completed",
    status: "Completed",
    target: "API Rate Limiting & Throttling",
    priority: 2,
    createdAt: "2026-03-20T10:15:00Z",
    progress: 1.0,
    health: "onTrack",
    content: "Deployed to production on April 28. All endpoints now enforce 1000 req/min per API key and 100 req/min per IP for unauthenticated requests.",
    leadName: "Sofia Rodriguez",
    leadEmail: "sofia@devvoid.io",
  },
  {
    id: 4,
    linearId: "proj-004",
    header: "Mobile App Push Notifications",
    description: "Integrate Firebase Cloud Messaging for real-time push notifications on iOS and Android platforms.",
    type: "in-progress",
    status: "Started",
    target: "Mobile App Push Notifications",
    priority: 3,
    createdAt: "2026-04-25T09:00:00Z",
    progress: 0.45,
    health: "onTrack",
    content: "## Progress\n- FCM integration complete for Android\n- iOS APNs bridge in testing\n- Notification preferences UI done\n- Deep linking from notifications WIP",
    leadName: "James O'Brien",
    leadEmail: "james@devvoid.io",
  },
  {
    id: 5,
    linearId: "proj-005",
    header: "Database Migration to PostgreSQL",
    description: "Migrate the primary datastore from MongoDB to PostgreSQL with zero-downtime deployment strategy.",
    type: "backlog",
    status: "Backlog",
    target: "Database Migration to PostgreSQL",
    priority: 1,
    createdAt: "2026-05-01T11:30:00Z",
    progress: 0.05,
    health: "offTrack",
    content: "## Concerns\n- Schema design needs review\n- Data migration scripts not started\n- Need to coordinate with all dependent services\n- Estimated 3-week migration window",
    leadName: "Liam Foster",
    leadEmail: "liam@devvoid.io",
  },
  {
    id: 6,
    linearId: "proj-006",
    header: "CI/CD Pipeline Optimization",
    description: "Reduce build times by 60% through parallel test execution, Docker layer caching, and artifact reuse.",
    type: "in-progress",
    status: "In Progress",
    target: "CI/CD Pipeline Optimization",
    priority: 3,
    createdAt: "2026-04-18T16:45:00Z",
    progress: 0.58,
    health: "onTrack",
    content: "## Wins so far\n- Docker builds down from 8min to 3min\n- Test suite parallelized (4 shards)\n- Artifact caching implemented\n\n## Remaining\n- Flaky test quarantine system\n- Deploy preview environments",
    leadName: "Priya Sharma",
    leadEmail: "priya@devvoid.io",
  },
  {
    id: 7,
    linearId: "proj-007",
    header: "Design System Component Library",
    description: "Build a shared component library with Storybook documentation, accessibility compliance, and theming support.",
    type: "in-progress",
    status: "In Progress",
    target: "Design System Component Library",
    priority: 2,
    createdAt: "2026-03-28T13:20:00Z",
    progress: 0.82,
    health: "onTrack",
    content: "## Components completed\nButton, Input, Select, Modal, Toast, Badge, Avatar, Card, Table, Tabs, Tooltip\n\n## Remaining\n- Date Picker\n- Combobox\n- Data Grid\n- Accessibility audit",
    leadName: "Anika Patel",
    leadEmail: "anika@devvoid.io",
  },
  {
    id: 8,
    linearId: "proj-008",
    header: "User Onboarding Flow Redesign",
    description: "Streamline the first-time user experience with guided tours, contextual tooltips, and progressive disclosure.",
    type: "canceled",
    status: "Canceled",
    target: "User Onboarding Flow Redesign",
    priority: 4,
    createdAt: "2026-02-15T10:00:00Z",
    progress: 0.2,
    health: "noData",
    content: "Canceled due to shifting priorities. The existing onboarding flow will receive incremental improvements instead of a full redesign.",
    leadName: "Marcus Chen",
    leadEmail: "marcus@devvoid.io",
  },
  {
    id: 9,
    linearId: "proj-009",
    header: "Search Infrastructure Upgrade",
    description: "Replace Elasticsearch 7.x with OpenSearch 2.x and implement vector search for semantic queries.",
    type: "planned",
    status: "Planned",
    target: "Search Infrastructure Upgrade",
    priority: 2,
    createdAt: "2026-05-05T08:00:00Z",
    progress: 0.08,
    health: "atRisk",
    content: "## Motivation\n- ES 7.x EOL approaching\n- Need vector search for AI features\n- Cost reduction (~40% with OpenSearch)\n\n## Timeline\nTargeting Q3 2026 for production cutover.",
    leadName: "Sofia Rodriguez",
    leadEmail: "sofia@devvoid.io",
  },
  {
    id: 10,
    linearId: "proj-010",
    header: "Billing & Subscription Management",
    description: "Integrate Stripe Billing for subscription management with usage-based pricing, invoicing, and customer portal.",
    type: "in-progress",
    status: "In Progress",
    target: "Billing & Subscription Management",
    priority: 1,
    createdAt: "2026-04-05T07:30:00Z",
    progress: 0.65,
    health: "onTrack",
    content: "## Completed\n- Stripe Customer + Subscription creation\n- Webhook handler for payment events\n- Customer portal integration\n\n## In Progress\n- Usage metering pipeline\n- Invoice PDF generation\n- Dunning emails",
    leadName: "James O'Brien",
    leadEmail: "james@devvoid.io",
  },
  {
    id: 11,
    linearId: "proj-011",
    header: "Internationalization (i18n)",
    description: "Add multi-language support for the web application targeting EN, ES, FR, DE, JA, and ZH locales.",
    type: "backlog",
    status: "Backlog",
    target: "Internationalization (i18n)",
    priority: 4,
    createdAt: "2026-05-10T12:00:00Z",
    progress: 0.0,
    health: "noData",
    leadName: "Priya Sharma",
    leadEmail: "priya@devvoid.io",
  },
  {
    id: 12,
    linearId: "proj-012",
    header: "Performance Monitoring & Alerting",
    description: "Deploy OpenTelemetry-based observability stack with custom dashboards, SLO tracking, and PagerDuty integration.",
    type: "completed",
    status: "Completed",
    target: "Performance Monitoring & Alerting",
    priority: 2,
    createdAt: "2026-03-10T09:45:00Z",
    progress: 1.0,
    health: "onTrack",
    content: "Fully deployed. All services instrumented with OTel SDK. Grafana dashboards live. PagerDuty alerting active for P1/P2 SLO breaches.",
    leadName: "Liam Foster",
    leadEmail: "liam@devvoid.io",
  },
]

// ── Mock Issues (matches the shape used by ProjectIssuesTable) ──────────────
export interface MockIssue {
  _id: string
  id: string
  title: string
  priority?: number
  state: { name: string }
  createdAt?: string
  project: { id: string; name: string } | null
  assignee: { id: string; name: string; email: string } | null
}

export const mockIssues: MockIssue[] = [
  // ── proj-001: Authentication System Overhaul ──
  { _id: "iss-001", id: "iss-001", title: "Implement OAuth2 PKCE flow", priority: 1, state: { name: "In Progress" }, createdAt: "2026-04-12T10:00:00Z", project: { id: "proj-001", name: "Authentication System Overhaul" }, assignee: { id: "u1", name: "Anika Patel", email: "anika@devvoid.io" } },
  { _id: "iss-002", id: "iss-002", title: "Add TOTP-based MFA support", priority: 2, state: { name: "In Progress" }, createdAt: "2026-04-14T09:30:00Z", project: { id: "proj-001", name: "Authentication System Overhaul" }, assignee: { id: "u3", name: "Sofia Rodriguez", email: "sofia@devvoid.io" } },
  { _id: "iss-003", id: "iss-003", title: "Migrate session storage to Redis", priority: 2, state: { name: "Done" }, createdAt: "2026-04-11T14:00:00Z", project: { id: "proj-001", name: "Authentication System Overhaul" }, assignee: { id: "u5", name: "Liam Foster", email: "liam@devvoid.io" } },
  { _id: "iss-004", id: "iss-004", title: "Rate limiting on auth endpoints", priority: 3, state: { name: "Todo" }, createdAt: "2026-04-20T08:00:00Z", project: { id: "proj-001", name: "Authentication System Overhaul" }, assignee: null },

  // ── proj-002: Dashboard Analytics V2 ──
  { _id: "iss-005", id: "iss-005", title: "Design interactive chart components", priority: 2, state: { name: "In Progress" }, createdAt: "2026-04-18T10:00:00Z", project: { id: "proj-002", name: "Dashboard Analytics V2" }, assignee: { id: "u2", name: "Marcus Chen", email: "marcus@devvoid.io" } },
  { _id: "iss-006", id: "iss-006", title: "Implement drag-and-drop widget layout", priority: 3, state: { name: "Backlog" }, createdAt: "2026-04-20T11:00:00Z", project: { id: "proj-002", name: "Dashboard Analytics V2" }, assignee: null },
  { _id: "iss-007", id: "iss-007", title: "Build CSV/PDF export functionality", priority: 3, state: { name: "Backlog" }, createdAt: "2026-04-22T09:00:00Z", project: { id: "proj-002", name: "Dashboard Analytics V2" }, assignee: { id: "u6", name: "Priya Sharma", email: "priya@devvoid.io" } },

  // ── proj-003: API Rate Limiting ──
  { _id: "iss-008", id: "iss-008", title: "Implement token-bucket algorithm", priority: 1, state: { name: "Done" }, createdAt: "2026-03-22T10:00:00Z", project: { id: "proj-003", name: "API Rate Limiting & Throttling" }, assignee: { id: "u3", name: "Sofia Rodriguez", email: "sofia@devvoid.io" } },
  { _id: "iss-009", id: "iss-009", title: "Add per-user quota configuration", priority: 2, state: { name: "Done" }, createdAt: "2026-03-25T14:00:00Z", project: { id: "proj-003", name: "API Rate Limiting & Throttling" }, assignee: { id: "u3", name: "Sofia Rodriguez", email: "sofia@devvoid.io" } },
  { _id: "iss-010", id: "iss-010", title: "Deploy rate limiter to production", priority: 1, state: { name: "Done" }, createdAt: "2026-04-26T08:00:00Z", project: { id: "proj-003", name: "API Rate Limiting & Throttling" }, assignee: { id: "u5", name: "Liam Foster", email: "liam@devvoid.io" } },

  // ── proj-004: Push Notifications ──
  { _id: "iss-011", id: "iss-011", title: "Integrate FCM for Android", priority: 2, state: { name: "Done" }, createdAt: "2026-04-26T10:00:00Z", project: { id: "proj-004", name: "Mobile App Push Notifications" }, assignee: { id: "u4", name: "James O'Brien", email: "james@devvoid.io" } },
  { _id: "iss-012", id: "iss-012", title: "Bridge APNs for iOS", priority: 2, state: { name: "In Progress" }, createdAt: "2026-04-28T09:00:00Z", project: { id: "proj-004", name: "Mobile App Push Notifications" }, assignee: { id: "u4", name: "James O'Brien", email: "james@devvoid.io" } },
  { _id: "iss-013", id: "iss-013", title: "Notification preferences UI", priority: 3, state: { name: "Done" }, createdAt: "2026-04-30T11:00:00Z", project: { id: "proj-004", name: "Mobile App Push Notifications" }, assignee: { id: "u1", name: "Anika Patel", email: "anika@devvoid.io" } },
  { _id: "iss-014", id: "iss-014", title: "Deep linking from notifications", priority: 3, state: { name: "In Progress" }, createdAt: "2026-05-02T08:00:00Z", project: { id: "proj-004", name: "Mobile App Push Notifications" }, assignee: { id: "u4", name: "James O'Brien", email: "james@devvoid.io" } },

  // ── proj-005: Database Migration ──
  { _id: "iss-015", id: "iss-015", title: "Design PostgreSQL schema", priority: 1, state: { name: "Todo" }, createdAt: "2026-05-02T10:00:00Z", project: { id: "proj-005", name: "Database Migration to PostgreSQL" }, assignee: { id: "u5", name: "Liam Foster", email: "liam@devvoid.io" } },
  { _id: "iss-016", id: "iss-016", title: "Write data migration scripts", priority: 1, state: { name: "Backlog" }, createdAt: "2026-05-03T14:00:00Z", project: { id: "proj-005", name: "Database Migration to PostgreSQL" }, assignee: null },

  // ── proj-006: CI/CD Optimization ──
  { _id: "iss-017", id: "iss-017", title: "Implement Docker layer caching", priority: 2, state: { name: "Done" }, createdAt: "2026-04-20T10:00:00Z", project: { id: "proj-006", name: "CI/CD Pipeline Optimization" }, assignee: { id: "u6", name: "Priya Sharma", email: "priya@devvoid.io" } },
  { _id: "iss-018", id: "iss-018", title: "Parallelize test suite (4 shards)", priority: 2, state: { name: "Done" }, createdAt: "2026-04-22T09:00:00Z", project: { id: "proj-006", name: "CI/CD Pipeline Optimization" }, assignee: { id: "u6", name: "Priya Sharma", email: "priya@devvoid.io" } },
  { _id: "iss-019", id: "iss-019", title: "Build flaky test quarantine system", priority: 3, state: { name: "In Progress" }, createdAt: "2026-05-01T08:00:00Z", project: { id: "proj-006", name: "CI/CD Pipeline Optimization" }, assignee: { id: "u6", name: "Priya Sharma", email: "priya@devvoid.io" } },
  { _id: "iss-020", id: "iss-020", title: "Deploy preview environments", priority: 3, state: { name: "Todo" }, createdAt: "2026-05-05T10:00:00Z", project: { id: "proj-006", name: "CI/CD Pipeline Optimization" }, assignee: null },

  // ── proj-007: Design System ──
  { _id: "iss-021", id: "iss-021", title: "Build Date Picker component", priority: 3, state: { name: "In Progress" }, createdAt: "2026-04-28T10:00:00Z", project: { id: "proj-007", name: "Design System Component Library" }, assignee: { id: "u1", name: "Anika Patel", email: "anika@devvoid.io" } },
  { _id: "iss-022", id: "iss-022", title: "Build Combobox component", priority: 3, state: { name: "Todo" }, createdAt: "2026-04-30T10:00:00Z", project: { id: "proj-007", name: "Design System Component Library" }, assignee: { id: "u2", name: "Marcus Chen", email: "marcus@devvoid.io" } },
  { _id: "iss-023", id: "iss-023", title: "Accessibility audit (WCAG 2.1 AA)", priority: 2, state: { name: "Todo" }, createdAt: "2026-05-05T11:00:00Z", project: { id: "proj-007", name: "Design System Component Library" }, assignee: null },

  // ── proj-010: Billing ──
  { _id: "iss-024", id: "iss-024", title: "Stripe Customer + Subscription creation", priority: 1, state: { name: "Done" }, createdAt: "2026-04-08T10:00:00Z", project: { id: "proj-010", name: "Billing & Subscription Management" }, assignee: { id: "u4", name: "James O'Brien", email: "james@devvoid.io" } },
  { _id: "iss-025", id: "iss-025", title: "Webhook handler for payment events", priority: 1, state: { name: "Done" }, createdAt: "2026-04-10T14:00:00Z", project: { id: "proj-010", name: "Billing & Subscription Management" }, assignee: { id: "u4", name: "James O'Brien", email: "james@devvoid.io" } },
  { _id: "iss-026", id: "iss-026", title: "Usage metering pipeline", priority: 2, state: { name: "In Progress" }, createdAt: "2026-04-25T09:00:00Z", project: { id: "proj-010", name: "Billing & Subscription Management" }, assignee: { id: "u3", name: "Sofia Rodriguez", email: "sofia@devvoid.io" } },
  { _id: "iss-027", id: "iss-027", title: "Invoice PDF generation", priority: 3, state: { name: "Todo" }, createdAt: "2026-05-01T10:00:00Z", project: { id: "proj-010", name: "Billing & Subscription Management" }, assignee: null },
  { _id: "iss-028", id: "iss-028", title: "Dunning email automation", priority: 3, state: { name: "Todo" }, createdAt: "2026-05-03T08:00:00Z", project: { id: "proj-010", name: "Billing & Subscription Management" }, assignee: { id: "u6", name: "Priya Sharma", email: "priya@devvoid.io" } },

  // ── proj-009: Search Upgrade ──
  { _id: "iss-029", id: "iss-029", title: "Evaluate OpenSearch 2.x vs Elasticsearch 8", priority: 2, state: { name: "In Progress" }, createdAt: "2026-05-06T10:00:00Z", project: { id: "proj-009", name: "Search Infrastructure Upgrade" }, assignee: { id: "u5", name: "Liam Foster", email: "liam@devvoid.io" } },
  { _id: "iss-030", id: "iss-030", title: "Prototype vector search with embeddings", priority: 2, state: { name: "Backlog" }, createdAt: "2026-05-08T09:00:00Z", project: { id: "proj-009", name: "Search Infrastructure Upgrade" }, assignee: null },

  // ── proj-012: Monitoring ──
  { _id: "iss-031", id: "iss-031", title: "Instrument services with OTel SDK", priority: 1, state: { name: "Done" }, createdAt: "2026-03-12T10:00:00Z", project: { id: "proj-012", name: "Performance Monitoring & Alerting" }, assignee: { id: "u5", name: "Liam Foster", email: "liam@devvoid.io" } },
  { _id: "iss-032", id: "iss-032", title: "Configure Grafana dashboards", priority: 2, state: { name: "Done" }, createdAt: "2026-03-18T14:00:00Z", project: { id: "proj-012", name: "Performance Monitoring & Alerting" }, assignee: { id: "u6", name: "Priya Sharma", email: "priya@devvoid.io" } },
  { _id: "iss-033", id: "iss-033", title: "PagerDuty alerting integration", priority: 1, state: { name: "Done" }, createdAt: "2026-03-25T09:00:00Z", project: { id: "proj-012", name: "Performance Monitoring & Alerting" }, assignee: { id: "u5", name: "Liam Foster", email: "liam@devvoid.io" } },
]

// Helper: get issues by project ID
export function getIssuesByProjectId(projectId: string): MockIssue[] {
  return mockIssues.filter((issue) => issue.project?.id === projectId)
}

// Helper: raw project data (shaped like Convex DB records for the chart)
export interface RawProject {
  _id: string
  _creationTime: number
  id: string
  name: string
  state: string
  createdAt?: string
  description?: string
  priority?: number
  health?: string
  progress?: number
  content?: string
  lead?: { name: string; email: string } | null
}

export const rawProjects: RawProject[] = mockProjects.map((p) => ({
  _id: `convex_${p.linearId}`,
  _creationTime: new Date(p.createdAt).getTime(),
  id: p.linearId,
  name: p.header,
  state: p.type,
  createdAt: p.createdAt,
  description: p.description,
  priority: p.priority,
  health: p.health,
  progress: p.progress,
  content: p.content,
  lead: p.leadName ? { name: p.leadName, email: p.leadEmail ?? "" } : null,
}))

export interface RawIssue {
  _id: string
  _creationTime: number
  id: string
  title: string
  priority?: number
  state: { name: string }
  createdAt?: string
  project: { id: string; name: string } | null
  assignee: { id: string; name: string; email: string } | null
}

export const rawIssues: RawIssue[] = mockIssues.map((i) => ({
  _id: i._id,
  _creationTime: new Date(i.createdAt ?? "2026-01-01").getTime(),
  id: i.id,
  title: i.title,
  priority: i.priority,
  state: i.state,
  createdAt: i.createdAt,
  project: i.project,
  assignee: i.assignee,
}))
