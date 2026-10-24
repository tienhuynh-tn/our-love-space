import { Card, SectionLabel } from "@/components/ui/card";
import { ActionForm, Field } from "@/components/ui/action-form";
import { signIn } from "@/features/auth/actions";
import { supabaseConfig } from "@/lib/supabase/config";
import Link from "next/link";

export default async function Login({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const { access } = await searchParams;
  return <main className="grid min-h-dvh place-items-center bg-[#f7f0e7] px-4 py-10 dark:bg-[#12100f]">
    <Card className="w-full max-w-md p-6 sm:p-9">
      <SectionLabel>Our Love Space</SectionLabel>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">A little closer, wherever we are.</h1>
      <p className="mb-8 mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">Come inside. This place belongs to just the two of you.</p>
      {!supabaseConfig() ? <p role="status" className="rounded-2xl bg-stone-500/10 p-4 text-sm leading-6">Your private space is waiting to be connected. Follow the Supabase setup in the project README, then come back to sign in.</p> : <>
        {access === "denied" && <p role="alert" className="mb-4 text-sm text-red-800 dark:text-red-200">Only the two provisioned accounts can enter this space.</p>}
        <ActionForm action={signIn} label="Come inside">
          <Field label="Email" name="email" type="email" autoComplete="username" required maxLength={320} />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required maxLength={1024} />
        </ActionForm>
      </>}
      <div className="mt-7 border-t border-stone-500/20 pt-4"><Link href="/english-game" className="inline-flex min-h-11 items-center rounded-xl text-sm font-medium underline underline-offset-4">Practice English numbers · No login needed ↗</Link></div>
    </Card>
  </main>;
}
