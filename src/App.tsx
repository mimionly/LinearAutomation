import { useUser, useOrganizationList, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SignIn from "@/components/SignIn";
import Dashboard from "./dashboard/Dashboard";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import * as React from "react";
import ProfilePage from "@/components/profile";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SettingsSidebar } from "@/components/ui/settings-sidebar";
import { TeamPage } from "./components/TeamPage";
import Settings from "./organization/organization";
import InvitePage from "./organization/invite";

function SetOrganization() {
  const { setActive, isLoaded } = useOrganizationList();

  useEffect(() => {
    if (!isLoaded || !setActive) return;

    async function activateOrg() {
      try {
        if (setActive) {
          await setActive({
            organization: "org_3EJbtVXoKoDBj8uY9kxTUX0Tvgp"
          });
        }
      } catch (err) {
        console.error("Failed to auto-activate organization:", err);
      }
    }

    activateOrg();
  }, [isLoaded, setActive]);

  return null;
}



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
  );
}

export default function App() {
  const { user, isSignedIn, isLoaded } = useUser();
  const logAction = useMutation(api.linear.logUserAction);
 
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const alreadyLogged = localStorage.getItem("hasLoggedLogin");
      if (!alreadyLogged) {
        logAction({ clerkId: user.id, action: "login" }).catch(console.error);
        localStorage.setItem("hasLoggedLogin", "true");
      }
    }
  }, [isSignedIn, user?.id, logAction]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isSignedIn && <SetOrganization />}
      <Routes>
        {isSignedIn ? (
          <>
            <Route path="/settings" element={<SettingsLayout />}>
             
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="teams"   element={<TeamPage />} />
              <Route path="members" element={<Settings />} />
              <Route path="squads"  element={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Squads coming soon.
                </div>
              } />
            </Route>

            <Route path="/invite" element={<InvitePage />} />
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
  );
}