import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const period = new Date(year, month, 1);

  const businesses = await prisma.business.findMany({
    select: { id: true },
    where: { deletedAt: null },
  });

  for (const business of businesses) {
    const existingBatch = await prisma.payrollBatch.findFirst({
      where: { businessId: business.id, period },
    });

    let batchId = existingBatch?.id;

    if (!batchId) {
      const batch = await prisma.payrollBatch.create({
        data: {
          businessId: business.id,
          period,
          locked: false,
        },
        select: { id: true },
      });
      batchId = batch.id;
    }

    const staffList = await prisma.staff.findMany({
      where: { businessId: business.id, deletedAt: null },
      select: { id: true },
    });

    for (const staff of staffList) {
      const exists = await prisma.payrollBatchItem.findFirst({
        where: { batchId, staffId: staff.id },
      });

      if (!exists) {
        await prisma.payrollBatchItem.create({
          data: {
            batchId,
            staffId: staff.id,
            amount: 0,
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
