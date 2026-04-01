"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  categoryId: string | null;
  date: string;
  note: string | null;
}

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    categoryId: "",
    date: "",
    note: "",
  });

  useEffect(() => {
    fetchTransaction();
    fetchCategories();
  }, []);

  async function fetchTransaction() {
    try {
      const res = await fetch(`/api/transactions?id=${params.id}`);
      if (res.ok) {
        const data: Transaction = await res.json();
        setFormData({
          type: data.type,
          amount: data.amount.toString(),
          categoryId: data.categoryId || "",
          date: data.date.split("T")[0],
          note: data.note || "",
        });
      } else {
        alert("交易记录不存在");
        router.push("/transactions");
      }
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/transactions?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          amount: parseFloat(formData.amount),
          categoryId: formData.categoryId || null,
          date: formData.date,
          note: formData.note || null,
        }),
      });

      if (res.ok) {
        router.push("/transactions");
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("Failed to update transaction:", error);
      alert("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/transactions"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold">编辑交易</h1>
          <p className="text-muted-foreground">修改交易记录信息</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>交易信息</CardTitle>
          <CardDescription>修改交易详细信息</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={formData.type === "expense" ? "default" : "outline"} onClick={() => setFormData({ ...formData, type: "expense" })} className="text-red-600">支出</Button>
              <Button type="button" variant={formData.type === "income" ? "default" : "outline"} onClick={() => setFormData({ ...formData, type: "income" })} className="text-green-600">收入</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">金额 *</Label>
              <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">类别</Label>
              <div className="grid grid-cols-3 gap-2">
                {filteredCategories.map((cat) => (
                  <button key={cat.id} type="button" className={`p-3 rounded-lg border text-sm transition-all ${formData.categoryId === cat.id ? "border-primary bg-primary/10" : "hover:bg-muted"}`} onClick={() => setFormData({ ...formData, categoryId: formData.categoryId === cat.id ? "" : cat.id })}>
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
              {filteredCategories.length === 0 && <p className="text-sm text-muted-foreground">暂无类别，请先在类别管理中添加</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">备注</Label>
              <Input id="note" type="text" placeholder="可选，添加一些备注信息" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
            </div>

            <Button type="submit" className="w-full" disabled={saving || !formData.amount}>
              <Save className="h-4 w-4 mr-2" />{saving ? "保存中..." : "保存修改"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
