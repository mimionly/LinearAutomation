import * as React from "react"
import { mockProjects, getIssuesByProjectId } from "@/data/mock-data"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Label } from "@/components/ui/label"
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconCircleX,
  IconCalendar,
  IconLayoutColumns,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconUser,
} from "@tabler/icons-react"
import { Loader, LoaderCircle } from "lucide-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"

import { Button } from "@/components/ui/button"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
} from "@/components/ui/tabs"

import { schema } from "@/lib/schema"

function createColumns(): ColumnDef<z.infer<typeof schema>>[] {
  return [
    {
      accessorKey: "header",
      header: "Project Name",
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} />
      },
      enableHiding: false,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-muted-foreground" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const val = row.original.progress;
        const pct = Math.round(val * 100);
        return (
          <div className="flex items-center gap-2" title={`${pct}%`}>
            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8">{pct}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "health",
      header: "Health",
      cell: ({ row }) => {
        const h = row.original.health;
        const healthMap: Record<string, string> = {
          onTrack: "On Track",
          atRisk: "At Risk",
          offTrack: "Off Track",
          noData: "No Data",
        };
        const label = healthMap[h] ?? (h || null);
        if (!label) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-muted-foreground">{label}</span>
        );
      },
    },
    {
      accessorKey: "leadName",
      header: "Lead",
      cell: ({ row }) => {
        const name = row.original.leadName;
        const email = row.original.leadEmail;
        if (!name) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <span
            className="inline-flex items-center gap-1 text-xs text-foreground"
            title={email}
          >
            <IconUser size={13} className="text-muted-foreground" />
            {name}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status?.toLowerCase() ?? "";
        const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
          backlog: { icon: <IconCircleDashed size={14} />, color: "text-muted-foreground", label: "Backlog" },
          planned: { icon: <IconCalendar size={14} />, color: "text-muted-foreground", label: "Planned" },
          "in progress": { icon: <LoaderCircle size={14} />, color: "text-foreground", label: "In Progress" },
          "in-progress": { icon: <LoaderCircle size={14} />, color: "text-foreground", label: "In Progress" },
          started: { icon: <Loader size={14} />, color: "text-foreground", label: "Started" },
          completed: { icon: <IconCircleCheckFilled size={14} />, color: "text-foreground", label: "Completed" },
          canceled: { icon: <IconCircleX size={14} />, color: "text-muted-foreground", label: "Canceled" },
        };
        const cfg = statusConfig[s] ?? { icon: <IconCircleDashed size={14} />, color: "text-slate-400", label: row.original.status };
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const p = row.original.priority;
        const priorityConfig: Record<number, { icon: React.ReactNode; label: string; color: string }> = {
          0: { icon: <IconCircleDashed size={14} />, label: "None", color: "text-muted-foreground" },
          1: { icon: <IconAlertCircle size={14} />, label: "Urgent", color: "text-foreground" },
          2: { icon: <IconArrowUp size={14} />, label: "High", color: "text-foreground" },
          3: { icon: <IconMinus size={14} />, label: "Medium", color: "text-foreground" },
          4: { icon: <IconArrowDown size={14} />, label: "Low", color: "text-muted-foreground" },
        };
        const cfg = priorityConfig[p] ?? priorityConfig[0];
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: () => (
        <></>
      ),
    },
  ]
}

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable() {
  const [data, setData] = React.useState<z.infer<typeof schema>[]>(() => mockProjects)

  const columns = React.useMemo(() => createColumns(), [])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}


function ProjectIssuesTable({ projectId }: { projectId: string }) {
  const issues = getIssuesByProjectId(projectId)

  if (issues.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        No issues found for this project.
      </div>
    )
  }

  const priorityLabel = (p: number | undefined) => {
    const map: Record<number, string> = { 0: "None", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low" }
    return map[p ?? 0] ?? "None"
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Issue</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Priority</TableHead>
            <TableHead className="text-xs">Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue._id}>
              <TableCell className="text-xs font-medium">{issue.title}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {issue.state?.name ?? "—"}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {priorityLabel(issue.priority)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {issue.assignee?.name ?? "Unassigned"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TableCellViewer({
  item,
}: {
  item: z.infer<typeof schema>
}) {
  const isMobile = useIsMobile()

  const healthMap: Record<string, { label: string; color: string }> = {
    onTrack: { label: "On Track", color: "text-emerald-500" },
    atRisk: { label: "At Risk", color: "text-amber-500" },
    offTrack: { label: "Off Track", color: "text-red-500" },
    noData: { label: "No Data", color: "text-muted-foreground" },
  }
  const healthCfg = healthMap[item.health] ?? { label: item.health || "—", color: "text-muted-foreground" }

  const priorityMap: Record<number, string> = { 0: "None", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low" }
  const pct = Math.round((item.progress ?? 0) * 100)

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Project details and associated issues
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6 text-sm">
          {/* ── Project metadata ── */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground">Description</Label>
            <div className="font-medium leading-relaxed">{item.description || "—"}</div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Status</Label>
              <div className="font-medium">{item.status}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Priority</Label>
              <div className="font-medium">{priorityMap[item.priority] ?? item.priority}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Health</Label>
              <div className={`font-medium ${healthCfg.color}`}>{healthCfg.label}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Progress</Label>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            </div>
          </div>

          {(item.leadName || item.leadEmail) && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground">Lead</Label>
              <div className="inline-flex items-center gap-1 font-medium">
                <IconUser size={14} className="text-muted-foreground" />
                {item.leadName}{item.leadEmail ? ` (${item.leadEmail})` : ""}
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {item.content && (
            <>
              <Separator />
              <div className="flex flex-col gap-1.5">
                <Label className="text-muted-foreground">Content</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
            </>
          )}

          {/* ── Project issues sub-table ── */}
          <Separator />
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground">Issues</Label>
            <ProjectIssuesTable projectId={item.linearId} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}