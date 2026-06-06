import { useNavigate } from "react-router-dom";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOutIcon, SettingsIcon, UserPlusIcon } from "lucide-react";
import { useClerk } from "@clerk/clerk-react"

export default function DevVoidDropdown() {
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const handleLogout = async () => {
    await signOut();
  }
  return (
    <DropdownMenuContent
      className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
      align="start"
      side="bottom"
      sideOffset={4}
    >
      <DropdownMenuItem onClick={() => navigate("/settings")}>
        <SettingsIcon className="mr-2 size-4" />
        Settings
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate("/invite")}>
        <UserPlusIcon className="mr-2 size-4" />
        Invite & Manage Members
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOutIcon className="mr-2 <text-red-500 size-4"
        />
        Log Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}