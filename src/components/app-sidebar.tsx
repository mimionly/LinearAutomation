import * as React from "react";
import {
  
  ChevronDownIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DevVoidDropdown from "@/dashboard/devVoid-dropdown";



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu >
              <DropdownMenuTrigger  >
                <SidebarMenuButton className="p-1.5 w-full">
                  <img src="/devVoid.jpeg" alt="DevVoid" className="size-9 rounded-md" />
                  <span className="text-base font-semibold">DevVoid</span>
                  <ChevronDownIcon className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

             <DevVoidDropdown />
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent />

      <SidebarFooter />
    </Sidebar>
  );
}