import { PrismaClient } from "../lib/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({ select: { id: true } });
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  for (const business of businesses) {
    const staffList = await prisma.staff.findMany({
      where: { businessId: business.id },
    });
    const period = new Date(year, month - 1, 1);

    for (const staff of staffList) {
      const exists = await prisma.payroll.findFirst({
        where: { staffId: staff.id, period },
      });
      if (!exists) {
        await prisma.payroll.create({
          data: {
            staffId: staff.id,
            businessId: business.id,
            amount: 0,
            period,
            paid: false,
          },
        });
      }
    }
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Payroll automation error:", err);
  process.exit(1);
});
