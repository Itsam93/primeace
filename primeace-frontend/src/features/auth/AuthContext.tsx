import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import {
  apiRequest,
  ApiError,
  setCsrfToken
} from "../../lib/api.js";

import type {
  IAdmin,
  IAuthContext,
  ICurrentAdminResponse,
  ILoginCredentials,
  ILoginResponse,
  AuthStatus
} from "./auth.type.js";

const AuthContext = createContext<IAuthContext | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

interface ICsrfResponse {
  csrfToken: string;
}

let csrfRefreshPromise: Promise<string> | null = null;


function refreshCsrfToken(): Promise<string> {
  if (!csrfRefreshPromise) {
    const request = apiRequest<ICsrfResponse>(
      "/auth/csrf",
      { method: "POST" }
    ).then((result) => {
      setCsrfToken(result.csrfToken);
      return result.csrfToken;
    });

    let sharedRequest: Promise<string>;

    sharedRequest = request.finally(() => {
      if (csrfRefreshPromise === sharedRequest) {
        csrfRefreshPromise = null;
      }
    });

    csrfRefreshPromise = sharedRequest;
  }

  return csrfRefreshPromise;
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

      await refreshCsrfToken();

      setAdmin(result.admin);
      setStatus("authenticated");
    } catch (error) {
      setAdmin(null);

      if (error instanceof ApiError && error.status === 401) {
        setCsrfToken(null);
        setStatus("unauthenticated");
        return;
      }

      setStatus("error");
      throw error;
    }
  }, []);

  const login = useCallback(
    async (credentials: ILoginCredentials) => {
      setCsrfToken(null);

      const result = await apiRequest<ILoginResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(credentials)
        }
      );

      setCsrfToken(result.csrfToken);
      setAdmin(result.admin);
      setStatus("authenticated");
    },
    []
  );

  const logout = useCallback(async () => {
    await apiRequest<null>("/auth/logout", {
      method: "POST"
    });

    setCsrfToken(null);
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

        await refreshCsrfToken();

        if (mounted) {
          setAdmin(result.admin);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setAdmin(null);
        setCsrfToken(null);

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
