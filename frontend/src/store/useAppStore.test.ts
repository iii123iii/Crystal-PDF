import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './useAppStore'

// Reset store to initial state before each test
beforeEach(() => {
  localStorage.clear()
  useAppStore.setState({
    activeTool: null,
    userEmail: null,
    isAdmin: false,
    passwordChangeRequired: false,
    theme: 'dark',
  })
})

describe('useAppStore – activeTool', () => {
  it('starts as null', () => {
    expect(useAppStore.getState().activeTool).toBeNull()
  })

  it('setActiveTool updates the tool', () => {
    useAppStore.getState().setActiveTool('watermark')
    expect(useAppStore.getState().activeTool).toBe('watermark')
  })

  it('setActiveTool can be reset to null', () => {
    useAppStore.getState().setActiveTool('split')
    useAppStore.getState().setActiveTool(null)
    expect(useAppStore.getState().activeTool).toBeNull()
  })
})

describe('useAppStore – auth', () => {
  it('starts unauthenticated', () => {
    const { userEmail, isAdmin, passwordChangeRequired } = useAppStore.getState()
    expect(userEmail).toBeNull()
    expect(isAdmin).toBe(false)
    expect(passwordChangeRequired).toBe(false)
  })

  it('setAuth persists email and flags', () => {
    useAppStore.getState().setAuth('alice@example.com', false, false)
    const { userEmail, isAdmin, passwordChangeRequired } = useAppStore.getState()
    expect(userEmail).toBe('alice@example.com')
    expect(isAdmin).toBe(false)
    expect(passwordChangeRequired).toBe(false)
  })

  it('setAuth sets isAdmin flag', () => {
    useAppStore.getState().setAuth('admin@example.com', true, false)
    expect(useAppStore.getState().isAdmin).toBe(true)
  })

  it('setAuth sets passwordChangeRequired flag', () => {
    useAppStore.getState().setAuth('user@example.com', false, true)
    expect(useAppStore.getState().passwordChangeRequired).toBe(true)
  })

  it('clearAuth resets to unauthenticated state', () => {
    useAppStore.getState().setAuth('alice@example.com', true, true)
    useAppStore.getState().clearAuth()
    const { userEmail, isAdmin, passwordChangeRequired } = useAppStore.getState()
    expect(userEmail).toBeNull()
    expect(isAdmin).toBe(false)
    expect(passwordChangeRequired).toBe(false)
  })
})

describe('useAppStore – theme', () => {
  it('starts as dark', () => {
    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('toggleTheme switches dark→light', () => {
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe('light')
  })

  it('toggleTheme switches light→dark', () => {
    useAppStore.setState({ theme: 'light' })
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('toggleTheme is idempotent when called twice', () => {
    const initial = useAppStore.getState().theme
    useAppStore.getState().toggleTheme()
    useAppStore.getState().toggleTheme()
    expect(useAppStore.getState().theme).toBe(initial)
  })
})
