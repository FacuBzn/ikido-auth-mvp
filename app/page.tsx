import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { getDashboardPathByRole } from "@/lib/authRoutes";

type HomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const authUser = await getAuthenticatedUser();

  if (authUser) {
    redirect(getDashboardPathByRole(authUser.profile.role));
  }

  const redirectToParam = searchParams?.redirectTo;
  const rawRedirectTo =
    typeof redirectToParam === "string"
      ? redirectToParam
      : Array.isArray(redirectToParam)
        ? redirectToParam[0]
        : undefined;
  const redirectTo =
    rawRedirectTo && rawRedirectTo.startsWith("/") ? rawRedirectTo : undefined;

  const loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login";
  const registerHref = "/register";

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-slate-950">
      <header className="flex items-center justify-between px-6 py-4 text-white">
        <div className="text-lg font-semibold">iKidO</div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href={loginHref}
            className="rounded-full border border-sky-500/60 px-4 py-2 font-semibold text-sky-400 transition hover:border-sky-400 hover:text-sky-300"
          >
            Sign in
          </Link>
          <Link
            href={registerHref}
            className="rounded-full bg-sky-500 px-4 py-2 font-semibold text-white transition hover:bg-sky-400"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 items-center justify-center px-6 py-16 text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Family mission control for goals, rewards, and habits.
          </h1>
          <p className="text-lg text-slate-300 md:text-xl">
            iKidO helps parents and children stay aligned on responsibilities. Track chores,
            award points, and celebrate progress together from a single shared dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={registerHref}
              className="rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-400"
            >
              Get started
            </Link>
            <Link
              href={loginHref}
              className="rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
