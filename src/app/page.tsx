import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
      <div className="card w-full p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          TabTally
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          Settle shared expenses with clarity.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-600">
          Track daily expenses, split participants evenly, and see who owes
          whom. Admins approve new users before they can sign in.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/signin">
            Sign in
          </Link>
          <Link className="btn btn-ghost" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
