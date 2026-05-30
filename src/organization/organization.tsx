import { OrganizationProfile } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useMembers } from "../lib/membertable";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

export default function Settings() {
  const { members } = useMembers();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (window.location.hash !== "#/organization-members") {
      window.location.hash = "/organization-members";
    }
  }, []);

  function handleExportCSV() {
    if (!members || members.length === 0) return;
    const headers = ["Name", "Email", "Role", "UserId"];
    const csvRows = members.map((m) => [m.name, m.email, m.clerkRole, m.id]);
    const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace_members.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex flex-col h-full px-4 py-8 sm:px-6 md:px-10 gap-6">

        {/* Header */}
        <div className="flex-none flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Members</h1>
            <p className="text-sm text-muted-foreground">
              Manage your workspace members and invitations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!members || members.length === 0}
            className="gap-2 w-full sm:w-auto shrink-0"
          >
            <DownloadIcon className="size-4" />
            Export CSV
          </Button>
        </div>

        {/* Clerk panel — flex-1 + min-h-0 so it fills remaining height */}
        <div className="flex-1 min-h-0 h-full w-full overflow-auto">
          <OrganizationProfile
            routing="hash"
            appearance={{
              baseTheme: resolvedTheme === "dark" ? dark : undefined,
              elements: {
                rootBox: {
                  width: "100%",
                  maxWidth: "100%",
                },
                cardBox: {
                  width: "100%",
                  maxWidth: "100%",
                  padding: "0",
                  gap: "0",
                },
                card: {
                  width: "100%",
                  maxWidth: "100%",
                  flexDirection: "row",
                  gap: "0",
                },
                scrollBox: {
                  width: "100%",
                  maxWidth: "100%",
                  justifyContent: "flex-start",
                  paddingLeft: "0",
                  marginLeft: "0",
                },
                pageScrollBox: {
                  width: "100%",
                  maxWidth: "100%",
                  justifyContent: "flex-start",
                  paddingLeft: "0",
                  marginLeft: "0",
                },
                page: {
                  width: "100%",
                  maxWidth: "100%",
                  marginLeft: "0",
                  marginRight: "auto",
                },
                pageContent: {
                  width: "100%",
                  maxWidth: "100%",
                  marginLeft: "0",
                  marginRight: "auto",
                },
                membersPage: {
                  width: "100%",
                  maxWidth: "none",
                },
                profilePage: {
                  width: "100%",
                  maxWidth: "none",
                },
                profileSection: {
                  width: "100%",
                  maxWidth: "none",
                },
              }
            }}
          />
        </div>

      </div>
    </div>
  );
}