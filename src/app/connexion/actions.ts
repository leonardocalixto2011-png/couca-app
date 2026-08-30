"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerCustomer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const name = input.name.trim().slice(0, 120);
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, error: "NAME_REQUIRED" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "BAD_EMAIL" };
  if (password.length < 8) return { ok: false, error: "WEAK_PASSWORD" };

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser?.passwordHash) return { ok: false, error: "EMAIL_TAKEN" };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = existingUser
      ? await tx.user.update({ where: { id: existingUser.id }, data: { name, passwordHash } })
      : await tx.user.create({ data: { name, email, role: "CUSTOMER", passwordHash } });

    const customer = await tx.customer.upsert({
      where: { email },
      create: { email, name, userId: user.id },
      update: { userId: user.id, name },
    });

    // Attach any prior guest bookings made with this email.
    await tx.booking.updateMany({
      where: { contactEmail: email, customerId: null },
      data: { customerId: customer.id },
    });
  });

  return { ok: true };
}
