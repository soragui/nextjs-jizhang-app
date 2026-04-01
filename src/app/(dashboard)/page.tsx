"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface StatsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryData: { name: string; value: number; color: string }[];
  dailyData: { date: string; income: number; expense: number }[];
  transactionCount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">欢迎回来，{session?.user?.name || session?.user?.email}</h1>
        <p className="text-muted-foreground">这是您的财务概览</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{stats?.totalIncome.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">本月</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总支出</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{stats?.totalExpense.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">本月</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">结余</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats?.balance.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">本月</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">交易笔数</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.transactionCount || 0}</div>
            <p className="text-xs text-muted-foreground">本月</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>每日收支趋势</CardTitle>
            <CardDescription>本月每日收入和支出情况</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.dailyData && stats.dailyData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`¥${Number(value).toFixed(2)}`, undefined]} labelFormatter={(label) => `日期：${label}`} />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" name="收入" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" name="支出" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {(!stats?.dailyData || stats.dailyData.length === 0) && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支出分类占比</CardTitle>
            <CardDescription>本月各类别支出分布</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.categoryData && stats.categoryData.length > 0 && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {(!stats?.categoryData || stats.categoryData.length === 0) && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
