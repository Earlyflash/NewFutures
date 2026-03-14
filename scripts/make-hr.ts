/**
 * Set a user's role to HR by email. Run from project root:
 *   npx tsx scripts/make-hr.ts user@example.com
 *   npm run make-hr -- user@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? process.env.EMAIL;
  if (!email) {
    console.error("Usage: npx tsx scripts/make-hr.ts <email>");
    console.error("   or:  EMAIL=user@example.com npm run make-hr");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "HR" },
  });
  console.log("Done. User is now HR:", user.email, user.name ?? "");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
