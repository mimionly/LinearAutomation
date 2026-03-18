import { useUser, SignOutButton, SignInButton } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { LayoutDashboard, Shield, LogOut, Menu, X, Loader2 } from "lucide-react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface NavLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

// --- Constants ---
const NAV_LINKS: NavLink[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Admin Panel", href: "/admin", icon: Shield, adminOnly: true },
];

const ADMIN_ROUTES = ["/admin"];

// --- Components ---

function ProtectedRoute({ children, requiredRole = "admin" }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, isLoaded } = useUser();
  const dbUser = useQuery(api.users.getCurrentUser, { clerkId: user?.id });
  const location = useLocation();

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (ADMIN_ROUTES.includes(location.pathname) && dbUser?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Sidebar({ onClose, userRole }: { onClose?: () => void; userRole?: string }) {
  const location = useLocation();

  const links = NAV_LINKS.filter(link => !link.adminOnly || userRole === "admin");

  return (
    <aside className="w-64 border-r border-white/10 bg-zinc-950/50 p-4 flex flex-col h-full glass-panel">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img
            src="/devVoid.jpeg"
            alt="Devvoid"
            className="h-10 w-auto rounded-xl"
            onError={(e) => { e.currentTarget.src = "/fallback-logo.png"; }}
          />
          <span className="text-xl font-bold tracking-tight text-white">Devvoid</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-zinc-400 hover:text-white transition" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <SignOutButton>
          <button className="flex w-full items-center gap-3 rounded-lg p-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}

// --- Main Application ---

export default function App() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {isSignedIn ? (
          <Route path="/*" element={<MainLayout />} />
        ) : (
          <Route path="*" element={<SignInPage />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

// --- Page Components ---

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
        <img
          src="/devVoid.jpeg"
          alt="Devvoid"
          className="h-16 w-auto rounded-2xl mx-auto mb-6"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="mb-2 text-3xl font-bold text-white">Devvoid</h1>
        <p className="mb-8 text-zinc-400">Streamlined task management dashboard linked with our Linear organization.</p>
        <SignInButton mode="modal">
          <button className="w-full rounded-lg bg-indigo-500/10 border border-indigo-500/50 px-6 py-3 font-semibold text-indigo-400 hover:bg-indigo-500/20 transition">
            Sign In to Dashboard
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

function MainLayout() {
  const { user } = useUser();
  const dbUser = useQuery(api.users.getCurrentUser, { clerkId: user?.id });
  const syncUser = useMutation(api.users.syncUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync user data
  useEffect(() => {
    if (user && dbUser === undefined) {
      syncUser({
        clerkId: user.id,
        name: user.fullName || undefined,
        email: user.primaryEmailAddress?.emailAddress,
      });
    }
  }, [user, dbUser, syncUser]);

  const userRole = dbUser?.role;

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-zinc-100">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <Sidebar userRole={userRole} />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute right-0 h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar onClose={() => setMobileMenuOpen(false)} userRole={userRole} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader onMenuOpen={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav userRole={userRole} />
      </div>
    </div>
  );
}

function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/50 glass-panel">
      <div className="flex items-center gap-2">
        <img src="/devVoid.jpeg" alt="Devvoid" className="h-8 w-auto rounded-lg" onError={(e) => { e.currentTarget.src = "/fallback-logo.png"; }} />
        <span className="font-bold text-white">Devvoid</span>
      </div>
      <button onClick={onMenuOpen} className="text-zinc-400 hover:text-white transition">
        <Menu className="h-6 w-6" />
      </button>
    </div>
  );
}

function BottomNav({ userRole }: { userRole?: string }) {
  const location = useLocation();
  const links = NAV_LINKS.filter(link => !link.adminOnly || userRole === "admin");

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/10 bg-zinc-950/80 glass-panel pb-3 pt-1 z-40">
      <nav className="flex items-center justify-around px-2">
        {links.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg min-w-[4rem] transition-all duration-200",
                isActive
                  ? "text-indigo-400 -translate-y-1"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}