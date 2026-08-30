import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { loyaltyState } from "./loyalty";

/** Any signed-in user (customer or admin). Redirects to /connexion otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  return session;
}

/** The Customer row for the signed-in user, creating one if missing. */
export async function getMyCustomer() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { customer: true },
  });
  if (!user) redirect("/connexion");

  let customer = user.customer;
  if (!customer) {
    customer = await prisma.customer.upsert({
      where: { email: user.email ?? `user-${user.id}@placeholder.local` },
      create: {
        email: user.email ?? `user-${user.id}@placeholder.local`,
        name: user.name,
        userId: user.id,
      },
      update: { userId: user.id },
    });
  }
  return { user, customer };
}

export async function getAccountOverview() {
  const { user, customer } = await getMyCustomer();
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { customerId: customer.id },
        customer.email ? { contactEmail: customer.email } : { id: "__none__" },
      ],
    },
    orderBy: { startAt: "desc" },
    take: 50,
    include: { service: true },
  });
  return {
    user,
    customer,
    bookings,
    loyalty: loyaltyState(customer.loyaltyVisits),
  };
}

export async function updateMyProfile(data: { name: string; phone: string }) {
  const { user, customer } = await getMyCustomer();
  const name = data.name.trim().slice(0, 120);
  const phone = data.phone.trim().slice(0, 40) || null;
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name: name || null } }),
    prisma.customer.update({ where: { id: customer.id }, data: { name: name || null, phone } }),
  ]);
}
