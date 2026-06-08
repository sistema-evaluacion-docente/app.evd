const FIREBASE_ERRORS: Record<string, string> = {
  "Firebase: Error (auth/email-already-in-use).":
    "The email address is already in use by another account.",
  "Firebase: Error (auth/invalid-email).": "The email address is not valid.",
  "Firebase: Error (auth/operation-not-allowed).":
    "Operation not allowed. Please contact support.",
  "Firebase: Error (auth/weak-password).":
    "The password is too weak. Please choose a stronger password.",
  "Firebase: Error (auth/user-disabled).":
    "The user account has been disabled by an administrator.",
  "Firebase: Error (auth/user-not-found).":
    "There is no user corresponding to the given email.",
  "Firebase: Error (auth/wrong-password).": "The password is invalid.",
  "Firebase: Error (auth/invalid-credential).":
    "Invalid authentication credential.",
  "Firebase: Error (auth/popup-closed-by-user).":
    "The popup has been closed by the user before finalizing the operation.",
};

export { FIREBASE_ERRORS };
