import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import './index.css'
import App from './App.tsx'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="max-w-md rounded-xl border border-gray-800 bg-gray-800/50 p-8 shadow-2xl backdrop-blur-sm">
          <h1 className="mb-4 text-2xl font-bold text-red-400">Missing Configuration</h1>
          <p className="mb-4 text-gray-300">
            Please add your Clerk API key to your <code className="rounded bg-gray-900 px-2 py-1">.env.local</code> file:
          </p>
          <pre className="rounded-lg bg-gray-950 p-4 font-mono text-sm text-green-400">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_dGVuZGVyLXdhbGxhYnktNTEuY2xlcmsuYWNjb3VudHMuZGV2JA
          </pre>
          <div className="mt-6 flex h-1 w-full overflow-hidden rounded-full bg-gray-700">
            <div className="h-full w-1/3 animate-pulse bg-red-500"></div>
          </div>
        </div>
      </div>
    )}
  </StrictMode>,
)
