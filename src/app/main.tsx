import { Toaster } from '@/components/ui/sonner.tsx'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthInitializer } from '@/features/auth/components/AuthInitializer'

import '@fontsource-variable/figtree/wght.css'
import '@fontsource-variable/host-grotesk/wght.css'

import { RouteError } from '@/components/common/RouteError'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App.tsx'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary FallbackComponent={RouteError}>
        <AuthInitializer>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <App />
              <Toaster position="bottom-left" />
            </TooltipProvider>
          </QueryClientProvider>
        </AuthInitializer>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
