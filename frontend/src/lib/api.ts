import { useAppStore } from '../store/useAppStore'

/**
 * Thin wrapper around fetch that automatically attaches the JWT Bearer token
 * when one is present in the Zustand store. Use this for all API calls.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAppStore.getState().token
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(url, { ...options, headers })
}
