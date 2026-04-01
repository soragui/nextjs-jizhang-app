"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  note?: string;
  category: {
    name: string;
    color: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/transactions");
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("确定要删除这条记录吗？")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTransactions(transactions.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">交易记录</h1>
          <p className="text-muted-foreground">查看和管理您的所有交易</p>
        </div>
        <Link href="/transactions/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            新增交易
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无交易记录</CardTitle>
            <CardDescription>开始添加您的第一笔交易记录吧</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${transaction.category.color}20` }}
                  >
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">{transaction.category.name}</CardTitle>
                    <CardDescription>
                      {new Date(transaction.date).toLocaleDateString("zh-CN")}
                      {transaction.note && ` · ${transaction.note}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-lg font-semibold ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}¥{transaction.amount.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={`/transactions/edit/${transaction.id}`}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
