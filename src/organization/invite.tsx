import { OrganizationProfile } from "@clerk/clerk-react";

import { useEffect } from "react";

export default function InvitePage() {

  useEffect(() => {
    if (window.location.hash !== "#/organization-members") {
      window.location.hash = "/organization-members";
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background p-4 md:p-10 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Members & Invites</h1>
          <p className="text-muted-foreground text-sm">
            Manage workspace memberships and invite new collaborators.
          </p>
        </div>
      
      </div>

      <div className="flex-1 w-full min-h-[600px] flex">
        <OrganizationProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: {
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                alignItems: "stretch",
              },
              cardBox: {
                width: "100%",
                maxWidth: "100%",
                boxShadow: "none",
                border: "none",
                background: "transparent",
                padding: "0",
                gap: "0",               // ← removes space reserved for navbar column
              },
              card: {
                width: "100%",
                maxWidth: "100%",
                boxShadow: "none",
                border: "none",
                background: "transparent",
                flexDirection: "column", // ← switches row layout to column, collapsing the gap
              },
              navbar: {
                display: "none",
              },
              navbarMobileMenuRow: {
                display: "none",
              },
              scrollBox: {
                width: "100%",
                maxWidth: "100%",
                border: "none",
                boxShadow: "none",
                paddingLeft: "0",        // ← removes leftover left offset
                marginLeft: "0",
              },
              pageScrollBox: {
                width: "100%",
                maxWidth: "100%",
                padding: "0",
              },
              page: {
                width: "100%",
                maxWidth: "100%",
              },
              pageContent: {
                width: "100%",
                maxWidth: "100%",
              },
            },
          }}
        />
      </div>
    </div>
  );
}