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
import { useOrganization } from "@clerk/clerk-react";



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { organization } = useOrganization();
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu >
              <DropdownMenuTrigger >
                <SidebarMenuButton className="p-1.5 w-full flex items-center gap-2">
                  {organization ? (
                    <>
                      <img 
                        src={organization.imageUrl} 
                        alt={organization.name} 
                        className="size-6 rounded-md object-cover border border-border" 
                      />
                      <span className="text-sm font-semibold truncate text-foreground">{organization.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="size-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground border border-dashed border-border shrink-0">
                        N/A
                      </div>
                      <span className="text-sm font-medium text-muted-foreground truncate">Select Workspace</span>
                    </>
                  )}
                  <ChevronDownIcon className="ml-auto size-4 opacity-50 shrink-0" />
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