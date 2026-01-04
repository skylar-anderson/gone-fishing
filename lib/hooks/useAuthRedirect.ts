'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

interface UseAuthRedirectOptions {
  /** Where to redirect when authenticated (default: '/') */
  redirectTo?: string;
  /** If true, redirects authenticated users away (for login/register pages) */
  redirectAuthenticated?: boolean;
  /** If true, redirects unauthenticated users away (for protected pages) */
  redirectUnauthenticated?: boolean;
  /** Where to redirect unauthenticated users (default: '/login') */
  unauthenticatedRedirect?: string;
}

/**
 * Hook to handle auth-based redirects, session restoration, and clear stale auth errors.
 *
 * Usage:
 * - Login/Register pages: useAuthRedirect({ redirectAuthenticated: true })
 * - Protected pages: useAuthRedirect({ redirectUnauthenticated: true })
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    redirectTo = '/',
    redirectAuthenticated = false,
    redirectUnauthenticated = false,
    unauthenticatedRedirect = '/login',
  } = options;

  const router = useRouter();
  const { connected, playerName, setAuthError } = useGameStore();
  const { restoreSession } = useWebSocket();
  const [isRestoring, setIsRestoring] = useState(redirectUnauthenticated); // Only restore on protected pages
  const hasAttemptedRestore = useRef(false);

  const isAuthenticated = connected && !!playerName;

  // Attempt session restoration on mount (for protected pages only)
  useEffect(() => {
    // Only restore on protected pages, and only once
    if (!redirectUnauthenticated || hasAttemptedRestore.current) {
      setIsRestoring(false);
      return;
    }

    // If already authenticated, no need to restore
    if (isAuthenticated) {
      setIsRestoring(false);
      return;
    }

    hasAttemptedRestore.current = true;

    restoreSession()
      .then((restored) => {
        if (!restored) {
          setIsRestoring(false);
        }
        // If restored successfully, the WebSocket handlers will update state
        // and isAuthenticated will become true, triggering the next effect
      })
      .catch(() => {
        setIsRestoring(false);
      });
  }, [redirectUnauthenticated, isAuthenticated, restoreSession]);

  // Update restoring state when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      setIsRestoring(false);
    }
  }, [isAuthenticated]);

  // Clear stale auth errors when mounting auth pages
  useEffect(() => {
    if (redirectAuthenticated) {
      setAuthError(null);
    }
  }, [redirectAuthenticated, setAuthError]);

  // Handle redirects (don't redirect while restoring)
  useEffect(() => {
    if (isRestoring) return;

    if (redirectAuthenticated && isAuthenticated) {
      router.replace(redirectTo);
    } else if (redirectUnauthenticated && !isAuthenticated) {
      router.replace(unauthenticatedRedirect);
    }
  }, [
    isAuthenticated,
    isRestoring,
    redirectAuthenticated,
    redirectUnauthenticated,
    redirectTo,
    unauthenticatedRedirect,
    router,
  ]);

  return { isAuthenticated, isRestoring };
}
