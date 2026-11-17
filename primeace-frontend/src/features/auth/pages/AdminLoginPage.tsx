import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail
} from "lucide-react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";

import { ApiError } from "../../../lib/api.js";
import { useAuth } from "../AuthContext.js";

function AdminLoginPage() {
  const { login, status } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const from = (
    location.state as {
      from?: { pathname?: string };
    } | null
  )?.from?.pathname;

  if (status === "authenticated") {
    return (
      <Navigate
        to={from?.startsWith("/admin") && from !== "/admin/login"
          ? from
          : "/admin"}
        replace
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password
      });

      navigate(
        from?.startsWith("/admin") && from !== "/admin/login"
          ? from
          : "/admin",
        { replace: true }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(
          "Unable to sign in. Please check your connection and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07152F] px-5 py-12">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-blue-600/15 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-48 -right-40 size-[500px] rounded-full bg-blue-400/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-blue-100/70 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to website
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/20 sm:p-10">
          <div className="mb-9">
            <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-[#1556D6] text-white">
              <LockKeyhole size={23} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1556D6]">
              PrimeAce Administration
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#07152F]">
              Welcome back
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Sign in to access your administrator workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@primeace.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-[#07152F] outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-[#07152F] outline-none transition placeholder:text-slate-400 focus:border-[#1556D6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#07152F]"
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1556D6] px-5 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign in to dashboard"
              )}
            </button>
          </form>

          <p className="mt-8 border-t border-slate-100 pt-6 text-center text-xs leading-5 text-slate-400">
            This area is restricted to authorised PrimeAce administrators.
          </p>
        </div>

        <p className="mt-7 text-center text-xs text-blue-100/40">
          © {new Date().getFullYear()} PrimeAce. All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default AdminLoginPage;
