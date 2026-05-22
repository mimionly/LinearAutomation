import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { ThemeProvider } from "./components/theme-provider"
import { ClerkProvider } from "@clerk/clerk-react"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import "./index.css"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY



ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexProvider client={convex}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <App />
        </ThemeProvider>
      </ConvexProvider>
    </ClerkProvider>
  </React.StrictMode>
)