export interface IAdmin {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface ILoginResponse {
  admin: IAdmin;
  csrfToken: string;
  expiresAt: string;
}

export interface ICurrentAdminResponse {
  admin: IAdmin;
}

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export interface IAuthContext {
  admin: IAdmin | null;
  status: AuthStatus;
  login: (credentials: ILoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}
