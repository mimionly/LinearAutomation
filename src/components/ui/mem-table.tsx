"use client"

import  type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Personal = {
  id: string
  customer: string
  email: string
  amount: number
  date: string
}

export const columns: ColumnDef<Personal>[] = [
  { accessorKey: "id", header: "Payment ID" },
  { accessorKey: "customer", header: "Customer" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `$${row.getValue<number>("amount").toFixed(2)}`,
  },
  { accessorKey: "date", header: "Date" },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]