import { useAppStore } from '../store/useAppStore'

/**
 * Thin wrapper around fetch for API calls.
 * Auth is handled via an HttpOnly cookie set by the backend — no token management needed here.
 * On 401, clears local auth state and redirects to login.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, options)

  if (res.status === 401 && !window.location.pathname.startsWith('/login')) {
    useAppStore.getState().clearAuth()
    window.location.href = '/login'
  }

  return res
}
