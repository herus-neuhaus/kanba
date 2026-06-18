import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache padrão de 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

// Inicialização segura do PostHog apenas no cliente
if (typeof window !== 'undefined') {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY || 'SUA_CHAVE_AQUI', {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
    autocapture: true,
  });
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PostHogProvider>
  );
}
