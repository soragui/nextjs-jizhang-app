import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  const prisma = new PrismaClient();

  const defaultExpenseCategories = [
    { name: "餐饮", color: "#ef4444" },
    { name: "交通", color: "#f97316" },
    { name: "购物", color: "#f59e0b" },
    { name: "娱乐", color: "#84cc16" },
    { name: "医疗", color: "#22c55e" },
    { name: "教育", color: "#14b8a6" },
    { name: "住房", color: "#06b6d4" },
    { name: "水电", color: "#0ea5e9" },
    { name: "通讯", color: "#3b82f6" },
    { name: "其他", color: "#6366f1" },
  ];

  const defaultIncomeCategories = [
    { name: "工资", color: "#22c55e" },
    { name: "奖金", color: "#14b8a6" },
    { name: "投资", color: "#06b6d4" },
    { name: "兼职", color: "#3b82f6" },
    { name: "其他", color: "#8b5cf6" },
  ];

  const hashedPassword = await bcrypt.hash("demo123", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "演示用户",
      password: hashedPassword,
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  for (const cat of defaultExpenseCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: demoUser.id, name: cat.name },
    });
    
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: "expense",
          color: cat.color,
          userId: demoUser.id,
          isDefault: true,
        },
      });
    }
  }

  console.log(`✅ Created ${defaultExpenseCategories.length} expense categories`);

  for (const cat of defaultIncomeCategories) {
    const existing = await prisma.category.findFirst({
      where: { userId: demoUser.id, name: cat.name },
    });
    
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: "income",
          color: cat.color,
          userId: demoUser.id,
          isDefault: true,
        },
      });
    }
  }

  console.log(`✅ Created ${defaultIncomeCategories.length} income categories`);

  const categories = await prisma.category.findMany({
    where: { userId: demoUser.id },
  });

  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const expenseCat = expenseCats[Math.floor(Math.random() * expenseCats.length)];
    const amount = Math.round((Math.random() * 200 + 20) * 100) / 100;

    await prisma.transaction.create({
      data: {
        amount,
        type: "expense",
        categoryId: expenseCat.id,
        date,
        note: `示例支出 ${i + 1}`,
        userId: demoUser.id,
      },
    });

    if (i % 7 === 0) {
      const incomeCat = incomeCats[Math.floor(Math.random() * incomeCats.length)];
      const incomeAmount = Math.round((Math.random() * 5000 + 3000) * 100) / 100;

      await prisma.transaction.create({
        data: {
          amount: incomeAmount,
          type: "income",
          categoryId: incomeCat.id,
          date,
          note: `示例收入 ${i + 1}`,
          userId: demoUser.id,
        },
      });
    }
  }

  console.log("✅ Created sample transactions");
  console.log("🎉 Seeding completed!");

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
