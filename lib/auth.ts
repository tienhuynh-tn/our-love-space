import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverClient } from "./supabase/server";
import { supabaseConfig } from "./supabase/config";

export const requirePair = cache(async () => {
  if (!supabaseConfig()) redirect("/login");
  const supabase = await serverClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) redirect("/login");
  const { data: pair, error: pairError } = await supabase.from("private_pair").select("*").eq("id", true).maybeSingle();
  if (pairError) throw new Error("We couldn’t open your private space. Please try again.");
  if (!pair || ![pair.person_one, pair.person_two].includes(data.claims.sub)) redirect("/login?access=denied");
  return { supabase, userId: data.claims.sub, pair };
});
