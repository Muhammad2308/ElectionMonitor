import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { useTheme } from './hooks/useTheme.ts';
import { syncManager } from './api/SyncManager';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline app shell and asset caching
registerSW({ immediate: true });

// Start the offline sync queue listener (retries on 'online' event & intervals)
syncManager.init();

const ThemeInitializer = () => {
  useTheme();
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
