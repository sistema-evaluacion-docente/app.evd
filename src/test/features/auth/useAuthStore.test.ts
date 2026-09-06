import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { User } from '@/features/auth/types/user.types'

const api = vi.hoisted(() => ({
  confirmPasswordResetCode: vi.fn(),
  getAuthUser: vi.fn(),
  logoutUser: vi.fn(),
  resetPassword: vi.fn(),
  signInGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmailAndPassword: vi.fn(),
}))

const authState = vi.hoisted(() => ({ callback: null as ((user: unknown) => void) | null }))

vi.mock('@/features/auth/api', () => api)

vi.mock('@/config/firebase', () => ({
  auth: {
    onAuthStateChanged: (cb: (user: unknown) => void) => {
      authState.callback = cb
      return vi.fn()
    },
  },
  providerGoogle: {},
}))

const { useAuthStore } = await import('@/features/auth/store/useAuthStore')

function fireAuthChange(user: unknown) {
  return act(async () => {
    await authState.callback?.(user)
  })
}

const baseUser: User = {
  uid: 'abc',
  name: 'Ana',
  username: 'ana',
  email: 'ana@ufps.edu.co',
  active: true,
  department_id: null,
  roles: ['DOCENTE'],
  avatar_url: '',
  teacher_id: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  authState.callback = null
  useAuthStore.setState({
    user: null,
    token: null,
    selectedRole: null,
    isLoading: true,
    loggedIn: false,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('setSelectedRole', () => {
  it('clears the role and localStorage when given null', () => {
    useAuthStore.setState({ selectedRole: 'DOCENTE' })
    localStorage.setItem('selectedRole', 'DOCENTE')

    useAuthStore.getState().setSelectedRole(null)

    expect(useAuthStore.getState().selectedRole).toBeNull()
    expect(localStorage.getItem('selectedRole')).toBeNull()
  })

  it('refuses a role the signed-in user does not hold', () => {
    useAuthStore.setState({ user: baseUser, selectedRole: 'DOCENTE' })

    useAuthStore.getState().setSelectedRole('ADMIN')

    expect(useAuthStore.getState().selectedRole).toBe('DOCENTE')
  })

  it('sets and persists a role the user does hold', () => {
    useAuthStore.setState({ user: baseUser })

    useAuthStore.getState().setSelectedRole('DOCENTE')

    expect(useAuthStore.getState().selectedRole).toBe('DOCENTE')
    expect(localStorage.getItem('selectedRole')).toBe('DOCENTE')
  })

  it('sets a role freely when there is no user yet', () => {
    useAuthStore.getState().setSelectedRole('DOCENTE')

    expect(useAuthStore.getState().selectedRole).toBe('DOCENTE')
  })
})

describe('delegating actions', () => {
  it('registerWithEmail turns off loading and delegates', async () => {
    api.signUpWithEmailAndPassword.mockResolvedValue({ status: 'success' })

    await useAuthStore.getState().registerWithEmail('a@a.com', 'pw')

    expect(useAuthStore.getState().isLoading).toBe(false)
    expect(api.signUpWithEmailAndPassword).toHaveBeenCalledWith('a@a.com', 'pw')
  })

  it('loginWithEmail delegates to the api', async () => {
    api.signInWithEmail.mockResolvedValue({ status: 'success' })

    await useAuthStore.getState().loginWithEmail('a@a.com', 'pw')

    expect(api.signInWithEmail).toHaveBeenCalledWith('a@a.com', 'pw')
  })

  it('loginWithGoogle delegates to the api', async () => {
    api.signInGoogle.mockResolvedValue({ status: 'success' })

    await useAuthStore.getState().loginWithGoogle()

    expect(api.signInGoogle).toHaveBeenCalled()
  })

  it('sendPasswordReset delegates to the api', async () => {
    api.resetPassword.mockResolvedValue({ status: 'success' })

    await useAuthStore.getState().sendPasswordReset('a@a.com')

    expect(api.resetPassword).toHaveBeenCalledWith('a@a.com')
  })

  it('confirmPasswordReset delegates to the api', async () => {
    api.confirmPasswordResetCode.mockResolvedValue({ status: 'success' })

    await useAuthStore.getState().confirmPasswordReset('code', 'newpw')

    expect(api.confirmPasswordResetCode).toHaveBeenCalledWith('code', 'newpw')
  })
})

describe('handleLogout', () => {
  it('clears the session and the stored role even when logoutUser rejects', async () => {
    api.logoutUser.mockRejectedValue(new Error('network'))
    useAuthStore.setState({ user: baseUser, token: 't', selectedRole: 'DOCENTE', loggedIn: true })
    localStorage.setItem('selectedRole', 'DOCENTE')

    await expect(useAuthStore.getState().handleLogout()).rejects.toThrow('network')

    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('resets the store on a successful logout', async () => {
    api.logoutUser.mockResolvedValue(undefined)
    useAuthStore.setState({ user: baseUser, token: 't', selectedRole: 'DOCENTE', loggedIn: true })

    await useAuthStore.getState().handleLogout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.loggedIn).toBe(false)
    expect(localStorage.getItem('selectedRole')).toBeNull()
  })
})

describe('refreshProfile', () => {
  it('does nothing without a token', async () => {
    await useAuthStore.getState().refreshProfile()

    expect(api.getAuthUser).not.toHaveBeenCalled()
  })

  it('stores the fetched profile', async () => {
    useAuthStore.setState({ token: 't' })
    api.getAuthUser.mockResolvedValue({ data: baseUser })

    await useAuthStore.getState().refreshProfile()

    expect(useAuthStore.getState().user).toEqual(baseUser)
  })

  it('swallows a failed refresh instead of throwing', async () => {
    useAuthStore.setState({ token: 't' })
    api.getAuthUser.mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(useAuthStore.getState().refreshProfile()).resolves.toBeUndefined()
  })
})

describe('subscribeToAuth', () => {
  it('clears the session when firebase reports no user', async () => {
    useAuthStore.getState().subscribeToAuth()

    await fireAuthChange(null)

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.loggedIn).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('stops loading without a session when the firebase user has no email', async () => {
    useAuthStore.getState().subscribeToAuth()

    await fireAuthChange({ email: null })

    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('fetches and stores the profile, adopting the stored role', async () => {
    localStorage.setItem('selectedRole', 'DOCENTE')
    api.getAuthUser.mockResolvedValue({ data: baseUser, status: 'success' })
    useAuthStore.getState().subscribeToAuth()

    await fireAuthChange({
      email: baseUser.email,
      uid: baseUser.uid,
      displayName: baseUser.name,
      photoURL: '',
      getIdToken: vi.fn().mockResolvedValue('tok'),
    })

    const state = useAuthStore.getState()
    expect(state.user).toEqual(baseUser)
    expect(state.selectedRole).toBe('DOCENTE')
    expect(state.loggedIn).toBe(true)
  })

  it('falls back to the profile own first role when nothing was stored', async () => {
    api.getAuthUser.mockResolvedValue({ data: baseUser, status: 'success' })
    useAuthStore.getState().subscribeToAuth()

    await fireAuthChange({
      email: baseUser.email,
      uid: baseUser.uid,
      displayName: baseUser.name,
      photoURL: '',
      getIdToken: vi.fn().mockResolvedValue('tok'),
    })

    expect(useAuthStore.getState().selectedRole).toBe('DOCENTE')
    expect(localStorage.getItem('selectedRole')).toBe('DOCENTE')
  })

  it('falls back to a minimal profile when fetching it fails', async () => {
    api.getAuthUser.mockRejectedValue(new Error('down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useAuthStore.getState().subscribeToAuth()

    await fireAuthChange({
      email: 'x@ufps.edu.co',
      uid: 'uid',
      displayName: '',
      photoURL: '',
      getIdToken: vi.fn().mockResolvedValue('tok'),
    })

    const state = useAuthStore.getState()
    expect(state.user?.email).toBe('x@ufps.edu.co')
    expect(state.loggedIn).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  it('does nothing further once a user is already in the store', async () => {
    useAuthStore.setState({ user: baseUser })
    useAuthStore.getState().subscribeToAuth()

    await fireAuthChange({
      email: baseUser.email,
      uid: baseUser.uid,
      displayName: baseUser.name,
      photoURL: '',
      getIdToken: vi.fn().mockResolvedValue('tok'),
    })

    expect(api.getAuthUser).not.toHaveBeenCalled()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
