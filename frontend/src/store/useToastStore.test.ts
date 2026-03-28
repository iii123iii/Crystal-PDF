import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToastStore } from './useToastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToastStore – addToast', () => {
  it('adds a success toast', () => {
    useToastStore.getState().addToast('success', 'Operation complete')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Operation complete')
  })

  it('adds an error toast', () => {
    useToastStore.getState().addToast('error', 'Something went wrong')
    const { toasts } = useToastStore.getState()
    expect(toasts[0].type).toBe('error')
  })

  it('assigns a unique id to each toast', () => {
    useToastStore.getState().addToast('success', 'First')
    useToastStore.getState().addToast('success', 'Second')
    const { toasts } = useToastStore.getState()
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('can hold multiple toasts', () => {
    useToastStore.getState().addToast('success', 'A')
    useToastStore.getState().addToast('error', 'B')
    useToastStore.getState().addToast('success', 'C')
    expect(useToastStore.getState().toasts).toHaveLength(3)
  })

  it('auto-removes the toast after 6 seconds', () => {
    useToastStore.getState().addToast('success', 'Temporary')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(6000)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('stores an optional action', () => {
    const action = { label: 'Undo', onClick: vi.fn() }
    useToastStore.getState().addToast('success', 'Done', action)
    const { toasts } = useToastStore.getState()
    expect(toasts[0].action).toEqual(action)
  })
})

describe('useToastStore – removeToast', () => {
  it('removes only the specified toast', () => {
    useToastStore.getState().addToast('success', 'Keep me')
    useToastStore.getState().addToast('error', 'Remove me')
    const { toasts } = useToastStore.getState()
    const removeId = toasts[1].id

    useToastStore.getState().removeToast(removeId)

    const remaining = useToastStore.getState().toasts
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('Keep me')
  })

  it('is a no-op for unknown ids', () => {
    useToastStore.getState().addToast('success', 'Toast')
    useToastStore.getState().removeToast('nonexistent-id')
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('clears all toasts when each is removed', () => {
    useToastStore.getState().addToast('success', 'A')
    useToastStore.getState().addToast('success', 'B')
    const ids = useToastStore.getState().toasts.map((t) => t.id)
    ids.forEach((id) => useToastStore.getState().removeToast(id))
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
