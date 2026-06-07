import { OrganizationProfile } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export default function InvitePage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (window.location.hash !== "#/organization-members") {
      window.location.hash = "/organization-members";
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background p-4 sm:p-6 md:p-10 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3.5 border-b pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="self-start px-2.5 py-1.5 h-auto text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50 rounded-md transition-all duration-200 flex items-center gap-2"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span className="font-sansserif text-sm">Back to App</span>
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Members & Invites</h1>
          <p className="text-muted-foreground text-sm">
            Manage workspace memberships and invite new collaborators.
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[600px] flex">
        <OrganizationProfile
          routing="hash"
          appearance={{
            baseTheme: resolvedTheme === "dark" ? dark : undefined,
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