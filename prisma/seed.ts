import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cycle = await prisma.reviewCycle.upsert({
    where: { id: "seed-cycle-1" },
    update: {},
    create: {
      id: "seed-cycle-1",
      name: "FY2025",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      status: "OPEN",
    },
  });
  console.log("Seed: review cycle", cycle.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
