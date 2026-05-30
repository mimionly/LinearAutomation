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
    UsersIcon
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";

export function SettingsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const navigate = useNavigate();
    return (
        <Sidebar collapsible="offcanvas" {...props}>    
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>   
                        <SidebarMenuButton className="p-1 w-full" onClick={() => navigate("/")}>
                            <ChevronLeftIcon className="size-4" />
                            <span className=" font-sansserif">Back To App</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="p-1 w-full" onClick={() => navigate("/settings/profile")}>
                            <FileIcon className="size-4" />
                            <span className=" font-sansserif">Profile</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    

                    <SidebarMenuItem>
                        <SidebarMenuButton className="p-1 w-full" onClick={() => navigate("/settings/teams")}>
                            <HandshakeIcon className="size-4" />
                            <span className=" font-sansserif">Teams</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                  
                    <SidebarMenuItem>
                        <SidebarMenuButton className="p-1 w-full" onClick={() => navigate("/settings/members")}>
                            <UserRoundIcon className="size-4" />
                            <span className=" font-sansserif">Members</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    
                    <SidebarMenuItem>
                        <SidebarMenuButton className="p-1 w-full" onClick={() => navigate("/settings/squads")}>
                            <UsersIcon className="size-4" />
                            <span className=" font-sansserif">Squads</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}