import { AppShell } from "@/components/space/app-shell";
import { requirePair } from "@/lib/auth";
import { signOut } from "@/features/auth/actions";
import { LiveUpdates } from "@/features/adventures/live-updates";

// Private routes must never be prerendered, including during an unconfigured build.
export const dynamic = "force-dynamic";

export default async function SpaceLayout({ children }: { children: React.ReactNode }) {
  await requirePair();
  return <AppShell>
    <div className="mx-auto mb-5 flex max-w-6xl justify-end"><form action={signOut}><button className="min-h-11 rounded-xl px-3 text-xs font-medium text-stone-600 hover:bg-stone-500/10 dark:text-stone-300">Sign out</button></form></div>
    <LiveUpdates />
    {children}
  </AppShell>;
}
