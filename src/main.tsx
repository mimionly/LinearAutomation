import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { ThemeProvider } from "./components/theme-provider"
import { ClerkProvider , useAuth} from "@clerk/clerk-react"

import "./index.css"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY



ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth = {useAuth}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <App />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>
)