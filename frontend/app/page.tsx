
"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <style jsx global>{`
        @keyframes moveTrainingBackground {
          0% {
            transform: scale(1.05) translateX(0);
          }

          50% {
            transform: scale(1.13) translateX(-1.5%);
          }

          100% {
            transform: scale(1.08) translateX(1.5%);
          }
        }

        .training-background {
          animation: moveTrainingBackground 25s ease-in-out infinite alternate;
        }

        @media (prefers-reduced-motion: reduce) {
          .training-background {
            animation: none;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="bg-blue-950 px-6 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              TRAINING COURSE REGISTRATION SYSTEM
            </h1>

            <p className="mt-1 text-sm text-blue-200">
              Training and Employee Development Platform
            </p>
          </div>

          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-white px-6 py-3 font-bold text-blue-950 transition hover:bg-blue-100"
          >
            LOGIN
          </button>
        </div>
      </header>

      {/* HERO SECTION WITH MOVING BACKGROUND IMAGE */}
      <section className="relative isolate overflow-hidden bg-blue-950 px-6 py-24 text-center text-white sm:py-32">

        {/* MOVING BACKGROUND IMAGE */}
        <div
          className="training-background absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage: "url('/training-office.png')",
          }}
        />

        {/* BLUE OVERLAY */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950/85 via-blue-900/75 to-blue-800/80" />

        {/* ORIGINAL TEXT - NOT CHANGED */}
        <div className="relative mx-auto max-w-4xl">
          <p className="mb-4 font-semibold uppercase tracking-widest text-blue-200">
            Welcome to Our Training Platform
          </p>

          <h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            Build Your Skills.
            <br />
            Improve Your Future.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            The Training Course Registration System helps employees
            discover available training courses, register for learning
            opportunities, and access educational materials.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="mt-8 rounded-lg bg-white px-8 py-4 font-bold text-blue-950 shadow-lg transition hover:bg-blue-100"
          >
            GET STARTED
          </button>
        </div>
      </section>

      {/* SYSTEM FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-blue-950">
            OUR SYSTEM FEATURES
          </h2>

          <p className="mt-3 text-slate-600">
            Everything you need to manage training courses in one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          {/* AVAILABLE COURSES */}
          <div className="rounded-xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1">
            <div className="text-4xl">📚</div>

            <h3 className="mt-4 text-lg font-bold text-blue-950">
              Available Courses
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Discover training courses available for employees.
            </p>
          </div>

          {/* COURSE REGISTRATION */}
          <div className="rounded-xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1">
            <div className="text-4xl">📝</div>

            <h3 className="mt-4 text-lg font-bold text-blue-950">
              Course Registration
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Register for courses and learning opportunities.
            </p>
          </div>

          {/* PDF MATERIALS */}
          <div className="rounded-xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1">
            <div className="text-4xl">📄</div>

            <h3 className="mt-4 text-lg font-bold text-blue-950">
              PDF Materials
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Access learning documents and training materials.
            </p>
          </div>

          {/* ADMINISTRATION */}
          <div className="rounded-xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1">
            <div className="text-4xl">📊</div>

            <h3 className="mt-4 text-lg font-bold text-blue-950">
              Administration
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage courses, registrations, and training activities.
            </p>
          </div>

        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-blue-50 px-6 py-14 text-center">
        <h2 className="text-2xl font-bold text-blue-950">
          Ready to Start Your Training?
        </h2>

        <p className="mt-3 text-slate-600">
          Login to access your training dashboard.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-6 rounded-lg bg-blue-900 px-8 py-3 font-bold text-white hover:bg-blue-800"
        >
          LOGIN TO SYSTEM
        </button>
      </section>

      {/* FOOTER */}
      <footer className="bg-blue-950 px-4 py-7 text-center text-white">
        <div className="flex flex-row flex-nowrap items-center justify-center gap-6 overflow-x-auto text-sm font-bold">
          <p className="whitespace-nowrap">
            REG NUMBER: 223009090
          </p>

          <p className="whitespace-nowrap">
            NAME: NIYIKIZA EMMANUEL
          </p>
        </div>

        <p className="mt-4 text-xs text-blue-200">
          Training Course Registration System
        </p>
      </footer>
    </main>
  );
}
