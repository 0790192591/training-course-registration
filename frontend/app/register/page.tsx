
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setMessage("Registration failed: " + error.message);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage(
          "Account created successfully! Please check your email to confirm your account."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(
        "Connection error. Please check your internet connection and Supabase settings."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-2xl font-bold text-blue-900">
          Create Account
        </h1>

        <p className="mb-6 text-center text-slate-500">
          Register for Training Courses
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 block font-medium">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-900 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-blue-900">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
