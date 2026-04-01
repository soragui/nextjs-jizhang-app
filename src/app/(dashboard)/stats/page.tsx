"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

interface StatsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryData: { name: string; value: number; color: string }[];
  dailyData: { date: string; income: number; expense: number }[];
  transactionCount: number;
}

export default function StatsPage() {
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
        <h1 className="text-3xl font-bold">统计图表</h1>
        <p className="text-muted-foreground">可视化分析您的财务数据</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-green-600">¥{stats?.totalIncome.toFixed(2)}</CardTitle>
            <CardDescription>总收入</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-red-600">¥{stats?.totalExpense.toFixed(2)}</CardTitle>
            <CardDescription>总支出</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-blue-600">¥{stats?.balance.toFixed(2)}</CardTitle>
            <CardDescription>结余</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>每日收支趋势</CardTitle>
          <CardDescription>本月每日收入和支出的变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.dailyData && stats.dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(value) => [`¥${Number(value).toFixed(2)}`, undefined]} labelFormatter={(label) => `日期：${label}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" name="收入" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="支出" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-muted-foreground">暂无数据</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>支出分类占比</CardTitle>
            <CardDescription>本月各类别支出占比情况</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.categoryData && stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={stats.categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {stats.categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>每日收支对比</CardTitle>
            <CardDescription>每日收入与支出的直观对比</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.dailyData && stats.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`¥${Number(value).toFixed(2)}`, undefined]} labelFormatter={(label) => `日期：${label}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" name="收入" />
                  <Bar dataKey="expense" fill="#ef4444" name="支出" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
