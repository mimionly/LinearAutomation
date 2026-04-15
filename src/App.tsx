import { useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Loader2 } from "lucide-react"
import SignIn from "@/components/SignIn"       
import Page from "./dashboard/page"            
import { useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"

export default function App() {
  const { user, isSignedIn, isLoaded } = useUser()
  const logAction = useMutation(api.linear.logUserAction)

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const alreadyLogged = sessionStorage.getItem("hasLoggedLogin");
      if (!alreadyLogged) {
        logAction({ clerkId: user.id, action: "login" }).catch(console.error);
        sessionStorage.setItem("hasLoggedLogin", "true");
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
          <Route path="/*" element={<Page />} />         
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