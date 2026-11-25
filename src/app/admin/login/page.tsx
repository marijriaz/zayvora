
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid username or password.");
        return;
      }

      router.replace("/admin");
      router.refresh();

    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fff8f0] px-4 py-10">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10">

        {/* Logo / Brand */}
        <div className="mb-8 text-center">

          <h1 className="text-4xl font-bold tracking-wide text-[#292522]">
            ZAYVORA
          </h1>

          <p className="mt-2 text-sm tracking-widest text-gray-500">
            RESTAURANT & DINING
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-[#e87532]" />

        </div>

        {/* Heading */}
        <div className="mb-7 text-center">

          <h2 className="text-2xl font-bold text-gray-800">
            Admin Login
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage your restaurant menu.
          </p>

        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username */}
          <div>

            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              maxLength={256}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-[#e87532] focus:ring-2 focus:ring-[#e87532]/20 disabled:bg-gray-100"
            />

          </div>

          {/* Password */}
          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <div className="relative">

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                maxLength={1024}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-14 text-gray-800 outline-none transition focus:border-[#e87532] focus:ring-2 focus:ring-[#e87532]/20 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#c85c23] hover:text-[#e87532]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>

            </div>

          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-lg bg-[#e87532] py-3.5 font-semibold text-white transition hover:bg-[#c85c23] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-5 text-center">

          <p className="text-xs text-gray-500">
            Authorized administrators only.
          </p>

          <p className="mt-2 text-xs text-gray-400">
            © {new Date().getFullYear()} Zayvora Restaurant
          </p>

        </div>

      </div>

    </main>
  );
}
