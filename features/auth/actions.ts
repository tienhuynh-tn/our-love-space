"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import type { ActionState } from "@/types/adventures";
import { signInErrorMessage } from "@/lib/auth-errors";

export async function signIn(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!supabaseConfig()) return { error: "This space is not connected yet. Complete the Supabase setup first." };
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string" || email.length > 320 || password.length > 1024 || !email.includes("@") || !password) return { error: "Enter your email and password." };
  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    // Log diagnostics only: never credentials, tokens, email, or the raw error.
    console.error(`Supabase sign-in failed ${JSON.stringify({ code: error.code ?? null, type: error.name ?? null, status: error.status ?? null })}`);
    return { error: signInErrorMessage(error) };
  }
  const { data: member, error: accessError } = await supabase.rpc("is_pair_member");
  if (accessError || !member) {
    await supabase.auth.signOut();
    if (accessError) {
      console.error(`Supabase membership check failed ${JSON.stringify({ code: accessError.code })}`);
      return { error: "You signed in, but we couldn’t open your private space. Its database setup may be incomplete. Please try again." };
    }
    return { error: "This account does not have access to this private space." };
  }
  revalidatePath("/", "layout");
  redirect("/adventures");
}
export async function signOut() {
  if (supabaseConfig()) await (await serverClient()).auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
