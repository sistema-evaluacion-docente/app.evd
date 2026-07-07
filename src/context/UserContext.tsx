import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";

import { auth } from "@/config/firebase";
import type { User } from "@/features/auth";
import {
  confirmPasswordResetCode,
  logoutUser,
  resetPassword,
  signInGoogle,
  signInWithEmail,
  signUpWithEmailAndPassword,
} from "@/features/auth/api/AuthService";
import { getAuthUser } from "@/features/auth/api/UserService";
import type { UserContextType } from "@/shared/types/UserContext";

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRoleState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("selectedRole") ?? null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setSelectedRole = useCallback(
    (role: string | null) => {
      if (!role) {
        setSelectedRoleState(null);
        localStorage.removeItem("selectedRole");
        return;
      }

      if (user && !user.roles.includes(role)) {
        return;
      }

      setSelectedRoleState(role);
      localStorage.setItem("selectedRole", role);

      if (
        location === "/login" ||
        location === "/register" ||
        location === "/"
      ) {
        setLocation("/dashboard", { replace: true });
      }
    },
    [user],
  );

  const registerWithEmail = async (email: string, password: string) => {
    return signUpWithEmailAndPassword(email, password).then(async (res) => {
      setIsLoading(false);
      return res;
    });
  };

  const loginWithEmail = async (email: string, password: string) => {
    return signInWithEmail(email, password).then((res) => {
      return res;
    });
  };

  const loginWithGoogle = async () => {
    return signInGoogle().then((res) => {
      return res;
    });
  };

  const sendPasswordReset = async (email: string) => {
    return resetPassword(email).then((res) => {
      return res;
    });
  };

  const confirmPasswordReset = async (code: string, newPassword: string) => {
    return confirmPasswordResetCode(code, newPassword).then((res) => {
      return res;
    });
  };

  const handleLogout = () => {
    setIsLoading(true);

    logoutUser()
      .then(() => {
        setUser(null);
        setToken(null);
        setSelectedRole(null);
        setIsLoading(false);
        setLocation("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const refreshProfile = async () => {
    if (!token) return;

    try {
      const requestUserProfile = await getAuthUser();
      const userProfile = requestUserProfile.data as User;

      if (userProfile) {
        setUser(userProfile);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  const handleSignIn = useCallback(
    async (userInitialData: User, token: string) => {
      if (user) {
        setIsLoading(false);
        return;
      }

      setToken(token);

      try {
        const requestUserProfile = await getAuthUser();
        const userProfile = (requestUserProfile.data ??
          userInitialData) as User;

        setUser(userProfile);

        const valueBack = localStorage.getItem("selectedRole");
        setSelectedRole(valueBack ?? userProfile.roles[0] ?? null);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setUser(userInitialData);
      }

      setIsLoading(false);

      if (location === "/login" || location === "/register") {
        setLocation("/dashboard");
      }
    },
    [user, setLocation, location, setSelectedRole],
  );

  useEffect(() => {
    const unsuscribeStateChanged = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.email === null) {
          setIsLoading(false);
          return;
        }

        const userInfo: User = {
          email: user.email,
          uid: user.uid,
          name: user.displayName || "",
          username: user.email.split("@")[0],
          department_id: null,
          avatar_url: user.photoURL || "",
          active: true,
          roles: [],
          teacher_id: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const token = await user.getIdToken(true);

        handleSignIn(userInfo, token);
      } else {
        setIsLoading(false);
        setLocation("/login");
      }
    });

    return () => {
      unsuscribeStateChanged();
    };
  }, [handleSignIn, setLocation]);

  const value = useMemo(() => {
    return {
      user,
      token,
      selectedRole,
      setSelectedRole,
      isLoading,
      registerWithEmail,
      loginWithEmail,
      loginWithGoogle,
      sendPasswordReset,
      confirmPasswordReset,
      handleLogout,
      refreshProfile,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, selectedRole, setSelectedRole, isLoading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
