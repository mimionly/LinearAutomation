
import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useProjects, useIssues } from "@/hooks/use-linear-data"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


export const description = "An interactive area chart"

const chartConfig = {
  Projects: {
    label: "Projects",
    color: "#0f172a", // dark black
  },
  Issues: {
    label: "Issues",
    color: "#cbd5e1", // light grey
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  const projects = useProjects() || []
  const issues = useIssues() || []

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(() => {
    const dateMap = new Map<string, { date: string, Projects: number, Issues: number }>()

    // Pre-fill the last 90 days to ensure a continuous line even with 1 data point
    const today = new Date()
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dateMap.set(dateStr, { date: dateStr, Projects: 0, Issues: 0 })
    }

    // Accepts a string ISO timestamp OR a numeric ms epoch (Convex _creationTime)
    const addDateItem = (timestamp: string | number | undefined, type: "Projects" | "Issues") => {
      if (timestamp === undefined || timestamp === null) return
      const dateObj = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp)
      if (isNaN(dateObj.getTime())) return
      const dateStr = dateObj.toISOString().split('T')[0]

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr, Projects: 0, Issues: 0 })
      }
      dateMap.get(dateStr)![type]++
    }

    // Use createdAt first, fall back to _creationTime (Convex built-in ms timestamp)
    projects.forEach(p => addDateItem(p.createdAt ?? p._creationTime, "Projects"))
    issues.forEach(i => addDateItem(i.createdAt ?? i._creationTime, "Issues"))

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [projects, issues])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Area Chart </CardTitle>
          <CardDescription>
            Showing Projects and Issues based on time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(value) => { if (value) setTimeRange(value) }}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillProjects" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Projects)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Projects)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillIssues" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Issues)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Issues)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              width={30}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="Projects"
              type="natural"
              fill="url(#fillProjects)"
              stroke="var(--color-Projects)"
              strokeWidth={2}
              strokeOpacity={1}
              stackId="a"
              connectNulls
            />
            <Area
              dataKey="Issues"
              type="natural"
              fill="url(#fillIssues)"
              stroke="var(--color-Issues)"
              strokeWidth={2}
              strokeOpacity={1}
              stackId="a"
              connectNulls
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
