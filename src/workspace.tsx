import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashBoard from "@/dashboard/Dashboard";
import  VenturesPage  from "@/components/Ventures";
import { ProjectsPage }  from "@/dashboard/project";
import ProjectDetailsPage from "@/dashboard/projectDetails";
import  IssuesPage from "@/dashboard/Issues";
import { ProjectsProvider } from "@/contexts/projects";

export default function App() {
  return (
    <BrowserRouter>
      <ProjectsProvider>
        <Routes>
          <Route path="/" element={<DashBoard />} />
          <Route path="/venture" element={<VenturesPage />} />
          <Route path="/projects" element={<ProjectsPage/>} />
          <Route path="/projects/:id" element={<ProjectDetailsPage/>} />
          <Route path="/issues" element={<IssuesPage/>} />
        </Routes>
      </ProjectsProvider>
    </BrowserRouter>
  );
}