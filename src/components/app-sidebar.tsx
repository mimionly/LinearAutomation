import * as React from "react";
import {
  ChevronDownIcon,
  Mountain,
  Lightbulb,
  CircleDot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DevVoidDropdown from "@/dashboard/devVoid-dropdown";
import { useOrganization } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const navItems = [
  {
    label: "Ventures",
    icon: Mountain,
    href: "/ventures",
  },
  {
    label: "Projects",
    icon: Lightbulb,
    href: "/projects",
  },
  {
    label: "Issues",
    icon: CircleDot,
    href: "/issues",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { organization } = useOrganization();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton className="p-1.5 w-full flex items-center gap-2" />}>
                  {organization ? (
                    <>
                      <img
                        src={organization.imageUrl}
                        alt={organization.name}
                        className="size-6 rounded-md object-cover border border-border"
                      />
                      <span className="text-sm font-semibold truncate text-foreground">
                        {organization.name}
                      </span>
                    </>
                  ) : (
                    <>
                      
                      
                    </>
                  )}
                  <ChevronDownIcon className="ml-auto size-4 opacity-50 shrink-0" />
              </DropdownMenuTrigger>

              <DevVoidDropdown />
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton render={<Link to={item.href} className="flex items-center gap-2" />}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}