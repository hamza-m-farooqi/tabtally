"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createAsAdmin, setCreateAsAdmin] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      createAsAdmin,
      adminSecret: form.get("adminSecret"),
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 201) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "PENDING") {
        router.push("/signin?pending=1");
        return;
      }
      router.push("/dashboard");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error || "Sign up failed.");
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
      <div className="card w-full p-8">
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Admins are auto-approved, users require admin approval.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium">Name</label>
            <input name="name" className="input mt-2" required />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input name="email" type="email" className="input mt-2" required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              className="input mt-2"
              required
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={createAsAdmin}
              onChange={(event) => setCreateAsAdmin(event.target.checked)}
            />
            Create as Admin
          </label>
          {createAsAdmin ? (
            <div>
              <label className="text-sm font-medium">
                Admin Signup Secret
              </label>
              <input
                name="adminSecret"
                type="password"
                className="input mt-2"
                required
              />
            </div>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link className="font-semibold text-teal-700" href="/signin">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
