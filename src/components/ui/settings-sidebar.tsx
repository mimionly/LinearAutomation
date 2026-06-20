import { 
    Sidebar, 
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem, 
    SidebarHeader,
    SidebarMenuButton
} from "@/components/ui/sidebar";
import { 
    ChevronLeftIcon,
    FileIcon,
    HandshakeIcon,
    UserRoundIcon,
    UsersIcon,
  
} from "lucide-react";
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function SettingsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const menuItems = [
        { path: "/settings/profile", label: "Profile", icon: <FileIcon className="size-4 shrink-0" /> },
        { path: "/settings/teams", label: "Teams", icon: <HandshakeIcon className="size-4 shrink-0" /> },
        { path: "/settings/members", label: "Members", icon: <UserRoundIcon className="size-4 shrink-0" /> },
        { path: "/settings/squads", label: "Squads", icon: <UsersIcon className="size-4 shrink-0" /> },
      
    ];

    return (
        <Sidebar collapsible="offcanvas" {...props}>    
            <SidebarHeader className="border-b border-zinc-200 dark:border-zinc-800/40 p-3">
                <SidebarMenu>
                    <SidebarMenuItem>   
                        <SidebarMenuButton 
                            className="px-2.5 py-2 w-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50 rounded-md transition-all duration-200 flex items-center gap-2.5" 
                            onClick={() => navigate("/")}
                        >
                            <ChevronLeftIcon className="size-4 shrink-0" />
                            <span className="font-sansserif text-sm">Back To App</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="p-3">
                <SidebarMenu className="gap-1.5">
                    {menuItems.map((item) => {
                        const isActive = currentPath === item.path;
                        return (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton 
                                    className={`px-2.5 py-2 w-full rounded-md transition-all duration-200 flex items-center gap-2.5 ${
                                        isActive 
                                            ? "text-zinc-900 bg-zinc-100 dark:text-white dark:bg-zinc-800/30 font-semibold" 
                                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
                                    }`}
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.icon}
                                    <span className="font-sansserif text-sm">{item.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}