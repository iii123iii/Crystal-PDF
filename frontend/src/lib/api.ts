import { useAppStore } from '../store/useAppStore'

/**
 * Thin wrapper around fetch for API calls.
 * Auth is handled via an HttpOnly cookie set by the backend — no token management needed here.
 * On 401, clears local auth state and redirects to login.
 * Supports AbortController for request cancellation on component unmount.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Always send cookies
  })

  if (res.status === 401 && !window.location.pathname.startsWith('/login')) {
    useAppStore.getState().clearAuth()
    window.location.href = '/login'
  }

  return res
}

/**
 * Hook utility to create an AbortController tied to component lifecycle.
 * Call in useEffect cleanup to cancel pending requests on unmount.
 *
 * Example:
 *   const controller = useAbortController()
 *   useEffect(() => {
 *     apiFetch('/api/data', { signal: controller.signal })
 *     return () => controller.abort()
 *   }, [])
 */
export function createAbortController(): AbortController {
  return new AbortController()
}
