import { useUser, SignInButton, SignUpButton, AuthenticateWithRedirectCallback, useSignIn, UserButton } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { LayoutDashboard, Shield, Menu, X, Loader2, Github } from "lucide-react";
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
  const { user } = useUser();

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

      <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-3 w-full">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 border border-white/10",
                userButtonPopoverCard: "bg-zinc-950 border border-white/10",
                userPreviewSecondaryIdentifier: "text-zinc-400",
                userPreviewMainIdentifier: "text-white",
              }
            }}
          />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium text-white truncate">{user?.fullName || "User"}</span>
            <span className="text-xs text-zinc-400 truncate">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
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
          <>
            <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
            <Route path="*" element={<SignInPage />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

// --- Page Components ---

function SignInPage() {
  const { signIn } = useSignIn();
  const [authError, setAuthError] = useState("");

  const handleGithubClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!signIn) return;
    try {
      setAuthError("");
      await signIn.authenticateWithRedirect({
        strategy: "oauth_github",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("GitHub Auth Error:", err);
      setAuthError(err.errors?.[0]?.longMessage || err.message || "Failed to authenticate with GitHub");
    }
  };

  const handleGoogleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!signIn) return;
    try {
      setAuthError("");
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setAuthError(err.errors?.[0]?.longMessage || err.message || "Failed to authenticate with Google");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow effects for the sign-in modal itself */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

        <img
          src="/devVoid.jpeg"
          alt="Devvoid"
          className="h-16 w-auto rounded-2xl mx-auto mb-6 relative z-10"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="mb-2 text-3xl font-bold text-white relative z-10">Devvoid</h1>
        <p className="mb-8 text-zinc-400 relative z-10">Streamlined task management dashboard linked with our Linear organization.</p>

        {authError && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400 relative z-10 text-left">
            {authError}
          </div>
        )}

        <div className="space-y-4 relative z-10 w-full max-w-sm mx-auto">
          <button
            onClick={handleGithubClick}
            className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#24292e] hover:bg-[#2f363d] border border-white/10 px-6 py-3 font-semibold text-white transition shadow-lg"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </button>

          <button
            onClick={handleGoogleClick}
            className="w-full flex items-center justify-center gap-3 rounded-lg bg-white hover:bg-zinc-200 border border-white/10 px-6 py-3 font-semibold text-black transition shadow-lg"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center py-2 relative z-10">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-zinc-500 uppercase">Or use email</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2">
            <SignInButton mode="modal">
              <button className="w-full rounded-lg bg-indigo-500/10 border border-indigo-500/50 px-4 py-3 font-semibold text-indigo-400 hover:bg-indigo-500/20 transition shadow-lg">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full rounded-lg bg-indigo-600 border border-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-500 transition shadow-lg">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
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
      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-8 w-8 border border-white/10",
              userButtonPopoverCard: "bg-zinc-950 border border-white/10",
            }
          }}
        />
        <button onClick={onMenuOpen} className="text-zinc-400 hover:text-white transition">
          <Menu className="h-6 w-6" />
        </button>
      </div>
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