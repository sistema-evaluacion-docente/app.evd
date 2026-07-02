import {
  GoogleAuthProvider,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { auth, providerGoogle } from "@/config/firebase";
import type { ResponseFirebase } from "@/shared/types/Response";
import { FIREBASE_ERRORS } from "@/shared/lib/firebaseErrors";

/**
 * Logs out the user.
 * @returns A promise that resolves to a ResponseFirebase object.
 */
const logoutUser = async (): Promise<boolean> => {
  return auth
    .signOut()
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};

/**
 * Signs up a user with the provided email and password.
 * @param email - The email of the user.
 * @param password - The password of the user.
 * @returns A Promise that resolves to a ResponseFirebase object.
 */
const signUpWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<ResponseFirebase> => {
  return createUserWithEmailAndPassword(auth, email, password)
    .then(async (user) => {
      const token = await user.user.getIdToken();

      return {
        msg: "User register successfully",
        data: { token, user },
        status: 200,
      };
    })
    .catch((error) => {
      return {
        error: FIREBASE_ERRORS[error.message] ?? "Registration failed",
        status: 409,
        // data: errors[error.message],
      };
    });
};

/**
 * Sign in with email and password.
 *
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns A promise that resolves to a ResponseFirebase object containing the login result.
 */
const signInWithEmail = async (
  email: string,
  password: string,
): Promise<ResponseFirebase> => {
  return signInWithEmailAndPassword(auth, email, password)
    .then((user) => {
      const token = user.user.getIdToken();

      return {
        msg: "User login successfully",
        data: { token, user },
        status: 200,
      };
    })
    .catch((error) => {
      return {
        error: FIREBASE_ERRORS[error.message] ?? "Login failed",
        status: 404,
        // data: errors[error.message],
      };
    });
};

/**
 * Sign in with Google.
 * @returns A promise that resolves to a ResponseFirebase object.
 */
const signInGoogle = async (): Promise<ResponseFirebase> => {
  return signInWithPopup(auth, providerGoogle)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new Error("Error to login with google");
      }

      const token = credential.accessToken;

      return {
        msg: "User logged",
        data: { token, user: result.user },
        status: 200,
      };
    })
    .catch((error) => {
      return {
        msg: "User no logged",
        error: FIREBASE_ERRORS[error.message] ?? "Login failed",
        status: 404,
        // data: errors[error.message],
      };
    });
};

/**
 * Sends a password reset email to the specified email address.
 * @param email - The email address to send the password reset email to.
 * @returns A Promise that resolves to a ResponseFirebase object containing the status and data of the operation.
 */
const resetPassword = async (email: string): Promise<ResponseFirebase> => {
  return sendPasswordResetEmail(auth, email)
    .then(() => {
      return {
        msg: "Email send",
        data: null,
        status: 200,
      };
    })
    .catch(() => {
      return {
        msg: "Error: email not send",
        error: "Error sending password reset email",
        status: 409,
        // data: errors[error.message],
      };
    });
};

/**
 * Confirms the password reset with the provided code and new password.
 * @param code - The password reset code.
 * @param newPassword - The new password.
 * @returns A Promise that resolves to a ResponseFirebase object.
 */
const confirmPasswordResetCode = async (
  code: string,
  newPassword: string,
): Promise<ResponseFirebase> => {
  return confirmPasswordReset(auth, code, newPassword)
    .then(() => {
      return {
        msg: "Password reset successfully",
        data: null,
        status: 200,
      };
    })
    .catch((error) => {
      return {
        msg: "Error resetting password",
        error: FIREBASE_ERRORS[error.message] ?? "Password reset failed",
        status: 409,
      };
    });
};

async function getToken(): Promise<string | null> {
  // Wait for Firebase to restore the session before reading currentUser.
  // On a hard reload, currentUser is null until onAuthStateChanged fires.
  await auth.authStateReady();

  const t = (await auth.currentUser?.getIdToken()) || null;

  if (!t) throw new Error("Token not found");

  return t;
}

export {
  confirmPasswordResetCode,
  getToken,
  logoutUser,
  resetPassword,
  signInGoogle,
  signInWithEmail,
  signUpWithEmailAndPassword,
};
