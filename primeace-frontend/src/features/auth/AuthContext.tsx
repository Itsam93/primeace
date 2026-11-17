import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import { apiRequest } from "../../lib/api.js";

import type {
  IAdmin,
  IAuthContext,
  ICurrentAdminResponse,
  ILoginCredentials,
  ILoginResponse,
  AuthStatus
} from "./auth.type.js";

import { ApiError } from "../../lib/api.js";

const AuthContext = createContext<IAuthContext | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<IAdmin | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshAdmin = useCallback(async () => {
    setStatus("loading");

    try {
      const result = await apiRequest<ICurrentAdminResponse>(
        "/auth/me"
      );

      setAdmin(result.admin);
      setStatus("authenticated");
    } catch (error) {
      setAdmin(null);

      if (error instanceof ApiError && error.status === 401) {
        setStatus("unauthenticated");
        return;
      }

      setStatus("error");
      throw error;
    }
  }, []);

  const login = useCallback(
    async (credentials: ILoginCredentials) => {
      const result = await apiRequest<ILoginResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials)
        }
      );

      setAdmin(result.admin);
      setStatus("authenticated");
    },
    []
  );

  const logout = useCallback(async () => {
    await apiRequest<null>("/auth/logout", {
      method: "POST"
    });

    setAdmin(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const result = await apiRequest<ICurrentAdminResponse>(
          "/auth/me"
        );

        if (mounted) {
          setAdmin(result.admin);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setAdmin(null);

        if (error instanceof ApiError && error.status === 401) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    };

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        admin,
        status,
        login,
        logout,
        refreshAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): IAuthContext {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider."
    );
  }

  return context;
}
