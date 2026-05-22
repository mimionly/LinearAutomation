import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import { useAuth } from "@clerk/clerk-react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import {
  IconSearch,
  IconUserPlus,
  IconDownload,
  IconLoader2,
  IconX,
  IconTrash,
} from "@tabler/icons-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ── Types ──────────────────────────────────────────────────────────────────

export type MemberRole = "Admin" | "User"

export interface Member {
  _id:        Id<"members">
  name:       string
  handle:     string
  email:      string
  avatarUrl?: string
  role:       "Admin" | "User"
  teams:      number
}

// ── Avatar ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f59e0b", "#3b82f6",
]

function Avatar({ member }: { member: Member }) {
  const initials = member.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase()
  const bg = AVATAR_COLORS[member.name.charCodeAt(0) % AVATAR_COLORS.length]

  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name}
        className="h-8 w-8 rounded-full object-cover"
      />
    )
  }

  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
      style={{ background: bg }}
    >
      {initials}
    </span>
  )
}

// ── Role badge ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === "Admin") {
    return (
      <span className="inline-flex items-center border px-2 py-0.5 text-[11px] font-medium text-foreground">
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      User
    </span>
  )
}

// ── Add Member Dialog ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  emails: "",
  role:   "User" as MemberRole,
  teams:  1,
}

function AddMemberDialog() {
  const addMember             = useMutation(api.members.addMembers)
  const [open, setOpen]       = React.useState(false)
  const [form, setForm]       = React.useState(EMPTY_FORM)
  const [error, setError]     = React.useState("")
  const [skipped, setSkipped] = React.useState<string[]>([])
  const [invalid, setInvalid] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  function set<K extends keyof typeof EMPTY_FORM>(field: K, val: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  async function handleSubmit() {
    const emails = form.emails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)

    if (emails.length === 0) return setError("At least one email is required.")

    setError("")
    setSkipped([])
    setInvalid([])
    setLoading(true)

    try {
      const results = await addMember({
        emails,
        role:  form.role,
        teams: Number(form.teams),
      })

      const skippedEmails = results.filter((r) => r.status === "skipped").map((r) => r.email)
      const invalidEmails = results.filter((r) => r.status === "invalid").map((r) => r.email)
      const anyInvited    = results.some((r) => r.status === "invited")

      setSkipped(skippedEmails)
      setInvalid(invalidEmails)

      if (anyInvited && skippedEmails.length === 0 && invalidEmails.length === 0) {
        setOpen(false)
      } else if (anyInvited) {
        setForm((f) => ({
          ...f,
          emails: [...skippedEmails, ...invalidEmails].join(", "),
        }))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send invites.")
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setForm(EMPTY_FORM)
      setError("")
      setSkipped([])
      setInvalid([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      
      <DialogTrigger >
        <span
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer select-none"
        >
          <IconUserPlus size={14} />
          Invite
        </span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground border rounded px-1 py-0.5">
              {"</>"}
            </span>
            <DialogTitle className="text-base font-medium">
              Invite to your workspace
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-5">

          {/* Emails */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="emails" className="text-sm font-medium">
                Email addresses
              </Label>
              <span className="text-xs text-muted-foreground">comma-separated</span>
            </div>
            <Input
              id="emails"
              type="text"
              placeholder="alice@devvoid.org, bob@devvoid.org…"
              value={form.emails}
              onChange={(e) => set("emails", e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Role</Label>
            <Select
              value={form.role}
              onValueChange={(val) => set("role", val as MemberRole)}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">
                  <div className="flex flex-col">
                    <span>Member</span>
                    <span className="text-xs text-muted-foreground">
                      Full access with limited permissions
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="Admin">
                  <div className="flex flex-col">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Full access including workspace settings
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teams */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Add to team</Label>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <Select
              value={form.teams > 0 ? String(form.teams) : ""}
              onValueChange={(val) => set("teams", Number(val))}
            >
              <SelectTrigger className="h-10 text-sm text-muted-foreground">
                <SelectValue placeholder="Select teams…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Product</SelectItem>
                <SelectItem value="1">Service</SelectItem>
                <SelectItem value="2">Operation</SelectItem>
                
                
              </SelectContent>
            </Select>
          </div>

          {/* Invalid email notice */}
          {invalid.length > 0 && (
            <p className="flex items-start gap-1.5 text-xs text-destructive">
              <IconX size={13} className="mt-0.5 shrink-0" />
              <span>
                Invalid email{invalid.length > 1 ? "s" : ""}:{" "}
                <span className="font-medium">{invalid.join(", ")}</span>
              </span>
            </p>
          )}

          {/* Skipped notice */}
          {skipped.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Already member{skipped.length > 1 ? "s" : ""}, skipped:{" "}
              <span className="text-foreground font-medium">{skipped.join(", ")}</span>
            </p>
          )}

          {/* General error */}
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <IconX size={13} />
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-4 border-t">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !form.emails.trim()}
            className="ml-auto"
          >
            {loading
              ? <><IconLoader2 size={13} className="animate-spin mr-1.5" />Sending…</>
              : "Send invites"
            }
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

// ── Column definitions ─────────────────────────────────────────────────────

function createColumns(onDelete: (id: Id<"members">) => void): ColumnDef<Member>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="flex items-center gap-2.5">
            <Avatar member={m} />
            <div>
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.handle}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "teams",
      header: "Teams",
      cell: ({ row }) => {
        const t = row.original.teams
        return (
          <span className="text-xs text-muted-foreground">
            {t > 0 ? `${t} team` : "—"}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <button
          onClick={() => onDelete(row.original._id)}
          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/row:opacity-100"
          title="Remove member"
        >
          <IconTrash size={14} />
        </button>
      ),
    },
  ]
}

// ── MembersTable ───────────────────────────────────────────────────────────

export function MembersTable() {
  // ── Fix 2: skip the query until Clerk has resolved auth ──
  const { isLoaded, isSignedIn } = useAuth()
  const rawMembers = useQuery(
  api.members.listMembers,
  !isLoaded || !isSignedIn ? "skip" : {}
)
   
  const removeMember = useMutation(api.members.removeMembers)
  const isLoading = !isLoaded || !isSignedIn || rawMembers === undefined
 
  const [searchValue, setSearchValue]     = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const data: Member[] = rawMembers ?? []

  const filteredData = React.useMemo(() => {
    const q = searchValue.toLowerCase()
    if (!q) return data
    return data.filter(
      (m) =>
        m.name.toLowerCase().includes(q)  ||
        m.email.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q)
    )
  }, [data, searchValue])

  const columns = React.useMemo(
    () => createColumns((id) => removeMember({ id })),
    [removeMember]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Show spinner while auth is resolving OR while query is in flight
 

  function handleExportCSV() {
    const headers = ["Name", "Handle", "Email", "Role", "Teams"]
    const csvRows = data.map((m) => [m.name, m.handle, m.email, m.role, m.teams])
    const csv     = [headers, ...csvRows].map((r) => r.join(",")).join("\n")
    const blob    = new Blob([csv], { type: "text/csv" })
    const url     = URL.createObjectURL(blob)
    const a       = document.createElement("a")
    a.href        = url
    a.download    = "members.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Members</h1>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <IconSearch
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <IconDownload size={14} />
            Export CSV
          </Button>
          <AddMemberDialog />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <IconLoader2 size={16} className="animate-spin" />
                    Loading members…
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group/row"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}