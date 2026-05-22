import { useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react"
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"
import SignIn from "@/components/SignIn"
import Dashboard from "./dashboard/Dashboard"
import { useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import * as React from "react"
import { MembersTable } from "@/components/members"
import ProfilePage from "@/components/profile"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SettingsSidebar } from "@/components/ui/settings-sidebar"

/* Settings pages use a dedicated sidebar layout */
function SettingsLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 48)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SettingsSidebar variant="inset" />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>

    
  )
}

export default function App() {
  const { user, isSignedIn, isLoaded } = useUser()
  const logAction = useMutation(api.linear.logUserAction)


  useEffect(() => {
    if (isSignedIn && user?.id) {
      const alreadyLogged = localStorage.getItem("hasLoggedLogin");
      if (!alreadyLogged) {
        logAction({ clerkId: user.id, action: "login" }).catch(console.error);
        localStorage.setItem("hasLoggedLogin", "true");
      }
    }
  }, [isSignedIn, user?.id, logAction])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {isSignedIn ? (
          <>
        {/* Settings pages — dedicated sidebar */}
        <Route path="/settings" element={<SettingsLayout />}>
          <Route path="profile" element={<ProfilePage  />} /> 
         
          <Route path="teams" />
         <Route path="members" element={<MembersTable />} />
          <Route path="squads" />
        </Route>

        {/* Main dashboard — catch-all */}
        <Route path="/*" element={<Dashboard />} />
          </>
        ) : (
          <>
            <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
            <Route path="*" element={<SignIn />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}