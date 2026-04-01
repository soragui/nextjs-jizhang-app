import { withAuth } from "@/lib/with-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await withAuth(req);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: { category: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryStats = await prisma.category.findMany({
      where: { userId: session.user.id },
      include: {
        transactions: {
          where: {
            userId: session.user.id,
            date: { gte: start, lte: end },
            type: "expense",
          },
        },
      },
    });

    const categoryData = categoryStats
      .map((cat) => ({
        name: cat.name,
        value: cat.transactions.reduce((sum, t) => sum + t.amount, 0),
        color: cat.color,
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const dailyStats: Record<string, { income: number; expense: number }> = {};
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      dailyStats[dateStr] = { income: 0, expense: 0 };
    }

    const transactionList: typeof transactions = transactions;
    transactionList.forEach((t) => {
      const dateStr = t.date.toISOString().split("T")[0];
      if (dailyStats[dateStr]) {
        if (t.type === "income") {
          dailyStats[dateStr].income += t.amount;
        } else {
          dailyStats[dateStr].expense += t.amount;
        }
      }
    });

    const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    return new Response(
      JSON.stringify({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        categoryData,
        dailyData,
        transactionCount: transactions.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new Response(JSON.stringify({ error: "获取统计失败" }), { status: 500 });
  }
}
