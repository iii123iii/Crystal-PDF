import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAppStore } from '../store/useAppStore'

// We import apiFetch dynamically so we can fully control window.location
// The module is re-imported fresh for each relevant test via dynamic import

beforeEach(() => {
  useAppStore.setState({
    activeTool: null,
    userEmail: 'alice@example.com',
    isAdmin: false,
    passwordChangeRequired: false,
    theme: 'dark',
  })
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiFetch', () => {
  it('returns the response for a successful request', async () => {
    const { apiFetch } = await import('./api')
    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 })
    vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse)

    const res = await apiFetch('/api/test')

    expect(res.status).toBe(200)
  })

  it('passes options to fetch', async () => {
    const { apiFetch } = await import('./api')
    const mockResponse = new Response(null, { status: 201 })
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse)

    await apiFetch('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/documents', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    })
  })

  it('clears auth and redirects on 401 outside /login', async () => {
    // Simulate being on /workspace
    Object.defineProperty(window, 'location', {
      value: { pathname: '/workspace', href: '/workspace' },
      writable: true,
      configurable: true,
    })

    const { apiFetch } = await import('./api')
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))

    await apiFetch('/api/documents')

    // Auth should be cleared
    expect(useAppStore.getState().userEmail).toBeNull()
  })

  it('does not redirect when already on /login', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/login', href: '/login' },
      writable: true,
      configurable: true,
    })

    const { apiFetch } = await import('./api')
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))

    const res = await apiFetch('/api/login')

    // Still returns the 401 without side-effects
    expect(res.status).toBe(401)
    // User should remain authenticated in store (no clearAuth was called)
    expect(useAppStore.getState().userEmail).toBe('alice@example.com')
  })

  it('returns error responses without throwing', async () => {
    const { apiFetch } = await import('./api')
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('Not Found', { status: 404 }))
    Object.defineProperty(window, 'location', {
      value: { pathname: '/workspace', href: '/workspace' },
      writable: true,
      configurable: true,
    })

    const res = await apiFetch('/api/missing')

    expect(res.status).toBe(404)
  })
})
