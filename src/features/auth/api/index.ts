import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'

import type { ResponseAPI, ResponseFirebase } from '@/@types/Response'
import api from '@/config/axios'
import { auth, providerGoogle } from '@/config/firebase'
import type { User } from '../types/user.types'

const FIREBASE_ERRORS: Record<string, string> = {
  'Firebase: Error (auth/email-already-in-use).':
    'The email address is already in use by another account.',
  'Firebase: Error (auth/invalid-email).': 'The email address is not valid.',
  'Firebase: Error (auth/operation-not-allowed).': 'Operation not allowed. Please contact support.',
  'Firebase: Error (auth/weak-password).':
    'The password is too weak. Please choose a stronger password.',
  'Firebase: Error (auth/user-disabled).':
    'The user account has been disabled by an administrator.',
  'Firebase: Error (auth/user-not-found).': 'There is no user corresponding to the given email.',
  'Firebase: Error (auth/wrong-password).': 'The password is invalid.',
  'Firebase: Error (auth/invalid-credential).': 'Invalid authentication credential.',
  'Firebase: Error (auth/popup-closed-by-user).':
    'The popup has been closed by the user before finalizing the operation.',
}

async function signInWithEmail(email: string, password: string): Promise<ResponseFirebase> {
  return signInWithEmailAndPassword(auth, email, password)
    .then((user) => {
      const token = user.user.getIdToken()
      return {
        msg: 'User login successfully',
        data: { token, user },
        status: 200,
      }
    })
    .catch((error) => {
      return {
        error: FIREBASE_ERRORS[error.message] ?? 'Login failed',
        status: 404,
      }
    })
}

async function signInGoogle(): Promise<ResponseFirebase> {
  return signInWithPopup(auth, providerGoogle)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result)
      if (!credential) {
        throw new Error('Error to login with google')
      }
      const token = credential.accessToken
      return {
        msg: 'User logged',
        data: { token, user: result.user },
        status: 200,
      }
    })
    .catch((error) => {
      return {
        msg: 'User no logged',
        error: FIREBASE_ERRORS[error.message] ?? 'Login failed',
        status: 404,
      }
    })
}

async function signUpWithEmailAndPassword(
  email: string,
  password: string,
): Promise<ResponseFirebase> {
  return createUserWithEmailAndPassword(auth, email, password)
    .then(async (user) => {
      const token = await user.user.getIdToken()
      return {
        msg: 'User register successfully',
        data: { token, user },
        status: 200,
      }
    })
    .catch((error) => {
      return {
        error: FIREBASE_ERRORS[error.message] ?? 'Registration failed',
        status: 409,
      }
    })
}

async function logoutUser(): Promise<boolean> {
  return auth
    .signOut()
    .then(() => true)
    .catch(() => false)
}

async function resetPassword(email: string): Promise<ResponseFirebase> {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      return {
        msg: 'Email send',
        data: null,
        status: 200,
      }
    })
    .catch(() => {
      return {
        msg: 'Error: email not send',
        error: 'Error sending password reset email',
        status: 409,
      }
    })
}

async function confirmPasswordResetCode(
  code: string,
  newPassword: string,
): Promise<ResponseFirebase> {
  return confirmPasswordReset(auth, code, newPassword)
    .then(() => {
      return {
        msg: 'Password reset successfully',
        data: null,
        status: 200,
      }
    })
    .catch((error) => {
      return {
        msg: 'Error resetting password',
        error: FIREBASE_ERRORS[error.message] ?? 'Password reset failed',
        status: 409,
      }
    })
}

async function getAuthUser(): Promise<ResponseAPI<User>> {
  return api.get('/users/auth')
}

async function getToken(): Promise<string | null> {
  await auth.authStateReady()
  const t = (await auth.currentUser?.getIdToken()) || null
  if (!t) throw new Error('Token not found')
  return t
}

export {
  confirmPasswordResetCode,
  getAuthUser,
  getToken,
  logoutUser,
  resetPassword,
  signInGoogle,
  signInWithEmail,
  signUpWithEmailAndPassword,
}

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

export function useGetAuthUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getAuthUser,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSignInWithEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInWithEmail(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

export function useSignInGoogle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: signInGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

export function useSignUpWithEmailAndPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signUpWithEmailAndPassword(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

export function useLogoutUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  })
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: ({ code, newPassword }: { code: string; newPassword: string }) =>
      confirmPasswordResetCode(code, newPassword),
  })
}
