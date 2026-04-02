"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, DollarSign, TrendingUp } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  isDefault: boolean;
  _count: { transactions: number };
}

const defaultColors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: defaultColors[0],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      if (res.ok) {
        setNewCategory({ name: "", type: "expense", color: defaultColors[0] });
        setShowForm(false);
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("创建失败，请稍后重试");
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("确定要删除这个类别吗？")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("删除失败，请稍后重试");
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">类别管理</h1>
          <p className="text-muted-foreground">管理您的收支类别</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><PlusCircle className="h-4 w-4 mr-2" />添加类别</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>添加新类别</CardTitle>
            <CardDescription>填写类别信息</CardDescription>
          </CardHeader>
          <form onSubmit={createCategory}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">类别名称 *</Label>
                  <Input id="name" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="如：餐饮、交通" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">类型 *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={newCategory.type === "expense" ? "default" : "outline"} onClick={() => setNewCategory({ ...newCategory, type: "expense" })} className="text-red-600">支出</Button>
                    <Button type="button" variant={newCategory.type === "income" ? "default" : "outline"} onClick={() => setNewCategory({ ...newCategory, type: "income" })} className="text-green-600">收入</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>颜色</Label>
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color) => (
                    <button key={color} type="button" className={`w-8 h-8 rounded-full transition-all ${newCategory.color === color ? "ring-2 ring-offset-2 ring-primary" : ""}`} style={{ backgroundColor: color }} onClick={() => setNewCategory({ ...newCategory, color })} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">保存</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>取消</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense"><DollarSign className="h-4 w-4 mr-2" />支出类别 ({expenseCategories.length})</TabsTrigger>
          <TabsTrigger value="income"><TrendingUp className="h-4 w-4 mr-2" />收入类别 ({incomeCategories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : expenseCategories.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">暂无支出类别，点击上方&ldquo;添加类别&rdquo;创建</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {expenseCategories.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">{cat._count?.transactions || 0} 笔交易</p>
                        </div>
                      </div>
                      {!cat.isDefault && (
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : incomeCategories.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">暂无收入类别，点击上方&ldquo;添加类别&rdquo;创建</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incomeCategories.map((cat) => (
                <Card key={cat.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">{cat._count?.transactions || 0} 笔交易</p>
                        </div>
                      </div>
                      {!cat.isDefault && (
                        <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
