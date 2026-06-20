import  VenturesPage  from "@/components/Ventures";
import { ProjectsPage } from "@/dashboard/project";
import  IssuesPage  from "@/dashboard/Issues";
import ProjectDetailsPage from "@/dashboard/projectDetails";
import VentureDetailsPage from "@/dashboard/VentureDetailsPage";
import DocumentEditor from "@/dashboard/DocumentEditor";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {SiteHeader} from "@/components/site-header";
import { useLocation } from "react-router-dom";

type Page = "ventures" | "venture-details" | "projects" | "project-details" | "issues" | "document-editor";

const pageMap: Record<Page, React.ReactNode> = {
  ventures: <VenturesPage />,
  "venture-details": <VentureDetailsPage />,
  projects: <ProjectsPage />,
  "project-details": <ProjectDetailsPage />,
  issues: <IssuesPage />,
  "document-editor": <DocumentEditor />,
};

export default function DashBoard() {
  const location = useLocation();
  let page: Page = "ventures";

  if (location.pathname === "/ventures") {
    page = "ventures";
  } else if (location.pathname.startsWith("/ventures/")) {
    page = "venture-details";
  } else if (location.pathname === "/projects") {
    page = "projects";
  } else if (location.pathname.startsWith("/projects/")) {
    page = "project-details";
  } else if (location.pathname === "/issues") {
    page = "issues";
  } else if (location.pathname.startsWith("/document/")) {
    page = "document-editor";
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 50)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col min-h-0">
          <div className="@container/main flex flex-1 flex-col min-h-0">
            {pageMap[page]}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}