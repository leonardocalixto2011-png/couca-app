"use server";

import { revalidatePath } from "next/cache";
import { updateMyProfile } from "@/lib/account";
import { signOut } from "@/auth";

export async function updateProfile(data: { name: string; phone: string }) {
  await updateMyProfile(data);
  revalidatePath("/compte");
}

export async function signOutCustomer() {
  await signOut({ redirectTo: "/" });
}
