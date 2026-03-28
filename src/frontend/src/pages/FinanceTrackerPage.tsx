import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IndianRupee,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import {
  useAddExpense,
  useDeleteExpense,
  useGetCallerUserProfile,
  useGetExpenses,
  useGetFinancialOverview,
  useSetMonthlyBudget,
  useSetSavingsGoal,
} from "../hooks/useQueries";
import { formatINR } from "../utils/currency";

const CATEGORIES = ["Food", "Transport", "Books", "Subscriptions", "Misc"];
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#0d9488",
  Transport: "#f59e0b",
  Books: "#6366f1",
  Subscriptions: "#10b981",
  Misc: "#f97316",
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚌",
  Books: "📚",
  Subscriptions: "📱",
  Misc: "🛍️",
};

interface ExpenseForm {
  amount: string;
  category: string;
  description: string;
  date: string;
}

const defaultForm: ExpenseForm = {
  amount: "",
  category: "Food",
  description: "",
  date: new Date().toISOString().split("T")[0],
};

export default function FinanceTrackerPage() {
  const { data: expenses = [], isLoading } = useGetExpenses();
  const { data: financialOverview } = useGetFinancialOverview();
  const { data: profile } = useGetCallerUserProfile();
  const { mutateAsync: addExpense, isPending: adding } = useAddExpense();
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { mutateAsync: setMonthlyBudget, isPending: settingBudget } =
    useSetMonthlyBudget();
  const { mutateAsync: setSavingsGoal, isPending: settingGoal } =
    useSetSavingsGoal();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(defaultForm);
  const [budgetInput, setBudgetInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

  const availableBalance = financialOverview?.[0] ?? 0;
  const savingsGoal = financialOverview?.[1] ?? 0;
  const monthlyBudget = profile?.monthlyBudget ?? 0;
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return CATEGORIES.map((cat) => ({
      name: cat,
      value: map[cat] || 0,
      color: CATEGORY_COLORS[cat],
    })).filter((c) => c.value > 0);
  }, [expenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await addExpense({
        amount,
        category: form.category,
        date: BigInt(new Date(form.date).getTime()) * BigInt(1_000_000),
        description: form.description,
      });
      toast.success("Expense added!");
      setDialogOpen(false);
      setForm(defaultForm);
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const handleSetBudget = async () => {
    const v = Number.parseFloat(budgetInput);
    if (!v || v <= 0) {
      toast.error("Enter a valid budget");
      return;
    }
    try {
      await setMonthlyBudget(v);
      toast.success("Budget updated!");
      setBudgetInput("");
    } catch {
      toast.error("Failed to update budget");
    }
  };

  const handleSetGoal = async () => {
    const v = Number.parseFloat(goalInput);
    if (!v || v <= 0) {
      toast.error("Enter a valid goal");
      return;
    }
    try {
      await setSavingsGoal(v);
      toast.success("Savings goal updated!");
      setGoalInput("");
    } catch {
      toast.error("Failed to update goal");
    }
  };

  const budgetUsedPct =
    monthlyBudget > 0
      ? Math.min(100, (totalExpenses / monthlyBudget) * 100)
      : 0;
  const savingsPct =
    savingsGoal > 0
      ? Math.min(100, (Math.max(0, availableBalance) / savingsGoal) * 100)
      : 0;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Finance Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your expenses in ₹ INR
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          className="rounded-xl gap-2 gradient-teal text-white border-0"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <IndianRupee className="w-4 h-4 text-primary mb-2" />
            <p className="text-xl font-display font-bold">
              {formatINR(monthlyBudget)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Monthly Budget</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <TrendingDown className="w-4 h-4 text-destructive mb-2" />
            <p className="text-xl font-display font-bold">
              {formatINR(totalExpenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total Spent</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <Wallet className="w-4 h-4 text-chart-3 mb-2" />
            <p
              className={`text-xl font-display font-bold ${
                availableBalance < 0 ? "text-destructive" : "text-chart-3"
              }`}
            >
              {formatINR(availableBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Balance</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <Target className="w-4 h-4 text-accent mb-2" />
            <p className="text-xl font-display font-bold">
              {formatINR(savingsGoal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Savings Goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget & Savings Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center justify-between">
              Budget Usage
              <span
                className={`text-sm font-bold ${
                  budgetUsedPct > 90 ? "text-destructive" : "text-primary"
                }`}
              >
                {budgetUsedPct.toFixed(0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={budgetUsedPct} className="h-3 rounded-full" />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Set monthly budget (₹)"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="rounded-xl flex-1"
              />
              <Button
                onClick={handleSetBudget}
                disabled={settingBudget}
                size="sm"
                className="rounded-xl"
              >
                {settingBudget ? "..." : "Set"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-display flex items-center justify-between">
              Savings Progress
              <span className="text-sm font-bold text-accent">
                {savingsPct.toFixed(0)}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={savingsPct} className="h-3 rounded-full" />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Set savings goal (₹)"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="rounded-xl flex-1"
              />
              <Button
                onClick={handleSetGoal}
                disabled={settingGoal}
                size="sm"
                className="rounded-xl"
              >
                {settingGoal ? "..." : "Set"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart + Expense List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Wallet className="w-10 h-10 opacity-30" />
                <p className="text-sm">No expenses recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatINR(v), ""]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Summary */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CATEGORIES.map((cat) => {
              const amount = expenses
                .filter((e) => e.category === cat)
                .reduce((a, e) => a + e.amount, 0);
              const pct =
                totalExpenses > 0
                  ? Math.round((amount / totalExpenses) * 100)
                  : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{CATEGORY_ICONS[cat]}</span>
                      <span className="font-medium">{cat}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatINR(amount)}{" "}
                      <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5 rounded-full" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No expenses yet</p>
              <p className="text-sm mt-1">
                Add your first expense to start tracking
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => {
                const date = new Date(Number(expense.date) / 1_000_000);
                return (
                  <div
                    key={String(expense.id)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[expense.category]}20`,
                      }}
                    >
                      {CATEGORY_ICONS[expense.category] || "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {expense.description || expense.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {expense.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {formatINR(expense.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                className="rounded-xl"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
                placeholder="What did you spend on?"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adding}
                className="flex-1 rounded-xl gradient-teal text-white border-0"
              >
                {adding ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
