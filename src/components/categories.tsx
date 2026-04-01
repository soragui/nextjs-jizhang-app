"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
  _count?: {
    transactions: number;
  };
}

interface CategoryFormProps {
  onSubmit: (data: Omit<Category, "id" | "_count">) => void;
  onCancel: () => void;
  initialData?: Category;
}

const colors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
];

export function CategoryForm({ onSubmit, onCancel, initialData }: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState(initialData?.type || "EXPENSE");
  const [color, setColor] = useState(initialData?.color || "bg-blue-500");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, type, color, icon: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Category" : "Add Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Food, Salary"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.value} ${
                    color === c.value ? "ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {initialData ? "Update" : "Add"} Category
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface CategoryListProps {
  categories: Category[];
  type: "EXPENSE" | "INCOME";
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryList({ categories, type, onEdit, onDelete }: CategoryListProps) {
  const filteredCategories = categories.filter((c) => c.type === type);

  if (filteredCategories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No {type.toLowerCase()} categories yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {type === "EXPENSE" ? "Expense" : "Income"} Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${category.color || "bg-gray-400"}`} />
                <div>
                  <p className="font-medium text-sm">{category.name}</p>
                  <p className="text-xs text-gray-500">
                    {category._count?.transactions || 0} transactions
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(category)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(category.id)}
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
