"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acknowledgeAlert(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  const supabase = createClient();
  await supabase
    .from("alerts")
    .update({ status: "acknowledged" })
    .eq("id", id);

  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
