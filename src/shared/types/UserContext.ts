import type { User } from "@/features/auth";
import type { ResponseFirebase } from "./Response";

export interface UserContextType {
  user: User | null;
  token: string | null;
  selectedRole: string | null;
  setSelectedRole: (role: string | null) => void;
  isLoading: boolean;
  loggedIn: boolean;
  registerWithEmail: (
    email: string,
    password: string,
  ) => Promise<ResponseFirebase>;
  loginWithEmail: (
    email: string,
    password: string,
  ) => Promise<ResponseFirebase>;
  loginWithGoogle: () => Promise<ResponseFirebase>;
  sendPasswordReset: (email: string) => Promise<ResponseFirebase>;
  confirmPasswordReset: (
    code: string,
    newPassword: string,
  ) => Promise<ResponseFirebase>;
  handleLogout: () => void;
  refreshProfile: () => Promise<void>;
}
