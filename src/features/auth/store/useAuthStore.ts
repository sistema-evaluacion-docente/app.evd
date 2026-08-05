import { create } from 'zustand'

import type { ResponseFirebase } from '@/@types/Response'
import { auth } from '@/config/firebase'
import {
  confirmPasswordResetCode,
  getAuthUser,
  logoutUser,
  resetPassword,
  signInGoogle,
  signInWithEmail,
  signUpWithEmailAndPassword,
} from '../api'
import type { User } from '../types/user.types'

interface AuthState {
  user: User | null
  token: string | null
  selectedRole: string | null
  isLoading: boolean
  loggedIn: boolean
}

interface AuthActions {
  setSelectedRole: (role: string | null) => void
  registerWithEmail: (email: string, password: string) => Promise<ResponseFirebase>
  loginWithEmail: (email: string, password: string) => Promise<ResponseFirebase>
  loginWithGoogle: () => Promise<ResponseFirebase>
  sendPasswordReset: (email: string) => Promise<ResponseFirebase>
  confirmPasswordReset: (code: string, newPassword: string) => Promise<ResponseFirebase>
  handleLogout: () => Promise<void>
  refreshProfile: () => Promise<void>
  subscribeToAuth: () => () => void
}

type AuthStore = AuthState & AuthActions

const getInitialSelectedRole = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('selectedRole') ?? null
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  selectedRole: getInitialSelectedRole(),
  isLoading: true,
  loggedIn: false,

  setSelectedRole: (role) => {
    const { user } = get()

    if (!role) {
      set({ selectedRole: null })
      localStorage.removeItem('selectedRole')
      return
    }

    if (user && !user.roles.includes(role)) {
      return
    }

    set({ selectedRole: role })
    localStorage.setItem('selectedRole', role)
  },

  registerWithEmail: async (email, password) => {
    set({ isLoading: false })
    return signUpWithEmailAndPassword(email, password)
  },

  loginWithEmail: async (email, password) => {
    return signInWithEmail(email, password)
  },

  loginWithGoogle: async () => {
    return signInGoogle()
  },

  sendPasswordReset: async (email) => {
    return resetPassword(email)
  },

  confirmPasswordReset: async (code, newPassword) => {
    return confirmPasswordResetCode(code, newPassword)
  },

  handleLogout: async () => {
    set({ isLoading: true })

    try {
      await logoutUser()
      set({
        user: null,
        token: null,
        selectedRole: null,
        loggedIn: false,
        isLoading: false,
      })
      localStorage.removeItem('selectedRole')
    } finally {
      set({ isLoading: false })
    }
  },

  refreshProfile: async () => {
    const { token } = get()
    if (!token) return

    try {
      const response = await getAuthUser()
      const userProfile = response.data as User
      if (userProfile) {
        set({ user: userProfile })
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  },

  subscribeToAuth: () => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email === null) {
          set({ isLoading: false })
          return
        }

        const userInfo: User = {
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          username: firebaseUser.email.split('@')[0],
          department_id: null,
          department_name: null,
          avatar_url: firebaseUser.photoURL || '',
          active: true,
          roles: [],
          teacher_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const token = await firebaseUser.getIdToken(true)

        const { user } = get()
        if (user) {
          set({ isLoading: false })
          return
        }

        set({ token })

        try {
          const response = await getAuthUser()
          const userProfile = (response.data ?? userInfo) as User

          set({ user: userProfile })

          const storedRole = localStorage.getItem('selectedRole')
          const roleToSet = storedRole ?? userProfile.roles[0] ?? null

          set({
            selectedRole: roleToSet,
            loggedIn: response.status === 'success',
            isLoading: false,
          })

          if (roleToSet) {
            localStorage.setItem('selectedRole', roleToSet)
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error)

          set({
            user: userInfo,
            loggedIn: false,
            isLoading: false,
          })
        }
      } else {
        set({
          user: null,
          token: null,
          loggedIn: false,
          isLoading: false,
        })
      }
    })

    return unsubscribe
  },
}))
